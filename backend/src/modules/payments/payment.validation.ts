import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";

export const paymentIdParamSchema = z.object({
  params: z.object({
    paymentId: objectIdSchema,
  }),
});

export const loanPaymentsParamSchema = z.object({
  params: z.object({
    loanId: objectIdSchema,
  }),
});

export const getPaymentsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    loanId: objectIdSchema.optional(),
    contactId: objectIdSchema.optional(),
    method: z.enum(PaymentMethod).optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    paymentDateFrom: z.coerce.date().optional(),
    paymentDateTo: z.coerce.date().optional(),
    hasProof: z.coerce.boolean().optional(),
    sortBy: z.enum(["paymentDate", "amount", "createdAt"]).default("paymentDate"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const createPaymentSchema = z.object({
  body: z.object({
    loanId: objectIdSchema,
    amount: z.coerce.number().positive("Payment amount must be greater than 0"),
    method: z.enum(PaymentMethod).default(PaymentMethod.CASH),
    paymentDate: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    paymentId: objectIdSchema,
  }),
  body: z.object({
    amount: z.coerce.number().positive("Payment amount must be greater than 0").optional(),
    method: z.enum(PaymentMethod).optional(),
    paymentDate: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
