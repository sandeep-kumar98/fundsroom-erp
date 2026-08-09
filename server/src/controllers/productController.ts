import { Request, Response } from "express";
import pool from "../config/database";

/*
========================================
CREATE PRODUCT
========================================
*/

export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      sku,
      category,
      unitPrice,
      currentStock,
      minimumStock,
      location
    } = req.body;

    // Required fields
    if (
      !name ||
      !sku ||
      unitPrice === undefined
    ) {
      return res.status(400).json({
        message: "Name, SKU and unit price are required"
      });
    }

    // Validate price
    if (Number(unitPrice) < 0) {
      return res.status(400).json({
        message: "Unit price cannot be negative"
      });
    }

    // Validate stock
    const initialStock =
      currentStock === undefined
        ? 0
        : Number(currentStock);

    if (initialStock < 0 || !Number.isInteger(initialStock)) {
      return res.status(400).json({
        message: "Initial stock must be a non-negative integer"
      });
    }

    const minimum =
      minimumStock === undefined
        ? 0
        : Number(minimumStock);

    if (minimum < 0 || !Number.isInteger(minimum)) {
      return res.status(400).json({
        message: "Minimum stock must be a non-negative integer"
      });
    }

    // Check duplicate SKU
    const existingProduct = await pool.query(
      `SELECT id FROM products WHERE sku = $1`,
      [sku]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({
        message: "Product with this SKU already exists"
      });
    }

    const user = (req as any).user;

    // Transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const productResult = await client.query(
        `INSERT INTO products
        (
          name,
          sku,
          category,
          unit_price,
          current_stock,
          minimum_stock,
          location
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *`,
        [
          name,
          sku,
          category || null,
          Number(unitPrice),
          initialStock,
          minimum,
          location || null
        ]
      );

      const product = productResult.rows[0];

      // Create initial stock movement if stock > 0
      if (initialStock > 0) {
        await client.query(
          `INSERT INTO stock_movements
          (
            product_id,
            quantity,
            movement_type,
            reason,
            created_by
          )
          VALUES ($1,$2,$3,$4,$5)`,
          [
            product.id,
            initialStock,
            "IN",
            "Initial stock",
            user.id
          ]
        );
      }

      await client.query("COMMIT");

      return res.status(201).json({
        message: "Product created successfully",
        product
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
GET ALL PRODUCTS
SEARCH + PAGINATION + LOW STOCK FILTER
========================================
*/

export const getProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const search =
      (req.query.search as string) || "";

    const lowStock =
      req.query.lowStock as string | undefined;

    const page = Math.max(
      parseInt(req.query.page as string) || 1,
      1
    );

    const limit = Math.min(
      parseInt(req.query.limit as string) || 10,
      100
    );

    const offset = (page - 1) * limit;

    const values: any[] = [];
    const conditions: string[] = [];

    // Search
    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          name ILIKE $${values.length}
          OR sku ILIKE $${values.length}
          OR category ILIKE $${values.length}
        )
      `);
    }

    // Low stock filter
    if (lowStock === "true") {
      conditions.push(
        "current_stock <= minimum_stock"
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // Count
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      ${whereClause}
      `,
      values
    );

    const total = parseInt(
      countResult.rows[0].total
    );

    // Products
    const dataValues = [
      ...values,
      limit,
      offset
    ];

    const result = await pool.query(
      `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
      `,
      dataValues
    );

    return res.status(200).json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
GET PRODUCT BY ID
========================================
*/

export const getProductById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json({
      product: result.rows[0]
    });

  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
UPDATE PRODUCT
========================================

Stock is NOT changed here.
Use the stock endpoint for stock changes.
========================================
*/

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      sku,
      category,
      unitPrice,
      minimumStock,
      location
    } = req.body;

    if (
      !name ||
      !sku ||
      unitPrice === undefined
    ) {
      return res.status(400).json({
        message: "Name, SKU and unit price are required"
      });
    }

    if (Number(unitPrice) < 0) {
      return res.status(400).json({
        message: "Unit price cannot be negative"
      });
    }

    const minimum =
      minimumStock === undefined
        ? 0
        : Number(minimumStock);

    if (
      minimum < 0 ||
      !Number.isInteger(minimum)
    ) {
      return res.status(400).json({
        message: "Minimum stock must be a non-negative integer"
      });
    }

    // Check whether product exists
    const existingProduct = await pool.query(
      `SELECT id FROM products WHERE id = $1`,
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check duplicate SKU
    const duplicateSku = await pool.query(
      `
      SELECT id
      FROM products
      WHERE sku = $1
      AND id != $2
      `,
      [sku, id]
    );

    if (duplicateSku.rows.length > 0) {
      return res.status(409).json({
        message: "Another product already uses this SKU"
      });
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = $1,
        sku = $2,
        category = $3,
        unit_price = $4,
        minimum_stock = $5,
        location = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        name,
        sku,
        category || null,
        Number(unitPrice),
        minimum,
        location || null,
        id
      ]
    );

    return res.status(200).json({
      message: "Product updated successfully",
      product: result.rows[0]
    });

  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
DELETE PRODUCT
========================================
*/

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete product error:", error);

    // Product has stock movement/challan references
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Product cannot be deleted because it is already used in stock movements or challans"
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


/*
========================================
ADD / REMOVE STOCK
========================================

movementType:
IN  → increase stock
OUT → decrease stock
========================================
*/

export const updateStock = async (
  req: Request,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      quantity,
      movementType,
      reason
    } = req.body;

    const user = (req as any).user;

    // Validate quantity
    if (
      quantity === undefined ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive integer"
      });
    }

    // Validate movement type
    if (
      movementType !== "IN" &&
      movementType !== "OUT"
    ) {
      return res.status(400).json({
        message: "Movement type must be IN or OUT"
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "Reason is required"
      });
    }

    const qty = Number(quantity);

    await client.query("BEGIN");

    /*
    FOR UPDATE locks the product row during
    the transaction.

    This is important for preventing two
    simultaneous requests from causing
    incorrect stock.
    */

    const productResult = await client.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    let newStock = product.current_stock;

    if (movementType === "IN") {
      newStock += qty;
    } else {
      // OUT
      if (qty > product.current_stock) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Insufficient stock",
          availableStock: product.current_stock,
          requestedQuantity: qty
        });
      }

      newStock -= qty;
    }

    // Update product stock
    const updatedProduct = await client.query(
      `
      UPDATE products
      SET
        current_stock = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [newStock, id]
    );

    // Create movement log
    const movement = await client.query(
      `
      INSERT INTO stock_movements
      (
        product_id,
        quantity,
        movement_type,
        reason,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        id,
        qty,
        movementType,
        reason,
        user.id
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Stock updated successfully",
      product: updatedProduct.rows[0],
      movement: movement.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update stock error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {
    client.release();
  }
};


/*
========================================
GET STOCK MOVEMENTS
========================================
*/

export const getStockMovements = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const productResult = await pool.query(
      `SELECT id, name, sku
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const result = await pool.query(
      `
      SELECT
        sm.id,
        sm.quantity,
        sm.movement_type,
        sm.reason,
        sm.created_at,
        u.id AS created_by_id,
        u.name AS created_by_name
      FROM stock_movements sm
      JOIN users u
        ON sm.created_by = u.id
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC
      `,
      [id]
    );

    return res.status(200).json({
      product: productResult.rows[0],
      movements: result.rows
    });

  } catch (error) {
    console.error(
      "Get stock movements error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};