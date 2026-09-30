import { z } from "zod";

const createSubstationValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Substation name must be at least 2 characters")
    .max(100, "Substation name cannot exceed 100 characters")
    .trim(),

  code: z
    .string()
    .min(2, "Substation code must be at least 2 characters")
    .max(20, "Substation code cannot exceed 20 characters")
    .trim()
    .toUpperCase(),

  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  isActive: z.boolean().optional(),

  zoneId: z
    .string()
    .uuid("Invalid zone ID"),
});

export const SubstationValidation = {
  createSubstationValidationSchema,
};