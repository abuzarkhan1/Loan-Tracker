import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, ReceiptText, Scale, Users } from "lucide-react-native";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { BrandLogo } from "../../components/BrandLogo";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { Screen } from "../../components/Screen";
import { SummaryCard } from "../../components/SummaryCard";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const chartWidth = Dimensions.get("window").width - 40;

export const DashboardScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const summaryQuery = useQuery({ queryKey: ["dashboard", "summary"], queryFn: api.getSummary });
  const monthlyQuery = useQuery({ queryKey: ["dashboard", "monthly"], queryFn: () => api.getMonthlyChart(6) });
  const topContactsQuery = useQuery({ queryKey: ["dashboard", "topContacts"], queryFn: () => api.getTopContacts(5) });

  const summary = summaryQuery.data;
  const monthly = monthlyQuery.data || [];
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(243, 111, 86, ${opacity})`,
    labelColor: () => theme.muted,
    decimalPlaces: 0,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.primary,
    },
  };

  return (
    <Screen className="pt-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row flex-1 items-center gap-3">
          <BrandLogo size={46} elevated={false} />
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark">Dashboard</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Aaj ki complete loan picture.</Text>
          </View>
        </View>
        <AppButton title="Naya Loan" icon={Plus} onPress={() => navigation.navigate("LoanForm")} />
      </View>

      {summaryQuery.isLoading ? <LoadingState label="Loading dashboard..." /> : null}
      {summaryQuery.isError ? <ErrorState message="Dashboard load nahi ho saka." onRetry={summaryQuery.refetch} /> : null}

      {summary ? (
        <>
          <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
            <SummaryCard label="Mujhe Lene Hain" value={formatCurrency(summary.netReceivable)} icon={ArrowDownLeft} tone="success" />
            <SummaryCard label="Mujhe Dene Hain" value={formatCurrency(summary.netPayable)} icon={ArrowUpRight} tone="danger" />
            <SummaryCard label="Total Wapis Mila" value={formatCurrency(summary.totalReceivedBack)} icon={ReceiptText} tone="primary" />
            <SummaryCard label="Total Wapis Diya" value={formatCurrency(summary.totalPaidBack)} icon={Landmark} tone="warning" />
            <SummaryCard label="Overall Balance" value={formatCurrency(summary.overallBalance)} icon={Scale} tone={summary.overallBalance >= 0 ? "success" : "danger"} />
            <SummaryCard label="Overdue Loans" value={String(summary.overdueLoans)} icon={Users} tone="danger" />
          </View>

          <View className="mt-6 rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-dark">Monthly Flow</Text>
              <Text className="text-xs font-semibold text-muted">6 months</Text>
            </View>
            {monthly.length ? (
              <LineChart
                data={{
                  labels: monthly.map((item) => item.month.slice(5)),
                  datasets: [
                    {
                      data: monthly.map((item) => item.given + item.taken),
                      color: () => theme.primary,
                    },
                    {
                      data: monthly.map((item) => item.received + item.paid),
                      color: () => theme.success,
                    },
                  ],
                  legend: ["Loans", "Payments"],
                }}
                width={chartWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={{ borderRadius: 8 }}
              />
            ) : (
              <EmptyState title="No chart data" subtitle="Naya loan ya payment add karte hi graph ban jayega." />
            )}
          </View>

          <View className="mt-6 rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="text-lg font-bold text-dark">Top Contacts</Text>
            <View className="mt-4 gap-3">
              {topContactsQuery.data?.length ? (
                topContactsQuery.data.map((contact) => (
                  <View key={contact.contactId} className="flex-row items-center justify-between border-b border-border pb-3">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-dark">{contact.contactName}</Text>
                      <Text className="mt-1 text-xs font-medium text-muted">{contact.loanCount} loans</Text>
                    </View>
                    <Text className="text-sm font-bold text-dark">{formatCurrency(contact.remainingAmount)}</Text>
                  </View>
                ))
              ) : (
                <EmptyState title="No contacts yet" subtitle="Contacts ke saath loan activity yahan show hogi." />
              )}
            </View>
          </View>
        </>
      ) : null}
    </Screen>
  );
};
