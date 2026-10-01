import express from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { validedRequest } from "../../middleware/validedRequest";
import { auth } from "../../middleware/checkAuth";


const router = express.Router();

/**
 * Customer initiate payment
 */
router.post(
  "/initiate",

  auth("CUSTOMER"),

  validedRequest(
    PaymentValidation
      .initiatePaymentValidationSchema
  ),

  PaymentController.initiatePayment
);

/**
 * bKash callback/webhook
 *
 * No JWT authentication
 */
router.post(
  "/webhook",

  PaymentController.webhook
);

router.get(
  "/webhook",

  PaymentController.webhook
);

/**
 * Customer/Admin payment details
 */
router.get(
  "/:id",

  auth("CUSTOMER", "ADMIN","SUPER_ADMIN"),

  PaymentController.getPaymentById
);

export const PaymentRoutes = router;