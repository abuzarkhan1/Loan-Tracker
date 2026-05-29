import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit3, PauseCircle, PlayCircle, SkipForward } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard, TimelineRow } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "RecurringTransactionDetail">;

export const RecurringTransactionDetailScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const id = route.params.recurringTransactionId;
  const query = useQuery({ queryKey: ["recurring-transaction", id], queryFn: () => api.getRecurringTransaction(id) });
  const complete = useMutation({
    mutationFn: (occurrenceId: string) => api.markRecurringCompleted(occurrenceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-transaction", id] }),
  });
  const pause = useMutation({ mutationFn: () => api.pauseRecurringTransaction(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-transaction", id] }) });
  const resume = useMutation({ mutationFn: () => api.resumeRecurringTransaction(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-transaction", id] }) });
  const skip = useMutation({ mutationFn: (occurrenceId: string) => api.skipRecurringOccurrence(occurrenceId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-transaction", id] }) });
  if (query.isLoading) return <Screen><LoadingState label="Loading recurring detail..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Recurring detail load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const { recurringTransaction, occurrences } = query.data;
  const next = occurrences.find((item) => ["UPCOMING", "DUE_TODAY", "OVERDUE"].includes(item.status));
  return (
    <Screen className="gap-5 pt-5">
      <PlanningCard title={recurringTransaction.title} subtitle={`${recurringTransaction.type} • next ${formatDate(recurringTransaction.nextRunDate)}`} amount={recurringTransaction.amount} badge={recurringTransaction.status} />
      <View className="flex-row gap-3">
        <AppButton title="Edit" variant="secondary" icon={Edit3} onPress={() => navigation.navigate("AddEditRecurringTransaction", { recurringTransactionId: id })} />
        {next ? <AppButton title="Mark Done" icon={CheckCircle2} loading={complete.isPending} onPress={() => complete.mutate(next._id)} /> : null}
      </View>
      <View className="flex-row gap-3">
        {recurringTransaction.status === "PAUSED" ? (
          <AppButton title="Resume" variant="secondary" icon={PlayCircle} loading={resume.isPending} onPress={() => resume.mutate()} />
        ) : (
          <AppButton title="Pause" variant="secondary" icon={PauseCircle} loading={pause.isPending} onPress={() => pause.mutate()} />
        )}
        {next ? <AppButton title="Skip Next" variant="secondary" icon={SkipForward} loading={skip.isPending} onPress={() => skip.mutate(next._id)} /> : null}
      </View>
      <Text className="text-base font-black text-dark">History</Text>
      {occurrences.map((item) => (
        <TimelineRow key={item._id} title={item.title} subtitle={`${item.status} • ${formatDate(item.dueDate)}`} amount={item.amount} tone={item.type === "INCOME" ? "inflow" : "outflow"} />
      ))}
    </Screen>
  );
};
