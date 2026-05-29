import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Plus, ReceiptText } from "lucide-react-native";
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

export const BillsScreen = () => {
  const navigation = useNavigation<Navigation>();
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED">("ALL");
  const query = useQuery({ queryKey: ["bills", status], queryFn: () => api.getBills({ status: status === "ALL" ? undefined : status, limit: 50 }) });

  if (query.isLoading) return <Screen><LoadingState label="Loading bills..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Bills load nahi ho sakay." onRetry={query.refetch} /></Screen>;

  const bills = query.data?.bills || [];
  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Bills</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">Rent, utilities, subscriptions aur due payments.</Text>
        </View>
        <AppButton title="Add" icon={Plus} onPress={() => navigation.navigate("AddEditBill")} />
      </View>
      <FormSelect label="Filter" value={status} onChange={setStatus} options={[
        { label: "All", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Paused", value: "PAUSED" },
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Done", value: "COMPLETED" },
      ]} />
      {bills.length ? bills.map((bill) => (
        <PlanningCard
          key={bill._id}
          title={bill.title}
          subtitle={`Next due ${formatDate(bill.nextDueDate)} • ${bill.frequency}`}
          amount={bill.amount}
          badge={bill.status}
          icon={ReceiptText}
          onPress={() => navigation.navigate("BillDetail", { billId: bill._id })}
        />
      )) : (
        <EmptyState title="No bills yet" subtitle="Recurring bills add karein taake calendar aur forecast accurate rahein." />
      )}
      {query.data?.bills?.length ? (
        <AppButton title="Open Calendar" variant="secondary" icon={CalendarClock} onPress={() => navigation.navigate("FinanceCalendar")} />
      ) : null}
    </Screen>
  );
};
