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
  source?: "MANUAL" | "DEVICE_CONTACT";
  deviceContactId?: string;
  normalizedPhone?: string;
  isFavorite?: boolean;
  lastUsedAt?: string;
  avatarColor?: string;
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
  isPinned?: boolean;
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
  promiseSuggestion?: {
    promiseId: string;
    promisedAmount: number;
    paidAmount: number;
    message: string;
  } | null;
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

export type ContactBalanceSummary = {
  netReceivable: number;
  netPayable: number;
  overallBalance: number;
  activeLoans: number;
};

export type ContactWithBalance = Contact & {
  balanceSummary?: ContactBalanceSummary;
};

export type DeviceContactImportPayload = {
  deviceContactId?: string;
  name: string;
  phone?: string;
  emails?: string[];
  source?: "DEVICE_CONTACT";
};

export type DeviceContactImportResult = {
  contact: Contact;
  imported: boolean;
  duplicate: boolean;
  match: {
    contact: Contact | null;
    matchConfidence: number;
    reason: string;
  };
};

export type BulkDeviceContactImportResult = {
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  contacts: Contact[];
  duplicates: Array<{ input: DeviceContactImportPayload; contact: Contact; reason: string }>;
};

export type ContactMatchResult = {
  contact: Contact | null;
  matchConfidence: number;
  reason: string;
};

export type DashboardInsight = {
  id: string;
  type: "DUE_SOON" | "OVERDUE" | "MONTHLY_SUMMARY" | "NET_BALANCE" | "TOP_PENDING" | "RECOVERY_RATE" | "TRUST_ALERT";
  title: string;
  description: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
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

export type LoanReminder = {
  _id: string;
  userId: string;
  loanId: string;
  enabled: boolean;
  remindBeforeDays: number;
  repeatUntilPaid: boolean;
  repeatFrequency: "DAILY" | "EVERY_2_DAYS" | "WEEKLY";
  tone: "POLITE" | "NORMAL" | "STRICT";
  customMessage?: string;
  snoozedUntil?: string;
  lastSentAt?: string;
  nextReminderAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoanReminderPreview = {
  title: string;
  body: string;
  nextReminderAt?: string;
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

export type ReceiptType = "PAYMENT_RECEIPT" | "LOAN_SUMMARY_RECEIPT" | "CONTACT_STATEMENT_RECEIPT";
export type ReceiptStatus = "PENDING" | "PROCESSING" | "GENERATED" | "FAILED";

export type Receipt = {
  _id: string;
  userId: string;
  receiptNumber: string;
  type: ReceiptType;
  loanId?: string;
  paymentId?: string;
  contactId?: string;
  title: string;
  status: ReceiptStatus;
  pdfUrl?: string;
  fileName?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedReceipts = {
  receipts: Receipt[];
  pagination: Pagination;
};

export type TrustProfile = {
  contactId: string;
  trustScore: number;
  label: "EXCELLENT" | "GOOD" | "AVERAGE" | "RISKY" | "NEW";
  totalLoans: number;
  completedLoans: number;
  activeLoans: number;
  overdueLoans: number;
  totalDealingAmount: number;
  averageRepaymentDays: number;
  onTimePaymentRate: number;
  overdueFrequency: number;
  lastPaymentDate?: string;
  summary: string;
  recommendations: string[];
};

export type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  entityType: string;
  entityId?: string;
  contactId?: string;
  createdAt: string;
  icon: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
};

export type PaginatedActivity = {
  activities: ActivityItem[];
  pagination: Pagination;
};

export type ReportOverview = {
  monthlyGivenAmount: number;
  monthlyTakenAmount: number;
  totalReceivedAmount: number;
  totalPaidAmount: number;
  overdueAmount: number;
  overdueCount: number;
  recoveryRate: number;
  completedLoansCount: number;
  totalLoans: number;
};

export type MonthlySummaryReport = {
  month: number;
  year: number;
  given: number;
  taken: number;
  received: number;
  paid: number;
  netBalance: number;
};

export type OverdueReport = {
  totalOverdueAmount: number;
  overdueLoans: Array<Loan & { overdueDays: number }>;
};

export type PaymentMethodReport = Array<{
  method: PaymentMethod;
  amount: number;
  count: number;
}>;

export type RecoveryRateReport = {
  completedLoans: number;
  totalLoans: number;
  loanCompletionRate: number;
  amountRecoveryRate: number;
  paidAmount: number;
  totalPayableAmount: number;
};

export type ContactPerformanceReport = {
  contacts: Array<TopContact & { overdueLoans: number; completedLoans: number; recoveryRate: number }>;
  bestPayingContacts: Array<TopContact & { overdueLoans: number; completedLoans: number; recoveryRate: number }>;
  riskyContacts: Array<TopContact & { overdueLoans: number; completedLoans: number; recoveryRate: number }>;
  highestPendingContacts: Array<TopContact & { overdueLoans: number; completedLoans: number; recoveryRate: number }>;
};

export type Backup = {
  _id: string;
  backupId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  backupType: "MANUAL" | "AUTO_LOCAL";
  totalContacts: number;
  totalLoans: number;
  totalPayments: number;
  totalInstallments: number;
  fileSize?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedBackups = {
  backups: Backup[];
  pagination: Pagination;
};

export type EmailType =
  | "PAYMENT_RECEIPT_EMAIL"
  | "LOAN_SUMMARY_EMAIL"
  | "CONTACT_STATEMENT_EMAIL"
  | "MONTHLY_REPORT_EMAIL"
  | "WEEKLY_SUMMARY_EMAIL"
  | "OVERDUE_REMINDER_EMAIL"
  | "PAYMENT_REQUEST_EMAIL"
  | "SETTLEMENT_CONFIRMATION_EMAIL";

export type EmailStatus = "QUEUED" | "SENT" | "FAILED";

export type EmailPreferences = {
  _id: string;
  userId: string;
  emailReportsEnabled: boolean;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: WeekDay;
  weeklySummaryTime: string;
  monthlyReportEnabled: boolean;
  monthlyReportDay: number;
  overdueEmailEnabled: boolean;
  receiptEmailEnabled: boolean;
  defaultRecipientEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailLog = {
  _id: string;
  type: EmailType;
  toEmail: string;
  subject: string;
  status: EmailStatus;
  error?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  contactId?: string;
  loanId?: string;
};

export type PaginatedEmailLogs = {
  logs: EmailLog[];
  pagination: Pagination;
};

export type ReminderTemplate = {
  _id: string;
  name: string;
  type: "POLITE" | "NORMAL" | "STRICT" | "FRIENDLY_ROMAN_URDU" | "PROFESSIONAL_ENGLISH" | "SHORT_WHATSAPP" | "EMAIL_STYLE";
  channel: "WHATSAPP" | "EMAIL" | "SMS" | "COPY";
  language: "ROMAN_URDU" | "ENGLISH" | "URDU_STYLE";
  tone: "POLITE" | "NORMAL" | "STRICT" | "FRIENDLY" | "PROFESSIONAL";
  subjectTemplate?: string;
  bodyTemplate: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedReminderTemplates = {
  templates: ReminderTemplate[];
  pagination: Pagination;
};

export type FollowUp = {
  _id: string;
  contactId: string | Contact;
  loanId?: string | Loan;
  channel: "WHATSAPP" | "EMAIL" | "CALL" | "SMS" | "IN_PERSON" | "COPY";
  type: "REMINDER" | "PROMISE_DISCUSSION" | "PAYMENT_REQUEST" | "GENERAL";
  message?: string;
  note?: string;
  status: "SENT" | "COPIED" | "CALLED" | "DISCUSSED" | "SNOOZED" | "FAILED";
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedFollowUps = {
  followUps: FollowUp[];
  pagination: Pagination;
};

export type PromiseToPay = {
  _id: string;
  contactId: string | Contact;
  loanId: string | Loan;
  promisedAmount: number;
  promiseDate: string;
  note?: string;
  status: "PENDING" | "KEPT" | "BROKEN" | "CANCELLED";
  keptAt?: string;
  brokenAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedPromises = {
  promises: PromiseToPay[];
  pagination: Pagination;
};

export type RecoveryItem = {
  id: string;
  type: "TODAY_DUE" | "OVERDUE" | "HIGH_PENDING" | "REMINDER_SUGGESTED" | "PROMISE_DUE" | "RECENTLY_PAID";
  contactId?: string;
  loanId?: string;
  contactName: string;
  phone?: string;
  amount: number;
  remainingAmount: number;
  dueDate?: string;
  overdueDays?: number;
  lastFollowUpAt?: string;
  nextSuggestedAction: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  actionButtons: string[];
};

export type RecoveryCenter = {
  todayDueLoans: RecoveryItem[];
  overdueLoans: RecoveryItem[];
  highPendingContacts: RecoveryItem[];
  reminderSuggested: RecoveryItem[];
  promiseDue: RecoveryItem[];
  recentlyPaid: RecoveryItem[];
  noActionNeededSummary: { clear: boolean; message: string };
};

export type PaymentRequest = {
  _id: string;
  contactId: string | Contact;
  loanId: string | Loan;
  requestNumber: string;
  amountRequested: number;
  remainingAmount: number;
  dueDate?: string;
  message: string;
  status: "CREATED" | "SHARED" | "EMAIL_SENT" | "CANCELLED" | "PAID";
  publicToken?: string;
  publicUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedPaymentRequests = {
  paymentRequests: PaymentRequest[];
  pagination: Pagination;
};

export type ContactRelationship = {
  preferredReminderChannel?: "WHATSAPP" | "EMAIL" | "CALL" | "SMS" | "NONE";
  preferredReminderTone?: "POLITE" | "NORMAL" | "STRICT" | "FRIENDLY";
  preferredLanguage?: "ROMAN_URDU" | "ENGLISH" | "URDU_STYLE";
  usuallyPaysOnTime?: boolean;
  doNotRemindBeforeDueDate?: boolean;
  importantContact?: boolean;
  privateNote?: string;
  tags?: string[];
};

export type Settlement = {
  _id: string;
  contactId: string | Contact;
  loanId: string | Loan;
  settlementNumber: string;
  finalAmount: number;
  paidAmount: number;
  remainingAmountAtSettlement: number;
  status: "DRAFT" | "SETTLED" | "CANCELLED";
  settlementNote?: string;
  receiptId?: string | Receipt;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedSettlements = {
  settlements: Settlement[];
  pagination: Pagination;
};

export type CommunicationItem = {
  id: string;
  type: string;
  channel: string;
  title: string;
  description: string;
  status: string;
  relatedLoanId?: string;
  relatedPaymentId?: string;
  createdAt: string;
};

export type CommunicationTimeline = {
  items: CommunicationItem[];
  pagination: Pagination;
};

export type TransactionType = "INCOME" | "EXPENSE" | "SALARY" | "LOAN_RECOVERY" | "LOAN_REPAYMENT";

export type Category = {
  _id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  monthlyBudget?: number;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  _id: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId?: string | Category;
  source?: string;
  paymentMethod: PaymentMethod;
  note?: string;
  linkedLoanId?: string | Loan;
  linkedPaymentId?: string | Payment;
  linkedContactId?: string | Contact;
  linkedSalaryEntryId?: string | SalaryEntry;
  isAutoGenerated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedTransactions = {
  transactions: Transaction[];
  pagination: Pagination;
};

export type SalaryProfile = {
  _id: string;
  defaultAmount: number;
  frequency: "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "CUSTOM";
  salaryDay: number;
  cycleStartDay: number;
  source: "JOB" | "FREELANCE" | "BUSINESS" | "OTHER";
  paymentMethod: PaymentMethod;
  autoCreateExpectedSalary: boolean;
  reminderEnabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SalaryEntry = {
  _id: string;
  amount: number;
  source: "JOB" | "FREELANCE" | "BUSINESS" | "OTHER";
  paymentMethod: PaymentMethod;
  salaryDate: string;
  cycleStartDate: string;
  cycleEndDate: string;
  status: "EXPECTED" | "RECEIVED" | "MISSED";
  linkedTransactionId?: string | Transaction;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedSalaryEntries = {
  entries: SalaryEntry[];
  pagination: Pagination;
};

export type SalaryCycleSummary = {
  cycleStartDate: string;
  cycleEndDate: string;
  salaryDate: string;
  expectedSalary: number;
  salaryEntry?: SalaryEntry;
  salaryReceived: number;
  otherIncome: number;
  totalIncome: number;
  totalExpenses: number;
  loanRecovery: number;
  loanRepayments: number;
  totalInflows: number;
  totalOutflows: number;
  availableCash: number;
  netCashFlow: number;
  savingsEstimate: number;
  budgetUsedPercent: number;
};

export type SalaryAllocation = {
  _id: string;
  salaryEntryId?: string;
  month?: number;
  year?: number;
  cycleStartDate: string;
  cycleEndDate: string;
  categoryId?: string | Category;
  name: string;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  type: "EXPENSE" | "LOAN_REPAYMENT" | "SAVINGS" | "OTHER";
  createdAt: string;
  updatedAt: string;
};

export type PaginatedSalaryAllocations = {
  allocations: SalaryAllocation[];
  pagination: Pagination;
};

export type Budget = {
  _id: string;
  cycleStartDate: string;
  cycleEndDate: string;
  month?: number;
  year?: number;
  totalBudget?: number;
  categoryBudgets: Array<{ categoryId: string | Category; amount: number; usedAmount?: number; remainingAmount?: number; usedPercent?: number }>;
  usedAmount?: number;
  remainingBudget?: number;
  usedPercent?: number;
  createdAt: string;
  updatedAt: string;
};

export type SavingsGoal = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget?: number;
  deadline?: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  progressPercent?: number;
  createdAt: string;
  updatedAt: string;
};

export type SavingsGoalProgress = {
  _id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedSavingsGoalProgress = {
  progress: SavingsGoalProgress[];
  pagination: Pagination;
};

export type FinanceDashboard = {
  salaryReceived: number;
  expectedSalary: number;
  otherIncome: number;
  totalIncome: number;
  totalExpenses: number;
  loanRecovery: number;
  loanRepayments: number;
  totalInflows: number;
  totalOutflows: number;
  availableCash: number;
  netCashFlow: number;
  topExpenseCategory?: { categoryId?: string; name: string; amount: number; count: number } | null;
  budgetUsedPercent: number;
  savingsEstimate: number;
  savingsTarget: number;
  salaryCycle: { cycleStartDate: string; cycleEndDate: string };
  charts: {
    cashFlow: Array<{ date: string; type: TransactionType; amount: number }>;
    categoryBreakdown: CategoryBreakdown[];
    paymentMethodBreakdown: FinancePaymentMethodBreakdown[];
  };
};

export type CategoryBreakdown = {
  categoryId?: string;
  name: string;
  color?: string;
  icon?: string;
  amount: number;
  count: number;
};

export type FinancePaymentMethodBreakdown = {
  paymentMethod: PaymentMethod;
  inflow: number;
  outflow: number;
  net: number;
  transactionCount: number;
};

export type FinanceInsight = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
};

export type SalaryVsExpenseReport = {
  salaryReceived: number;
  expectedSalary: number;
  totalExpenses: number;
  remainingCash: number;
  savingsEstimate: number;
  expensePercentOfSalary: number;
};

export type LoanImpactOnSalaryReport = {
  loanRepayments: number;
  loanRecovery: number;
  netLoanCashFlow: number;
  repaymentPercentOfSalary: number;
  recoveryPercentOfSalary: number;
};

export type CashFlowTrendPoint = {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
};
