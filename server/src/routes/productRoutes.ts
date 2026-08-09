import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  getStockMovements
} from "../controllers/productController";

import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = Router();

/*
========================================
PRODUCT ROUTES
========================================
*/

// Create product
router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  createProduct
);


// Get all products
router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getProducts
);


// Get product by ID
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getProductById
);


// Update product
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  updateProduct
);


// Delete product
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteProduct
);


/*
========================================
STOCK ROUTES
========================================
*/

// Add / Remove stock
router.post(
  "/:id/stock",
  authenticateToken,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  updateStock
);


// Get stock movement history
router.get(
  "/:id/stock-movements",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getStockMovements
);


export default router;