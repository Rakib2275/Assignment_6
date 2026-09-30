import { z } from "zod";

const createFeederValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Feeder name must be at least 2 characters")
    .max(100, "Feeder name cannot exceed 100 characters")
    .trim(),

  code: z
    .string()
    .min(2, "Feeder code must be at least 2 characters")
    .max(20, "Feeder code cannot exceed 20 characters")
    .trim()
    .toUpperCase(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  isActive: z.boolean().optional(),

  substationId: z
    .string()
    .uuid("Invalid substation ID"),
});

export const FeederValidation = {
  createFeederValidationSchema,
};