import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

export const PaymentMethodBreakdownScreen = () => {
  const { theme } = useAppTheme();
  const breakdownQuery = useQuery({ queryKey: ["finance", "payment-method-breakdown"], queryFn: () => api.getFinancePaymentMethodBreakdown() });

  if (breakdownQuery.isLoading) return <Screen><LoadingState label="Loading payment method breakdown..." /></Screen>;
  if (breakdownQuery.isError) return <Screen><ErrorState message="Payment method breakdown load nahi ho saka." onRetry={breakdownQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Payment Method Breakdown</Text>
      <View className="gap-3">
        {breakdownQuery.data?.some((item) => item.transactionCount > 0) ? breakdownQuery.data.map((item) => (
          <View key={item.paymentMethod} className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
                <CreditCard color={theme.primary} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-dark">{item.paymentMethod}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{item.transactionCount} transactions</Text>
              </View>
              <Text className="text-sm font-black text-primary">{formatCurrency(item.net)}</Text>
            </View>
            <View className="mt-4 flex-row border-t border-border pt-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-muted">Inflow</Text>
                <Text className="mt-1 text-sm font-black text-dark">{formatCurrency(item.inflow)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-muted">Outflow</Text>
                <Text className="mt-1 text-sm font-black text-dark">{formatCurrency(item.outflow)}</Text>
              </View>
            </View>
          </View>
        )) : <EmptyState title="No payment method data" subtitle="Transactions add hon gi to breakdown banega." />}
      </View>
    </Screen>
  );
};
