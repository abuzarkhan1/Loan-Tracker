import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Flag, Plus } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const FinancialGoalsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const query = useQuery({ queryKey: ["goals-planner"], queryFn: () => api.getGoalsPlanner() });
  if (query.isLoading) return <Screen><LoadingState label="Loading goals..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Goals load nahi ho sakay." onRetry={query.refetch} /></Screen>;
  const goals = query.data || [];
  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Financial Goals</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">Savings goals with smart monthly planning.</Text>
        </View>
        <AppButton title="Add" icon={Plus} onPress={() => navigation.navigate("CreateEditGoal")} />
      </View>
      {goals.length ? goals.map(({ goal, plan }) => (
        <PlanningCard
          key={goal._id}
          title={goal.name}
          subtitle={`${plan.currentProgress}% complete${goal.deadline ? ` • ${formatDate(goal.deadline)}` : ""}`}
          amount={goal.targetAmount - goal.currentAmount}
          badge={plan.onTrack ? "On track" : "Behind"}
          icon={Flag}
          onPress={() => navigation.navigate("GoalDetail", { goalId: goal._id })}
        />
      )) : <EmptyState title="No goals yet" subtitle="Emergency fund, laptop, education ya custom goal banayein." />}
    </Screen>
  );
};
