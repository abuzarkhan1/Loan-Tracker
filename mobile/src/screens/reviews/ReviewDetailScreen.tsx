import { RouteProp, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Route = RouteProp<RootStackParamList, "ReviewDetail">;

export const ReviewDetailScreen = () => {
  const { reviewId } = useRoute<Route>().params;
  const query = useQuery({ queryKey: ["reviews", reviewId], queryFn: () => api.getReview(reviewId) });

  if (query.isLoading) return <Screen><LoadingState label="Loading review..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Review detail load nahi ho saka." onRetry={query.refetch} /></Screen>;

  const review = query.data;
  const summary = review.summaryData as Record<string, number | { name?: string } | null>;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Cycle Review</Text>
        <Text className="mt-1 text-sm font-semibold text-muted">{formatDate(review.cycleStartDate)} - {formatDate(review.cycleEndDate)}</Text>
      </View>

      <PlanningCard title="Cash Flow Result" amount={Number(summary.cashFlowResult || 0)} subtitle="Net movement in this cycle" />
      <View className="flex-row gap-3">
        <PlanningCard title="Income" amount={Number(summary.salaryReceived || 0) + Number(summary.otherIncome || 0)} />
        <PlanningCard title="Expenses" amount={Number(summary.expenses || 0)} />
      </View>
      <View className="flex-row gap-3">
        <PlanningCard title="Recovered" amount={Number(summary.loanRecoveries || 0)} />
        <PlanningCard title="Repaid" amount={Number(summary.loanRepayments || 0)} />
      </View>
      <PlanningCard title="Savings Estimate" amount={Number(summary.savingsEstimate || 0)} />

      <View className="gap-3">
        <Text className="text-base font-black text-dark">Highlights</Text>
        {review.highlights.map((item) => (
          <View key={item.title} className="rounded-2xl bg-background-soft p-4">
            <Text className="text-sm font-black text-dark">{item.title}</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">{item.description}</Text>
          </View>
        ))}
      </View>

      {review.warnings.length ? (
        <View className="gap-3">
          <Text className="text-base font-black text-dark">Warnings</Text>
          {review.warnings.map((item) => (
            <View key={item.title} className="rounded-2xl bg-peach p-4">
              <Text className="text-sm font-black text-danger">{item.title}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{item.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
};
