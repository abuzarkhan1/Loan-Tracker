import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Contacts: undefined;
  Loans: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ContactForm: { contactId?: string } | undefined;
  ContactDetail: { contactId: string };
  LoanForm: { loanId?: string; contactId?: string } | undefined;
  LoanDetail: { loanId: string };
  PaymentForm: { loanId: string; paymentId?: string };
};
