import { useQuery } from "@tanstack/react-query";
import { Banknote, ReceiptText, WalletCards } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const SalaryVsExpenseReportScreen = () => {
  const reportQuery = useQuery({ queryKey: ["reports", "salary-vs-expense"], queryFn: api.getSalaryVsExpenseReport });
  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading salary report..." /></Screen>;
  if (reportQuery.isError) return <Screen><ErrorState message="Salary report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;
  const report = reportQuery.data!;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary vs Expense</Text>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Salary" value={formatCurrency(report.salaryReceived)} icon={Banknote} tone="success" />
        <MoneySummaryCard title="Expenses" value={formatCurrency(report.totalExpenses)} icon={ReceiptText} tone="danger" />
      </View>
      <MoneySummaryCard title="Remaining Cash" value={formatCurrency(report.remainingCash)} subtitle={`Savings ${formatCurrency(report.savingsEstimate)}`} icon={WalletCards} />
      <View className="rounded-3xl border border-border bg-card p-5">
        <Text className="text-base font-black text-dark">Expense Percent of Salary</Text>
        <View className="mt-4"><ProgressBar progress={Math.min(100, report.expensePercentOfSalary)} /></View>
        <Text className="mt-2 text-sm font-bold text-muted">{Math.round(report.expensePercentOfSalary)}%</Text>
      </View>
    </Screen>
  );
};
