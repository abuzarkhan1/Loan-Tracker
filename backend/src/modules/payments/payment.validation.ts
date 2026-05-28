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
