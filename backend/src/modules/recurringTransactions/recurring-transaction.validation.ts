import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { RECURRING_FREQUENCIES, RECURRING_STATUSES, RECURRING_TRANSACTION_TYPES } from "./recurring-transaction.model";
import { RECURRING_OCCURRENCE_STATUSES } from "./recurring-occurrence.model";

const body = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(RECURRING_TRANSACTION_TYPES),
  amount: z.coerce.number().positive(),
  categoryId: objectIdSchema,
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.CASH),
  frequency: z.enum(RECURRING_FREQUENCIES).default("MONTHLY"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  nextRunDate: z.coerce.date().optional(),
  autoCreateTransaction: z.coerce.boolean().default(false),
  reminderEnabled: z.coerce.boolean().default(true),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(2),
  status: z.enum(RECURRING_STATUSES).optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createRecurringTransactionSchema = z.object({ body });
export const updateRecurringTransactionSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const recurringIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const recurringListSchema = z.object({
  query: z.object({
    type: z.enum(RECURRING_TRANSACTION_TYPES).optional(),
    status: z.enum(RECURRING_STATUSES).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const recurringOccurrenceListSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({
    status: z.enum(RECURRING_OCCURRENCE_STATUSES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const recurringOccurrenceIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const markRecurringCompletedSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    completedDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
