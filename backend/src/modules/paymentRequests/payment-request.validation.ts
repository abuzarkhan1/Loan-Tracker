import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const createPaymentRequestSchema = z.object({
  params: z.object({ loanId: objectIdSchema }),
  body: z.object({
    amountRequested: z.coerce.number().positive().optional(),
    message: z.string().trim().max(1000).optional(),
    expiresAt: z.coerce.date().optional(),
  }),
});
export const paymentRequestIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const publicPaymentRequestSchema = z.object({ params: z.object({ token: z.string().trim().min(32).max(128) }) });
export const paymentRequestListSchema = z.object({
  query: z.object({
    status: z.enum(["CREATED", "SHARED", "EMAIL_SENT", "CANCELLED", "PAID"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
