import { Router } from "express";

import {
  createChallan,
  getChallans,
  getChallanById,
  confirmChallan,
  cancelChallan
} from "../controllers/challanController";

import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = Router();


/*
========================================
CREATE CHALLAN
========================================

Sales and Admin can create.
========================================
*/

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  createChallan
);


/*
========================================
GET ALL CHALLANS
========================================
*/

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getChallans
);


/*
========================================
GET CHALLAN BY ID
========================================
*/

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "SALES",
    "WAREHOUSE",
    "ACCOUNTS"
  ),
  getChallanById
);


/*
========================================
CONFIRM CHALLAN
========================================

Confirmation changes stock,
so only Admin/Sales can do it.
========================================
*/

router.post(
  "/:id/confirm",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  confirmChallan
);


/*
========================================
CANCEL CHALLAN
========================================
*/

router.post(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES"),
  cancelChallan
);


export default router;