import { Request, Response } from "express";
import pool from "../config/database";

export const createCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes
    } = req.body;

    // Required fields
    if (!name || !mobile || !customerType) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    // Validate customer type
    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR"
    ];

    if (!validCustomerTypes.includes(customerType)) {
      return res.status(400).json({
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR"
      });
    }

    // Validate status if provided
    const validStatuses = [
      "LEAD",
      "ACTIVE",
      "INACTIVE"
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Status must be LEAD, ACTIVE or INACTIVE"
      });
    }

    const result = await pool.query(
      `INSERT INTO customers
      (
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        name,
        mobile,
        email || null,
        businessName || null,
        gstNumber || null,
        customerType,
        address || null,
        status || "LEAD",
        followUpDate || null,
        notes || null
      ]
    );

    return res.status(201).json({
      message: "Customer created successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};



export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;

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

    if (search) {
      values.push(`%${search}%`);

      conditions.push(`
        (
          name ILIKE $${values.length}
          OR mobile ILIKE $${values.length}
          OR email ILIKE $${values.length}
          OR business_name ILIKE $${values.length}
        )
      `);
    }

    if (status) {
      values.push(status);

      conditions.push(
        `status = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM customers
      ${whereClause}
      `,
      values
    );

    const total = parseInt(
      countResult.rows[0].total
    );

    const dataValues = [
      ...values,
      limit,
      offset
    ];

    const result = await pool.query(
      `
      SELECT *
      FROM customers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
      `,
      dataValues
    );

    return res.status(200).json({
      customers: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const getCustomerById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM customers WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      customer: result.rows[0]
    });

  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const updateCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes
    } = req.body;

    if (!name || !mobile || !customerType) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR"
    ];

    if (!validCustomerTypes.includes(customerType)) {
      return res.status(400).json({
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR"
      });
    }

    const validStatuses = [
      "LEAD",
      "ACTIVE",
      "INACTIVE"
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Status must be LEAD, ACTIVE or INACTIVE"
      });
    }

    const result = await pool.query(
      `UPDATE customers
       SET
         name = $1,
         mobile = $2,
         email = $3,
         business_name = $4,
         gst_number = $5,
         customer_type = $6,
         address = $7,
         status = $8,
         follow_up_date = $9,
         notes = $10,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        name,
        mobile,
        email || null,
        businessName || null,
        gstNumber || null,
        customerType,
        address || null,
        status || "LEAD",
        followUpDate || null,
        notes || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      message: "Customer updated successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const deleteCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM customers
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      message: "Customer deleted successfully"
    });

  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


export const createFollowUp = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { note, followUpDate } = req.body;

    if (!note) {
      return res.status(400).json({
        message: "Follow-up note is required"
      });
    }

    // Check whether customer exists
    const customerResult = await pool.query(
      `SELECT id FROM customers WHERE id = $1`,
      [id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    // Get logged-in user
    const user = (req as any).user;

    const result = await pool.query(
      `INSERT INTO follow_ups
       (
         customer_id,
         note,
         follow_up_date,
         created_by
       )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        id,
        note,
        followUpDate || null,
        user.id
      ]
    );

    return res.status(201).json({
      message: "Follow-up added successfully",
      followUp: result.rows[0]
    });

  } catch (error) {
    console.error("Create follow-up error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};