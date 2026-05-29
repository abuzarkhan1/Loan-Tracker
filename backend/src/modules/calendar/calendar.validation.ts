import { z } from "zod";

export const calendarRangeSchema = z.object({
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

export const calendarDaySchema = z.object({
  query: z.object({
    date: z.coerce.date(),
  }),
});

export const calendarMonthSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});
