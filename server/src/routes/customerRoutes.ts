import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createFollowUp
} from "../controllers/customerController";

const router = Router();

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  createCustomer
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getCustomers
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"),
  getCustomerById
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  updateCustomer
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  deleteCustomer
);

router.post(
  "/:id/followups",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  createFollowUp
);

export default router;