import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react-native";
import { Text } from "react-native";
import { api } from "../../api/client";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const SpendingInsightsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const query = useQuery({ queryKey: ["spending-habits"], queryFn: () => api.getSpendingHabits() });
  if (query.isLoading) return <Screen><LoadingState label="Analyzing habits..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Spending insights load nahi ho sakay." onRetry={query.refetch} /></Screen>;
  const insights = query.data?.insights || [];
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">Spending Insights</Text>
      {insights.length ? insights.map((insight) => (
        <PlanningCard
          key={insight.id}
          title={insight.title}
          subtitle={insight.description}
          amount={insight.currentValue}
          badge={insight.severity}
          icon={TrendingUp}
          onPress={insight.relatedCategoryId ? () => navigation.navigate("CategoryTrendDetail", { categoryId: insight.relatedCategoryId! }) : undefined}
        />
      )) : <EmptyState title="No insights yet" subtitle="Transactions add hon gi to spending habits yahan aein ge." />}
    </Screen>
  );
};
