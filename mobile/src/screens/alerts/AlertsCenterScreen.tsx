import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCircle2, XCircle } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const AlertsCenterScreen = () => {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["alerts", "active"], queryFn: () => api.getActiveAlerts() });
  const dismiss = useMutation({ mutationFn: (id: string) => api.dismissAlert(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });
  const resolve = useMutation({ mutationFn: (id: string) => api.resolveAlert(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }) });
  if (query.isLoading) return <Screen><LoadingState label="Checking alerts..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Alerts load nahi ho sakay." onRetry={query.refetch} /></Screen>;
  const alerts = query.data || [];
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">Alerts Center</Text>
      {alerts.length ? alerts.map((alert) => (
        <View key={alert._id} className="gap-3">
          <PlanningCard title={alert.title} subtitle={alert.message} badge={alert.severity} icon={BellRing} onPress={() => navigation.navigate("AlertDetail", { alertId: alert._id })} />
          <View className="flex-row gap-3">
            <AppButton title="Dismiss" variant="secondary" icon={XCircle} onPress={() => dismiss.mutate(alert._id)} />
            <AppButton title="Resolve" variant="secondary" icon={CheckCircle2} onPress={() => resolve.mutate(alert._id)} />
          </View>
        </View>
      )) : <EmptyState title="Everything is clear" subtitle="No smart alerts right now." />}
    </Screen>
  );
};
