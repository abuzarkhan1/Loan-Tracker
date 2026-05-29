import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, RefreshCcw } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatCurrency, formatDate } from "../../utils/format";

export const MonthlyReviewScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["reviews", "current"], queryFn: api.getCurrentReview });
  const mutation = useMutation({ mutationFn: api.generateReview, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }) });
  if (query.isLoading) return <Screen><LoadingState label="Preparing review..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Review load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const review = query.data;
  const summary = review.summaryData as Record<string, number | { name?: string } | null>;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">Cycle Review</Text>
      <Text className="text-sm font-semibold text-muted">{formatDate(review.cycleStartDate)} - {formatDate(review.cycleEndDate)}</Text>
      <PlanningCard title="Cash Flow Result" amount={Number(summary.cashFlowResult || 0)} subtitle="Net movement this cycle" />
      <View className="flex-row gap-3">
        <PlanningCard title="Income" amount={Number(summary.salaryReceived || 0) + Number(summary.otherIncome || 0)} />
        <PlanningCard title="Expenses" amount={Number(summary.expenses || 0)} />
      </View>
      <View className="flex-row gap-3">
        <PlanningCard title="Recovered" amount={Number(summary.loanRecoveries || 0)} />
        <PlanningCard title="Repaid" amount={Number(summary.loanRepayments || 0)} />
      </View>
      <Text className="text-base font-black text-dark">Highlights</Text>
      {review.highlights.map((item) => <View key={item.title} className="rounded-2xl bg-background-soft p-4"><Text className="text-sm font-black text-dark">{item.title}</Text><Text className="mt-1 text-xs font-semibold text-muted">{item.description}</Text></View>)}
      {review.warnings.length ? <Text className="text-base font-black text-dark">Warnings</Text> : null}
      {review.warnings.map((item) => <View key={item.title} className="rounded-2xl bg-peach p-4"><Text className="text-sm font-black text-danger">{item.title}</Text><Text className="mt-1 text-xs font-semibold text-muted">{item.description}</Text></View>)}
      <AppButton title="Regenerate Review" icon={RefreshCcw} loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <AppButton title="Review History" icon={History} variant="secondary" onPress={() => navigation.navigate("ReviewHistory")} />
    </Screen>
  );
};
