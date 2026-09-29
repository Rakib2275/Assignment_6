import { Router } from "express";

import { ZoneController } from "./zone.controller";
import { ZoneValidation } from "./zone.validation";

import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";

const router = Router();

router.post(
  "/register",
  auth("ADMIN","SUPER_ADMIN"),
  validedRequest(
    ZoneValidation.createZoneValidationSchema,
  ),
  ZoneController.createZone,
);

router.get("/",ZoneController.getAllZones,);


router.get(
  "/:id",
  auth("CUSTOMER", "OPERATOR", "ADMIN"),
  ZoneController.getZoneById,
);

router.patch(
  "/:id",
  auth("ADMIN","SUPER_ADMIN"),
  validedRequest(
    ZoneValidation.updateZoneValidationSchema,
  ),
  ZoneController.updateZone,
);

export const ZoneRoutes = router;