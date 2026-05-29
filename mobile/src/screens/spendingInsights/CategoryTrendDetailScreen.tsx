import { RouteProp, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { PlanningCard, TimelineRow } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Route = RouteProp<RootStackParamList, "CategoryTrendDetail">;

export const CategoryTrendDetailScreen = () => {
  const { categoryId } = useRoute<Route>().params;
  const query = useQuery({ queryKey: ["category-trend", categoryId], queryFn: () => api.getCategoryTrend(categoryId) });
  if (query.isLoading) return <Screen><LoadingState label="Loading category trend..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Category trend load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const data = query.data;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">{data.category?.name || "Category Trend"}</Text>
      <View className="flex-row gap-3">
        <PlanningCard title="Current" amount={data.currentAmount} />
        <PlanningCard title="Previous" amount={data.previousAmount} badge={`${data.changePercent}%`} />
      </View>
      {data.transactions.map((transaction) => (
        <TimelineRow key={transaction._id} title={transaction.source || "Expense"} subtitle={formatDate(transaction.date)} amount={transaction.amount} tone="outflow" />
      ))}
    </Screen>
  );
};
