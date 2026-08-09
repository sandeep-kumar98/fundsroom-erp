import "dotenv/config";

import express from "express";
import cors from "cors";

import pool from "./config/database";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import productRoutes from "./routes/productRoutes";
import challanRoutes from "./routes/challanRoutes";

import { authenticateToken } from "./middleware/authMiddleware";

const app = express();

/* =====================================================
   MIDDLEWARE
===================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.options("*", cors());
app.use(express.json());

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FundsRoom ERP API is running",
  });
});

/* =====================================================
   AUTH ROUTES
===================================================== */

app.use(
  "/api/auth",
  authRoutes
);

/* =====================================================
   CUSTOMER ROUTES
===================================================== */

app.use(
  "/api/customers",
  customerRoutes
);

/* =====================================================
   PRODUCT + STOCK ROUTES
===================================================== */

app.use(
  "/api/products",
  productRoutes
);

/*
  Includes:

  GET    /api/products
  POST   /api/products
  GET    /api/products/:id
  PUT    /api/products/:id
  DELETE /api/products/:id

  POST   /api/products/:id/stock
  GET    /api/products/:id/stock-movements
*/

/* =====================================================
   CHALLAN ROUTES
===================================================== */

app.use(
  "/api/challans",
  challanRoutes
);

/* =====================================================
   PROTECTED TEST ROUTE
===================================================== */

app.get(
  "/api/protected",
  authenticateToken,
  (req, res) => {
    res.status(200).json({
      message:
        "You accessed a protected route",
      user: req.user,
    });
  }
);

/* =====================================================
   DATABASE TEST
===================================================== */

app.get(
  "/db-test",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          "SELECT NOW()"
        );

      res.status(200).json({
        message:
          "Database connected successfully",
        time: result.rows[0].now,
      });

    } catch (error) {
      console.error(
        "Database test error:",
        error
      );

      res.status(500).json({
        message:
          "Database connection failed",
      });
    }
  }
);

/* =====================================================
   404 HANDLER
===================================================== */

app.use(
  (req, res) => {
    res.status(404).json({
      message: "Route not found",
      path: req.originalUrl,
    });
  }
);

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(
      "Unhandled server error:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      message:
        error.message ||
        "Internal server error",
    });
  }
);

/* =====================================================
   START SERVER
===================================================== */

const PORT =
  Number(process.env.PORT) || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);