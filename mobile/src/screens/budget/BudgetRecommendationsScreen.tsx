import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Sparkles } from "lucide-react-native";
import { Text } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const BudgetRecommendationsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["budget-recommendations"], queryFn: () => api.getBudgetRecommendations() });
  const apply = useMutation({
    mutationFn: () => api.applyBudgetRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      navigation.navigate("Budget");
    },
  });
  if (query.isLoading) return <Screen><LoadingState label="Preparing recommendations..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Recommendations load nahi ho sakein." onRetry={query.refetch} /></Screen>;
  return (
    <Screen className="gap-5 pt-5">
      <PlanningCard title="Recommended Budget" amount={query.data.recommendedTotalBudget} subtitle={query.data.savingsSuggestion} icon={Sparkles} onPress={() => navigation.navigate("AddEditBudget")} />
      <AppButton title="Apply All Recommendations" icon={CheckCircle2} loading={apply.isPending} onPress={() => apply.mutate()} />
      <Text className="text-base font-black text-dark">Category Recommendations</Text>
      {query.data.categoryRecommendations.map((item) => (
        <PlanningCard key={item.categoryId} title={item.categoryName} subtitle={item.reason} amount={item.recommendedBudget} badge={item.confidence} />
      ))}
      {query.data.warnings.map((warning) => <Text key={warning} className="rounded-2xl bg-card p-4 text-sm font-semibold text-muted">{warning}</Text>)}
    </Screen>
  );
};
