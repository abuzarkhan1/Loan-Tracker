import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ContactTrustReport">;

export const ContactTrustReportScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const { contactId } = route.params;
  const trustQuery = useQuery({ queryKey: ["contact", contactId, "trust"], queryFn: () => api.getContactTrustProfile(contactId) });

  if (trustQuery.isLoading) return <Screen><LoadingState label="Loading trust report..." /></Screen>;
  if (trustQuery.isError || !trustQuery.data) {
    return <Screen><ErrorState message="Trust report load nahi ho saka." onRetry={trustQuery.refetch} /></Screen>;
  }

  const trust = trustQuery.data;
  return (
    <Screen className="pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <ShieldCheck color={theme.primaryDark} size={28} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark">{trust.label}</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Trust Score {trust.trustScore}/100</Text>
          </View>
        </View>
        <View className="mt-5">
          <ProgressBar progress={trust.trustScore} />
        </View>
        <Text className="mt-5 text-sm font-medium leading-6 text-muted">{trust.summary}</Text>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-3">
        {[
          ["Total Dealings", formatCurrency(trust.totalDealingAmount)],
          ["Completed", String(trust.completedLoans)],
          ["Active", String(trust.activeLoans)],
          ["Overdue", String(trust.overdueLoans)],
          ["Avg Repayment", `${trust.averageRepaymentDays || 0} days`],
          ["On-time Rate", `${trust.onTimePaymentRate}%`],
          ["Last Payment", formatDate(trust.lastPaymentDate)],
        ].map(([label, value]) => (
          <View key={label} className="w-[47%] rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <Text className="text-[10px] font-black uppercase text-muted" style={{ fontFamily: fontFamily.bold }}>{label}</Text>
            <Text className="mt-2 text-base font-black text-dark">{value}</Text>
          </View>
        ))}
      </View>

      <View className="mt-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-black text-dark">Recommendations</Text>
        <View className="mt-4 gap-3">
          {trust.recommendations.map((item) => (
            <Text key={item} className="text-sm font-semibold leading-6 text-muted">- {item}</Text>
          ))}
        </View>
      </View>
    </Screen>
  );
};
