import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Repeat2, Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const RecurringTransactionsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [filter, setFilter] = useState<"ALL" | "EXPENSE" | "INCOME" | "PAUSED">("ALL");
  const query = useQuery({
    queryKey: ["recurring-transactions", filter],
    queryFn: () => api.getRecurringTransactions({
      type: filter === "INCOME" || filter === "EXPENSE" ? filter : undefined,
      status: filter === "PAUSED" ? "PAUSED" : undefined,
      limit: 50,
    }),
  });
  if (query.isLoading) return <Screen><LoadingState label="Loading recurring items..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Recurring items load nahi ho sakay." onRetry={query.refetch} /></Screen>;
  const items = query.data?.recurringTransactions || [];
  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Recurring</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">Regular income aur expenses ka schedule.</Text>
        </View>
        <AppButton title="Add" icon={Plus} onPress={() => navigation.navigate("AddEditRecurringTransaction")} />
      </View>
      <FormSelect label="Filter" value={filter} onChange={setFilter} options={[
        { label: "All", value: "ALL" },
        { label: "Expenses", value: "EXPENSE" },
        { label: "Income", value: "INCOME" },
        { label: "Paused", value: "PAUSED" },
      ]} />
      {items.length ? items.map((item) => (
        <PlanningCard
          key={item._id}
          title={item.title}
          subtitle={`${item.type} • next ${formatDate(item.nextRunDate)} • ${item.frequency}`}
          amount={item.amount}
          badge={item.status}
          icon={Repeat2}
          onPress={() => navigation.navigate("RecurringTransactionDetail", { recurringTransactionId: item._id })}
        />
      )) : <EmptyState title="No recurring records" subtitle="Rent, freelance income ya monthly expenses yahan add karein." />}
    </Screen>
  );
};
