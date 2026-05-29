import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { ReportType, ReportStatus } from "./report.model";

export const reportIdParamSchema = z.object({
  params: z.object({
    reportId: objectIdSchema,
  }),
});

export const contactReportParamSchema = z.object({
  params: z.object({
    contactId: objectIdSchema,
  }),
  body: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }).optional(),
});

export const monthlyReportSchema = z.object({
  body: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export const reportListSchema = z.object({
  query: z.object({
    type: z.enum(ReportType).optional(),
    status: z.enum(ReportStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
