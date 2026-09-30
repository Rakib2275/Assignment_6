import express from "express";

import { ScheduleController } from "./schedule.controller";
import { ScheduleValidation } from "./schedule.validation";

import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";


const router = express.Router();

// #16 Create Schedule
router.post(
  "/",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    ScheduleValidation.createScheduleValidationSchema
  ),
  ScheduleController.createSchedule
);

// #17 Get All Schedules
router.get(
  "/",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  ScheduleController.getAllSchedules
);

// #18 Get Schedule By ID
router.get(
  "/:id",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  ScheduleController.getScheduleById
);

// #19 Update Schedule
router.patch(
  "/:id",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    ScheduleValidation.updateScheduleValidationSchema
  ),
  ScheduleController.updateSchedule
);

// #20 Delete Schedule
router.delete(
  "/:id",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  ScheduleController.deleteSchedule
);

// #21 Generate Schedule
router.post(
  "/generate",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    ScheduleValidation.generateScheduleValidationSchema
  ),
  ScheduleController.generateSchedule
);

export const ScheduleRoutes = router;