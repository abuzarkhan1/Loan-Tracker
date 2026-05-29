export const queueNames = {
  notification: "notificationQueue",
  report: "reportQueue",
  cleanup: "cleanupQueue",
  audit: "auditQueue",
  email: "emailQueue",
  salary: "salaryQueue",
} as const;

export const jobNames = {
  dueSoonReminder: "due-soon-reminder",
  overdueReminder: "overdue-reminder",
  dailySummary: "daily-summary",
  weeklySummary: "weekly-summary",
  pdfReport: "pdf-report",
  excelExport: "excel-export",
  receiptPdf: "receipt-pdf",
  sendEmail: "send-email",
  createExpectedSalary: "create-expected-salary",
  cleanupTempFiles: "cleanup-temp-files",
  writeAuditLog: "write-audit-log",
} as const;
