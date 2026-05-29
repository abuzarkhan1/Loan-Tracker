import axios from "axios";
import {
  ApiResponse,
  AuthPayload,
  Backup,
  Budget,
  BulkDeviceContactImportResult,
  CashFlowTrendPoint,
  Category,
  CategoryBreakdown,
  Contact,
  ContactDetail,
  ContactLedger,
  CommunicationTimeline,
  ContactMatchResult,
  ContactPerformanceReport,
  ContactRelationship,
  ContactWithBalance,
  DashboardSummary,
  DashboardInsight,
  DeviceContactImportPayload,
  DeviceContactImportResult,
  EmailLog,
  EmailPreferences,
  FinanceDashboard,
  FinanceInsight,
  FinancePaymentMethodBreakdown,
  FollowUp,
  Installment,
  InterestPreview,
  Loan,
  LoanDetail,
  LoanImpactOnSalaryReport,
  LoanReminder,
  LoanReminderPreview,
  LoanStatusChartPoint,
  LoanTypeChartPoint,
  MonthlySummaryReport,
  MonthlyChartPoint,
  OverdueReport,
  PaginatedContacts,
  PaginatedActivity,
  PaginatedBackups,
  PaginatedEmailLogs,
  PaginatedFollowUps,
  PaginatedLoans,
  PaginatedNotificationLogs,
  PaginatedPaymentRequests,
  PaginatedPromises,
  PaginatedReceipts,
  PaginatedReports,
  PaginatedReminderTemplates,
  PaginatedSalaryAllocations,
  PaginatedSalaryEntries,
  PaginatedSavingsGoalProgress,
  PaginatedSettlements,
  PaginatedTransactions,
  Payment,
  PaymentMethodReport,
  PaymentMethod,
  PaymentMutationResponse,
  PaymentProof,
  Receipt,
  ReminderSettings,
  ReminderTemplate,
  Report,
  ReportOverview,
  RecoveryRateReport,
  RecoveryCenter,
  PaymentRequest,
  PromiseToPay,
  SalaryAllocation,
  SalaryCycleSummary,
  SalaryEntry,
  SalaryProfile,
  SalaryVsExpenseReport,
  SavingsGoal,
  Settlement,
  TrustProfile,
  TopContact,
  Transaction,
  TransactionType,
  User,
} from "./types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

export const setAuthToken = (token?: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

const unwrap = async <T>(promise: Promise<{ data: ApiResponse<T> }>) => {
  const response = await promise;
  return response.data.data;
};

export const api = {
  login: (payload: { email: string; password: string }) =>
    unwrap<AuthPayload>(apiClient.post("/auth/login", payload)),
  register: (payload: { name: string; email: string; password: string }) =>
    unwrap<AuthPayload>(apiClient.post("/auth/register", payload)),
  me: () => unwrap<User>(apiClient.get("/auth/me")),
  updateMe: (payload: Partial<Pick<User, "name" | "email">>) =>
    unwrap<User>(apiClient.patch("/auth/me", payload)),

  getContacts: (params?: { search?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedContacts>(apiClient.get("/contacts", { params })),
  getFavoriteContacts: (limit = 10) =>
    unwrap<ContactWithBalance[]>(apiClient.get("/contacts/favorites", { params: { limit } })),
  getRecentContacts: (limit = 10) =>
    unwrap<ContactWithBalance[]>(apiClient.get("/contacts/recent", { params: { limit } })),
  importDeviceContact: (payload: DeviceContactImportPayload) =>
    unwrap<DeviceContactImportResult>(apiClient.post("/contacts/import-device-contact", payload)),
  bulkImportDeviceContacts: (contacts: DeviceContactImportPayload[]) =>
    unwrap<BulkDeviceContactImportResult>(apiClient.post("/contacts/bulk-import-device-contacts", { contacts })),
  matchContact: (params: { phone?: string; name?: string; deviceContactId?: string }) =>
    unwrap<ContactMatchResult>(apiClient.get("/contacts/match", { params })),
  getContact: (contactId: string) => unwrap<ContactDetail>(apiClient.get(`/contacts/${contactId}`)),
  getContactLedger: (contactId: string) => unwrap<ContactLedger>(apiClient.get(`/contacts/${contactId}/ledger`)),
  getContactTrustProfile: (contactId: string) =>
    unwrap<TrustProfile>(apiClient.get(`/contacts/${contactId}/trust-profile`)),
  getContactRelationship: (contactId: string) =>
    unwrap<ContactRelationship>(apiClient.get(`/contacts/${contactId}/relationship`)),
  updateContactRelationship: (contactId: string, payload: ContactRelationship) =>
    unwrap<ContactRelationship>(apiClient.patch(`/contacts/${contactId}/relationship`, payload)),
  setContactFavorite: (contactId: string, isFavorite: boolean) =>
    unwrap<Contact>(apiClient.patch(`/contacts/${contactId}/favorite`, { isFavorite })),
  touchContactLastUsed: (contactId: string) =>
    unwrap<Contact>(apiClient.patch(`/contacts/${contactId}/last-used`)),
  createContact: (payload: Partial<Contact>) => unwrap<Contact>(apiClient.post("/contacts", payload)),
  updateContact: (contactId: string, payload: Partial<Contact>) =>
    unwrap<Contact>(apiClient.patch(`/contacts/${contactId}`, payload)),
  deleteContact: (contactId: string) => unwrap<{ id: string }>(apiClient.delete(`/contacts/${contactId}`)),

  getLoans: (params?: {
    search?: string;
    type?: string;
    status?: string;
    contactId?: string;
    minAmount?: number;
    maxAmount?: number;
    issueDateFrom?: string;
    issueDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    paymentMethod?: string;
    hasProof?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => unwrap<PaginatedLoans>(apiClient.get("/loans", { params })),
  getPinnedLoans: (limit = 10) =>
    unwrap<Loan[]>(apiClient.get("/loans/pinned", { params: { limit } })),
  getLoan: (loanId: string) => unwrap<LoanDetail>(apiClient.get(`/loans/${loanId}`)),
  createLoan: (payload: Partial<Loan>) => unwrap<Loan>(apiClient.post("/loans", payload)),
  updateLoan: (loanId: string, payload: Partial<Loan>) => unwrap<Loan>(apiClient.patch(`/loans/${loanId}`, payload)),
  deleteLoan: (loanId: string) => unwrap<{ id: string }>(apiClient.delete(`/loans/${loanId}`)),
  setLoanPinned: (loanId: string, isPinned: boolean) =>
    unwrap<Loan>(apiClient.patch(`/loans/${loanId}/pin`, { isPinned })),
  getLoanReminder: (loanId: string) => unwrap<LoanReminder>(apiClient.get(`/loans/${loanId}/reminder`)),
  updateLoanReminder: (loanId: string, payload: Partial<LoanReminder>) =>
    unwrap<LoanReminder>(apiClient.patch(`/loans/${loanId}/reminder`, payload)),
  snoozeLoanReminder: (loanId: string, snoozedUntil: string) =>
    unwrap<LoanReminder>(apiClient.post(`/loans/${loanId}/reminder/snooze`, { snoozedUntil })),
  previewLoanReminder: (loanId: string) =>
    unwrap<LoanReminderPreview>(apiClient.get(`/loans/${loanId}/reminder/preview`)),
  testLoanReminder: (loanId: string) =>
    unwrap(apiClient.post(`/loans/${loanId}/reminder/test-message`)),
  getInterestPreview: (loanId: string, params?: { interestEnabled?: boolean; interestType?: string; interestRate?: number }) =>
    unwrap<InterestPreview>(apiClient.get(`/loans/${loanId}/interest-preview`, { params })),
  updateLoanInterest: (loanId: string, payload: { interestEnabled: boolean; interestType?: string; interestRate?: number }) =>
    unwrap<Loan>(apiClient.patch(`/loans/${loanId}/interest`, payload)),
  generateInstallments: (loanId: string) =>
    unwrap<Installment[]>(apiClient.post(`/loans/${loanId}/installments/generate`)),
  getLoanInstallments: (loanId: string) =>
    unwrap<Installment[]>(apiClient.get(`/loans/${loanId}/installments`)),
  getUpcomingInstallments: () => unwrap<Installment[]>(apiClient.get("/installments/upcoming")),
  updateInstallment: (installmentId: string, payload: Partial<Installment>) =>
    unwrap<Installment>(apiClient.patch(`/installments/${installmentId}`, payload)),
  payInstallment: (
    installmentId: string,
    payload: { amount: number; method?: PaymentMethod; paymentDate?: string; note?: string },
  ) => unwrap<{ installment: Installment; payment: Payment; loan: Loan }>(apiClient.post(`/installments/${installmentId}/pay`, payload)),

  addPayment: (payload: Partial<Payment>) => unwrap<PaymentMutationResponse>(apiClient.post("/payments", payload)),
  getPaymentsByLoan: (loanId: string) => unwrap<Payment[]>(apiClient.get(`/payments/loan/${loanId}`)),
  updatePayment: (paymentId: string, payload: Partial<Payment>) =>
    unwrap<PaymentMutationResponse>(apiClient.patch(`/payments/${paymentId}`, payload)),
  deletePayment: (paymentId: string) =>
    unwrap<PaymentMutationResponse>(apiClient.delete(`/payments/${paymentId}`)),
  uploadPaymentProof: (paymentId: string, file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append("proof", file as unknown as Blob);
    return unwrap<PaymentProof>(apiClient.post(`/payments/${paymentId}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }));
  },
  getPaymentProof: (paymentId: string) => unwrap<PaymentProof>(apiClient.get(`/payments/${paymentId}/proof`)),
  deletePaymentProof: (paymentId: string) =>
    unwrap<{ id: string; paymentId: string }>(apiClient.delete(`/payments/${paymentId}/proof`)),

  getSummary: () => unwrap<DashboardSummary>(apiClient.get("/dashboard/summary")),
  getMonthlyChart: (months = 6) =>
    unwrap<MonthlyChartPoint[]>(apiClient.get("/dashboard/monthly-chart", { params: { months } })),
  getLoanTypeChart: () => unwrap<LoanTypeChartPoint[]>(apiClient.get("/dashboard/loan-type-chart")),
  getLoanStatusChart: () => unwrap<LoanStatusChartPoint[]>(apiClient.get("/dashboard/loan-status-chart")),
  getTopContacts: (limit = 5) =>
    unwrap<TopContact[]>(apiClient.get("/dashboard/top-contacts", { params: { limit } })),
  getDashboardInsights: () => unwrap<DashboardInsight[]>(apiClient.get("/dashboard/insights")),

  getRecoveryCenter: () => unwrap<RecoveryCenter>(apiClient.get("/recovery/center")),

  getReminderSettings: () => unwrap<ReminderSettings>(apiClient.get("/reminders/settings")),
  updateReminderSettings: (payload: Partial<ReminderSettings>) =>
    unwrap<ReminderSettings>(apiClient.patch("/reminders/settings", payload)),
  registerPushToken: (payload: { pushToken: string; timezone?: string }) =>
    unwrap<ReminderSettings>(apiClient.post("/reminders/register-push-token", payload)),
  getReminderLogs: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedNotificationLogs>(apiClient.get("/reminders/logs", { params })),
  sendTestReminder: () => unwrap(apiClient.post("/reminders/test")),

  getEmailPreferences: () => unwrap<EmailPreferences>(apiClient.get("/email/preferences")),
  updateEmailPreferences: (payload: Partial<EmailPreferences>) =>
    unwrap<EmailPreferences>(apiClient.patch("/email/preferences", payload)),
  getEmailLogs: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedEmailLogs>(apiClient.get("/email/logs", { params })),
  retryEmail: (emailLogId: string) => unwrap<EmailLog>(apiClient.post(`/email/logs/${emailLogId}/retry`)),
  sendPaymentReceiptEmail: (paymentId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-payment-receipt/${paymentId}`, payload || {})),
  sendLoanSummaryEmail: (loanId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-loan-summary/${loanId}`, payload || {})),
  sendContactStatementEmail: (contactId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-contact-statement/${contactId}`, payload || {})),
  sendMonthlyReportEmail: (payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean; month?: number; year?: number }) =>
    unwrap<EmailLog>(apiClient.post("/email/send-monthly-report", payload || {})),
  sendOverdueReminderEmail: (loanId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-overdue-reminder/${loanId}`, payload || {})),
  sendPaymentRequestEmail: (loanId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-payment-request/${loanId}`, payload || {})),
  sendSettlementConfirmationEmail: (loanId: string, payload?: { toEmail?: string; subject?: string; message?: string; attachPdf?: boolean }) =>
    unwrap<EmailLog>(apiClient.post(`/email/send-settlement-confirmation/${loanId}`, payload || {})),

  getReminderTemplates: (params?: { channel?: string; type?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedReminderTemplates>(apiClient.get("/reminder-templates", { params })),
  createReminderTemplate: (payload: Partial<ReminderTemplate>) =>
    unwrap<ReminderTemplate>(apiClient.post("/reminder-templates", payload)),
  updateReminderTemplate: (id: string, payload: Partial<ReminderTemplate>) =>
    unwrap<ReminderTemplate>(apiClient.patch(`/reminder-templates/${id}`, payload)),
  deleteReminderTemplate: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/reminder-templates/${id}`)),
  previewReminderTemplate: (payload: { templateId?: string; loanId: string; subjectTemplate?: string; bodyTemplate?: string }) =>
    unwrap<{ subject: string; body: string; variables: Record<string, unknown> }>(apiClient.post("/reminder-templates/preview", payload)),

  createFollowUp: (payload: Partial<FollowUp>) => unwrap<FollowUp>(apiClient.post("/follow-ups", payload)),
  getFollowUps: (params?: { channel?: string; status?: string; contactId?: string; loanId?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedFollowUps>(apiClient.get("/follow-ups", { params })),
  getContactFollowUps: (contactId: string) => unwrap<PaginatedFollowUps>(apiClient.get(`/follow-ups/contact/${contactId}`)),
  getLoanFollowUps: (loanId: string) => unwrap<PaginatedFollowUps>(apiClient.get(`/follow-ups/loan/${loanId}`)),
  updateFollowUp: (id: string, payload: Partial<FollowUp>) => unwrap<FollowUp>(apiClient.patch(`/follow-ups/${id}`, payload)),
  snoozeFollowUp: (id: string, nextFollowUpAt: string) =>
    unwrap<FollowUp>(apiClient.post(`/follow-ups/${id}/snooze`, { nextFollowUpAt })),
  deleteFollowUp: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/follow-ups/${id}`)),

  createPromise: (payload: Partial<PromiseToPay>) => unwrap<PromiseToPay>(apiClient.post("/promises", payload)),
  getPromises: (params?: { status?: string; contactId?: string; loanId?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedPromises>(apiClient.get("/promises", { params })),
  getContactPromises: (contactId: string) => unwrap<PaginatedPromises>(apiClient.get(`/promises/contact/${contactId}`)),
  getLoanPromises: (loanId: string) => unwrap<PaginatedPromises>(apiClient.get(`/promises/loan/${loanId}`)),
  updatePromise: (id: string, payload: Partial<PromiseToPay>) => unwrap<PromiseToPay>(apiClient.patch(`/promises/${id}`, payload)),
  markPromiseKept: (id: string) => unwrap<PromiseToPay>(apiClient.patch(`/promises/${id}/mark-kept`)),
  markPromiseBroken: (id: string) => unwrap<PromiseToPay>(apiClient.patch(`/promises/${id}/mark-broken`)),
  cancelPromise: (id: string) => unwrap<PromiseToPay>(apiClient.patch(`/promises/${id}/cancel`)),
  deletePromise: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/promises/${id}`)),

  createContactPdfReport: (contactId: string, payload?: { dateFrom?: string; dateTo?: string }) =>
    unwrap<Report>(apiClient.post(`/reports/pdf/contact/${contactId}`, payload || {})),
  createMonthlyPdfReport: (payload: { month: number; year: number }) =>
    unwrap<Report>(apiClient.post("/reports/pdf/monthly", payload)),
  createCompleteHistoryPdfReport: () => unwrap<Report>(apiClient.post("/reports/pdf/complete-history")),
  createLoansExcelExport: (payload?: Record<string, unknown>) =>
    unwrap<Report>(apiClient.post("/reports/excel/loans", payload || {})),
  createPaymentsExcelExport: (payload?: Record<string, unknown>) =>
    unwrap<Report>(apiClient.post("/reports/excel/payments", payload || {})),
  createContactExcelExport: (contactId: string, payload?: Record<string, unknown>) =>
    unwrap<Report>(apiClient.post(`/reports/excel/contact/${contactId}`, payload || {})),
  getReports: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedReports>(apiClient.get("/reports", { params })),
  getReport: (reportId: string) => unwrap<Report>(apiClient.get(`/reports/${reportId}`)),
  deleteReport: (reportId: string) => unwrap<{ id: string }>(apiClient.delete(`/reports/${reportId}`)),

  getReportsOverview: () => unwrap<ReportOverview>(apiClient.get("/reports/overview")),
  getMonthlySummaryReport: (params?: { month?: number; year?: number }) =>
    unwrap<MonthlySummaryReport>(apiClient.get("/reports/monthly-summary", { params })),
  getOverdueReport: () => unwrap<OverdueReport>(apiClient.get("/reports/overdue")),
  getPaymentMethodsReport: () => unwrap<PaymentMethodReport>(apiClient.get("/reports/payment-methods")),
  getRecoveryRateReport: () => unwrap<RecoveryRateReport>(apiClient.get("/reports/recovery-rate")),
  getContactPerformanceReport: () =>
    unwrap<ContactPerformanceReport>(apiClient.get("/reports/contact-performance")),

  createPaymentReceipt: (paymentId: string) => unwrap<Receipt>(apiClient.post(`/receipts/payment/${paymentId}`)),
  createLoanReceipt: (loanId: string) => unwrap<Receipt>(apiClient.post(`/receipts/loan/${loanId}`)),
  createContactReceipt: (contactId: string) => unwrap<Receipt>(apiClient.post(`/receipts/contact/${contactId}`)),
  getReceipts: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedReceipts>(apiClient.get("/receipts", { params })),
  getReceipt: (receiptId: string) => unwrap<Receipt>(apiClient.get(`/receipts/${receiptId}`)),
  deleteReceipt: (receiptId: string) => unwrap<{ id: string }>(apiClient.delete(`/receipts/${receiptId}`)),

  createPaymentRequest: (loanId: string, payload?: { amountRequested?: number; message?: string; expiresAt?: string }) =>
    unwrap<PaymentRequest>(apiClient.post(`/payment-requests/loan/${loanId}`, payload || {})),
  getPaymentRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedPaymentRequests>(apiClient.get("/payment-requests", { params })),
  getPaymentRequest: (id: string) => unwrap<PaymentRequest>(apiClient.get(`/payment-requests/${id}`)),
  cancelPaymentRequest: (id: string) => unwrap<PaymentRequest>(apiClient.patch(`/payment-requests/${id}/cancel`)),
  markPaymentRequestShared: (id: string) => unwrap<PaymentRequest>(apiClient.patch(`/payment-requests/${id}/mark-shared`)),

  createSettlement: (loanId: string, payload?: { settlementNote?: string }) =>
    unwrap<Settlement>(apiClient.post(`/settlements/loan/${loanId}`, payload || {})),
  getSettlements: (params?: { status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedSettlements>(apiClient.get("/settlements", { params })),
  getSettlement: (id: string) => unwrap<Settlement>(apiClient.get(`/settlements/${id}`)),
  getLoanSettlement: (loanId: string) => unwrap<Settlement | null>(apiClient.get(`/settlements/loan/${loanId}`)),
  cancelSettlement: (id: string) => unwrap<Settlement>(apiClient.patch(`/settlements/${id}/cancel`)),
  sendSettlementEmail: (id: string, payload?: { toEmail?: string; subject?: string; message?: string }) =>
    unwrap<EmailLog>(apiClient.post(`/settlements/${id}/send-email`, payload || {})),

  getRecentActivity: (params?: { type?: string; contactId?: string; search?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedActivity>(apiClient.get("/activity/recent", { params })),

  getCommunicationTimeline: (contactId: string, params?: { type?: string; channel?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
    unwrap<CommunicationTimeline>(apiClient.get(`/communications/contact/${contactId}`, { params })),

  getCategories: (params?: { type?: "INCOME" | "EXPENSE"; includeInactive?: boolean }) =>
    unwrap<Category[]>(apiClient.get("/categories", { params })),
  createCategory: (payload: Partial<Category>) => unwrap<Category>(apiClient.post("/categories", payload)),
  updateCategory: (id: string, payload: Partial<Category>) => unwrap<Category>(apiClient.patch(`/categories/${id}`, payload)),
  deleteCategory: (id: string) => unwrap<{ id: string; deactivated: boolean }>(apiClient.delete(`/categories/${id}`)),

  getTransactions: (params?: {
    type?: TransactionType;
    categoryId?: string;
    paymentMethod?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    linkedContactId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => unwrap<PaginatedTransactions>(apiClient.get("/transactions", { params })),
  getTransaction: (id: string) => unwrap<Transaction>(apiClient.get(`/transactions/${id}`)),
  createTransaction: (payload: Partial<Transaction>) => unwrap<Transaction>(apiClient.post("/transactions", payload)),
  updateTransaction: (id: string, payload: Partial<Transaction>) => unwrap<Transaction>(apiClient.patch(`/transactions/${id}`, payload)),
  deleteTransaction: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/transactions/${id}`)),

  getSalaryProfile: () => unwrap<SalaryProfile | null>(apiClient.get("/salary/profile")),
  saveSalaryProfile: (payload: Partial<SalaryProfile>) => unwrap<SalaryProfile>(apiClient.post("/salary/profile", payload)),
  updateSalaryProfile: (payload: Partial<SalaryProfile>) => unwrap<SalaryProfile>(apiClient.patch("/salary/profile", payload)),
  getSalaryDashboard: () => unwrap<SalaryCycleSummary & { hasProfile: boolean; nextSalaryDate?: string }>(apiClient.get("/salary/dashboard")),
  getCurrentSalaryCycle: (params?: { date?: string }) => unwrap<{ cycleStartDate: string; cycleEndDate: string; salaryDate: string; profile?: SalaryProfile }>(apiClient.get("/salary/current-cycle", { params })),
  getSalaryCycleSummary: (params?: { date?: string }) => unwrap<SalaryCycleSummary>(apiClient.get("/salary/cycle-summary", { params })),
  createSalaryEntry: (payload: Partial<SalaryEntry>) => unwrap<SalaryEntry>(apiClient.post("/salary/entries", payload)),
  getSalaryEntries: (params?: { status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedSalaryEntries>(apiClient.get("/salary/entries", { params })),
  getCurrentCycleSalaryEntry: () => unwrap<SalaryEntry | null>(apiClient.get("/salary/entries/current-cycle")),
  getSalaryEntry: (id: string) => unwrap<SalaryEntry>(apiClient.get(`/salary/entries/${id}`)),
  updateSalaryEntry: (id: string, payload: Partial<SalaryEntry>) => unwrap<SalaryEntry>(apiClient.patch(`/salary/entries/${id}`, payload)),
  deleteSalaryEntry: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/salary/entries/${id}`)),
  markSalaryReceived: (id: string, payload?: Partial<SalaryEntry>) => unwrap<SalaryEntry>(apiClient.patch(`/salary/entries/${id}/mark-received`, payload || {})),
  markSalaryMissed: (id: string) => unwrap<SalaryEntry>(apiClient.patch(`/salary/entries/${id}/mark-missed`)),
  createSalaryAllocation: (payload: Partial<SalaryAllocation>) => unwrap<SalaryAllocation>(apiClient.post("/salary/allocations", payload)),
  getSalaryAllocations: (params?: { type?: string; date?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedSalaryAllocations>(apiClient.get("/salary/allocations", { params })),
  updateSalaryAllocation: (id: string, payload: Partial<SalaryAllocation>) => unwrap<SalaryAllocation>(apiClient.patch(`/salary/allocations/${id}`, payload)),
  deleteSalaryAllocation: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/salary/allocations/${id}`)),
  getSalaryAllocationSummary: (params?: { date?: string }) =>
    unwrap<{ salaryAmount: number; allocatedAmount: number; usedAmount: number; unallocatedAmount: number; remainingAmount: number; allocations: SalaryAllocation[] }>(apiClient.get("/salary/allocation-summary", { params })),

  createBudget: (payload: Partial<Budget>) => unwrap<Budget>(apiClient.post("/budgets", payload)),
  getCurrentBudget: (params?: { date?: string }) => unwrap<Budget | null>(apiClient.get("/budgets/current", { params })),
  getBudgets: (params?: { month?: number; year?: number; date?: string }) => unwrap<Budget[]>(apiClient.get("/budgets", { params })),
  updateBudget: (id: string, payload: Partial<Budget>) => unwrap<Budget>(apiClient.patch(`/budgets/${id}`, payload)),
  deleteBudget: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/budgets/${id}`)),

  createSavingsGoal: (payload: Partial<SavingsGoal>) => unwrap<SavingsGoal>(apiClient.post("/savings-goals", payload)),
  getSavingsGoals: (params?: { status?: string }) => unwrap<SavingsGoal[]>(apiClient.get("/savings-goals", { params })),
  getSavingsGoal: (id: string) => unwrap<SavingsGoal>(apiClient.get(`/savings-goals/${id}`)),
  updateSavingsGoal: (id: string, payload: Partial<SavingsGoal>) => unwrap<SavingsGoal>(apiClient.patch(`/savings-goals/${id}`, payload)),
  deleteSavingsGoal: (id: string) => unwrap<{ id: string }>(apiClient.delete(`/savings-goals/${id}`)),
  getSavingsGoalProgress: (id: string, params?: { page?: number; limit?: number }) =>
    unwrap<PaginatedSavingsGoalProgress>(apiClient.get(`/savings-goals/${id}/progress`, { params })),
  addSavingsProgress: (id: string, payload: { amount: number; date?: string; note?: string }) =>
    unwrap<SavingsGoal>(apiClient.post(`/savings-goals/${id}/add-progress`, payload)),

  getFinanceDashboard: (params?: { date?: string; dateFrom?: string; dateTo?: string; month?: number; year?: number }) =>
    unwrap<FinanceDashboard>(apiClient.get("/finance/dashboard", { params })),
  getFinanceCashFlow: (params?: { date?: string; dateFrom?: string; dateTo?: string; month?: number; year?: number }) =>
    unwrap<Array<{ date: string; type: TransactionType; amount: number }>>(apiClient.get("/finance/cash-flow", { params })),
  getFinanceCategoryBreakdown: (params?: { date?: string; dateFrom?: string; dateTo?: string; month?: number; year?: number }) =>
    unwrap<CategoryBreakdown[]>(apiClient.get("/finance/category-breakdown", { params })),
  getFinancePaymentMethodBreakdown: (params?: { date?: string; dateFrom?: string; dateTo?: string; month?: number; year?: number; paymentMethod?: PaymentMethod }) =>
    unwrap<FinancePaymentMethodBreakdown[]>(apiClient.get("/finance/payment-method-breakdown", { params })),
  getFinanceInsights: (params?: { date?: string; dateFrom?: string; dateTo?: string; month?: number; year?: number }) =>
    unwrap<FinanceInsight[]>(apiClient.get("/finance/insights", { params })),
  getSalaryVsExpenseReport: () => unwrap<SalaryVsExpenseReport>(apiClient.get("/reports/salary-vs-expense")),
  getLoanImpactOnSalaryReport: () => unwrap<LoanImpactOnSalaryReport>(apiClient.get("/reports/loan-impact-on-salary")),
  getBudgetUsageReport: () => unwrap<Budget | null>(apiClient.get("/reports/budget-usage")),
  getSavingsProgressReport: () => unwrap<SavingsGoal[]>(apiClient.get("/reports/savings-progress")),
  getCashFlowTrendReport: () => unwrap<CashFlowTrendPoint[]>(apiClient.get("/reports/cash-flow-trend")),

  createBackup: () => unwrap<Backup>(apiClient.post("/backups/create")),
  getBackups: (params?: { page?: number; limit?: number }) =>
    unwrap<PaginatedBackups>(apiClient.get("/backups", { params })),
  getBackup: (backupId: string) => unwrap<Backup>(apiClient.get(`/backups/${backupId}`)),
  restoreBackup: (backupId: string, mode: "MERGE" | "REPLACE") =>
    unwrap<{ id: string; mode: string }>(apiClient.post(`/backups/${backupId}/restore`, { mode })),
  deleteBackup: (backupId: string) => unwrap<{ id: string }>(apiClient.delete(`/backups/${backupId}`)),
};

export const getApiBaseUrl = () => API_URL;

export const getAssetUrl = (url?: string) => {
  if (!url) return undefined;

  let resolvedUrl = url;

  // If the URL is absolute and contains localhost/127.0.0.1, replace it with the dynamic host of the current API_URL
  if (/^https?:\/\//i.test(url) && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    const rootUrl = (API_URL || "").replace(/\/api\/?$/, "");
    if (rootUrl) {
      resolvedUrl = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, rootUrl);
    }
  }

  if (/^https?:\/\//i.test(resolvedUrl)) return resolvedUrl;

  const rootUrl = (API_URL || "").replace(/\/api\/?$/, "");
  return `${rootUrl}${resolvedUrl.startsWith("/") ? resolvedUrl : `/${resolvedUrl}`}`;
};
