import { z } from "zod";

const initiatePaymentValidationSchema = z.object({
  outageId: z.string().uuid("Invalid outage ID"),

  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(10000, "Amount cannot exceed 10000"),
});

export const PaymentValidation = {
  initiatePaymentValidationSchema,
};