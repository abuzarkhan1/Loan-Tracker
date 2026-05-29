import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit3, PauseCircle, PlayCircle } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard, TimelineRow } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "BillDetail">;

export const BillDetailScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { billId } = route.params;
  const query = useQuery({ queryKey: ["bill", billId], queryFn: () => api.getBill(billId) });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bill", billId] });
    queryClient.invalidateQueries({ queryKey: ["bills"] });
  };
  const pause = useMutation({ mutationFn: () => api.pauseBill(billId), onSuccess: invalidate });
  const resume = useMutation({ mutationFn: () => api.resumeBill(billId), onSuccess: invalidate });

  if (query.isLoading) return <Screen><LoadingState label="Loading bill..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Bill detail load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const { bill, occurrences } = query.data;
  const next = occurrences.find((item) => ["UPCOMING", "DUE_TODAY", "OVERDUE"].includes(item.status));

  return (
    <Screen className="gap-5 pt-5">
      <PlanningCard title={bill.title} subtitle={`${bill.frequency} • next ${formatDate(bill.nextDueDate)}`} amount={bill.amount} badge={bill.status} />
      <View className="flex-row gap-3">
        <AppButton title="Edit" variant="secondary" icon={Edit3} onPress={() => navigation.navigate("AddEditBill", { billId })} />
        {bill.status === "PAUSED" ? (
          <AppButton title="Resume" variant="secondary" icon={PlayCircle} onPress={() => resume.mutate()} />
        ) : (
          <AppButton title="Pause" variant="secondary" icon={PauseCircle} onPress={() => pause.mutate()} />
        )}
      </View>
      {next ? <AppButton title="Mark Next Paid" icon={CheckCircle2} onPress={() => navigation.navigate("MarkBillPaid", { occurrenceId: next._id, billId, defaultAmount: next.amount })} /> : null}
      <View className="gap-3">
        <Text className="text-base font-black text-dark">Occurrence History</Text>
        {occurrences.map((item) => (
          <TimelineRow key={item._id} title={item.title} subtitle={`${item.status} • ${formatDate(item.dueDate)}`} amount={item.amount} tone={item.status === "PAID" ? "inflow" : "outflow"} />
        ))}
      </View>
    </Screen>
  );
};
