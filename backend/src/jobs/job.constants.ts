export const queueNames = {
  notification: "notificationQueue",
  report: "reportQueue",
  cleanup: "cleanupQueue",
  audit: "auditQueue",
  email: "emailQueue",
  salary: "salaryQueue",
  bill: "billQueue",
  recurringTransaction: "recurringTransactionQueue",
  alert: "alertQueue",
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
  generateBillOccurrences: "generate-bill-occurrences",
  generateRecurringOccurrences: "generate-recurring-occurrences",
  evaluateAlerts: "evaluate-alerts",
  cleanupTempFiles: "cleanup-temp-files",
  writeAuditLog: "write-audit-log",
} as const;
