export enum ReminderType {
  DUE_SOON = "DUE_SOON",
  OVERDUE = "OVERDUE",
  DAILY_SUMMARY = "DAILY_SUMMARY",
  WEEKLY_SUMMARY = "WEEKLY_SUMMARY",
  CUSTOM = "CUSTOM",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export const WEEK_DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];
