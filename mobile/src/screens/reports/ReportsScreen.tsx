import { useQuery } from "@tanstack/react-query";
import { Dimensions, Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";

const width = Dimensions.get("window").width - 40;

export const ReportsScreen = () => {
  const { theme } = useAppTheme();
  const monthlyQuery = useQuery({ queryKey: ["dashboard", "monthly", "reports"], queryFn: () => api.getMonthlyChart(6) });
  const typeQuery = useQuery({ queryKey: ["dashboard", "typeChart"], queryFn: api.getLoanTypeChart });
  const statusQuery = useQuery({ queryKey: ["dashboard", "statusChart"], queryFn: api.getLoanStatusChart });

  const loading = monthlyQuery.isLoading || typeQuery.isLoading || statusQuery.isLoading;
  const failed = monthlyQuery.isError || typeQuery.isError || statusQuery.isError;

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(243, 111, 86, ${opacity})`,
    labelColor: () => theme.muted,
    decimalPlaces: 0,
  };

  const typeData = (typeQuery.data || []).map((item) => ({
    name: item.type === "GIVEN" ? "Lene" : "Dene",
    population: item.amount,
    color: item.type === "GIVEN" ? theme.success : theme.danger,
    legendFontColor: theme.text,
    legendFontSize: 12,
  }));

  const statusColors = {
    ACTIVE: theme.primary,
    PARTIALLY_PAID: theme.warning,
    COMPLETED: theme.success,
    OVERDUE: theme.danger,
  };

  const statusData = (statusQuery.data || []).map((item) => ({
    name: item.status.replace("_", " "),
    population: item.count,
    color: statusColors[item.status],
    legendFontColor: theme.text,
    legendFontSize: 12,
  }));

  const monthly = monthlyQuery.data || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Reports</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Charts se trends jaldi samajh aate hain.</Text>
      </View>

      {loading ? <LoadingState label="Loading reports..." /> : null}
      {failed ? <ErrorState message="Reports load nahi ho sake." /> : null}

      {!loading && !failed ? (
        <>
          <View className="mt-6 rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="text-lg font-bold text-dark">Loan Type Chart</Text>
            {typeData.length ? (
              <PieChart
                data={typeData}
                width={width - 32}
                height={210}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="8"
                absolute
              />
            ) : (
              <EmptyState title="No type data" />
            )}
          </View>

          <View className="mt-6 rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="text-lg font-bold text-dark">Loan Status Chart</Text>
            {statusData.length ? (
              <PieChart
                data={statusData}
                width={width - 32}
                height={210}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="8"
                absolute
              />
            ) : (
              <EmptyState title="No status data" />
            )}
          </View>

          <View className="mt-6 rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="text-lg font-bold text-dark">Baqi Raqam Trend</Text>
            {monthly.length ? (
              <BarChart
                data={{
                  labels: monthly.map((item) => item.month.slice(5)),
                  datasets: [{ data: monthly.map((item) => item.given + item.taken) }],
                }}
                width={width - 32}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(243, 111, 86, ${opacity})`,
                }}
                style={{ borderRadius: 8 }}
              />
            ) : (
              <EmptyState title="No monthly data" />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
};
