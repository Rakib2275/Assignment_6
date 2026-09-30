import express from "express";
import { FeederController } from "./feeder.controller";
import { FeederValidation } from "./feeder.validation";
import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";


const router = express.Router();

router.post(
  "/",
  auth("ADMIN","SUPER_ADMIN"),
  validedRequest(
    FeederValidation.createFeederValidationSchema
  ),
  FeederController.createFeeder
);

router.get(
  "/",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  FeederController.getAllFeeders
);

export const FeederRoutes = router;