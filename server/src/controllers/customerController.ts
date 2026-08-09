import { Request, Response } from "express";
import pool from "../config/database";

/**
 * Create customer
 */
export const createCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      mobile,
      email,

      // Support both camelCase and snake_case
      businessName,
      business_name,

      gstNumber,
      gst_number,

      customerType,
      customer_type,

      address,
      status,

      followUpDate,
      follow_up_date,

      notes,
    } = req.body;

    const finalBusinessName =
      businessName ?? business_name;

    const finalGstNumber =
      gstNumber ?? gst_number;

    const finalCustomerType =
      customerType ?? customer_type;

    const finalFollowUpDate =
      followUpDate ?? follow_up_date;

    // Required fields
    if (
      !name ||
      !mobile ||
      !finalCustomerType
    ) {
      return res.status(400).json({
        message:
          "Name, mobile and customer type are required",
      });
    }

    // Normalize values
    const normalizedCustomerType =
      String(finalCustomerType)
        .trim()
        .toUpperCase();

    const normalizedStatus =
      String(status || "LEAD")
        .trim()
        .toUpperCase();

    // Validate customer type
    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR",
    ];

    if (
      !validCustomerTypes.includes(
        normalizedCustomerType
      )
    ) {
      return res.status(400).json({
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR",
      });
    }

    // Validate status
    const validStatuses = [
      "LEAD",
      "ACTIVE",
      "INACTIVE",
    ];

    if (
      !validStatuses.includes(
        normalizedStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be LEAD, ACTIVE or INACTIVE",
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
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      RETURNING *`,
      [
        String(name).trim(),
        String(mobile).trim(),
        email || null,
        finalBusinessName || null,
        finalGstNumber || null,
        normalizedCustomerType,
        address || null,
        normalizedStatus,
        finalFollowUpDate || null,
        notes || null,
      ]
    );

    return res.status(201).json({
      message:
        "Customer created successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create customer error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Get customers
 */
export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const search =
      (req.query.search as string) || "";

    const status =
      req.query.status as
        | string
        | undefined;

    const customerType =
      (req.query.customer_type ||
        req.query.customerType) as
        | string
        | undefined;

    const page = Math.max(
      parseInt(
        req.query.page as string
      ) || 1,
      1
    );

    const limit = Math.min(
      parseInt(
        req.query.limit as string
      ) || 10,
      100
    );

    const offset =
      (page - 1) * limit;

    const values: any[] = [];
    const conditions: string[] = [];

    /**
     * Search
     */
    if (search.trim()) {
      values.push(
        `%${search.trim()}%`
      );

      const index = values.length;

      conditions.push(`
        (
          name ILIKE $${index}
          OR mobile ILIKE $${index}
          OR email ILIKE $${index}
          OR business_name ILIKE $${index}
        )
      `);
    }

    /**
     * Status filter
     */
    if (status) {
      values.push(
        String(status)
          .trim()
          .toUpperCase()
      );

      conditions.push(
        `status = $${values.length}`
      );
    }

    /**
     * Customer type filter
     */
    if (customerType) {
      values.push(
        String(customerType)
          .trim()
          .toUpperCase()
      );

      conditions.push(
        `customer_type = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    /**
     * Count
     */
    const countResult =
      await pool.query(
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

    /**
     * Data query
     */
    const dataValues = [
      ...values,
      limit,
      offset,
    ];

    const limitIndex =
      dataValues.length - 1;

    const offsetIndex =
      dataValues.length;

    const result =
      await pool.query(
        `
        SELECT *
        FROM customers
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
        `,
        dataValues
      );

    return res.status(200).json({
      customers: result.rows,

      pagination: {
        page,
        limit,
        total,
        totalPages:
          Math.ceil(
            total / limit
          ),
      },
    });
  } catch (error) {
    console.error(
      "Get customers error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result =
      await pool.query(
        `
        SELECT *
        FROM customers
        WHERE id = $1
        `,
        [id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Customer not found",
      });
    }

    return res.status(200).json({
      customer:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get customer error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Update customer
 */
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
      business_name,

      gstNumber,
      gst_number,

      customerType,
      customer_type,

      address,
      status,

      followUpDate,
      follow_up_date,

      notes,
    } = req.body;

    const finalBusinessName =
      businessName ?? business_name;

    const finalGstNumber =
      gstNumber ?? gst_number;

    const finalCustomerType =
      customerType ?? customer_type;

    const finalFollowUpDate =
      followUpDate ?? follow_up_date;

    // Required fields
    if (
      !name ||
      !mobile ||
      !finalCustomerType
    ) {
      return res.status(400).json({
        message:
          "Name, mobile and customer type are required",
      });
    }

    const normalizedCustomerType =
      String(finalCustomerType)
        .trim()
        .toUpperCase();

    const normalizedStatus =
      String(status || "LEAD")
        .trim()
        .toUpperCase();

    // Validate customer type
    const validCustomerTypes = [
      "RETAIL",
      "WHOLESALE",
      "DISTRIBUTOR",
    ];

    if (
      !validCustomerTypes.includes(
        normalizedCustomerType
      )
    ) {
      return res.status(400).json({
        message:
          "Customer type must be RETAIL, WHOLESALE or DISTRIBUTOR",
      });
    }

    // Validate status
    const validStatuses = [
      "LEAD",
      "ACTIVE",
      "INACTIVE",
    ];

    if (
      !validStatuses.includes(
        normalizedStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be LEAD, ACTIVE or INACTIVE",
      });
    }

    const result =
      await pool.query(
        `
        UPDATE customers
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
        RETURNING *
        `,
        [
          String(name).trim(),
          String(mobile).trim(),
          email || null,
          finalBusinessName || null,
          finalGstNumber || null,
          normalizedCustomerType,
          address || null,
          normalizedStatus,
          finalFollowUpDate || null,
          notes || null,
          id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Customer not found",
      });
    }

    return res.status(200).json({
      message:
        "Customer updated successfully",
      customer:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update customer error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result =
      await pool.query(
        `
        DELETE FROM customers
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Customer not found",
      });
    }

    return res.status(200).json({
      message:
        "Customer deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete customer error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * Create follow-up
 */
export const createFollowUp = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      note,
      followUpDate,
      follow_up_date,
    } = req.body;

    const finalFollowUpDate =
      followUpDate ??
      follow_up_date;

    if (!note) {
      return res.status(400).json({
        message:
          "Follow-up note is required",
      });
    }

    // Check customer exists
    const customerResult =
      await pool.query(
        `
        SELECT id
        FROM customers
        WHERE id = $1
        `,
        [id]
      );

    if (
      customerResult.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Customer not found",
      });
    }

    // Logged-in user
    const user = (req as any).user;

    if (!user?.id) {
      return res.status(401).json({
        message:
          "Authenticated user not found",
      });
    }

    const result =
      await pool.query(
        `
        INSERT INTO follow_ups
        (
          customer_id,
          note,
          follow_up_date,
          created_by
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING *
        `,
        [
          id,
          note.trim(),
          finalFollowUpDate || null,
          user.id,
        ]
      );

    return res.status(201).json({
      message:
        "Follow-up added successfully",
      followUp:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Create follow-up error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};