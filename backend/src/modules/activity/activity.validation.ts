import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const recentActivitySchema = z.object({
  query: z.object({
    type: z.string().trim().optional(),
    contactId: objectIdSchema.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
