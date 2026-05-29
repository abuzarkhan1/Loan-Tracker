import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const BudgetUsageReportScreen = () => {
  const reportQuery = useQuery({ queryKey: ["reports", "budget-usage"], queryFn: api.getBudgetUsageReport });
  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading budget report..." /></Screen>;
  if (reportQuery.isError) return <Screen><ErrorState message="Budget report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;
  const budget = reportQuery.data;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Budget Usage</Text>
      {budget ? (
        <View className="gap-3">
          <View className="rounded-3xl border border-border bg-card p-5">
            <Text className="text-base font-black text-dark">Total Budget</Text>
            <Text className="mt-2 text-2xl font-black text-dark">{formatCurrency(budget.totalBudget || 0)}</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Used {formatCurrency(budget.usedAmount || 0)}</Text>
            <View className="mt-4"><ProgressBar progress={Math.min(100, budget.usedPercent || 0)} /></View>
          </View>
          {budget.categoryBudgets.map((item) => (
            <View key={typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id} className="rounded-3xl border border-border bg-card p-4">
              <Text className="text-base font-black text-dark">{typeof item.categoryId === "string" ? "Category" : item.categoryId.name}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{formatCurrency(item.usedAmount || 0)} of {formatCurrency(item.amount)}</Text>
              <View className="mt-3"><ProgressBar progress={Math.min(100, item.usedPercent || 0)} /></View>
            </View>
          ))}
        </View>
      ) : <EmptyState title="No budget yet" subtitle="Budget set karein to usage report show ho gi." />}
    </Screen>
  );
};
