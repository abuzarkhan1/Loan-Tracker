import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Brain } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";

type Props = NativeStackScreenProps<RootStackParamList, "InsightsDetail">;

export const InsightsDetailScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const insightsQuery = useQuery({ queryKey: ["dashboard", "insights"], queryFn: () => api.getDashboardInsights() });

  if (insightsQuery.isLoading) return <Screen><LoadingState label="Loading insights..." /></Screen>;
  if (insightsQuery.isError) return <Screen><ErrorState message="Insights load nahi ho sake." onRetry={insightsQuery.refetch} /></Screen>;

  const insights = insightsQuery.data || [];
  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Smart Insights</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Useful reminders and account signals.</Text>
      </View>

      <View className="mt-5 gap-3">
        {insights.length ? insights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            activeOpacity={0.88}
            onPress={() => {
              if (insight.actionRoute === "LoanDetail" && insight.metadata?.loanId) {
                navigation.navigate("LoanDetail", { loanId: String(insight.metadata.loanId) });
              } else if (insight.actionRoute === "ContactLoanProfile" && insight.metadata?.contactId) {
                navigation.navigate("ContactLoanProfile", { contactId: String(insight.metadata.contactId) });
              }
            }}
            className="rounded-3xl border border-border bg-card p-5"
            style={theme.shadowSoft}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-peach">
                <Brain color={theme.primaryDark} size={21} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-black uppercase text-muted">{insight.severity}</Text>
                <Text className="mt-1 text-base font-black text-dark">{insight.title}</Text>
              </View>
            </View>
            <Text className="mt-4 text-sm font-semibold leading-6 text-muted">{insight.description}</Text>
            {insight.actionLabel ? <Text className="mt-3 text-xs font-black text-primary">{insight.actionLabel}</Text> : null}
          </TouchableOpacity>
        )) : (
          <EmptyState title="No important insights right now" subtitle="Loans aur payments update hotay hi insights yahan show hongi." />
        )}
      </View>
    </Screen>
  );
};
