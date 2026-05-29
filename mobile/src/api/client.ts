import axios from "axios";
import {
  ApiResponse,
  AuthPayload,
  Contact,
  ContactDetail,
  ContactLedger,
  DashboardSummary,
  Installment,
  InterestPreview,
  Loan,
  LoanDetail,
  LoanStatusChartPoint,
  LoanTypeChartPoint,
  MonthlyChartPoint,
  PaginatedContacts,
  PaginatedLoans,
  PaginatedNotificationLogs,
  PaginatedReports,
  Payment,
  PaymentMethod,
  PaymentMutationResponse,
  PaymentProof,
  ReminderSettings,
  Report,
  TopContact,
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
  getContact: (contactId: string) => unwrap<ContactDetail>(apiClient.get(`/contacts/${contactId}`)),
  getContactLedger: (contactId: string) => unwrap<ContactLedger>(apiClient.get(`/contacts/${contactId}/ledger`)),
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
  getLoan: (loanId: string) => unwrap<LoanDetail>(apiClient.get(`/loans/${loanId}`)),
  createLoan: (payload: Partial<Loan>) => unwrap<Loan>(apiClient.post("/loans", payload)),
  updateLoan: (loanId: string, payload: Partial<Loan>) => unwrap<Loan>(apiClient.patch(`/loans/${loanId}`, payload)),
  deleteLoan: (loanId: string) => unwrap<{ id: string }>(apiClient.delete(`/loans/${loanId}`)),
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

  getReminderSettings: () => unwrap<ReminderSettings>(apiClient.get("/reminders/settings")),
  updateReminderSettings: (payload: Partial<ReminderSettings>) =>
    unwrap<ReminderSettings>(apiClient.patch("/reminders/settings", payload)),
  registerPushToken: (payload: { pushToken: string; timezone?: string }) =>
    unwrap<ReminderSettings>(apiClient.post("/reminders/register-push-token", payload)),
  getReminderLogs: (params?: { type?: string; status?: string; page?: number; limit?: number }) =>
    unwrap<PaginatedNotificationLogs>(apiClient.get("/reminders/logs", { params })),
  sendTestReminder: () => unwrap(apiClient.post("/reminders/test")),

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
