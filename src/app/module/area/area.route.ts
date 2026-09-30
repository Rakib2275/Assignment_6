import express from "express";
import { AreaController } from "./area.controller";
import { AreaValidation } from "./area.validation";
import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";


const router = express.Router();

router.post(
  "/",
  auth("ADMIN","SUPER_ADMIN"),
  validedRequest(
    AreaValidation.createAreaValidationSchema
  ),
  AreaController.createArea
);

router.get(
  "/",
  auth("CUSTOMER", "OPERATOR", "ADMIN","SUPER_ADMIN"),
  AreaController.getAllAreas
);

export const AreaRoutes = router;