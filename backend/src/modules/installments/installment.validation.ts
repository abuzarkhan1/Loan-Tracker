import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { InstallmentStatus } from "./installment.model";

export const loanInstallmentsParamSchema = z.object({
  params: z.object({
    loanId: objectIdSchema,
  }),
});

export const installmentIdParamSchema = z.object({
  params: z.object({
    installmentId: objectIdSchema,
  }),
});

export const updateInstallmentSchema = z.object({
  params: z.object({
    installmentId: objectIdSchema,
  }),
  body: z.object({
    dueDate: z.coerce.date().optional(),
    expectedAmount: z.coerce.number().positive().optional(),
    status: z.enum(InstallmentStatus).optional(),
  }),
});

export const payInstallmentSchema = z.object({
  params: z.object({
    installmentId: objectIdSchema,
  }),
  body: z.object({
    amount: z.coerce.number().positive("Payment amount must be greater than 0"),
    method: z.enum(PaymentMethod).default(PaymentMethod.CASH),
    paymentDate: z.coerce.date().optional(),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
