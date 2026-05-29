import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { CATEGORY_TYPES } from "./category.model";

const body = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(CATEGORY_TYPES),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  monthlyBudget: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({ body });
export const updateCategorySchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: body.partial(),
});
export const categoryIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const categoryListSchema = z.object({
  query: z.object({
    type: z.enum(CATEGORY_TYPES).optional(),
    includeInactive: z.coerce.boolean().default(false),
  }),
});
