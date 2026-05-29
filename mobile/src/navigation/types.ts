import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Contacts: undefined;
  Loans: { filters?: LoanFilterParams } | undefined;
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
  LoanForm: { loanId?: string; contactId?: string } | undefined;
  LoanDetail: { loanId: string };
  PaymentForm: { loanId: string; paymentId?: string };
  ReminderSettings: undefined;
  ReminderLogs: undefined;
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
};
