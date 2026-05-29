import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

export const PaymentMethodsReportScreen = () => {
  const { theme } = useAppTheme();
  const reportQuery = useQuery({ queryKey: ["reports", "payment-methods"], queryFn: () => api.getPaymentMethodsReport() });

  if (reportQuery.isLoading) return <Screen><LoadingState label="Loading payment methods..." /></Screen>;
  if (reportQuery.isError) return <Screen><ErrorState message="Payment methods load nahi ho sake." onRetry={reportQuery.refetch} /></Screen>;

  const rows = reportQuery.data || [];
  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Payment Methods</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Cash, bank aur wallet breakdown.</Text>
      <View className="mt-5 gap-3">
        {rows.some((row) => row.count > 0) ? rows.map((row) => (
          <View key={row.method} className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
              <CreditCard color={theme.primary} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-dark">{row.method}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{row.count} payments</Text>
            </View>
            <Text className="text-sm font-black text-primary">{formatCurrency(row.amount)}</Text>
          </View>
        )) : (
          <EmptyState title="No payment methods yet" subtitle="Payments add hon gi to breakdown banega." />
        )}
      </View>
    </Screen>
  );
};
