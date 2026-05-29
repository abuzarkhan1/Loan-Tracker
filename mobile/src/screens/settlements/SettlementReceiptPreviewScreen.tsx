import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Mail, ReceiptText, Share2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Contact, Loan, Receipt } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { shareText } from "../../utils/share";

type Props = NativeStackScreenProps<RootStackParamList, "SettlementReceiptPreview">;

const contactName = (value: string | Contact) => (typeof value === "object" ? value.name : "Contact");
const loanAmount = (value: string | Loan) => (typeof value === "object" ? value.amount : 0);
const receiptId = (value?: string | Receipt) => (typeof value === "object" ? value._id : value);

export const SettlementReceiptPreviewScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const { settlementId } = route.params;
  const settlementQuery = useQuery({ queryKey: ["settlements", settlementId], queryFn: () => api.getSettlement(settlementId) });

  if (settlementQuery.isLoading) return <Screen><LoadingState label="Loading settlement receipt..." /></Screen>;
  if (settlementQuery.isError || !settlementQuery.data) {
    return <Screen><ErrorState message="Settlement receipt load nahi ho saka." onRetry={settlementQuery.refetch} /></Screen>;
  }

  const settlement = settlementQuery.data;
  const message = [
    `Settlement Confirmation - ${contactName(settlement.contactId)}`,
    `Settlement No: ${settlement.settlementNumber}`,
    `Loan Amount: ${formatCurrency(loanAmount(settlement.loanId) || settlement.finalAmount)}`,
    `Paid Amount: ${formatCurrency(settlement.paidAmount)}`,
    `Remaining: ${formatCurrency(settlement.remainingAmountAtSettlement)}`,
    `Status: ${settlement.status}`,
    settlement.settledAt ? `Settled At: ${formatDate(settlement.settledAt)}` : undefined,
  ].filter(Boolean).join("\n");

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Settlement Receipt</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Final closing confirmation.</Text>
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-black uppercase text-muted">{settlement.settlementNumber}</Text>
            <Text className="mt-2 text-2xl font-black text-dark">{contactName(settlement.contactId)}</Text>
            <Text className="mt-2 text-sm font-semibold text-muted">
              {settlement.settledAt ? formatDate(settlement.settledAt) : formatDate(settlement.createdAt)}
            </Text>
          </View>
          <StatusBadge value={settlement.status} />
        </View>

        <View className="mt-6 rounded-2xl bg-background-soft p-4">
          <Text className="text-xs font-black uppercase text-muted">Final Amount</Text>
          <Text className="mt-1 text-3xl font-black text-primary">{formatCurrency(settlement.finalAmount)}</Text>
          <Text className="mt-3 text-sm font-semibold text-muted">Paid: {formatCurrency(settlement.paidAmount)}</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">Remaining at settlement: {formatCurrency(settlement.remainingAmountAtSettlement)}</Text>
        </View>

        {settlement.settlementNote ? <Text className="mt-4 text-sm font-medium leading-6 text-muted">{settlement.settlementNote}</Text> : null}
      </View>

      <View className="gap-3">
        {receiptId(settlement.receiptId) ? (
          <AppButton
            title="View Generated Receipt"
            icon={ReceiptText}
            variant="secondary"
            onPress={() => navigation.navigate("ReceiptPreview", { receiptId: receiptId(settlement.receiptId)! })}
          />
        ) : null}
        <AppButton title="Share Settlement" icon={Share2} onPress={() => void shareText(message)} />
        <AppButton
          title="Send Email"
          icon={Mail}
          variant="secondary"
          onPress={() => navigation.navigate("SendEmail", { kind: "SETTLEMENT_CONFIRMATION", settlementId })}
        />
      </View>
    </Screen>
  );
};
