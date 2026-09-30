import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { FeederService } from "./feeder.service";

const createFeeder = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FeederService.createFeeder(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Feeder created successfully",
      data: result,
    });
  }
);

const getAllFeeders = catchAsync(
  async (req: Request, res: Response) => {
    const result = await FeederService.getAllFeeders({
      search: req.query.search as string | undefined,
      substationId: req.query.substationId as string | undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Feeders retrieved successfully",
      data: result,
    });
  }
);

export const FeederController = {
  createFeeder,
  getAllFeeders,
};