import { z } from "zod";
import { LoanStatus, LoanType } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";

const optionalDate = z.coerce.date().optional();

export const loanIdParamSchema = z.object({
  params: z.object({
    loanId: objectIdSchema,
  }),
});

export const createLoanSchema = z.object({
  body: z.object({
    contactId: objectIdSchema,
    type: z.enum(LoanType),
    amount: z.coerce.number().positive("Loan amount must be greater than 0"),
    issueDate: z.coerce.date().optional(),
    dueDate: optionalDate,
    description: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

export const getLoansSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    type: z.enum(LoanType).optional(),
    status: z.enum(LoanStatus).optional(),
    contactId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const updateLoanSchema = z.object({
  params: z.object({
    loanId: objectIdSchema,
  }),
  body: z.object({
    contactId: objectIdSchema.optional(),
    type: z.enum(LoanType).optional(),
    amount: z.coerce.number().positive("Loan amount must be greater than 0").optional(),
    issueDate: z.coerce.date().optional(),
    dueDate: optionalDate.or(z.literal("")),
    description: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});
