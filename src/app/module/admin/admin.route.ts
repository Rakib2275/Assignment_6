import express from "express";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import { validedRequest } from "../../middleware/validedRequest";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

const router = express.Router();


// ========================================
// Get All Users
// ========================================

router.get(
  "/users",
  auth(Role.ADMIN,Role.SUPER_ADMIN),
  AdminController.getAllUsers
);


// ========================================
// Update User Role
// ========================================

router.patch(
  "/users/:id/role",
  auth(Role.ADMIN,Role.SUPER_ADMIN),
  validedRequest(
    AdminValidation.updateUserRoleValidationSchema
  ),
  AdminController.updateUserRole
);


// ========================================
// Dashboard Statistics
// ========================================

router.get(
  "/dashboard-stats",
  auth(Role.ADMIN,Role.SUPER_ADMIN),
  AdminController.getDashboardStats
);


// ========================================
// Audit Logs
// ========================================

router.get(
  "/audit-logs",
  auth(Role.ADMIN,Role.SUPER_ADMIN),
  AdminController.getAuditLogs
);


export const AdminRoutes = router;

