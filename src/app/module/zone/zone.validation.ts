import { z } from "zod";

const createZoneValidationSchema = z.object({
    name: z
      .string()
      .min(2, "Zone name must be at least 2 characters")
      .max(100, "Zone name cannot exceed 100 characters")
      .trim(),

    code: z
      .string()
      .min(2, "Zone code must be at least 2 characters")
      .max(20, "Zone code cannot exceed 20 characters")
      .trim()
      .toUpperCase(),

    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  })

const updateZoneValidationSchema = z.object({
    name: z
      .string()
      .min(2, "Zone name must be at least 2 characters")
      .max(100, "Zone name cannot exceed 100 characters")
      .trim()
      .optional(),

    code: z
      .string()
      .min(2, "Zone code must be at least 2 characters")
      .max(20, "Zone code cannot exceed 20 characters")
      .trim()
      .toUpperCase()
      .optional(),

    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  })

export const ZoneValidation = {
  createZoneValidationSchema,
  updateZoneValidationSchema,
};