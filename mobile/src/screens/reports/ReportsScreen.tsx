import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileSpreadsheet, FileText, History, TrendingUp, Scale, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart, PieChart, ProgressChart } from "react-native-chart-kit";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

const width = Dimensions.get("window").width - 40;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ReportsScreen = () => {
  const { theme, mode } = useAppTheme();
  const navigation = useNavigation<Navigation>();

  // Fetch summary and charts
  const summaryQuery = useQuery({ 
    queryKey: ["dashboard", "summary"], 
    queryFn: () => api.getSummary() 
  });
  const monthlyQuery = useQuery({ 
    queryKey: ["dashboard", "monthly", "reports"], 
    queryFn: () => api.getMonthlyChart(6) 
  });

  // Diagnostic log errors if any queries fail
  if (summaryQuery.error) {
    console.error("[ReportsScreen] Summary query failed:", summaryQuery.error);
  }
  if (monthlyQuery.error) {
    console.error("[ReportsScreen] Monthly query failed:", monthlyQuery.error);
  }

  const loading = summaryQuery.isLoading || monthlyQuery.isLoading;
  const failed = summaryQuery.isError || monthlyQuery.isError;

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(243, 111, 86, ${opacity})`,
    labelColor: () => theme.muted,
    decimalPlaces: 0,
    propsForLabels: {
      fontFamily: fontFamily.semiBold,
      fontSize: 10,
    }
  };

  const summary = summaryQuery.data;
  const monthly = monthlyQuery.data || [];

  // 1. Calculate repayment and recovery rates for the Progress Chart
  const recoveryRate = useMemo(() => {
    if (!summary) return 0;
    const totalGiven = (summary.totalReceivedBack || 0) + (summary.netReceivable || 0);
    return totalGiven > 0 ? (summary.totalReceivedBack || 0) / totalGiven : 0;
  }, [summary]);

  const repaymentRate = useMemo(() => {
    if (!summary) return 0;
    const totalTaken = (summary.totalPaidBack || 0) + (summary.netPayable || 0);
    return totalTaken > 0 ? (summary.totalPaidBack || 0) / totalTaken : 0;
  }, [summary]);

  // 2. Prepare Outstanding Distribution data for the Pie Chart
  const distributionData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: "Lene (Receivable)",
        population: summary.netReceivable || 0,
        color: theme.success,
        legendFontColor: theme.text,
        legendFontSize: 11,
      },
      {
        name: "Dene (Payable)",
        population: summary.netPayable || 0,
        color: theme.danger,
        legendFontColor: theme.text,
        legendFontSize: 11,
      }
    ].filter(item => item.population > 0);
  }, [summary, theme]);

  return (
    <Screen className="pt-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* --- Header Section --- */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Reports & Analytics</Text>
            <Text className="mt-1 text-xs font-medium text-muted" style={{ fontFamily: fontFamily.medium }}>Deep financial insights and accounts compilation.</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ReportHistory")}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            style={theme.shadowSoft}
          >
            <History color={theme.primary} size={18} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="mt-12">
            <LoadingState label="Loading reporting metrics..." />
          </View>
        ) : null}
        {failed ? (
          <View className="mt-12">
            <ErrorState message="Reporting visual graphs load nahi ho sake." />
          </View>
        ) : null}

        {summary && !loading && !failed ? (
          <View className="mt-6 gap-6">
            {/* --- Premium Analytics Hero Card --- */}
            <View 
              className="rounded-3xl border p-5 relative overflow-hidden"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                ...theme.shadowSoft
              }}
            >
              {/* Soft decorative background glow */}
              <View 
                className="absolute -right-16 -top-16 h-36 w-36 rounded-full opacity-10"
                style={{ backgroundColor: theme.primary }}
              />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-wider" style={{ fontFamily: fontFamily.bold }}>Net Portfolio Value</Text>
                  <Text 
                    className="text-2xl font-black mt-1" 
                    style={{ 
                      fontFamily: fontFamily.extraBold, 
                      color: summary.overallBalance >= 0 ? theme.success : theme.danger 
                    }}
                  >
                    {formatCurrency(summary.overallBalance)}
                  </Text>
                </View>
                <View 
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: mode === "light" ? "#fff1ea" : "rgba(243, 111, 86, 0.08)" }}
                >
                  <Scale color={theme.primary} size={20} />
                </View>
              </View>

              {/* Horizontally aligned sub-metrics */}
              <View className="mt-5 flex-row border-t border-border pt-4 justify-between">
                <View className="flex-1 flex-row items-center gap-2">
                  <ArrowDownLeft color={theme.success} size={16} />
                  <View>
                    <Text className="text-[9px] font-bold text-muted uppercase" style={{ fontFamily: fontFamily.bold }}>Receivable</Text>
                    <Text className="text-xs font-extrabold text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.netReceivable)}</Text>
                  </View>
                </View>
                <View className="flex-1 flex-row items-center gap-2 border-l border-border pl-4">
                  <ArrowUpRight color={theme.danger} size={16} />
                  <View>
                    <Text className="text-[9px] font-bold text-muted uppercase" style={{ fontFamily: fontFamily.bold }}>Payable</Text>
                    <Text className="text-xs font-extrabold text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.netPayable)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* --- Document Statements Engine Dock --- */}
            <View className="gap-3">
              {/* PDF statement pill */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate("GeneratePdf")}
                className="flex-row items-center justify-between rounded-2xl border p-4 bg-card"
                style={{ borderColor: theme.border, ...theme.shadowSoft }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mode === "light" ? "#fff1ea" : "rgba(243, 111, 86, 0.08)" }}>
                    <FileText color={theme.primary} size={18} />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Generate PDF Statement</Text>
                    <Text className="text-[10px] text-muted mt-0.5" style={{ fontFamily: fontFamily.medium }}>Client ledgers, monthly reports, and summaries.</Text>
                  </View>
                </View>
                <ChevronRight color={theme.primary} size={16} />
              </TouchableOpacity>

              {/* Excel statement pill */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate("ExportExcel")}
                className="flex-row items-center justify-between rounded-2xl border p-4 bg-card"
                style={{ borderColor: theme.border, ...theme.shadowSoft }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: mode === "light" ? "#ebf7f3" : "rgba(27, 125, 98, 0.08)" }}>
                    <FileSpreadsheet color={theme.success} size={18} />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Export to Excel Sheet</Text>
                    <Text className="text-[10px] text-muted mt-0.5" style={{ fontFamily: fontFamily.medium }}>Download standard spreadsheet format accounts.</Text>
                  </View>
                </View>
                <ChevronRight color={theme.success} size={16} />
              </TouchableOpacity>
            </View>

            {/* --- Advanced Professional Charts --- */}
            
            {/* Chart 1: Curved Bezier Cash Flow Volume (Trend) */}
            <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
              <View className="mb-4 flex-row items-center gap-3">
                <TrendingUp color={theme.primary} size={18} />
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Monthly Cash Flow Volume</Text>
              </View>
              {monthly.length ? (
                <LineChart
                  data={{
                    labels: monthly.map((item) => item.month.slice(5)),
                    datasets: [
                      {
                        data: monthly.map((item) => (item.given || 0) + (item.paid || 0)),
                        color: () => theme.primary,
                        strokeWidth: 2,
                      },
                      {
                        data: monthly.map((item) => (item.received || 0) + (item.taken || 0)),
                        color: () => theme.success,
                        strokeWidth: 2,
                      }
                    ],
                    legend: ["Cash Outflow", "Cash Inflow"]
                  }}
                  width={width - 24}
                  height={200}
                  yAxisLabel="Rs "
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 16 }}
                />
              ) : (
                <EmptyState title="No cash flow data" subtitle="Loans register hote hi trend graph ban jayega." />
              )}
            </View>

            {/* Chart 2: Double-Ring Repayment Progress Chart */}
            <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
              <View className="mb-2 flex-row items-center gap-3">
                <Scale color={theme.success} size={18} />
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Repayment & Recovery Rate</Text>
              </View>
              <Text className="text-xs text-muted mb-4" style={{ fontFamily: fontFamily.medium }}>Percentage of funds returned back vs active outstanding.</Text>
              
              {recoveryRate > 0 || repaymentRate > 0 ? (
                <ProgressChart
                  data={{
                    labels: ["Recovered (Lene)", "Paid Back (Dene)"],
                    data: [recoveryRate, repaymentRate]
                  }}
                  width={width - 24}
                  height={170}
                  strokeWidth={12}
                  radius={28}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1, index) => 
                      index === 0 
                        ? `rgba(27, 125, 98, ${opacity})` // Recovery in green
                        : `rgba(243, 111, 86, ${opacity})` // Repayment in primary/coral
                  }}
                  hideLegend={false}
                  style={{ borderRadius: 16 }}
                />
              ) : (
                <EmptyState title="No transactions recorded" subtitle="Transactions add hone par repayments metrics dikhegi." />
              )}
            </View>

            {/* Chart 3: Debt Distribution Pie Chart */}
            <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
              <View className="mb-4 flex-row items-center gap-3">
                <Scale color={theme.primary} size={18} />
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Active Debt Distribution</Text>
              </View>
              {distributionData.length > 0 ? (
                <PieChart
                  data={distributionData}
                  width={width - 24}
                  height={160}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="8"
                  absolute
                />
              ) : (
                <EmptyState title="No outstanding balance" subtitle="All loan accounts are settled." />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};
