import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const spendingHabitsSchema = z.object({
  query: z.object({
    date: z.coerce.date().optional(),
  }),
});

export const categoryTrendSchema = z.object({
  params: z.object({ categoryId: objectIdSchema }),
  query: z.object({
    date: z.coerce.date().optional(),
  }),
});
