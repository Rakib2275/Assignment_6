import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OutageService } from "./outage.service";

const getOutageId = (req: Request) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    throw new Error("Outage ID is required");
  }

  return id;
};

const getUserId = (req: Request) => {
  if (!req.user) {
    throw new Error("Authentication required");
  }

  return req.user.userId;
};

const createOutage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.createOutage(
      req.body,
      getUserId(req)
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Outage reported successfully",
      data: result,
    });
  }
);

const getAllOutages = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.getAllOutages({
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      search: req.query.search as string | undefined,
      areaId: req.query.areaId as string | undefined,
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      type: req.query.type as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outages retrieved successfully",
      data: result,
    });
  }
);

const getMyReports = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.getMyReports(
      getUserId(req)
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your outage reports retrieved successfully",
      data: result,
    });
  }
);

const getOutageById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.getOutageById(
      getOutageId(req),
      getUserId(req),
      req.user?.role ?? "CUSTOMER"
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outage retrieved successfully",
      data: result,
    });
  }
);

const verifyOutage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.verifyOutage(
      getOutageId(req),
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outage verified successfully",
      data: result,
    });
  }
);

const updateOutageStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await OutageService.updateOutageStatus(
        getOutageId(req),
        req.body.status
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Outage status updated successfully",
      data: result,
    });
  }
);

const assignOutage = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OutageService.assignOutage(
      getOutageId(req),
      req.body.technicianId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Operator assigned successfully",
      data: result,
    });
  }
);

export const OutageController = {
  createOutage,
  getAllOutages,
  getMyReports,
  getOutageById,
  verifyOutage,
  updateOutageStatus,
  assignOutage,
};