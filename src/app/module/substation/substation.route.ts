import express from "express";
import { SubstationController } from "./substation.controller";
import { validedRequest } from "../../middleware/validedRequest";
import { SubstationValidation } from "./substation.validation";
import { auth } from "../../middleware/checkAuth";

const router = express.Router();

router.post(
  "/",
  auth("ADMIN","SUPER_ADMIN"),
  validedRequest(
    SubstationValidation.createSubstationValidationSchema
  ),
  SubstationController.createSubstation
);

router.get(
  "/",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  SubstationController.getAllSubstations
);

export const SubstationRoutes = router;