import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";


const getOverview = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await AnalyticsService.getOverview();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Analytics overview retrieved successfully",
      data: result,
    });
  }
);


const getOutageAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const startDate = req.query.startDate as
      | string
      | undefined;

    const endDate = req.query.endDate as
      | string
      | undefined;

    const result =
      await AnalyticsService.getOutageAnalytics(
        startDate,
        endDate
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Outage analytics retrieved successfully",
      data: result,
    });
  }
);


export const AnalyticsController = {
  getOverview,
  getOutageAnalytics,
};