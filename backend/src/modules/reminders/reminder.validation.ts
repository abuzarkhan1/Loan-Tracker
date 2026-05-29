import { z } from "zod";
import { NotificationStatus, ReminderType, WEEK_DAYS } from "./reminder.enums";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

export const updateReminderSettingsSchema = z.object({
  body: z.object({
    dueSoonEnabled: z.boolean().optional(),
    dueSoonDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
    overdueEnabled: z.boolean().optional(),
    dailySummaryEnabled: z.boolean().optional(),
    dailySummaryTime: timeSchema.optional(),
    weeklySummaryEnabled: z.boolean().optional(),
    weeklySummaryDay: z.enum(WEEK_DAYS).optional(),
    weeklySummaryTime: timeSchema.optional(),
    timezone: z.string().trim().min(1).max(80).optional(),
  }),
});

export const registerPushTokenSchema = z.object({
  body: z.object({
    pushToken: z.string().trim().min(10).max(250),
    timezone: z.string().trim().min(1).max(80).optional(),
  }),
});

export const getNotificationLogsSchema = z.object({
  query: z.object({
    type: z.enum(ReminderType).optional(),
    status: z.enum(NotificationStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const updateLoanReminderSchema = z.object({
  params: z.object({
    loanId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
  }),
  body: z.object({
    enabled: z.boolean().optional(),
    remindBeforeDays: z.coerce.number().int().min(0).max(60).optional(),
    repeatUntilPaid: z.boolean().optional(),
    repeatFrequency: z.enum(["DAILY", "EVERY_2_DAYS", "WEEKLY"]).optional(),
    tone: z.enum(["POLITE", "NORMAL", "STRICT"]).optional(),
    customMessage: z.string().trim().max(500).optional().or(z.literal("")),
  }),
});

export const loanReminderParamSchema = z.object({
  params: z.object({
    loanId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
  }),
});

export const snoozeLoanReminderSchema = z.object({
  params: z.object({
    loanId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
  }),
  body: z.object({
    snoozedUntil: z.coerce.date(),
  }),
});
