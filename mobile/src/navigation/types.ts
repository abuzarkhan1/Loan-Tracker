import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Loans: { filters?: LoanFilterParams } | undefined;
  Money: undefined;
  Contacts: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type LoanFilterParams = {
  minAmount?: string;
  maxAmount?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  paymentMethod?: string;
  hasProof?: boolean;
  sortBy?: string;
  sortOrder?: string;
  contactId?: string;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ContactForm: { contactId?: string } | undefined;
  ContactDetail: { contactId: string };
  ContactLedger: { contactId: string };
  ContactsPermission: undefined;
  DeviceContacts: undefined;
  ContactLoanProfile: { contactId: string };
  ContactTrustReport: { contactId: string };
  LoanForm: { loanId?: string; contactId?: string } | undefined;
  LoanDetail: { loanId: string };
  PaymentForm: { loanId: string; paymentId?: string };
  QuickAddPayment: { loanId?: string; contactId?: string } | undefined;
  Transactions: undefined;
  TransactionDetail: { transactionId: string };
  AddTransaction: { transactionId?: string; defaultType?: "INCOME" | "EXPENSE" } | undefined;
  AddExpense: undefined;
  AddIncome: undefined;
  Categories: undefined;
  AddEditCategory: { categoryId?: string; type?: "INCOME" | "EXPENSE" } | undefined;
  SalaryDashboard: undefined;
  SalarySetup: undefined;
  SalarySettings: undefined;
  SalaryEntries: undefined;
  SalaryEntryDetail: { entryId?: string } | undefined;
  MarkSalaryReceived: { entryId: string };
  SalaryCycleDetail: undefined;
  SalaryAllocation: undefined;
  AddEditAllocation: { allocationId?: string } | undefined;
  Budget: undefined;
  AddEditBudget: { budgetId?: string } | undefined;
  SavingsGoals: undefined;
  AddEditSavingsGoal: { goalId?: string } | undefined;
  AddSavingsProgress: { goalId: string };
  FinanceInsights: undefined;
  PaymentMethodBreakdownFinance: undefined;
  SalaryVsExpenseReport: undefined;
  LoanImpactOnSalaryReport: undefined;
  BudgetUsageReport: undefined;
  SavingsProgressReport: undefined;
  CashFlowTrendReport: undefined;
  LoanReminderSettings: { loanId: string };
  ReminderSettings: undefined;
  ReminderLogs: undefined;
  InsightsDetail: undefined;
  RecentActivity: { contactId?: string } | undefined;
  ReceiptPreview: { receiptId: string };
  ReceiptHistory: undefined;
  SecuritySettings: undefined;
  SetPin: undefined;
  ChangePin: undefined;
  GeneratePdf: undefined;
  ExportExcel: undefined;
  ReportHistory: undefined;
  AdvancedLoanFilters: { filters?: LoanFilterParams } | undefined;
  InstallmentSchedule: { loanId: string };
  UpcomingInstallments: undefined;
  InterestBreakdown: { loanId: string };
  MonthlyReportDetail: undefined;
  OverdueReport: undefined;
  PaymentMethodsReport: undefined;
  ContactPerformanceReport: undefined;
  BackupRestore: undefined;
  BackupHistory: undefined;
  RestoreConfirmation: { backupId: string };
  RecoveryCenter: undefined;
  EmailReportsSettings: undefined;
  EmailLogs: undefined;
  SendEmail: {
    kind:
      | "PAYMENT_RECEIPT"
      | "LOAN_SUMMARY"
      | "CONTACT_STATEMENT"
      | "MONTHLY_REPORT"
      | "OVERDUE_REMINDER"
      | "PAYMENT_REQUEST"
      | "SETTLEMENT_CONFIRMATION";
    paymentId?: string;
    loanId?: string;
    contactId?: string;
    settlementId?: string;
    defaultEmail?: string;
  };
  ReminderTemplates: undefined;
  CreateEditReminderTemplate: { templateId?: string } | undefined;
  FollowUpTimeline: { contactId?: string; loanId?: string } | undefined;
  Promises: { contactId?: string; loanId?: string; status?: string } | undefined;
  AddPromise: { contactId?: string; loanId?: string } | undefined;
  PaymentRequestPreview: { loanId?: string; requestId?: string };
  PaymentRequestsHistory: undefined;
  ContactRelationshipSettings: { contactId: string };
  SettlementConfirmation: { loanId: string };
  SettlementReceiptPreview: { settlementId: string };
  CommunicationTimeline: { contactId: string };
};
