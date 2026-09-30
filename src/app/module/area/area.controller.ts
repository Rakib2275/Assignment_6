import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AreaService } from "./area.service";

const createArea = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AreaService.createArea(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Area created successfully",
      data: result,
    });
  }
);

const getAllAreas = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AreaService.getAllAreas({
      page: req.query.page as string | undefined,
      limit: req.query.limit as string | undefined,
      search: req.query.search as string | undefined,
      feederId: req.query.feederId as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as string | undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Areas retrieved successfully",
      data: result,
    });
  }
);

export const AreaController = {
  createArea,
  getAllAreas,
};