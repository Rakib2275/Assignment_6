import { prisma } from "../../lib/prisma";
import { getBkashIdToken } from "../../lib/bkash";
import config from "../../config";

const generateTransactionId = () => {
  return `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new Error("No bKash Access Token");
  }

  const bkashCreatePaymentResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-APP-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",

        // তোমার working project-এর মতো
        payerReference: userId,

        callbackURL: config.bkash_callback_url,

        amount: amount.toString(),
        currency: "BDT",
        intent: "sale",

        merchantInvoiceNumber: transactionId,
      }),
    }
  );

  const bkashCreatePaymentResult =
    await bkashCreatePaymentResponse.json();

  console.log(
    "========== BKASH CREATE =========="
  );
  console.log(bkashCreatePaymentResult);
  console.log(
    "=================================="
  );

  if (
    !bkashCreatePaymentResponse.ok ||
    !bkashCreatePaymentResult.paymentID
  ) {
    throw new Error(
      bkashCreatePaymentResult.statusMessage ||
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
          bkashCreatePaymentResult.paymentID,
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

    paymentURL:
      bkashCreatePaymentResult.bkashURL,

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
    throw new Error("Payment record not found");
  }

  if (["SUCCESS", "FAILED", "CANCELLED"].includes(payment.status)) {
    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }

  if (!payment.bkashPaymentId) {
    throw new Error(
      "bKash Payment ID not found"
    );
  }

  const bkashIdToken =
    await getBkashIdToken();

  if (!bkashIdToken) {
    throw new Error(
      "No bKash Access Token"
    );
  }

  const executedPaymentResponse =
    await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-APP-Key":
            config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID:
            payment.bkashPaymentId,
        }),
      }
    );

  const executedPaymentResult =
    await executedPaymentResponse.json();

  console.log(
    "========== BKASH EXECUTE =========="
  );
  console.log(executedPaymentResult);
  console.log(
    "==================================="
  );

  if (!executedPaymentResponse.ok) {
    throw new Error(
      executedPaymentResult.statusMessage ||
        "bKash payment execution failed"
    );
  }

  /*
   * Successful bKash transaction
   */
  if (
    String(
      executedPaymentResult.statusCode
    ) === "0000"
  ) {
    const updatedPayment =
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "SUCCESS",
        },
      });

    return {
      ...updatedPayment,
      amount: Number(
        updatedPayment.amount
      ),
      bkashResponse:
        executedPaymentResult,
    };
  }

  let bkashResponse = executedPaymentResult;

  if (String(executedPaymentResult.statusCode) === "2056") {
    const paymentStatusResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/payment/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-APP-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: payment.bkashPaymentId,
        }),
      }
    );

    const paymentStatusResult = await paymentStatusResponse.json();
    bkashResponse = {
      execute: executedPaymentResult,
      status: paymentStatusResult,
    };

    if (
      paymentStatusResponse.ok &&
      String(paymentStatusResult.statusCode) === "0000" &&
      String(paymentStatusResult.transactionStatus).toLowerCase() ===
        "completed"
    ) {
      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "SUCCESS",
        },
      });

      return {
        ...updatedPayment,
        amount: Number(updatedPayment.amount),
        bkashResponse,
      };
    }
  }

  /*
   * bKash execution failed
   */
  const updatedPayment =
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

  return {
    ...updatedPayment,
    amount: Number(
      updatedPayment.amount
    ),
    bkashResponse,
  };
};

/**
 * bKash Callback
 */
const handleWebhook = async (
  paymentID: string,
  status: string
) => {
  if (!paymentID) {
    throw new Error("Payment Id Missing");
  }

  if (!status) {
    throw new Error("Payment Status is Missing");
  }

  console.log("========== BKASH CALLBACK ==========");
  console.log({
    paymentID,
    status,
  });
  console.log("====================================");

  const payment = await prisma.payment.findUnique({
    where: {
      bkashPaymentId: paymentID,
    },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  const normalizedStatus = status.toLowerCase();

  // CANCEL
  if (normalizedStatus === "cancel") {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return {
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    };
  }

  // FAILURE
  if (normalizedStatus === "failure") {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
      },
    });

    return {
      ...updatedPayment,
      amount: Number(updatedPayment.amount),
    };
  }

  // SUCCESS → NOW EXECUTE
  if (normalizedStatus === "success") {
    return executeBkashPayment(payment.id);
  }

  throw new Error(
    `Unknown bKash payment status: ${status}`
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

const getPayments = async (userId: string, role: string) => {
  const payments = await prisma.payment.findMany({
    where:
      role === "ADMIN" || role === "SUPER_ADMIN"
        ? undefined
        : { userId },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }));
};

export const PaymentService = {
  initiatePayment,
  executeBkashPayment,
  handleWebhook,
  getPaymentById,
  getPayments,
};