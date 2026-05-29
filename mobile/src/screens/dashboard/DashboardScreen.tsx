import { useMemo } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Landmark, 
  Plus, 
  ReceiptText, 
  Scale, 
  Users, 
  TrendingUp, 
  Activity, 
  Sparkles 
} from "lucide-react-native";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
const screenWidth = Dimensions.get("window").width;

export const DashboardScreen = () => {
  const { theme, mode } = useAppTheme();
  const navigation = useNavigation<Navigation>();

  // Fetch summary, charts, top contacts, and me
  const summaryQuery = useQuery({ 
    queryKey: ["dashboard", "summary"], 
    queryFn: () => api.getSummary() 
  });
  const monthlyQuery = useQuery({ 
    queryKey: ["dashboard", "monthly"], 
    queryFn: () => api.getMonthlyChart(6) 
  });
  const topContactsQuery = useQuery({ 
    queryKey: ["dashboard", "topContacts"], 
    queryFn: () => api.getTopContacts(5) 
  });
  const meQuery = useQuery({ 
    queryKey: ["auth", "me"], 
    queryFn: () => api.me() 
  });

  const loading = summaryQuery.isLoading || monthlyQuery.isLoading || topContactsQuery.isLoading || meQuery.isLoading;
  const failed = summaryQuery.isError || monthlyQuery.isError || topContactsQuery.isError || meQuery.isError;

  const summary = summaryQuery.data;
  const monthly = monthlyQuery.data || [];

  // 1. Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

  const handleRetry = () => {
    summaryQuery.refetch();
    monthlyQuery.refetch();
    topContactsQuery.refetch();
    meQuery.refetch();
  };

  return (
    <Screen className="pt-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* --- Header Section with Profile Initial --- */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-muted uppercase tracking-wider" style={{ fontFamily: fontFamily.bold }}>
              {greeting},
            </Text>
            <Text className="text-2xl font-black text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>
              {meQuery.data?.name || "Welcome back"} 👋
            </Text>
          </View>
          <View 
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-card" 
            style={theme.shadowSoft}
          >
            <Text className="text-sm font-black text-primary" style={{ fontFamily: fontFamily.extraBold }}>
              {(meQuery.data?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="mt-12">
            <LoadingState label="Loading wealth portfolio..." />
          </View>
        ) : null}

        {failed ? (
          <View className="mt-12">
            <ErrorState message="Dashboard load nahi ho saka." onRetry={handleRetry} />
          </View>
        ) : null}

        {summary && !loading && !failed ? (
          <View className="mt-6 gap-6">
            {/* --- Premium Wealth Portfolio Hero Card --- */}
            <View 
              className="rounded-3xl border p-5 relative overflow-hidden"
              style={{
                backgroundColor: mode === "light" ? "#1a1625" : theme.card,
                borderColor: theme.border,
                ...theme.shadowSoft
              }}
            >
              {/* Soft decorative visual gradient shape */}
              <View 
                className="absolute -right-20 -top-20 h-44 w-44 rounded-full opacity-10"
                style={{ backgroundColor: theme.primary }}
              />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: fontFamily.bold, color: "#fff7ef" }}>
                    Net Wealth Portfolio
                  </Text>
                  <Text 
                    className="text-3xl font-black mt-1 text-white" 
                    style={{ fontFamily: fontFamily.extraBold }}
                  >
                    {formatCurrency(summary.overallBalance)}
                  </Text>
                </View>
                <View 
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(243, 111, 86, 0.15)" }}
                >
                  <Scale color={theme.primary} size={22} />
                </View>
              </View>

              {/* Outstanding Receivable vs Payable splits */}
              <View className="mt-6 flex-row border-t border-muted/20 pt-4 justify-between">
                <View className="flex-1 flex-row items-center gap-2">
                  <ArrowDownLeft color={theme.success} size={18} />
                  <View>
                    <Text className="text-[9px] font-bold uppercase opacity-60" style={{ fontFamily: fontFamily.bold, color: "#fff7ef" }}>Lene Hain</Text>
                    <Text className="text-sm font-extrabold text-white mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.netReceivable)}</Text>
                  </View>
                </View>
                <View className="flex-1 flex-row items-center gap-2 border-l border-muted/20 pl-4">
                  <ArrowUpRight color={theme.danger} size={18} />
                  <View>
                    <Text className="text-[9px] font-bold uppercase opacity-60" style={{ fontFamily: fontFamily.bold, color: "#fff7ef" }}>Dene Hain</Text>
                    <Text className="text-sm font-extrabold text-white mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.netPayable)}</Text>
                  </View>
                </View>
              </View>

              {/* Inside Card Quick Action Button */}
              <View className="mt-5 flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("LoanForm")}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 bg-primary"
                >
                  <Plus color={theme.white} size={14} />
                  <Text className="text-xs font-extrabold text-white" style={{ fontFamily: fontFamily.bold }}>
                    Add Transaction
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* --- Logically Clustered Metrics --- */}

            {/* Section 1: Active Loan Status Cluster */}
            <View className="flex-row justify-between gap-3">
              <View className="flex-1 border border-border bg-card rounded-2xl p-3.5 items-center" style={theme.shadowSoft}>
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-background-soft mb-2">
                  <Activity color={theme.primary} size={15} />
                </View>
                <Text className="text-[9px] font-bold text-muted uppercase text-center" style={{ fontFamily: fontFamily.bold }}>Active Loans</Text>
                <Text className="text-sm font-extrabold text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{summary.activeLoans}</Text>
              </View>

              <View className="flex-1 border border-border bg-card rounded-2xl p-3.5 items-center" style={theme.shadowSoft}>
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-peach mb-2">
                  <Users color={theme.danger} size={15} />
                </View>
                <Text className="text-[9px] font-bold text-muted uppercase text-center" style={{ fontFamily: fontFamily.bold }}>Overdue</Text>
                <Text className="text-sm font-extrabold text-danger mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{summary.overdueLoans}</Text>
              </View>

              <View className="flex-1 border border-border bg-card rounded-2xl p-3.5 items-center" style={theme.shadowSoft}>
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-mint mb-2">
                  <Sparkles color={theme.success} size={15} />
                </View>
                <Text className="text-[9px] font-bold text-muted uppercase text-center" style={{ fontFamily: fontFamily.bold }}>Settled</Text>
                <Text className="text-sm font-extrabold text-success mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{summary.completedLoans}</Text>
              </View>
            </View>

            {/* Section 2: Lifetime Cash Flows Highlights */}
            <View className="flex-row justify-between gap-3">
              <View className="flex-1 border border-border bg-card rounded-2xl p-4 flex-row items-center gap-3" style={theme.shadowSoft}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
                  <ReceiptText color={theme.success} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-bold text-muted uppercase" style={{ fontFamily: fontFamily.bold }}>Total Recovered</Text>
                  <Text className="text-xs font-extrabold text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.totalReceivedBack)}</Text>
                </View>
              </View>

              <View className="flex-1 border border-border bg-card rounded-2xl p-4 flex-row items-center gap-3" style={theme.shadowSoft}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-peach">
                  <Landmark color={theme.danger} size={16} />
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-bold text-muted uppercase" style={{ fontFamily: fontFamily.bold }}>Total Paid Back</Text>
                  <Text className="text-xs font-extrabold text-dark mt-0.5" style={{ fontFamily: fontFamily.extraBold }}>{formatCurrency(summary.totalPaidBack)}</Text>
                </View>
              </View>
            </View>

            {/* --- Premium Styled Monthly Flow Chart Card --- */}
            <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <TrendingUp color={theme.primary} size={18} />
                  <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Monthly Volume Trend</Text>
                </View>
                <View className="rounded-full bg-background-soft px-3 py-1">
                  <Text className="text-[10px] font-bold text-muted" style={{ fontFamily: fontFamily.bold }}>6 Months</Text>
                </View>
              </View>
              {monthly.length ? (
                <LineChart
                  data={{
                    labels: monthly.map((item) => item.month.slice(5)),
                    datasets: [
                      {
                        data: monthly.map((item) => item.given + item.taken),
                        color: () => theme.primary,
                        strokeWidth: 3,
                      },
                      {
                        data: monthly.map((item) => item.received + item.paid),
                        color: () => theme.success,
                        strokeWidth: 3,
                      },
                    ],
                    legend: ["Loans Volume", "Payments Volume"],
                  }}
                  width={screenWidth - 56}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: 16 }}
                />
              ) : (
                <EmptyState title="No chart data yet" subtitle="Naya loan ya payment add karte hi graph ban jayega." />
              )}
            </View>

            {/* --- Horizontal Top Active Clients Slider --- */}
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-dark" style={{ fontFamily: fontFamily.bold }}>Top Active Clients</Text>
                <TouchableOpacity onPress={() => navigation.navigate("MainTabs", { screen: "Contacts" } as any)}>
                  <Text className="text-xs font-bold text-primary" style={{ fontFamily: fontFamily.bold }}>View All</Text>
                </TouchableOpacity>
              </View>

              {topContactsQuery.data?.length ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingVertical: 4 }}
                >
                  {topContactsQuery.data.map((contact) => {
                    const initial = contact.contactName.trim().charAt(0).toUpperCase();
                    const balance = contact.overallBalance || 0;
                    
                    return (
                      <TouchableOpacity
                        key={contact.contactId}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate("ContactLedger", { contactId: contact.contactId })}
                        className="border bg-card rounded-2xl p-4 items-center justify-between"
                        style={{ 
                          borderColor: theme.border, 
                          width: 136,
                          minHeight: 144,
                          ...theme.shadowSoft 
                        }}
                      >
                        {/* Contact Initial Avatar */}
                        <View
                          className="h-11 w-11 items-center justify-center rounded-full"
                          style={{ backgroundColor: mode === "light" ? "#fff7ef" : "#2b2631" }}
                        >
                          <Text className="text-base font-extrabold text-primary" style={{ fontFamily: fontFamily.extraBold }}>
                            {initial}
                          </Text>
                        </View>

                        {/* Client Name */}
                        <Text 
                          numberOfLines={1} 
                          className="text-xs font-bold text-dark mt-3 text-center" 
                          style={{ fontFamily: fontFamily.bold }}
                        >
                          {contact.contactName}
                        </Text>

                        {/* Balance Status */}
                        <View className="mt-2">
                          <Text 
                            className="text-xs font-extrabold text-center" 
                            style={{ 
                              fontFamily: fontFamily.extraBold,
                              color: balance > 0 
                                ? theme.success 
                                : balance < 0 
                                  ? theme.danger 
                                  : theme.muted 
                            }}
                          >
                            {balance > 0 ? "+" : ""}{formatCurrency(balance)}
                          </Text>
                          <Text className="text-[8px] font-bold text-muted text-center mt-0.5" style={{ fontFamily: fontFamily.bold }}>
                            {contact.loanCount} loan{contact.loanCount > 1 ? "s" : ""}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <EmptyState title="No active clients yet" subtitle="Lend or borrow money to start logs." />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};
