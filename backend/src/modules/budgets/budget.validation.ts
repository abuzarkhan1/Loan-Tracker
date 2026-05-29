import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

const categoryBudget = z.object({
  categoryId: objectIdSchema,
  amount: z.coerce.number().min(0),
});

const body = z.object({
  cycleStartDate: z.coerce.date().optional(),
  cycleEndDate: z.coerce.date().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  totalBudget: z.coerce.number().min(0).optional(),
  categoryBudgets: z.array(categoryBudget).default([]),
});

export const createBudgetSchema = z.object({ body });
export const updateBudgetSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const budgetIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const budgetListSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    date: z.coerce.date().optional(),
  }),
});

export const applyBudgetRecommendationsSchema = z.object({
  body: z.object({
    categoryIds: z.array(objectIdSchema).optional(),
  }).default({}),
});
