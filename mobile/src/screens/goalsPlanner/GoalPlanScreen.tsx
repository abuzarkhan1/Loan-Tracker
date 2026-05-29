import { RouteProp, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
import { api } from "../../api/client";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Route = RouteProp<RootStackParamList, "GoalPlan">;

export const GoalPlanScreen = () => {
  const { goalId } = useRoute<Route>().params;
  const query = useQuery({ queryKey: ["goal-plan", goalId], queryFn: () => api.calculateGoalPlan(goalId) });
  if (query.isLoading) return <Screen><LoadingState label="Calculating goal plan..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Goal plan load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const { goal, plan } = query.data;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">{goal.name} Plan</Text>
      <PlanningCard title="Required Monthly Saving" amount={plan.requiredMonthlySaving} badge={plan.onTrack ? "On track" : "Behind"} />
      <PlanningCard title="Months Remaining" amount={plan.monthsRemaining || 0} />
      <Text className="rounded-3xl border border-border bg-card p-5 text-sm font-semibold text-muted">{plan.recommendedAction}</Text>
    </Screen>
  );
};
