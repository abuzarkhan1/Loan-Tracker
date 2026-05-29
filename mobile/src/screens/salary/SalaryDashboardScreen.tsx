import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CalendarDays, CheckCircle2, ClipboardList, Settings2, WalletCards } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { MoneySummaryCard } from "../../components/MoneySummaryCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const SalaryDashboardScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["salary", "dashboard"], queryFn: api.getSalaryDashboard });
  const currentEntryQuery = useQuery({ queryKey: ["salary", "current-entry"], queryFn: api.getCurrentCycleSalaryEntry });
  const markReceivedMutation = useMutation({
    mutationFn: (entryId: string) => api.markSalaryReceived(entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["salary"] });
      await queryClient.invalidateQueries({ queryKey: ["finance"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  if (dashboardQuery.isLoading) return <Screen><LoadingState label="Loading salary dashboard..." /></Screen>;
  if (dashboardQuery.isError) return <Screen><ErrorState message="Salary dashboard load nahi ho saka." onRetry={dashboardQuery.refetch} /></Screen>;

  const data = dashboardQuery.data;
  if (!data?.hasProfile) {
    return (
      <Screen className="gap-5 pt-5">
        <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary</Text>
        <EmptyState title="Salary profile not set" subtitle="Apni salary day aur cycle set karein taake app cash flow properly calculate kare." />
        <AppButton title="Setup Salary" icon={Banknote} onPress={() => navigation.navigate("SalarySetup")} />
      </Screen>
    );
  }

  const currentEntry = currentEntryQuery.data;

  return (
    <Screen className="gap-5 pt-5">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Salary</Text>
          <Text className="mt-1 text-sm font-medium text-muted">
            {formatDate(data.cycleStartDate)} - {formatDate(data.cycleEndDate)}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => navigation.navigate("SalarySettings")}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card"
          style={theme.shadowSoft}
        >
          <Settings2 color={theme.primary} size={21} />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3">
        <MoneySummaryCard title="Received" value={formatCurrency(data.salaryReceived)} subtitle={`Expected ${formatCurrency(data.expectedSalary)}`} icon={Banknote} tone="success" />
        <MoneySummaryCard title="Remaining Cash" value={formatCurrency(data.availableCash)} icon={WalletCards} tone="primary" />
      </View>
      <View className="flex-row gap-3">
        <MoneySummaryCard title="Expenses" value={formatCurrency(data.totalExpenses)} icon={ClipboardList} tone="danger" />
        <MoneySummaryCard title="Savings Estimate" value={formatCurrency(data.savingsEstimate)} icon={CheckCircle2} tone="success" />
      </View>

      {currentEntry?.status === "EXPECTED" ? (
        <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
          <Text className="text-base font-black text-dark">Expected Salary</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">{formatCurrency(currentEntry.amount)} due on {formatDate(currentEntry.salaryDate)}</Text>
          <View className="mt-4">
            <AppButton
              title="Mark Received"
              icon={CheckCircle2}
              loading={markReceivedMutation.isPending}
              onPress={() => navigation.navigate("MarkSalaryReceived", { entryId: currentEntry._id })}
            />
          </View>
          {markReceivedMutation.isError ? <Text className="mt-3 text-sm font-semibold text-danger">{getErrorMessage(markReceivedMutation.error)}</Text> : null}
        </View>
      ) : null}

      <View className="gap-3">
        <AppButton title="Salary Entries" icon={ClipboardList} variant="secondary" onPress={() => navigation.navigate("SalaryEntries")} />
        <AppButton title="Cycle Detail" icon={CalendarDays} variant="secondary" onPress={() => navigation.navigate("SalaryCycleDetail")} />
        <AppButton title="Salary Allocation" icon={WalletCards} variant="secondary" onPress={() => navigation.navigate("SalaryAllocation")} />
      </View>
    </Screen>
  );
};
