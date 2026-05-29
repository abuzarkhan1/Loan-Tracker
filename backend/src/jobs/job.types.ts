import type { AuditAction, AuditEntityType } from "../modules/audit/audit-log.model";
import type { ReminderType } from "../modules/reminders/reminder.enums";
import type { ReportType } from "../modules/reports/report.model";
import { jobNames } from "./job.constants";

export type NotificationJobPayload = {
  userId: string;
  loanId?: string;
  notificationLogId?: string;
  type: ReminderType;
  title: string;
  body: string;
  scheduledFor?: string;
};

export type ReportJobPayload = {
  userId: string;
  reportId?: string;
  type: ReportType;
  metadata?: Record<string, unknown>;
};

export type CleanupJobPayload = {
  scope: "TEMP_FILES" | "OLD_LOGS";
  olderThanHours?: number;
};

export type AuditJobPayload = {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export type QueueJobPayload =
  | { name: typeof jobNames.dueSoonReminder; data: NotificationJobPayload }
  | { name: typeof jobNames.overdueReminder; data: NotificationJobPayload }
  | { name: typeof jobNames.dailySummary; data: NotificationJobPayload }
  | { name: typeof jobNames.weeklySummary; data: NotificationJobPayload }
  | { name: typeof jobNames.pdfReport; data: ReportJobPayload }
  | { name: typeof jobNames.excelExport; data: ReportJobPayload }
  | { name: typeof jobNames.cleanupTempFiles; data: CleanupJobPayload }
  | { name: typeof jobNames.writeAuditLog; data: AuditJobPayload };
