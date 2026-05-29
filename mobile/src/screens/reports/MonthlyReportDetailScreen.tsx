import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

export const MonthlyReportDetailScreen = () => {
  const { theme } = useAppTheme();
  const now = new Date();
  const reportQuery = useQuery({
    queryKey: ["reports", "monthly-summary", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => api.getMonthlySummaryReport({ month: now.getMonth() + 1, year: now.getFullYear() }),
  });

  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading monthly report..." /></Screen>;
  if (reportQuery.isError || !reportQuery.data) return <Screen><ErrorState message="Monthly report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;

  const report = reportQuery.data;
  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Monthly Summary</Text>
      <Text className="mt-1 text-sm font-medium text-muted">{report.month}/{report.year}</Text>
      <View className="mt-5 flex-row flex-wrap gap-3">
        {[
          ["Given", report.given],
          ["Taken", report.taken],
          ["Received", report.received],
          ["Paid", report.paid],
          ["Net", report.netBalance],
        ].map(([label, value]) => (
          <View key={String(label)} className="w-[47%] rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
            <Text className="text-xs font-black uppercase text-muted">{label}</Text>
            <Text className="mt-2 text-lg font-black text-dark">{formatCurrency(Number(value))}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
};
