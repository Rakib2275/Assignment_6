import { prisma } from "../../lib/prisma";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";

const generateTransactionId = () => {
  return `PAY-${Date.now()}-${Math.floor(
    Math.random() * 100000
  )}`;
};

/**
 * Initiate bKash Payment
 */
const initiatePayment = async (
  userId: string,
  _outageId: string,
  amount: number
) => {
  if (!userId) {
    throw new Error("User is required");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const transactionId = generateTransactionId();

  const payment = await prisma.payment.create({
    data: {
      transactionId,
      userId,
      amount,
      status: "INITIATED",
    },
  });

  const idToken = await getBkashIdToken();

  if (!idToken) {
    throw new Error("Unable to authenticate with bKash");
  }

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: userId,
        callbackURL: config.bkash_callback_url,
        amount: amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: transactionId,
      }),
    }
  );

  const bkashResult = await response.json();

  console.log("BKASH CREATE:", bkashResult);

  if (!response.ok || !bkashResult.paymentID) {
    throw new Error(
      bkashResult.statusMessage ||
        "bKash payment creation failed"
    );
  }

  const updatedPayment =
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        bkashPaymentId:
          bkashResult.paymentID,
      },
    });

  return {
    id: updatedPayment.id,
    transactionId: updatedPayment.transactionId,
    userId: updatedPayment.userId,
    amount: Number(updatedPayment.amount),
    status: updatedPayment.status,
    bkashPaymentId:
      updatedPayment.bkashPaymentId,
    paymentURL: bkashResult.bkashURL,
    createdAt: updatedPayment.createdAt,
    updatedAt: updatedPayment.updatedAt,
  };
};

/**
 * Execute bKash Payment
 */
const executeBkashPayment = async (
  paymentId: string
) => {
  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

  if (!payment) {
    throw new Error(
      "Payment record not found"
    );
  }

  const idToken =
    await getBkashIdToken();

  if (!idToken) {
    throw new Error("Unable to authenticate with bKash");
  }

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",

        Authorization: idToken,

        "X-APP-Key":
          config.bkash_app_key,
      },

      body: JSON.stringify({
        paymentID: payment.bkashPaymentId,
      }),
    }
  );

  const result = await response.json();

  console.log("========== BKASH EXECUTE RESPONSE ==========");
  console.log(result);
  console.log("============================================");

  if (
    !response.ok ||
    result.statusCode !== "0000"
  ) {
    throw new Error(
      result.statusMessage ||
        "bKash payment execution failed"
    );
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS" },
  });

  return {
    ...updatedPayment,
    amount: Number(updatedPayment.amount),
    bkashResponse: result,
  };
};

/**
 * bKash Callback / Webhook
 */
const handleWebhook = async (
  paymentID: string,
  status: string
) => {
  if (!paymentID) {
    throw new Error(
      "Payment ID is required"
    );
  }

  console.log("bKash Callback:", {
    paymentID,
    status,
  });

  const payment =
    await prisma.payment.findUnique({
      where: {
        bkashPaymentId: paymentID,
      },
    });

  if (!payment) {
    throw new Error(
      "Payment record not found"
    );
  }

  if (
    status &&
    status.toLowerCase() === "cancel"
  ) {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CANCELLED" },
    });

    return {
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    };
  }

  if (
    status &&
    status.toLowerCase() === "failure"
  ) {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    return {
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    };
  }

  return executeBkashPayment(
    payment.id
  );
};

/**
 * Get Payment
 */
const getPaymentById = async (
  paymentId: string,
  userId: string,
  role: string
) => {
  const payment =
    await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  if (!payment) {
    throw new Error(
      "Payment not found"
    );
  }

  if (
    role !== "ADMIN" &&
    role !== "SUPER_ADMIN" &&
    payment.userId !== userId
  ) {
    throw new Error(
      "You don't have permission to access this payment"
    );
  }

  return {
    ...payment,

    amount: Number(payment.amount),
  };
};

export const PaymentService = {
  initiatePayment,
  executeBkashPayment,
  handleWebhook,
  getPaymentById,
};