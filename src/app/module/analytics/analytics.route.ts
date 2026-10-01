import express from "express";
import { AnalyticsController } from "./analytics.controller";
import { auth } from "../../middleware/checkAuth";

const router = express.Router();

router.get(
  "/overview",
  auth("ADMIN","SUPER_ADMIN"),
  AnalyticsController.getOverview
);

router.get(
  "/outages",
  auth("ADMIN","SUPER_ADMIN"),
  AnalyticsController.getOutageAnalytics
);

export const AnalyticsRoutes = router;