import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PlusCircle } from "lucide-react-native";
import { View } from "react-native";
import { LoadingState } from "../components/StateViews";
import { useAuth } from "../providers/AuthProvider";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";
import { AuthStackParamList, MainTabParamList, RootStackParamList } from "./types";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { InsightsDetailScreen } from "../screens/dashboard/InsightsDetailScreen";
import { RecentActivityScreen } from "../screens/dashboard/RecentActivityScreen";
import { ContactsScreen } from "../screens/contacts/ContactsScreen";
import { ContactFormScreen } from "../screens/contacts/ContactFormScreen";
import { ContactDetailScreen } from "../screens/contacts/ContactDetailScreen";
import { ContactLedgerScreen } from "../screens/contacts/ContactLedgerScreen";
import { ContactLoanProfileScreen } from "../screens/contacts/ContactLoanProfileScreen";
import { ContactRelationshipSettingsScreen } from "../screens/contacts/ContactRelationshipSettingsScreen";
import { ContactTrustReportScreen } from "../screens/contacts/ContactTrustReportScreen";
import { CommunicationTimelineScreen } from "../screens/communications/CommunicationTimelineScreen";
import { LoansScreen } from "../screens/loans/LoansScreen";
import { AdvancedLoanFilterScreen } from "../screens/loans/AdvancedLoanFilterScreen";
import { InstallmentScheduleScreen } from "../screens/loans/InstallmentScheduleScreen";
import { UpcomingInstallmentsScreen } from "../screens/loans/UpcomingInstallmentsScreen";
import { InterestBreakdownScreen } from "../screens/loans/InterestBreakdownScreen";
import { LoanFormScreen } from "../screens/loans/LoanFormScreen";
import { LoanDetailScreen } from "../screens/loans/LoanDetailScreen";
import { PaymentFormScreen } from "../screens/payments/PaymentFormScreen";
import { QuickAddPaymentScreen } from "../screens/payments/QuickAddPaymentScreen";
import { MoneyDashboardScreen } from "../screens/money/MoneyDashboardScreen";
import { FinanceInsightsScreen } from "../screens/money/FinanceInsightsScreen";
import { TransactionsScreen } from "../screens/transactions/TransactionsScreen";
import { TransactionDetailScreen } from "../screens/transactions/TransactionDetailScreen";
import { AddExpenseScreen, AddIncomeScreen, AddTransactionScreen } from "../screens/transactions/AddTransactionScreen";
import { CategoriesScreen } from "../screens/categories/CategoriesScreen";
import { AddEditCategoryScreen } from "../screens/categories/AddEditCategoryScreen";
import { SalaryDashboardScreen } from "../screens/salary/SalaryDashboardScreen";
import { SalarySetupScreen, SalarySettingsScreen } from "../screens/salary/SalaryProfileScreen";
import { SalaryEntriesScreen } from "../screens/salary/SalaryEntriesScreen";
import { SalaryEntryDetailScreen } from "../screens/salary/SalaryEntryDetailScreen";
import { MarkSalaryReceivedScreen } from "../screens/salary/MarkSalaryReceivedScreen";
import { SalaryCycleDetailScreen } from "../screens/salary/SalaryCycleDetailScreen";
import { SalaryAllocationScreen } from "../screens/salary/SalaryAllocationScreen";
import { AddEditAllocationScreen } from "../screens/salary/AddEditAllocationScreen";
import { BudgetScreen } from "../screens/budget/BudgetScreen";
import { AddEditBudgetScreen } from "../screens/budget/AddEditBudgetScreen";
import { SavingsGoalsScreen } from "../screens/savings/SavingsGoalsScreen";
import { AddEditSavingsGoalScreen } from "../screens/savings/AddEditSavingsGoalScreen";
import { AddSavingsProgressScreen } from "../screens/savings/AddSavingsProgressScreen";
import { PaymentMethodBreakdownScreen } from "../screens/financeReports/PaymentMethodBreakdownScreen";
import { SalaryVsExpenseReportScreen } from "../screens/financeReports/SalaryVsExpenseReportScreen";
import { LoanImpactOnSalaryReportScreen } from "../screens/financeReports/LoanImpactOnSalaryReportScreen";
import { BudgetUsageReportScreen } from "../screens/financeReports/BudgetUsageReportScreen";
import { SavingsProgressReportScreen } from "../screens/financeReports/SavingsProgressReportScreen";
import { CashFlowTrendReportScreen } from "../screens/financeReports/CashFlowTrendReportScreen";
import { PaymentRequestPreviewScreen } from "../screens/paymentRequests/PaymentRequestPreviewScreen";
import { PaymentRequestsHistoryScreen } from "../screens/paymentRequests/PaymentRequestsHistoryScreen";
import { AddPromiseScreen } from "../screens/promises/AddPromiseScreen";
import { PromisesScreen } from "../screens/promises/PromisesScreen";
import { FollowUpTimelineScreen } from "../screens/followUps/FollowUpTimelineScreen";
import { RecoveryCenterScreen } from "../screens/recovery/RecoveryCenterScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { ExportExcelScreen } from "../screens/reports/ExportExcelScreen";
import { GeneratePdfScreen } from "../screens/reports/GeneratePdfScreen";
import { ReportHistoryScreen } from "../screens/reports/ReportHistoryScreen";
import { MonthlyReportDetailScreen } from "../screens/reports/MonthlyReportDetailScreen";
import { OverdueReportScreen } from "../screens/reports/OverdueReportScreen";
import { PaymentMethodsReportScreen } from "../screens/reports/PaymentMethodsReportScreen";
import { ContactPerformanceReportScreen } from "../screens/reports/ContactPerformanceReportScreen";
import { ReceiptHistoryScreen } from "../screens/receipts/ReceiptHistoryScreen";
import { ReceiptPreviewScreen } from "../screens/receipts/ReceiptPreviewScreen";
import { EmailLogsScreen } from "../screens/email/EmailLogsScreen";
import { EmailReportsSettingsScreen } from "../screens/email/EmailReportsSettingsScreen";
import { SendEmailScreen } from "../screens/email/SendEmailScreen";
import { CreateEditReminderTemplateScreen } from "../screens/reminderTemplates/CreateEditReminderTemplateScreen";
import { ReminderTemplatesScreen } from "../screens/reminderTemplates/ReminderTemplatesScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { BackupHistoryScreen } from "../screens/settings/BackupHistoryScreen";
import { BackupRestoreScreen } from "../screens/settings/BackupRestoreScreen";
import { RestoreConfirmationScreen } from "../screens/settings/RestoreConfirmationScreen";
import { ReminderLogsScreen } from "../screens/reminders/ReminderLogsScreen";
import { ReminderSettingsScreen } from "../screens/reminders/ReminderSettingsScreen";
import { LoanReminderSettingsScreen } from "../screens/reminders/LoanReminderSettingsScreen";
import { SettlementConfirmationScreen } from "../screens/settlements/SettlementConfirmationScreen";
import { SettlementReceiptPreviewScreen } from "../screens/settlements/SettlementReceiptPreviewScreen";
import { ChangePinScreen } from "../screens/security/ChangePinScreen";
import { SecuritySettingsScreen } from "../screens/security/SecuritySettingsScreen";
import { SetPinScreen } from "../screens/security/SetPinScreen";
import { UnlockScreen } from "../screens/security/UnlockScreen";
import { FloatingTabBar } from "./FloatingTabBar";
import { useSecurity } from "../providers/SecurityProvider";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
      <Tab.Screen name="Money" component={MoneyDashboardScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const AppNavigator = () => {
  const { theme } = useAppTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: { color: theme.text, fontWeight: "800", fontFamily: fontFamily.extraBold },
        headerShadowVisible: false,
        headerTintColor: theme.text,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="ContactForm" component={ContactFormScreen} options={{ title: "Contact" }} />
      <RootStack.Screen name="ContactsPermission" component={ContactsScreen} options={{ title: "Contacts Access" }} />
      <RootStack.Screen name="DeviceContacts" component={ContactsScreen} options={{ title: "Device Contacts" }} />
      <RootStack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: "Contact Detail" }} />
      <RootStack.Screen name="ContactLedger" component={ContactLedgerScreen} options={{ title: "Contact Ledger" }} />
      <RootStack.Screen name="ContactLoanProfile" component={ContactLoanProfileScreen} options={{ title: "Loan Profile" }} />
      <RootStack.Screen name="ContactRelationshipSettings" component={ContactRelationshipSettingsScreen} options={{ title: "Relationship Notes" }} />
      <RootStack.Screen name="ContactTrustReport" component={ContactTrustReportScreen} options={{ title: "Trust Report" }} />
      <RootStack.Screen name="CommunicationTimeline" component={CommunicationTimelineScreen} options={{ title: "Communication" }} />
      <RootStack.Screen
        name="LoanForm"
        component={LoanFormScreen}
        options={{ title: "Naya Loan", headerRight: () => <PlusCircle color={theme.primary} size={20} /> }}
      />
      <RootStack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: "Loan Detail" }} />
      <RootStack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: "Nayi Payment" }} />
      <RootStack.Screen name="QuickAddPayment" component={QuickAddPaymentScreen} options={{ title: "Quick Payment" }} />
      <RootStack.Screen name="Transactions" component={TransactionsScreen} options={{ title: "Transactions" }} />
      <RootStack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: "Transaction Detail" }} />
      <RootStack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: "Add Transaction" }} />
      <RootStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: "Add Expense" }} />
      <RootStack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: "Add Income" }} />
      <RootStack.Screen name="Categories" component={CategoriesScreen} options={{ title: "Categories" }} />
      <RootStack.Screen name="AddEditCategory" component={AddEditCategoryScreen} options={{ title: "Category" }} />
      <RootStack.Screen name="SalaryDashboard" component={SalaryDashboardScreen} options={{ title: "Salary" }} />
      <RootStack.Screen name="SalarySetup" component={SalarySetupScreen} options={{ title: "Salary Setup" }} />
      <RootStack.Screen name="SalarySettings" component={SalarySettingsScreen} options={{ title: "Salary Settings" }} />
      <RootStack.Screen name="SalaryEntries" component={SalaryEntriesScreen} options={{ title: "Salary Entries" }} />
      <RootStack.Screen name="SalaryEntryDetail" component={SalaryEntryDetailScreen} options={{ title: "Salary Entry" }} />
      <RootStack.Screen name="MarkSalaryReceived" component={MarkSalaryReceivedScreen} options={{ title: "Mark Salary Received" }} />
      <RootStack.Screen name="SalaryCycleDetail" component={SalaryCycleDetailScreen} options={{ title: "Salary Cycle" }} />
      <RootStack.Screen name="SalaryAllocation" component={SalaryAllocationScreen} options={{ title: "Salary Allocation" }} />
      <RootStack.Screen name="AddEditAllocation" component={AddEditAllocationScreen} options={{ title: "Allocation" }} />
      <RootStack.Screen name="Budget" component={BudgetScreen} options={{ title: "Budget" }} />
      <RootStack.Screen name="AddEditBudget" component={AddEditBudgetScreen} options={{ title: "Budget Setup" }} />
      <RootStack.Screen name="SavingsGoals" component={SavingsGoalsScreen} options={{ title: "Savings Goals" }} />
      <RootStack.Screen name="AddEditSavingsGoal" component={AddEditSavingsGoalScreen} options={{ title: "Savings Goal" }} />
      <RootStack.Screen name="AddSavingsProgress" component={AddSavingsProgressScreen} options={{ title: "Add Savings" }} />
      <RootStack.Screen name="FinanceInsights" component={FinanceInsightsScreen} options={{ title: "Cash Flow Insights" }} />
      <RootStack.Screen name="PaymentMethodBreakdownFinance" component={PaymentMethodBreakdownScreen} options={{ title: "Payment Breakdown" }} />
      <RootStack.Screen name="SalaryVsExpenseReport" component={SalaryVsExpenseReportScreen} options={{ title: "Salary vs Expense" }} />
      <RootStack.Screen name="LoanImpactOnSalaryReport" component={LoanImpactOnSalaryReportScreen} options={{ title: "Loan Impact" }} />
      <RootStack.Screen name="BudgetUsageReport" component={BudgetUsageReportScreen} options={{ title: "Budget Usage" }} />
      <RootStack.Screen name="SavingsProgressReport" component={SavingsProgressReportScreen} options={{ title: "Savings Progress" }} />
      <RootStack.Screen name="CashFlowTrendReport" component={CashFlowTrendReportScreen} options={{ title: "Cash Flow Trend" }} />
      <RootStack.Screen name="PaymentRequestPreview" component={PaymentRequestPreviewScreen} options={{ title: "Payment Request" }} />
      <RootStack.Screen name="PaymentRequestsHistory" component={PaymentRequestsHistoryScreen} options={{ title: "Payment Requests" }} />
      <RootStack.Screen name="Promises" component={PromisesScreen} options={{ title: "Promises" }} />
      <RootStack.Screen name="AddPromise" component={AddPromiseScreen} options={{ title: "Add Promise" }} />
      <RootStack.Screen name="FollowUpTimeline" component={FollowUpTimelineScreen} options={{ title: "Follow-up Timeline" }} />
      <RootStack.Screen name="RecoveryCenter" component={RecoveryCenterScreen} options={{ title: "Recovery Center" }} />
      <RootStack.Screen name="LoanReminderSettings" component={LoanReminderSettingsScreen} options={{ title: "Loan Reminder" }} />
      <RootStack.Screen name="ReminderSettings" component={ReminderSettingsScreen} options={{ title: "Reminder Settings" }} />
      <RootStack.Screen name="ReminderLogs" component={ReminderLogsScreen} options={{ title: "Notification History" }} />
      <RootStack.Screen name="ReminderTemplates" component={ReminderTemplatesScreen} options={{ title: "Reminder Templates" }} />
      <RootStack.Screen name="CreateEditReminderTemplate" component={CreateEditReminderTemplateScreen} options={{ title: "Reminder Template" }} />
      <RootStack.Screen name="EmailReportsSettings" component={EmailReportsSettingsScreen} options={{ title: "Email Reports" }} />
      <RootStack.Screen name="EmailLogs" component={EmailLogsScreen} options={{ title: "Email Logs" }} />
      <RootStack.Screen name="SendEmail" component={SendEmailScreen} options={{ title: "Send Email" }} />
      <RootStack.Screen name="InsightsDetail" component={InsightsDetailScreen} options={{ title: "Smart Insights" }} />
      <RootStack.Screen name="RecentActivity" component={RecentActivityScreen} options={{ title: "Recent Activity" }} />
      <RootStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security & App Lock" }} />
      <RootStack.Screen name="SetPin" component={SetPinScreen} options={{ title: "Set PIN" }} />
      <RootStack.Screen name="ChangePin" component={ChangePinScreen} options={{ title: "Change PIN" }} />
      <RootStack.Screen name="GeneratePdf" component={GeneratePdfScreen} options={{ title: "Generate PDF" }} />
      <RootStack.Screen name="ExportExcel" component={ExportExcelScreen} options={{ title: "Export Excel" }} />
      <RootStack.Screen name="ReportHistory" component={ReportHistoryScreen} options={{ title: "Report History" }} />
      <RootStack.Screen name="ReceiptHistory" component={ReceiptHistoryScreen} options={{ title: "Receipt History" }} />
      <RootStack.Screen name="ReceiptPreview" component={ReceiptPreviewScreen} options={{ title: "Receipt Preview" }} />
      <RootStack.Screen name="AdvancedLoanFilters" component={AdvancedLoanFilterScreen} options={{ title: "Advanced Filters" }} />
      <RootStack.Screen name="InstallmentSchedule" component={InstallmentScheduleScreen} options={{ title: "Installment Schedule" }} />
      <RootStack.Screen name="UpcomingInstallments" component={UpcomingInstallmentsScreen} options={{ title: "Upcoming Installments" }} />
      <RootStack.Screen name="InterestBreakdown" component={InterestBreakdownScreen} options={{ title: "Interest Breakdown" }} />
      <RootStack.Screen name="MonthlyReportDetail" component={MonthlyReportDetailScreen} options={{ title: "Monthly Summary" }} />
      <RootStack.Screen name="OverdueReport" component={OverdueReportScreen} options={{ title: "Overdue Report" }} />
      <RootStack.Screen name="PaymentMethodsReport" component={PaymentMethodsReportScreen} options={{ title: "Payment Methods" }} />
      <RootStack.Screen name="ContactPerformanceReport" component={ContactPerformanceReportScreen} options={{ title: "Contact Performance" }} />
      <RootStack.Screen name="BackupRestore" component={BackupRestoreScreen} options={{ title: "Backup & Restore" }} />
      <RootStack.Screen name="BackupHistory" component={BackupHistoryScreen} options={{ title: "Backup History" }} />
      <RootStack.Screen name="RestoreConfirmation" component={RestoreConfirmationScreen} options={{ title: "Restore Backup" }} />
      <RootStack.Screen name="SettlementConfirmation" component={SettlementConfirmationScreen} options={{ title: "Settlement" }} />
      <RootStack.Screen name="SettlementReceiptPreview" component={SettlementReceiptPreviewScreen} options={{ title: "Settlement Receipt" }} />
    </RootStack.Navigator>
  );
};

export const RootNavigator = () => {
  const { token, isBootstrapping } = useAuth();
  const security = useSecurity();
  const { theme, mode } = useAppTheme();

  const navigationTheme = {
    ...DefaultTheme,
    dark: mode === "dark",
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  if (isBootstrapping || security.isBootstrapping) {
    return (
      <View className="flex-1 bg-background" style={{ backgroundColor: theme.background }}>
        <LoadingState label="Preparing your wallet..." />
      </View>
    );
  }

  if (token && security.isLocked) {
    return <UnlockScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
