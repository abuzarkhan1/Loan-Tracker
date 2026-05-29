import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Plus } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Installment } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { showAlert } from "../../providers/AlertProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "InstallmentSchedule">;

const statusColor = (installment: Installment, theme: ReturnType<typeof useAppTheme>["theme"]) => {
  if (installment.status === "PAID") return theme.success;
  if (installment.status === "OVERDUE") return theme.danger;
  if (installment.status === "PARTIAL") return theme.warning;
  return theme.primary;
};

export const InstallmentScheduleScreen = ({ route }: Props) => {
  const { loanId } = route.params;
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const installmentsQuery = useQuery({
    queryKey: ["installments", loanId],
    queryFn: () => api.getLoanInstallments(loanId),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateInstallments(loanId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
    },
  });

  const payMutation = useMutation({
    mutationFn: (installment: Installment) =>
      api.payInstallment(installment._id, {
        amount: installment.remainingAmount,
        method: "CASH",
        note: `Installment #${installment.installmentNumber}`,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const confirmPay = (installment: Installment) => {
    showAlert({
      title: "Pay installment",
      message: `${formatCurrency(installment.remainingAmount)} add karni hai?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Pay", onPress: () => payMutation.mutate(installment) },
      ],
    });
  };

  if (installmentsQuery.isLoading) return <Screen><LoadingState label="Loading schedule..." /></Screen>;
  if (installmentsQuery.isError) {
    return <Screen><ErrorState message="Installment schedule load nahi ho saka." onRetry={installmentsQuery.refetch} /></Screen>;
  }

  const installments = installmentsQuery.data || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Installment Schedule</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Due date, expected amount, aur status.</Text>
      </View>

      <View className="mt-6">
        <AppButton title="Generate Schedule" icon={Plus} loading={generateMutation.isPending} onPress={() => generateMutation.mutate()} />
      </View>

      <View className="mt-5 gap-3">
        {installments.length ? installments.map((installment) => (
          <View key={installment._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 16 }}>
                  Installment #{installment.installmentNumber}
                </Text>
                <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 5 }}>
                  Due {formatDate(installment.dueDate)}
                </Text>
              </View>
              <View style={{ borderRadius: 999, backgroundColor: theme.backgroundSoft, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: statusColor(installment, theme), fontFamily: fontFamily.extraBold, fontSize: 11 }}>
                  {installment.status}
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row justify-between">
              <Text className="text-sm font-semibold text-muted">Expected {formatCurrency(installment.expectedAmount)}</Text>
              <Text className="text-sm font-semibold text-muted">Baqi {formatCurrency(installment.remainingAmount)}</Text>
            </View>

            {installment.remainingAmount > 0 ? (
              <View className="mt-4">
                <AppButton
                  title="Pay Now"
                  icon={CalendarClock}
                  variant="secondary"
                  loading={payMutation.isPending}
                  onPress={() => confirmPay(installment)}
                />
              </View>
            ) : (
              <View className="mt-4 flex-row items-center gap-2">
                <CheckCircle2 color={theme.success} size={18} />
                <Text className="text-sm font-bold text-success">Paid</Text>
              </View>
            )}
          </View>
        )) : (
          <EmptyState title="No schedule yet" subtitle="Generate Schedule se installments create karein." />
        )}
      </View>
    </Screen>
  );
};
