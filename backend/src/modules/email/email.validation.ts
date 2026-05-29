import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { EMAIL_STATUSES, EMAIL_TYPES } from "./email.model";

const sendEmailBody = z.object({
  toEmail: z.string().trim().email().optional(),
  subject: z.string().trim().min(2).max(220).optional(),
  message: z.string().trim().max(4000).optional(),
  attachPdf: z.boolean().optional(),
});

export const updateEmailPreferencesSchema = z.object({
  body: z.object({
    emailReportsEnabled: z.boolean().optional(),
    weeklySummaryEnabled: z.boolean().optional(),
    weeklySummaryDay: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).optional(),
    weeklySummaryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    monthlyReportEnabled: z.boolean().optional(),
    monthlyReportDay: z.coerce.number().int().min(1).max(28).optional(),
    overdueEmailEnabled: z.boolean().optional(),
    receiptEmailEnabled: z.boolean().optional(),
    defaultRecipientEmail: z.string().trim().email().optional().or(z.literal("")),
  }),
});

export const sendPaymentReceiptEmailSchema = z.object({ params: z.object({ paymentId: objectIdSchema }), body: sendEmailBody });
export const sendLoanEmailSchema = z.object({ params: z.object({ loanId: objectIdSchema }), body: sendEmailBody });
export const sendContactEmailSchema = z.object({ params: z.object({ contactId: objectIdSchema }), body: sendEmailBody });
export const sendMonthlyReportEmailSchema = z.object({
  body: sendEmailBody.extend({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export const emailLogsSchema = z.object({
  query: z.object({
    type: z.enum(EMAIL_TYPES).optional(),
    status: z.enum(EMAIL_STATUSES).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const retryEmailSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});
