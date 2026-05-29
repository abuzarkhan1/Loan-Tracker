import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Edit3, PiggyBank, Plus } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "GoalDetail">;

export const GoalDetailScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { goalId } = useRoute<Route>().params;
  const goalQuery = useQuery({ queryKey: ["goal", goalId], queryFn: () => api.getSavingsGoal(goalId) });
  const planQuery = useQuery({ queryKey: ["goal-plan", goalId], queryFn: () => api.calculateGoalPlan(goalId) });
  if (goalQuery.isLoading || planQuery.isLoading) return <Screen><LoadingState label="Loading goal..." /></Screen>;
  if (goalQuery.isError || !goalQuery.data || !planQuery.data) return <Screen><ErrorState message="Goal load nahi ho saka." onRetry={goalQuery.refetch} /></Screen>;
  const goal = goalQuery.data;
  const plan = planQuery.data.plan;
  return (
    <Screen className="gap-5 pt-5">
      <PlanningCard title={goal.name} subtitle={plan.recommendedAction} amount={goal.targetAmount - goal.currentAmount} badge={goal.priority || "MEDIUM"} icon={PiggyBank} />
      <View className="rounded-3xl border border-border bg-card p-5">
        <ProgressBar progress={plan.currentProgress} />
        <Text className="mt-3 text-sm font-semibold text-muted">{plan.currentProgress}% completed</Text>
      </View>
      <View className="flex-row gap-3">
        <PlanningCard title="Monthly Needed" amount={plan.requiredMonthlySaving} />
        <PlanningCard title="Behind" amount={plan.behindAmount} badge={plan.onTrack ? "OK" : "Action"} />
      </View>
      <AppButton title="Edit Goal" icon={Edit3} onPress={() => navigation.navigate("CreateEditGoal", { goalId })} />
      <AppButton title="Add Progress" icon={Plus} onPress={() => navigation.navigate("AddSavingsProgress", { goalId })} />
      <AppButton title="View Plan" variant="secondary" onPress={() => navigation.navigate("GoalPlan", { goalId })} />
      <AppButton title="Smart Auto-Plan" variant="secondary" onPress={() => navigation.navigate("GoalAutoPlan", { goalId })} />
    </Screen>
  );
};
