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
import { LoansScreen } from "../screens/loans/LoansScreen";
import { LoanFormScreen } from "../screens/loans/LoanFormScreen";
import { LoanDetailScreen } from "../screens/loans/LoanDetailScreen";
import { PaymentFormScreen } from "../screens/payments/PaymentFormScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { FloatingTabBar } from "./FloatingTabBar";

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
      <RootStack.Screen
        name="LoanForm"
        component={LoanFormScreen}
        options={{ title: "Naya Loan", headerRight: () => <PlusCircle color={theme.primary} size={20} /> }}
      />
      <RootStack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: "Loan Detail" }} />
      <RootStack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: "Nayi Payment" }} />
    </RootStack.Navigator>
  );
};

export const RootNavigator = () => {
  const { token, isBootstrapping } = useAuth();
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

  if (isBootstrapping) {
    return (
      <View className="flex-1 bg-background" style={{ backgroundColor: theme.background }}>
        <LoadingState label="Preparing your wallet..." />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
