import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

export const FinanceInsightsScreen = () => {
  const { theme } = useAppTheme();
  const insightsQuery = useQuery({ queryKey: ["finance", "insights", "all"], queryFn: () => api.getFinanceInsights() });

  if (insightsQuery.isLoading) return <Screen><LoadingState label="Loading cash flow insights..." /></Screen>;
  if (insightsQuery.isError) return <Screen><ErrorState message="Cash flow insights load nahi ho sake." onRetry={insightsQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Cash Flow Insights</Text>
      <View className="gap-3">
        {insightsQuery.data?.length ? insightsQuery.data.map((insight) => (
          <View key={insight.id} className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
                <Sparkles color={theme.primary} size={19} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-dark">{insight.title}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{insight.severity}</Text>
              </View>
            </View>
            <Text className="mt-3 text-sm font-semibold text-muted">{insight.description}</Text>
          </View>
        )) : <EmptyState title="No insights yet" subtitle="Transactions add hon gi to useful insights yahan show hon gi." />}
      </View>
    </Screen>
  );
};
