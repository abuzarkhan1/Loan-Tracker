import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const OverdueReportScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const reportQuery = useQuery({ queryKey: ["reports", "overdue"], queryFn: () => api.getOverdueReport() });

  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading overdue report..." /></Screen>;
  if (reportQuery.isError || !reportQuery.data) return <Screen><ErrorState message="Overdue report load nahi ho saka." onRetry={reportQuery.refetch} /></Screen>;

  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Overdue Report</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Total overdue {formatCurrency(reportQuery.data.totalOverdueAmount)}</Text>

      <View className="mt-5 gap-3">
        {reportQuery.data.overdueLoans.length ? reportQuery.data.overdueLoans.map((loan) => (
          <TouchableOpacity
            key={loan._id}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("LoanDetail", { loanId: loan._id })}
            className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4"
            style={theme.shadowSoft}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
              <AlertTriangle color={theme.danger} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-dark">{formatCurrency(loan.remainingAmount)}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{loan.overdueDays} days overdue - due {formatDate(loan.dueDate)}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <EmptyState title="No overdue loans" subtitle="Aapka overdue report clear hai." />
        )}
      </View>
    </Screen>
  );
};
