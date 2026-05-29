import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { FOLLOW_UP_CHANNELS, FOLLOW_UP_STATUSES, FOLLOW_UP_TYPES } from "./follow-up.model";

const body = z.object({
  contactId: objectIdSchema,
  loanId: objectIdSchema.optional(),
  channel: z.enum(FOLLOW_UP_CHANNELS),
  type: z.enum(FOLLOW_UP_TYPES).default("REMINDER"),
  message: z.string().trim().max(4000).optional(),
  note: z.string().trim().max(1000).optional(),
  status: z.enum(FOLLOW_UP_STATUSES).default("SENT"),
  nextFollowUpAt: z.coerce.date().optional(),
});

export const createFollowUpSchema = z.object({ body });
export const updateFollowUpSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const followUpIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const followUpContactParamSchema = z.object({ params: z.object({ contactId: objectIdSchema }) });
export const followUpLoanParamSchema = z.object({ params: z.object({ loanId: objectIdSchema }) });
export const snoozeFollowUpSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ nextFollowUpAt: z.coerce.date() }),
});
export const followUpListSchema = z.object({
  query: z.object({
    channel: z.enum(FOLLOW_UP_CHANNELS).optional(),
    status: z.enum(FOLLOW_UP_STATUSES).optional(),
    contactId: objectIdSchema.optional(),
    loanId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
