import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { PlanningCard, TimelineRow } from "../../components/PlanningCards";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { formatDate } from "../../utils/format";

export const CashForecastScreen = () => {
  const query = useQuery({ queryKey: ["forecast", "current-cycle"], queryFn: () => api.getCurrentCycleForecast() });
  if (query.isLoading) return <Screen><LoadingState label="Building cash forecast..." /></Screen>;
  if (query.isError || !query.data) return <Screen><ErrorState message="Forecast load nahi ho saka." onRetry={query.refetch} /></Screen>;
  const forecast = query.data;
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark">Cash Forecast</Text>
      <PlanningCard title="Projected Cash" amount={forecast.projectedCash} subtitle={`${formatDate(forecast.periodStart)} - ${formatDate(forecast.periodEnd)}`} badge={forecast.confidenceLevel} icon={TrendingUp} />
      <View className="flex-row gap-3">
        <PlanningCard title="Inflows" amount={Object.values(forecast.expectedInflows).reduce((a, b) => a + b, 0)} />
        <PlanningCard title="Outflows" amount={Object.values(forecast.expectedOutflows).reduce((a, b) => a + b, 0)} />
      </View>
      {forecast.warnings.map((warning) => (
        <View key={warning} className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-sm font-black text-dark">{warning}</Text>
        </View>
      ))}
      <Text className="text-base font-black text-dark">Projection Timeline</Text>
      {forecast.timeline.map((item) => (
        <TimelineRow key={`${item.type}-${item.id}`} title={item.title} subtitle={`${item.type.replace(/_/g, " ")} • ${formatDate(item.date)}`} amount={item.amount} tone={item.direction === "INFLOW" ? "inflow" : "outflow"} />
      ))}
    </Screen>
  );
};
