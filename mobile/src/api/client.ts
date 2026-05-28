import axios from "axios";
import {
  ApiResponse,
  AuthPayload,
  Contact,
  ContactDetail,
  DashboardSummary,
  Loan,
  LoanDetail,
  LoanStatusChartPoint,
  LoanTypeChartPoint,
  MonthlyChartPoint,
  PaginatedContacts,
  PaginatedLoans,
  Payment,
  PaymentMutationResponse,
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
  createContact: (payload: Partial<Contact>) => unwrap<Contact>(apiClient.post("/contacts", payload)),
  updateContact: (contactId: string, payload: Partial<Contact>) =>
    unwrap<Contact>(apiClient.patch(`/contacts/${contactId}`, payload)),
  deleteContact: (contactId: string) => unwrap<{ id: string }>(apiClient.delete(`/contacts/${contactId}`)),

  getLoans: (params?: {
    search?: string;
    type?: string;
    status?: string;
    contactId?: string;
    page?: number;
    limit?: number;
  }) => unwrap<PaginatedLoans>(apiClient.get("/loans", { params })),
  getLoan: (loanId: string) => unwrap<LoanDetail>(apiClient.get(`/loans/${loanId}`)),
  createLoan: (payload: Partial<Loan>) => unwrap<Loan>(apiClient.post("/loans", payload)),
  updateLoan: (loanId: string, payload: Partial<Loan>) => unwrap<Loan>(apiClient.patch(`/loans/${loanId}`, payload)),
  deleteLoan: (loanId: string) => unwrap<{ id: string }>(apiClient.delete(`/loans/${loanId}`)),

  addPayment: (payload: Partial<Payment>) => unwrap<PaymentMutationResponse>(apiClient.post("/payments", payload)),
  getPaymentsByLoan: (loanId: string) => unwrap<Payment[]>(apiClient.get(`/payments/loan/${loanId}`)),
  updatePayment: (paymentId: string, payload: Partial<Payment>) =>
    unwrap<PaymentMutationResponse>(apiClient.patch(`/payments/${paymentId}`, payload)),
  deletePayment: (paymentId: string) =>
    unwrap<PaymentMutationResponse>(apiClient.delete(`/payments/${paymentId}`)),

  getSummary: () => unwrap<DashboardSummary>(apiClient.get("/dashboard/summary")),
  getMonthlyChart: (months = 6) =>
    unwrap<MonthlyChartPoint[]>(apiClient.get("/dashboard/monthly-chart", { params: { months } })),
  getLoanTypeChart: () => unwrap<LoanTypeChartPoint[]>(apiClient.get("/dashboard/loan-type-chart")),
  getLoanStatusChart: () => unwrap<LoanStatusChartPoint[]>(apiClient.get("/dashboard/loan-status-chart")),
  getTopContacts: (limit = 5) =>
    unwrap<TopContact[]>(apiClient.get("/dashboard/top-contacts", { params: { limit } })),
};

export const getApiBaseUrl = () => API_URL;
