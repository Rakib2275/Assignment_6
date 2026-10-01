import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";


// ========================================
// Get Users
// ========================================

const getAllUsers = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AdminService.getAllUsers(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  }
);


// ========================================
// Update User Role
// ========================================

const updateUserRole = catchAsync(
  async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const result =
      await AdminService.updateUserRole(
        req.user!.userId,
        userId,
        req.body.role
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User role updated successfully",
      data: result,
    });
  }
);


// ========================================
// Dashboard Stats
// ========================================

const getDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AdminService.getDashboardStats();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Dashboard statistics retrieved successfully",
      data: result,
    });
  }
);


// ========================================
// Audit Logs
// ========================================

const getAuditLogs = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AdminService.getAuditLogs(req.query);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
    });
  }
);


export const AdminController = {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getAuditLogs,
};

