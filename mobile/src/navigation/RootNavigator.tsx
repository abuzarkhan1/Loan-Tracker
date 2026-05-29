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
import { ContactsScreen } from "../screens/contacts/ContactsScreen";
import { ContactFormScreen } from "../screens/contacts/ContactFormScreen";
import { ContactDetailScreen } from "../screens/contacts/ContactDetailScreen";
import { ContactLedgerScreen } from "../screens/contacts/ContactLedgerScreen";
import { LoansScreen } from "../screens/loans/LoansScreen";
import { AdvancedLoanFilterScreen } from "../screens/loans/AdvancedLoanFilterScreen";
import { InstallmentScheduleScreen } from "../screens/loans/InstallmentScheduleScreen";
import { UpcomingInstallmentsScreen } from "../screens/loans/UpcomingInstallmentsScreen";
import { InterestBreakdownScreen } from "../screens/loans/InterestBreakdownScreen";
import { LoanFormScreen } from "../screens/loans/LoanFormScreen";
import { LoanDetailScreen } from "../screens/loans/LoanDetailScreen";
import { PaymentFormScreen } from "../screens/payments/PaymentFormScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { ExportExcelScreen } from "../screens/reports/ExportExcelScreen";
import { GeneratePdfScreen } from "../screens/reports/GeneratePdfScreen";
import { ReportHistoryScreen } from "../screens/reports/ReportHistoryScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { ReminderLogsScreen } from "../screens/reminders/ReminderLogsScreen";
import { ReminderSettingsScreen } from "../screens/reminders/ReminderSettingsScreen";
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
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
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
      <RootStack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: "Contact Detail" }} />
      <RootStack.Screen name="ContactLedger" component={ContactLedgerScreen} options={{ title: "Contact Ledger" }} />
      <RootStack.Screen
        name="LoanForm"
        component={LoanFormScreen}
        options={{ title: "Naya Loan", headerRight: () => <PlusCircle color={theme.primary} size={20} /> }}
      />
      <RootStack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: "Loan Detail" }} />
      <RootStack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: "Nayi Payment" }} />
      <RootStack.Screen name="ReminderSettings" component={ReminderSettingsScreen} options={{ title: "Reminder Settings" }} />
      <RootStack.Screen name="ReminderLogs" component={ReminderLogsScreen} options={{ title: "Notification History" }} />
      <RootStack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: "Security & App Lock" }} />
      <RootStack.Screen name="SetPin" component={SetPinScreen} options={{ title: "Set PIN" }} />
      <RootStack.Screen name="ChangePin" component={ChangePinScreen} options={{ title: "Change PIN" }} />
      <RootStack.Screen name="GeneratePdf" component={GeneratePdfScreen} options={{ title: "Generate PDF" }} />
      <RootStack.Screen name="ExportExcel" component={ExportExcelScreen} options={{ title: "Export Excel" }} />
      <RootStack.Screen name="ReportHistory" component={ReportHistoryScreen} options={{ title: "Report History" }} />
      <RootStack.Screen name="AdvancedLoanFilters" component={AdvancedLoanFilterScreen} options={{ title: "Advanced Filters" }} />
      <RootStack.Screen name="InstallmentSchedule" component={InstallmentScheduleScreen} options={{ title: "Installment Schedule" }} />
      <RootStack.Screen name="UpcomingInstallments" component={UpcomingInstallmentsScreen} options={{ title: "Upcoming Installments" }} />
      <RootStack.Screen name="InterestBreakdown" component={InterestBreakdownScreen} options={{ title: "Interest Breakdown" }} />
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
