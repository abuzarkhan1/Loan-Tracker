import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Landmark } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { SummaryCard } from "../../components/SummaryCard";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ContactLedger">;

export const ContactLedgerScreen = ({ route }: Props) => {
  const { contactId } = route.params;
  const { theme } = useAppTheme();
  const ledgerQuery = useQuery({
    queryKey: ["contact-ledger", contactId],
    queryFn: () => api.getContactLedger(contactId),
  });

  if (ledgerQuery.isLoading) return <Screen><LoadingState label="Loading ledger..." /></Screen>;
  if (ledgerQuery.isError || !ledgerQuery.data) {
    return <Screen><ErrorState message="Ledger load nahi ho saka." onRetry={ledgerQuery.refetch} /></Screen>;
  }

  const { contact, summary, timeline } = ledgerQuery.data;

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{contact.name} Ledger</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Complete hisaab aur transaction timeline.</Text>
      </View>

      <View className="mt-6 flex-row flex-wrap justify-between gap-y-3">
        <SummaryCard label="Total Diya" value={formatCurrency(summary.totalGiven)} icon={Landmark} tone="success" />
        <SummaryCard label="Total Liya" value={formatCurrency(summary.totalTaken)} icon={Landmark} tone="danger" />
        <SummaryCard label="Wapis Mila" value={formatCurrency(summary.totalReceivedBack)} icon={Landmark} tone="primary" />
        <SummaryCard label="Wapis Diya" value={formatCurrency(summary.totalPaidBack)} icon={Landmark} tone="warning" />
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Net Balance</Text>
        <Text className="mt-2 text-3xl font-black text-dark">{formatCurrency(summary.overallBalance)}</Text>
        <Text className="mt-2 text-sm font-semibold text-muted">
          Active {summary.activeLoans} · Completed {summary.completedLoans} · Overdue {summary.overdueLoans}
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-black text-dark">Transaction Timeline</Text>
      </View>

      <View className="mt-4 gap-3">
        {timeline.length ? timeline.map((item) => (
          <View key={`${item.kind}-${item.id}`} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="flex-row justify-between gap-3">
              <View className="flex-1">
                <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 15 }}>
                  {item.kind === "LOAN" ? "Loan" : "Payment"} · {item.type}
                </Text>
                <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 5 }}>
                  {formatDate(item.date)}
                </Text>
              </View>
              <Text className="text-base font-black text-dark">{formatCurrency(item.amount)}</Text>
            </View>
            {item.status ? <Text className="mt-2 text-xs font-black uppercase text-muted">{item.status}</Text> : null}
            {item.method ? <Text className="mt-2 text-xs font-black uppercase text-muted">{item.method}</Text> : null}
            {item.description || item.note ? (
              <Text className="mt-2 text-sm font-medium text-muted">{item.description || item.note}</Text>
            ) : null}
          </View>
        )) : (
          <EmptyState title="No ledger activity" subtitle="Loans aur payments timeline yahan show hogi." />
        )}
      </View>
    </Screen>
  );
};
