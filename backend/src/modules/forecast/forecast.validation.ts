import { z } from "zod";

export const forecastRangeSchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});
