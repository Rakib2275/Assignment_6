import { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { PaymentService } from "./payment.service";

const getUserId = (req: Request) => {
  if (!req.user) {
    throw new Error("Authentication required");
  }

  return req.user.userId;
};

const getPaymentId = (req: Request) => {
  const { id } = req.params;

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Payment ID is required");
  }

  return id;
};

const initiatePayment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PaymentService.initiatePayment(
      getUserId(req),
      typeof req.body?.outageId === "string"
        ? req.body.outageId
        : "",
      Number(req.body?.amount)
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Payment initiated successfully",
      data: result,
    });
  }
);

const webhook = catchAsync(
  async (req: Request, res: Response) => {
    const paymentID =
      typeof req.body?.paymentID === "string"
        ? req.body.paymentID
        : typeof req.query.paymentID === "string"
          ? req.query.paymentID
          : "";

    const status =
      typeof req.body?.status === "string"
        ? req.body.status
        : typeof req.query.status === "string"
          ? req.query.status
          : "";

    const result = await PaymentService.handleWebhook(
      paymentID,
      status
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment processed successfully",
      data: result,
    });
  }
);

const getPaymentById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PaymentService.getPaymentById(
      getPaymentId(req),
      getUserId(req),
      req.user?.role ?? "CUSTOMER"
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment retrieved successfully",
      data: result,
    });
  }
);

export const PaymentController = {
  initiatePayment,
  webhook,
  getPaymentById,
};