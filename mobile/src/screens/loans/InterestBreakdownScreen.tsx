import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Percent } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { SummaryCard } from "../../components/SummaryCard";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "InterestBreakdown">;

export const InterestBreakdownScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const { loanId } = route.params;
  const previewQuery = useQuery({
    queryKey: ["interest-preview", loanId],
    queryFn: () => api.getInterestPreview(loanId),
  });

  if (previewQuery.isLoading) return <Screen><LoadingState label="Loading interest..." /></Screen>;
  if (previewQuery.isError || !previewQuery.data) {
    return <Screen><ErrorState message="Interest breakdown load nahi ho saka." onRetry={previewQuery.refetch} /></Screen>;
  }

  const preview = previewQuery.data;

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Interest Breakdown</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Principal aur interest clearly separated.</Text>
      </View>

      <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
        <SummaryCard label="Principal" value={formatCurrency(preview.principalAmount)} icon={Percent} tone="primary" />
        <SummaryCard label="Interest" value={formatCurrency(preview.interestAmount)} icon={Percent} tone="warning" />
        <SummaryCard label="Total Payable" value={formatCurrency(preview.totalPayableAmount)} icon={Percent} tone="success" />
        <SummaryCard label="Remaining" value={formatCurrency(preview.remainingAmount)} icon={Percent} tone="danger" />
      </View>

      <View className="mt-6 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Details</Text>
        <Text className="mt-3 text-sm font-semibold text-muted">Type: {preview.interestType}</Text>
        <Text className="mt-2 text-sm font-semibold text-muted">Rate: {preview.interestRate}%</Text>
        <Text className="mt-2 text-sm font-semibold text-muted">Paid: {formatCurrency(preview.paidAmount)}</Text>
      </View>
    </Screen>
  );
};
