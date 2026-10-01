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

/**
 * Customer's payments or all payments for Admin
 */
router.get(
  "/",

  auth("CUSTOMER", "ADMIN", "SUPER_ADMIN"),

  PaymentController.getPayments
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