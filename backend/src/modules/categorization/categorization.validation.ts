import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";

export const suggestCategorizationSchema = z.object({
  body: z.object({
    text: z.string().trim().max(500).optional(),
    amount: z.coerce.number().positive().optional(),
    type: z.enum(["INCOME", "EXPENSE"]),
  }),
});

export const categorizationFeedbackSchema = z.object({
  body: z.object({
    text: z.string().trim().min(1).max(500),
    type: z.enum(["INCOME", "EXPENSE"]),
    categoryId: objectIdSchema,
    paymentMethod: z.enum(PaymentMethod).optional(),
  }),
});
