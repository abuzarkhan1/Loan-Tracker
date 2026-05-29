import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { ReceiptStatus, ReceiptType } from "./receipt.model";

export const receiptPaymentParamSchema = z.object({
  params: z.object({ paymentId: objectIdSchema }),
});

export const receiptLoanParamSchema = z.object({
  params: z.object({ loanId: objectIdSchema }),
});

export const receiptContactParamSchema = z.object({
  params: z.object({ contactId: objectIdSchema }),
});

export const receiptIdParamSchema = z.object({
  params: z.object({ receiptId: objectIdSchema }),
});

export const receiptListSchema = z.object({
  query: z.object({
    type: z.enum(ReceiptType).optional(),
    status: z.enum(ReceiptStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
