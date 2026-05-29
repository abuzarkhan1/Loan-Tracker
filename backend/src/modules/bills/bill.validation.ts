import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { BILL_FREQUENCIES, BILL_STATUSES } from "./bill.model";
import { BILL_OCCURRENCE_STATUSES } from "./bill-occurrence.model";

const billBody = z.object({
  title: z.string().trim().min(1).max(120),
  categoryId: objectIdSchema.optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.CASH),
  frequency: z.enum(BILL_FREQUENCIES).default("MONTHLY"),
  dueDate: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
  reminderEnabled: z.coerce.boolean().default(true),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(2),
  autoCreateExpense: z.coerce.boolean().default(true),
  status: z.enum(BILL_STATUSES).optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createBillSchema = z.object({ body: billBody });
export const updateBillSchema = z.object({ params: z.object({ id: objectIdSchema }), body: billBody.partial() });
export const billIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const occurrenceIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const billListSchema = z.object({
  query: z.object({
    status: z.enum(BILL_STATUSES).optional(),
    frequency: z.enum(BILL_FREQUENCIES).optional(),
    search: z.string().trim().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const occurrenceListSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({
    status: z.enum(BILL_OCCURRENCE_STATUSES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
export const markBillPaidSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    paidDate: z.coerce.date().optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
