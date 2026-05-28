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
