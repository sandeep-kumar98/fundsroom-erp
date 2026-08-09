import { Request, Response } from "express";
import pool from "../config/database";

/*
========================================
GENERATE CHALLAN NUMBER
========================================
*/

const generateChallanNumber = async (client: any) => {
  const result = await client.query(
    `
    SELECT challan_number
    FROM challans
    ORDER BY id DESC
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    return "CH-00001";
  }

  const lastNumber = result.rows[0].challan_number;

  const numericPart = parseInt(
    lastNumber.replace("CH-", "")
  );

  const nextNumber = numericPart + 1;

  return `CH-${String(nextNumber).padStart(5, "0")}`;
};


/*
========================================
CREATE CHALLAN
========================================

Initial status = DRAFT

Expected body:

{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 5
    }
  ]
}
========================================
*/

export const createChallan = async (
  req: Request,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { customerId, items } = req.body;

    const user = (req as any).user;

    /*
    -------------------------------
    VALIDATION
    -------------------------------
    */

    if (!customerId) {
      return res.status(400).json({
        message: "Customer ID is required"
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "At least one product is required"
      });
    }

    /*
    -------------------------------
    CHECK CUSTOMER
    -------------------------------
    */

    const customerResult = await client.query(
      `
      SELECT id, name, business_name
      FROM customers
      WHERE id = $1
      `,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    /*
    -------------------------------
    START TRANSACTION
    -------------------------------
    */

    await client.query("BEGIN");

    /*
    -------------------------------
    GENERATE CHALLAN NUMBER
    -------------------------------
    */

    const challanNumber =
      await generateChallanNumber(client);

    /*
    -------------------------------
    CREATE CHALLAN
    -------------------------------
    */

    const challanResult = await client.query(
      `
      INSERT INTO challans
      (
        challan_number,
        customer_id,
        total_quantity,
        status,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        challanNumber,
        customerId,
        0,
        "DRAFT",
        user.id
      ]
    );

    const challan = challanResult.rows[0];

    let totalQuantity = 0;

    /*
    -------------------------------
    ADD CHALLAN ITEMS
    -------------------------------
    */

    for (const item of items) {

      const productId = item.productId;
      const quantity = Number(item.quantity);

      if (
        !productId ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message:
            "Each item must contain a valid productId and positive integer quantity"
        });
      }

      /*
      Get product information.

      We don't reduce stock here because
      this challan is only a DRAFT.
      */

      const productResult = await client.query(
        `
        SELECT
          id,
          name,
          sku,
          unit_price,
          current_stock
        FROM products
        WHERE id = $1
        `,
        [productId]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Product ${productId} not found`
        });
      }

      const product = productResult.rows[0];

      /*
      Product snapshot is stored here.
      */

      await client.query(
        `
        INSERT INTO challan_items
        (
          challan_id,
          product_id,
          product_name,
          sku,
          unit_price,
          quantity
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          challan.id,
          product.id,
          product.name,
          product.sku,
          product.unit_price,
          quantity
        ]
      );

      totalQuantity += quantity;
    }

    /*
    -------------------------------
    UPDATE TOTAL QUANTITY
    -------------------------------
    */

    const updatedChallan = await client.query(
      `
      UPDATE challans
      SET total_quantity = $1
      WHERE id = $2
      RETURNING *
      `,
      [
        totalQuantity,
        challan.id
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Challan created successfully",
      challan: updatedChallan.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Create challan error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {
    client.release();
  }
};


/*
========================================
GET ALL CHALLANS
========================================
*/

export const getChallans = async (
  req: Request,
  res: Response
) => {
  try {

    const status =
      req.query.status as string | undefined;

    const search =
      (req.query.search as string) || "";

    const page = Math.max(
      parseInt(req.query.page as string) || 1,
      1
    );

    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      100
    );

    const offset =
      (page - 1) * limit;

    const values: any[] = [];
    const conditions: string[] = [];

    /*
    STATUS FILTER
    */

    if (status) {

      values.push(status);

      conditions.push(
        `c.status = $${values.length}`
      );
    }

    /*
    SEARCH
    */

    if (search) {

      values.push(`%${search}%`);

      conditions.push(`
        (
          c.challan_number ILIKE $${values.length}
          OR cu.name ILIKE $${values.length}
          OR cu.business_name ILIKE $${values.length}
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    /*
    COUNT
    */

    const countResult =
      await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM challans c
        JOIN customers cu
          ON c.customer_id = cu.id
        ${whereClause}
        `,
        values
      );

    const total = parseInt(
      countResult.rows[0].total
    );

    /*
    DATA
    */

    const dataValues = [
      ...values,
      limit,
      offset
    ];

    const result =
      await pool.query(
        `
        SELECT
          c.id,
          c.challan_number,
          c.customer_id,
          cu.name AS customer_name,
          cu.business_name,
          c.total_quantity,
          c.status,
          c.created_by,
          c.created_at
        FROM challans c
        JOIN customers cu
          ON c.customer_id = cu.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${dataValues.length - 1}
        OFFSET $${dataValues.length}
        `,
        dataValues
      );

    return res.status(200).json({
      challans: result.rows,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(total / limit)
      }
    });

  } catch (error) {

    console.error(
      "Get challans error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
GET CHALLAN BY ID
========================================
*/

export const getChallanById = async (
  req: Request,
  res: Response
) => {

  try {

    const { id } = req.params;

    /*
    CHALLAN
    */

    const challanResult =
      await pool.query(
        `
        SELECT
          c.*,
          cu.name AS customer_name,
          cu.mobile AS customer_mobile,
          cu.email AS customer_email,
          cu.business_name,
          cu.gst_number
        FROM challans c
        JOIN customers cu
          ON c.customer_id = cu.id
        WHERE c.id = $1
        `,
        [id]
      );

    if (
      challanResult.rows.length === 0
    ) {
      return res.status(404).json({
        message: "Challan not found"
      });
    }

    /*
    ITEMS
    */

    const itemsResult =
      await pool.query(
        `
        SELECT
          id,
          product_id,
          product_name,
          sku,
          unit_price,
          quantity
        FROM challan_items
        WHERE challan_id = $1
        ORDER BY id
        `,
        [id]
      );

    return res.status(200).json({
      challan: challanResult.rows[0],
      items: itemsResult.rows
    });

  } catch (error) {

    console.error(
      "Get challan error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
CONFIRM CHALLAN
========================================

IMPORTANT BUSINESS LOGIC:

1. Challan must be DRAFT
2. Lock product rows
3. Check stock
4. Reduce stock
5. Create OUT movement
6. Change challan to CONFIRMED

Everything happens inside one transaction.
========================================
*/

export const confirmChallan = async (
  req: Request,
  res: Response
) => {

  const client = await pool.connect();

  try {

    const { id } = req.params;

    const user = (req as any).user;

    await client.query("BEGIN");

    /*
    -------------------------------
    GET CHALLAN
    -------------------------------
    */

    const challanResult =
      await client.query(
        `
        SELECT *
        FROM challans
        WHERE id = $1
        FOR UPDATE
        `,
        [id]
      );

    if (
      challanResult.rows.length === 0
    ) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Challan not found"
      });
    }

    const challan =
      challanResult.rows[0];

    /*
    -------------------------------
    CHECK STATUS
    -------------------------------
    */

    if (challan.status !== "DRAFT") {

      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          `Challan cannot be confirmed because its current status is ${challan.status}`
      });
    }

    /*
    -------------------------------
    GET ITEMS
    -------------------------------
    */

    const itemsResult =
      await client.query(
        `
        SELECT *
        FROM challan_items
        WHERE challan_id = $1
        `,
        [id]
      );

    if (itemsResult.rows.length === 0) {

      await client.query("ROLLBACK");

      return res.status(400).json({
        message:
          "Cannot confirm a challan without products"
      });
    }

    /*
    -------------------------------
    CHECK EACH PRODUCT
    -------------------------------
    */

    for (
      const item of itemsResult.rows
    ) {

      /*
      Lock product row.

      This prevents concurrent
      stock updates.
      */

      const productResult =
        await client.query(
          `
          SELECT
            id,
            name,
            current_stock
          FROM products
          WHERE id = $1
          FOR UPDATE
          `,
          [item.product_id]
        );

      if (
        productResult.rows.length === 0
      ) {

        await client.query("ROLLBACK");

        return res.status(404).json({
          message:
            `Product ${item.product_id} not found`
        });
      }

      const product =
        productResult.rows[0];

      /*
      STOCK VALIDATION
      */

      if (
        item.quantity >
        product.current_stock
      ) {

        await client.query("ROLLBACK");

        return res.status(400).json({

          message:
            `Insufficient stock for ${product.name}`,

          productId:
            product.id,

          availableStock:
            product.current_stock,

          requestedQuantity:
            item.quantity
        });
      }
    }

    /*
    -------------------------------
    REDUCE STOCK
    -------------------------------
    */

    for (
      const item of itemsResult.rows
    ) {

      const productResult =
        await client.query(
          `
          SELECT
            id,
            current_stock
          FROM products
          WHERE id = $1
          FOR UPDATE
          `,
          [item.product_id]
        );

      const product =
        productResult.rows[0];

      const newStock =
        product.current_stock -
        item.quantity;

      /*
      UPDATE STOCK
      */

      await client.query(
        `
        UPDATE products
        SET
          current_stock = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          newStock,
          item.product_id
        ]
      );

      /*
      STOCK MOVEMENT
      */

      await client.query(
        `
        INSERT INTO stock_movements
        (
          product_id,
          quantity,
          movement_type,
          reason,
          created_by
        )
        VALUES
        ($1,$2,$3,$4,$5)
        `,
        [
          item.product_id,
          item.quantity,
          "OUT",
          `Sales Challan ${challan.challan_number}`,
          user.id
        ]
      );
    }

    /*
    -------------------------------
    CONFIRM CHALLAN
    -------------------------------
    */

    const updatedChallan =
      await client.query(
        `
        UPDATE challans
        SET status = 'CONFIRMED'
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );

    await client.query("COMMIT");

    return res.status(200).json({
      message:
        "Challan confirmed successfully",

      challan:
        updatedChallan.rows[0]
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "Confirm challan error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {

    client.release();
  }
};


/*
========================================
CANCEL CHALLAN
========================================

Only DRAFT challans can be cancelled.
Since stock is not reduced for a draft,
there is no stock reversal required.
========================================
*/

export const cancelChallan = async (
  req: Request,
  res: Response
) => {

  try {

    const { id } = req.params;

    const result =
      await pool.query(
        `
        UPDATE challans
        SET status = 'CANCELLED'
        WHERE id = $1
          AND status = 'DRAFT'
        RETURNING *
        `,
        [id]
      );

    if (
      result.rows.length === 0
    ) {

      const existing =
        await pool.query(
          `
          SELECT status
          FROM challans
          WHERE id = $1
          `,
          [id]
        );

      if (
        existing.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Challan not found"
        });
      }

      return res.status(400).json({
        message:
          `Only DRAFT challans can be cancelled. Current status: ${existing.rows[0].status}`
      });
    }

    return res.status(200).json({
      message:
        "Challan cancelled successfully",

      challan:
        result.rows[0]
    });

  } catch (error) {

    console.error(
      "Cancel challan error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};