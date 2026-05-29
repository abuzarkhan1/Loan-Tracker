import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { PROMISE_STATUSES } from "./promise.model";

const body = z.object({
  contactId: objectIdSchema,
  loanId: objectIdSchema,
  promisedAmount: z.coerce.number().positive(),
  promiseDate: z.coerce.date(),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createPromiseSchema = z.object({ body });
export const updatePromiseSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial().extend({ status: z.enum(PROMISE_STATUSES).optional() }) });
export const promiseIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const promiseContactParamSchema = z.object({ params: z.object({ contactId: objectIdSchema }) });
export const promiseLoanParamSchema = z.object({ params: z.object({ loanId: objectIdSchema }) });
export const promiseListSchema = z.object({
  query: z.object({
    status: z.enum(PROMISE_STATUSES).optional(),
    contactId: objectIdSchema.optional(),
    loanId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
