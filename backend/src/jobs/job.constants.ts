export const queueNames = {
  notification: "notificationQueue",
  report: "reportQueue",
  cleanup: "cleanupQueue",
  audit: "auditQueue",
} as const;

export const jobNames = {
  dueSoonReminder: "due-soon-reminder",
  overdueReminder: "overdue-reminder",
  dailySummary: "daily-summary",
  weeklySummary: "weekly-summary",
  pdfReport: "pdf-report",
  excelExport: "excel-export",
  cleanupTempFiles: "cleanup-temp-files",
  writeAuditLog: "write-audit-log",
} as const;
