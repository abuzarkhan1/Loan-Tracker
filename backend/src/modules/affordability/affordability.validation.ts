import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const affordabilityCheckSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    categoryId: objectIdSchema.optional(),
    plannedDate: z.coerce.date(),
    note: z.string().trim().max(200).optional().or(z.literal("")),
  }),
});
