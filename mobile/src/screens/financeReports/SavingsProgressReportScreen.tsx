import { useQuery } from "@tanstack/react-query";
import { PiggyBank } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const SavingsProgressReportScreen = () => {
  const { theme } = useAppTheme();
  const reportQuery = useQuery({ queryKey: ["reports", "savings-progress"], queryFn: api.getSavingsProgressReport });
  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading savings report..." /></Screen>;
  if (reportQuery.isError) return <Screen><ErrorState message="Savings report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Savings Progress</Text>
      <View className="gap-3">
        {reportQuery.data?.length ? reportQuery.data.map((goal) => (
          <View key={goal._id} className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
                <PiggyBank color={theme.primary} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-dark">{goal.name}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</Text>
              </View>
            </View>
            <View className="mt-4"><ProgressBar progress={goal.progressPercent || 0} /></View>
          </View>
        )) : <EmptyState title="No savings progress" subtitle="Savings goal add karein to report yahan aye gi." />}
      </View>
    </Screen>
  );
};
