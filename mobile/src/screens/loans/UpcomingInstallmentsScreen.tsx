import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "UpcomingInstallments">;

export const UpcomingInstallmentsScreen = (_props: Props) => {
  const { theme } = useAppTheme();
  const upcomingQuery = useQuery({
    queryKey: ["installments", "upcoming"],
    queryFn: api.getUpcomingInstallments,
  });

  if (upcomingQuery.isLoading) return <Screen><LoadingState label="Loading upcoming installments..." /></Screen>;
  if (upcomingQuery.isError) {
    return <Screen><ErrorState message="Upcoming installments load nahi ho sake." onRetry={upcomingQuery.refetch} /></Screen>;
  }

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Upcoming Installments</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Upcoming aur overdue installment view.</Text>
      </View>

      <View className="mt-6 gap-3">
        {upcomingQuery.data?.length ? upcomingQuery.data.map((installment) => (
          <View key={installment._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row justify-between gap-3">
              <View className="flex-1">
                <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 16 }}>
                  Installment #{installment.installmentNumber}
                </Text>
                <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 5 }}>
                  Due {formatDate(installment.dueDate)}
                </Text>
              </View>
              <Text className="text-base font-black text-dark">{formatCurrency(installment.remainingAmount)}</Text>
            </View>
            <Text className="mt-3 text-xs font-black uppercase text-muted">{installment.status}</Text>
          </View>
        )) : (
          <EmptyState title="No upcoming installments" subtitle="Installment loans yahan show honge." />
        )}
      </View>
    </Screen>
  );
};
