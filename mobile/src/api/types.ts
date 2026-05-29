export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Contact = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoanType = "GIVEN" | "TAKEN";
export type LoanStatus = "ACTIVE" | "PARTIALLY_PAID" | "COMPLETED" | "OVERDUE";
export type PaymentType = "RECEIVED" | "PAID";
export type PaymentMethod = "CASH" | "BANK" | "JAZZCASH" | "EASYPAISA" | "OTHER";
export type InstallmentStatus = "UPCOMING" | "PARTIAL" | "PAID" | "OVERDUE";

export type Loan = {
  _id: string;
  userId: string;
  contactId: string | Contact;
  type: LoanType;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: string;
  dueDate?: string;
  status: LoanStatus;
  description?: string;
  isInstallmentLoan: boolean;
  installmentFrequency?: "MONTHLY" | "WEEKLY" | "CUSTOM";
  installmentAmount?: number;
  totalInstallments?: number;
  installmentStartDate?: string;
  interestEnabled: boolean;
  interestType?: "SIMPLE" | "MONTHLY";
  interestRate?: number;
  interestAmount: number;
  totalPayableAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type Installment = {
  _id: string;
  userId: string;
  loanId: string | Loan;
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  _id: string;
  userId: string;
  loanId: string;
  contactId: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  paymentDate: string;
  note?: string;
  proof?: PaymentProof | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentProof = {
  _id: string;
  userId: string;
  paymentId: string;
  loanId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageType: "LOCAL" | "S3_READY";
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = {
  user: User;
  token: string;
};

export type PaginatedContacts = {
  contacts: Contact[];
  pagination: Pagination;
};

export type PaginatedLoans = {
  loans: Loan[];
  pagination: Pagination;
};

export type ContactDetail = {
  contact: Contact;
  summary: {
    totalLoans: number;
    totalGiven: number;
    totalTaken: number;
    totalReceivedBack: number;
    totalPaidBack: number;
    netReceivable: number;
    netPayable: number;
    overallBalance: number;
    activeLoans: number;
    completedLoans: number;
    overdueLoans: number;
  };
  recentLoans: Loan[];
};

export type LedgerTimelineItem = {
  id: string;
  kind: "LOAN" | "PAYMENT";
  date: string;
  amount: number;
  type: string;
  status?: LoanStatus;
  method?: PaymentMethod;
  description?: string;
  note?: string;
  remainingAmount?: number;
  createdAt: string;
};

export type ContactLedger = {
  contact: Contact;
  summary: ContactDetail["summary"];
  loans: Loan[];
  payments: Payment[];
  timeline: LedgerTimelineItem[];
};

export type LoanDetail = {
  loan: Loan;
  payments: Payment[];
};

export type PaymentMutationResponse = {
  payment?: Payment;
  id?: string;
  loan: Loan;
};

export type DashboardSummary = {
  totalLoanGiven: number;
  totalLoanTaken: number;
  totalReceivedBack: number;
  totalPaidBack: number;
  netReceivable: number;
  netPayable: number;
  overallBalance: number;
  activeLoans: number;
  completedLoans: number;
  overdueLoans: number;
};

export type MonthlyChartPoint = {
  month: string;
  given: number;
  taken: number;
  received: number;
  paid: number;
};

export type LoanTypeChartPoint = {
  type: LoanType;
  count: number;
  amount: number;
  remainingAmount: number;
};

export type LoanStatusChartPoint = {
  status: LoanStatus;
  count: number;
  amount: number;
  remainingAmount: number;
};

export type TopContact = {
  contactId: string;
  contactName: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  netReceivable: number;
  netPayable: number;
  overallBalance: number;
  loanCount: number;
};

export type ReminderType = "DUE_SOON" | "OVERDUE" | "DAILY_SUMMARY" | "WEEKLY_SUMMARY" | "CUSTOM";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type WeekDay =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type ReminderSettings = {
  _id: string;
  userId: string;
  dueSoonEnabled: boolean;
  dueSoonDaysBefore: number;
  overdueEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: WeekDay;
  weeklySummaryTime: string;
  pushToken?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationLog = {
  _id: string;
  userId: string;
  loanId?: Loan | string;
  type: ReminderType;
  title: string;
  body: string;
  status: NotificationStatus;
  error?: string;
  scheduledFor: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedNotificationLogs = {
  logs: NotificationLog[];
  pagination: Pagination;
};

export type ReportType =
  | "CONTACT_STATEMENT"
  | "MONTHLY_REPORT"
  | "COMPLETE_HISTORY"
  | "EXCEL_LOANS"
  | "EXCEL_PAYMENTS"
  | "EXCEL_CONTACT";

export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Report = {
  _id: string;
  userId: string;
  type: ReportType;
  status: ReportStatus;
  fileUrl?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type PaginatedReports = {
  reports: Report[];
  pagination: Pagination;
};

export type InterestPreview = {
  principalAmount: number;
  interestEnabled: boolean;
  interestType: "SIMPLE" | "MONTHLY";
  interestRate: number;
  interestAmount: number;
  totalPayableAmount: number;
  paidAmount: number;
  remainingAmount: number;
};
