import { useQuery } from "@tanstack/react-query";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const width = Dimensions.get("window").width - 40;

export const CashFlowTrendReportScreen = () => {
  const { theme } = useAppTheme();
  const trendQuery = useQuery({ queryKey: ["reports", "cash-flow-trend"], queryFn: api.getCashFlowTrendReport });
  if (trendQuery.isLoading) return <Screen><LoadingState label="Loading cash flow trend..." /></Screen>;
  if (trendQuery.isError) return <Screen><ErrorState message="Cash flow trend load nahi ho saka." onRetry={trendQuery.refetch} /></Screen>;
  const rows = trendQuery.data || [];
  const hasData = rows.some((row) => row.inflow || row.outflow || row.net);
  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Cash Flow Trend</Text>
      {hasData ? (
        <>
          <View className="overflow-hidden rounded-3xl border border-border bg-card p-2">
            <LineChart
              data={{
                labels: rows.map((row) => row.month.slice(5)),
                datasets: [{ data: rows.map((row) => row.net) }],
              }}
              width={width}
              height={220}
              yAxisLabel="Rs "
              chartConfig={{
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                color: (opacity = 1) => `rgba(243, 111, 86, ${opacity})`,
                labelColor: () => theme.muted,
                decimalPlaces: 0,
              }}
              bezier
              style={{ borderRadius: 24 }}
            />
          </View>
          <View className="gap-3">
            {rows.map((row) => (
              <View key={row.month} className="rounded-3xl border border-border bg-card p-4">
                <Text className="text-base font-black text-dark">{row.month}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">In {formatCurrency(row.inflow)} · Out {formatCurrency(row.outflow)} · Net {formatCurrency(row.net)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : <EmptyState title="No trend yet" subtitle="Transactions add hon gi to cash flow trend banega." />}
    </Screen>
  );
};
