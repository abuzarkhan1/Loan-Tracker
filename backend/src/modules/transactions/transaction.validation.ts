import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { TRANSACTION_TYPES } from "./transaction.model";

const manualTypes = ["INCOME", "EXPENSE", "SALARY"] as const;

const body = z.object({
  type: z.enum(manualTypes),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  categoryId: objectIdSchema.optional(),
  source: z.string().trim().max(120).optional().or(z.literal("")),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.CASH),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createTransactionSchema = z.object({ body });
export const updateTransactionSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const transactionIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const transactionListSchema = z.object({
  query: z.object({
    type: z.enum(TRANSACTION_TYPES).optional(),
    categoryId: objectIdSchema.optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    search: z.string().trim().optional(),
    linkedContactId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});
