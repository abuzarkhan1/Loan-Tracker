import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  Calculator,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  WalletCards,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AmountText } from "../../components/AmountText";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { percentText } from "../../utils/finance";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const QuickAction = ({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: typeof Plus;
  onPress: () => void;
}) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-2xl border border-border bg-card p-4"
      style={theme.shadowSoft}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
        <Icon color={theme.primary} size={20} />
      </View>
      <Text className="text-center text-xs font-black text-dark">{label}</Text>
    </TouchableOpacity>
  );
};

export const MoneyDashboardScreen = () => {
  const { theme, mode } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const dashboardQuery = useQuery({ queryKey: ["finance", "dashboard"], queryFn: () => api.getFinanceDashboard() });
  const insightsQuery = useQuery({ queryKey: ["finance", "insights"], queryFn: () => api.getFinanceInsights() });
  const forecastQuery = useQuery({ queryKey: ["forecast", "current-cycle"], queryFn: () => api.getCurrentCycleForecast() });
  const alertsQuery = useQuery({ queryKey: ["alerts", "active"], queryFn: () => api.getActiveAlerts() });
  const billsQuery = useQuery({ queryKey: ["bills", "upcoming"], queryFn: () => api.getUpcomingBills() });

  if (dashboardQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading money dashboard..." />
      </Screen>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <Screen>
        <ErrorState message="Money dashboard load nahi ho saka." onRetry={dashboardQuery.refetch} />
      </Screen>
    );
  }

  const data = dashboardQuery.data;
  if (!data) {
    return (
      <Screen className="pt-5">
        <EmptyState title="No money data yet" subtitle="Expense, income ya salary add karein to cash flow yahan nazar aye ga." />
      </Screen>
    );
  }

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Money</Text>
          <Text className="mt-1 text-sm font-medium text-muted">
            {formatDate(data.salaryCycle.cycleStartDate)} - {formatDate(data.salaryCycle.cycleEndDate)}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("Transactions")}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
          style={theme.shadowSoft}
        >
          <ReceiptText color={theme.primary} size={21} />
        </TouchableOpacity>
      </View>

      <View
        className="overflow-hidden rounded-3xl border border-border p-5"
        style={{ backgroundColor: mode === "light" ? "#1a1625" : theme.card, ...theme.shadowSoft }}
      >
        <View className="absolute -right-20 -top-20 h-44 w-44 rounded-full opacity-10" style={{ backgroundColor: theme.primary }} />
        <Text className="text-[10px] font-black uppercase text-white/70">Available Cash</Text>
        <AmountText amount={data.availableCash} className="mt-2 text-3xl font-black text-white" style={{ fontFamily: fontFamily.extraBold }} />
        <View className="mt-5 flex-row gap-3 border-t border-white/10 pt-4">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase text-white/55">Inflows</Text>
            <AmountText amount={data.totalInflows} className="mt-1 text-sm font-black text-white" />
          </View>
          <View className="flex-1 border-l border-white/10 pl-3">
            <Text className="text-[10px] font-black uppercase text-white/55">Outflows</Text>
            <AmountText amount={data.totalOutflows} className="mt-1 text-sm font-black text-white" />
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <MoneySummaryCard title="Salary" value={formatCurrency(data.salaryReceived)} subtitle={`Expected ${formatCurrency(data.expectedSalary)}`} icon={Banknote} tone="success" />
        <MoneySummaryCard title="Expenses" value={formatCurrency(data.totalExpenses)} subtitle={`${percentText(data.budgetUsedPercent)} budget used`} icon={ArrowUpRight} tone="danger" />
      </View>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Loan Recovery" value={formatCurrency(data.loanRecovery)} icon={ArrowDownLeft} tone="success" />
        <MoneySummaryCard title="Loan Repayment" value={formatCurrency(data.loanRepayments)} icon={WalletCards} tone="warning" />
      </View>
      <MoneySummaryCard title="Savings Estimate" value={formatCurrency(data.savingsEstimate)} subtitle={`Target ${formatCurrency(data.savingsTarget)}`} icon={PiggyBank} tone="primary" />

      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-black text-dark">Quick Actions</Text>
        </View>
        <View className="flex-row gap-3">
          <QuickAction label="Add Expense" icon={ArrowUpRight} onPress={() => navigation.navigate("AddExpense")} />
          <QuickAction label="Add Income" icon={ArrowDownLeft} onPress={() => navigation.navigate("AddIncome")} />
          <QuickAction label="Salary" icon={Banknote} onPress={() => navigation.navigate("SalaryDashboard")} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <QuickAction label="Bills" icon={ReceiptText} onPress={() => navigation.navigate("Bills")} />
          <QuickAction label="Calendar" icon={CalendarDays} onPress={() => navigation.navigate("FinanceCalendar")} />
          <QuickAction label="Afford?" icon={Calculator} onPress={() => navigation.navigate("AffordabilityCalculator")} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <QuickAction label="Recurring" icon={Repeat2} onPress={() => navigation.navigate("RecurringTransactions")} />
          <QuickAction label="Templates" icon={Plus} onPress={() => navigation.navigate("TransactionTemplates")} />
          <QuickAction label="Goals" icon={PiggyBank} onPress={() => navigation.navigate("FinancialGoals")} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <QuickAction label="Smart Entry" icon={Plus} onPress={() => navigation.navigate("SmartTextEntry")} />
          <QuickAction label="Scenario" icon={Calculator} onPress={() => navigation.navigate("ScenarioPlanner")} />
          <QuickAction label="Assistant" icon={ChartNoAxesCombined} onPress={() => navigation.navigate("FinanceAssistant")} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <QuickAction label="Health" icon={WalletCards} onPress={() => navigation.navigate("MoneyHealthScore")} />
          <QuickAction label="Review" icon={ChartNoAxesCombined} onPress={() => navigation.navigate("MonthlyReview")} />
          <QuickAction label="Changed" icon={Repeat2} onPress={() => navigation.navigate("WhatChanged")} />
        </View>
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-dark">Planning Snapshot</Text>
          <TouchableOpacity onPress={() => navigation.navigate("CashForecast")}>
            <Text className="text-xs font-black text-primary">Forecast</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-4 gap-3">
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("CashForecast")} className="rounded-2xl bg-background-soft p-4">
            <Text className="text-sm font-black text-dark">Projected Cash</Text>
            {forecastQuery.data ? (
              <AmountText
                value={`${formatCurrency(forecastQuery.data.projectedCash)} • ${forecastQuery.data.confidenceLevel}`}
                hiddenLabel={`Rs. **** • ${forecastQuery.data.confidenceLevel}`}
                className="mt-1 text-xs font-semibold text-muted"
              />
            ) : (
              <Text className="mt-1 text-xs font-semibold text-muted">Forecast ready ho raha hai</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("AlertsCenter")} className="rounded-2xl bg-background-soft p-4">
            <View className="flex-row items-center gap-2">
              <BellRing color={theme.primary} size={16} />
              <Text className="text-sm font-black text-dark">Smart Alerts</Text>
            </View>
            <Text className="mt-1 text-xs font-semibold text-muted">{alertsQuery.data?.length || 0} active alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("Bills")} className="rounded-2xl bg-background-soft p-4">
            <Text className="text-sm font-black text-dark">Upcoming Bills</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">{billsQuery.data?.length || 0} bills in view</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-black text-dark">Cash Flow Insights</Text>
          <TouchableOpacity onPress={() => navigation.navigate("FinanceInsights")}>
            <Text className="text-xs font-black text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-4 gap-3">
          {insightsQuery.data?.length ? insightsQuery.data.slice(0, 3).map((insight) => (
            <TouchableOpacity
              key={insight.id}
              activeOpacity={0.86}
              onPress={() => navigation.navigate("FinanceInsights")}
              className="rounded-2xl bg-background-soft p-4"
            >
              <Text className="text-sm font-black text-dark">{insight.title}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{insight.description}</Text>
            </TouchableOpacity>
          )) : (
            <EmptyState title="No insights yet" subtitle="Thori transactions add hon gi to smart cash flow tips yahan aein gi." />
          )}
        </View>
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-3">
          <ChartNoAxesCombined color={theme.primary} size={22} />
          <Text className="text-base font-black text-dark">Top Expense Category</Text>
        </View>
        <Text className="mt-3 text-2xl font-black text-dark">{data.topExpenseCategory?.name || "No expense yet"}</Text>
        <Text className="mt-1 text-sm font-semibold text-muted">
          {data.topExpenseCategory ? (
            <>
              <AmountText amount={data.topExpenseCategory.amount} className="text-sm font-semibold text-muted" /> this cycle
            </>
          ) : "Expenses track karte hi yahan biggest category show ho gi."}
        </Text>
      </View>
    </Screen>
  );
};
