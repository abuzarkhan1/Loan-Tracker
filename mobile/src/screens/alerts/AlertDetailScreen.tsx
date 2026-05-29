import { RouteProp, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native";
import { api } from "../../api/client";
import { PlanningCard } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { formatDate } from "../../utils/format";

type Route = RouteProp<RootStackParamList, "AlertDetail">;

export const AlertDetailScreen = () => {
  const { alertId } = useRoute<Route>().params;
  const query = useQuery({ queryKey: ["alert", alertId], queryFn: () => api.getAlert(alertId) });
  if (query.isLoading) return <Screen><LoadingState label="Loading alert..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Alert load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const alert = query.data;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">Alert Detail</Text>
      <PlanningCard title={alert.title} subtitle={alert.message} badge={alert.severity} />
      <Text className="rounded-3xl border border-border bg-card p-5 text-sm font-semibold text-muted">
        Type: {alert.type.replace(/_/g, " ")}{"\n"}
        Status: {alert.status}{"\n"}
        Created: {formatDate(alert.createdAt)}
      </Text>
    </Screen>
  );
};
