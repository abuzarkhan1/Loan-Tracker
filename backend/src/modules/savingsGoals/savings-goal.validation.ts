import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { SAVINGS_GOAL_PRIORITIES, SAVINGS_GOAL_STATUSES, SAVINGS_GOAL_TYPES } from "./savings-goal.model";

const body = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(SAVINGS_GOAL_TYPES).default("CUSTOM"),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  monthlyTarget: z.coerce.number().min(0).optional(),
  deadline: z.coerce.date().optional(),
  priority: z.enum(SAVINGS_GOAL_PRIORITIES).default("MEDIUM"),
  status: z.enum(SAVINGS_GOAL_STATUSES).default("ACTIVE"),
  autoContributionEnabled: z.coerce.boolean().default(false),
});

export const createSavingsGoalSchema = z.object({ body });
export const updateSavingsGoalSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const savingsGoalIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const savingsGoalListSchema = z.object({
  query: z.object({
    status: z.enum(SAVINGS_GOAL_STATUSES).optional(),
  }),
});
export const savingsProgressListSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const addSavingsProgressSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    amount: z.coerce.number().positive(),
    date: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
