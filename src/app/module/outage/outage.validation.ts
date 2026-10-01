import { z } from "zod";

const createOutageValidationSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  type: z
    .enum(["SCHEDULED", "UNEXPECTED"])
    .default("UNEXPECTED"),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .default("MEDIUM"),

  areaId: z
    .string()
    .uuid("Invalid area ID"),
});

const verifyOutageValidationSchema = z.object({
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
});

const updateOutageStatusValidationSchema = z.object({
  status: z.enum([
    "REPORTED",
    "VERIFIED",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESTORED",
    "CLOSED",
  ]),
});

const assignOutageValidationSchema = z.object({
  technicianId: z
    .string()
    .uuid("Invalid technician/operator ID"),
});

export const OutageValidation = {
  createOutageValidationSchema,
  verifyOutageValidationSchema,
  updateOutageStatusValidationSchema,
  assignOutageValidationSchema,
};