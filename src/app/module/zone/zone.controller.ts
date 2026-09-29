import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ZoneService } from "./zone.service";

const createZone = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.createZone(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Zone created successfully",
    data: result,
  });
});

const getAllZones = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.getAllZones({
    search: req.query.search as string | undefined,
    isActive: req.query.isActive as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Zones retrieved successfully",
    data: result,
  });
});

const getZoneById = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.getZoneById(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Zone retrieved successfully",
    data: result,
  });
});

const updateZone = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.updateZone(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Zone updated successfully",
    data: result,
  });
});

export const ZoneController = {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
};