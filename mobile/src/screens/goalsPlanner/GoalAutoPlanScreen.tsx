import { RouteProp, useRoute } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Target } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate } from "../../utils/format";

type Route = RouteProp<RootStackParamList, "GoalAutoPlan">;

export const GoalAutoPlanScreen = () => {
  const { theme } = useAppTheme();
  const { goalId } = useRoute<Route>().params;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["goal-auto-plan", goalId], queryFn: () => api.getGoalAutoPlan(goalId) });
  const mutation = useMutation({
    mutationFn: () => api.generateGoalAutoPlan(goalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goal-auto-plan", goalId] }),
  });
  const applyMutation = useMutation({
    mutationFn: () => api.applyGoalAutoPlan(goalId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["goal", goalId] }),
        queryClient.invalidateQueries({ queryKey: ["goal-plan", goalId] }),
        queryClient.invalidateQueries({ queryKey: ["goal-auto-plan", goalId] }),
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
      ]);
    },
  });

  if (query.isLoading) return <Screen><LoadingState label="Building smart goal plan..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Goal auto-plan load nahi ho saka." onRetry={query.refetch} /></Screen>;

  const plan = mutation.data || query.data;

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
            <Target color={theme.primaryDark} size={23} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-dark">Smart Goal Auto-Plan</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">
              {plan.projectedCompletionDate ? `Projected ${formatDate(plan.projectedCompletionDate)}` : "Based on your current cash flow"}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <PlanningCard title="Remaining" amount={plan.remainingAmount} />
        <PlanningCard title="Required / month" amount={plan.requiredMonthlySaving} />
      </View>
      <PlanningCard
        title="Realistic Saving"
        subtitle="Current cash flow ke hisaab se"
        amount={plan.realisticMonthlySavingBasedOnCashFlow}
        badge={plan.isOnTrack ? "On track" : "Adjust"}
      />

      <View className="gap-3">
        <Text className="text-base font-black text-dark">Recommendations</Text>
        {plan.suggestions.map((suggestion) => (
          <View key={suggestion} className="rounded-2xl bg-background-soft p-4">
            <Text className="text-sm font-bold text-dark">{suggestion}</Text>
          </View>
        ))}
      </View>

      <AppButton title="Regenerate Auto-Plan" icon={RefreshCcw} loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <AppButton
        title="Apply Suggested Plan"
        loading={applyMutation.isPending}
        onPress={() => applyMutation.mutate()}
      />
    </Screen>
  );
};
