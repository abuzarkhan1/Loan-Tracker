import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";
import { objectIdSchema } from "../contacts/contact.validation";
import { TRANSACTION_TEMPLATE_TYPES } from "./transaction-template.model";

const body = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(TRANSACTION_TEMPLATE_TYPES),
  amount: z.coerce.number().positive(),
  categoryId: objectIdSchema,
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.CASH),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  isFavorite: z.coerce.boolean().default(false),
});

export const createTransactionTemplateSchema = z.object({ body });
export const updateTransactionTemplateSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const transactionTemplateIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const transactionTemplateListSchema = z.object({
  query: z.object({
    type: z.enum(TRANSACTION_TEMPLATE_TYPES).optional(),
    isFavorite: z.coerce.boolean().optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
