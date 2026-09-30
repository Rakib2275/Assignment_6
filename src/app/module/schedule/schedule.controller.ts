import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ScheduleService } from "./schedule.service";

const getScheduleId = (req: Request) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    throw new Error("Schedule ID is required");
  }

  return id;
};

const getUserId = (req: Request) => {
  if (!req.user) {
    throw new Error("Authentication required");
  }

  return req.user.userId;
};

const createSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result =
      await ScheduleService.createSchedule(
        req.body,
        userId
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Schedule created successfully",
      data: result,
    });
  }
);

const getAllSchedules = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await ScheduleService.getAllSchedules({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        search: req.query.search as string | undefined,
        areaId: req.query.areaId as string | undefined,
        date: req.query.date as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder:
          req.query.sortOrder as string | undefined,
      });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Schedules retrieved successfully",
      data: result,
    });
  }
);

const getScheduleById = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await ScheduleService.getScheduleById(
        getScheduleId(req)
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Schedule retrieved successfully",
      data: result,
    });
  }
);

const updateSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await ScheduleService.updateSchedule(
        getScheduleId(req),
        req.body
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Schedule updated successfully",
      data: result,
    });
  }
);

const deleteSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await ScheduleService.deleteSchedule(
        getScheduleId(req)
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Schedule deleted successfully",
      data: result,
    });
  }
);

const generateSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const result =
      await ScheduleService.generateSchedule(
        req.body,
        userId
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Schedule generated successfully",
      data: result,
    });
  }
);

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  generateSchedule,
};
