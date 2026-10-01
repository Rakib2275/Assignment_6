import { z } from "zod";
import { Role } from "../../../generated/prisma/enums";

const updateUserRoleValidationSchema = z.object({
  role: z.enum(Role),
});

export const AdminValidation = {
  updateUserRoleValidationSchema,
};

