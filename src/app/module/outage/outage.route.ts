import express from "express";

import { OutageController } from "./outage.controller";
import { OutageValidation } from "./outage.validation";

import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";


const router = express.Router();

// #22
// Customer reports an outage
router.post(
  "/",
  auth("CUSTOMER"),
  validedRequest(
    OutageValidation.createOutageValidationSchema
  ),
  OutageController.createOutage
);

// #23
// Admin + Operator see all outage reports
router.get(
  "/",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  OutageController.getAllOutages
);

// #24
// Customer sees own reports
router.get(
  "/my-reports",
  auth("CUSTOMER"),
  OutageController.getMyReports
);

// #25
// Authorized users see outage details
router.get(
  "/:id",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  OutageController.getOutageById
);

// #26
// Verify outage
router.patch(
  "/:id/verify",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    OutageValidation.verifyOutageValidationSchema
  ),
  OutageController.verifyOutage
);

// #27
// Update status
router.patch(
  "/:id/status",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    OutageValidation.updateOutageStatusValidationSchema
  ),
  OutageController.updateOutageStatus
);

// #28
// Assign operator
router.post(
  "/:id/assign",
  auth("ADMIN", "OPERATOR","SUPER_ADMIN"),
  validedRequest(
    OutageValidation.assignOutageValidationSchema
  ),
  OutageController.assignOutage
);

export const OutageRoutes = router;