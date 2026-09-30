import { z } from "zod";

const createScheduleValidationSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters")
      .trim(),

    startTime: z
      .string()
      .datetime("Invalid start time"),

    endTime: z
      .string()
      .datetime("Invalid end time"),

    areaId: z
      .string()
      .uuid("Invalid area ID"),
  })
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

const updateScheduleValidationSchema = z
  .object({
    title: z
      .string()
      .min(3)
      .max(150)
      .trim()
      .optional(),

    startTime: z
      .string()
      .datetime()
      .optional(),

    endTime: z
      .string()
      .datetime()
      .optional(),

    areaId: z
      .string()
      .uuid("Invalid area ID")
      .optional(),
  });

const generateScheduleValidationSchema = z.object({
  areaId: z
    .string()
    .uuid("Invalid area ID"),

  startTime: z
    .string()
    .datetime("Invalid start time"),

  endTime: z
    .string()
    .datetime("Invalid end time"),

  durationMinutes: z
    .number()
    .int()
    .positive()
    .optional(),

  title: z
    .string()
    .max(150)
    .trim()
    .optional(),

});

export const ScheduleValidation = {
  createScheduleValidationSchema,
  updateScheduleValidationSchema,
  generateScheduleValidationSchema,
};