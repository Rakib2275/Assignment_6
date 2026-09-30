import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SubstationService } from "./substation.service";

const createSubstation = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubstationService.createSubstation(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Substation created successfully",
      data: result,
    });
  }
);

const getAllSubstations = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubstationService.getAllSubstations({
      search: req.query.search as string | undefined,
      zoneId: req.query.zoneId as string | undefined,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Substations retrieved successfully",
      data: result,
    });
  }
);

export const SubstationController = {
  createSubstation,
  getAllSubstations,
};