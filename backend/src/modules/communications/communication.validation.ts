import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const communicationContactSchema = z.object({
  params: z.object({ contactId: objectIdSchema }),
  query: z.object({
    type: z.string().trim().optional(),
    channel: z.string().trim().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
