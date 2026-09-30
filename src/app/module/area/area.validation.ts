import { z } from "zod";

const createAreaValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Area name must be at least 2 characters")
    .max(100, "Area name cannot exceed 100 characters")
    .trim(),

  code: z
    .string()
    .min(2, "Area code must be at least 2 characters")
    .max(20, "Area code cannot exceed 20 characters")
    .trim()
    .toUpperCase(),

  feederId: z
    .string()
    .uuid("Invalid feeder ID"),
});

const getAllAreasValidationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  feederId: z.string().uuid("Invalid feeder ID").optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const AreaValidation = {
  createAreaValidationSchema,
  getAllAreasValidationSchema,
};