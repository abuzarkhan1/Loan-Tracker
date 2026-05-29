import { z } from "zod";
import { PaymentMethod } from "../../constants/enums";

export const financeDateRangeSchema = z.object({
  query: z.object({
    date: z.coerce.date().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
  }),
});
