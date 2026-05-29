import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const createSettlementSchema = z.object({
  params: z.object({ loanId: objectIdSchema }),
  body: z.object({ settlementNote: z.string().trim().max(1000).optional().or(z.literal("")) }),
});
export const settlementIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const settlementLoanParamSchema = z.object({ params: z.object({ loanId: objectIdSchema }) });
export const settlementListSchema = z.object({
  query: z.object({
    status: z.enum(["DRAFT", "SETTLED", "CANCELLED"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
