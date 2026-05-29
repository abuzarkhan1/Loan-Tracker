import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ReceiptText, Save } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { Contact } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SettlementConfirmation">;

const contactName = (value: string | Contact) => (typeof value === "object" ? value.name : "Contact");

export const SettlementConfirmationScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { loanId } = route.params;
  const [settlementNote, setSettlementNote] = useState("");
  const loanQuery = useQuery({ queryKey: ["loan", loanId, "settlement"], queryFn: () => api.getLoan(loanId) });
  const settlementQuery = useQuery({ queryKey: ["settlement", "loan", loanId], queryFn: () => api.getLoanSettlement(loanId) });

  const mutation = useMutation({
    mutationFn: () => api.createSettlement(loanId, { settlementNote }),
    onSuccess: async (settlement) => {
      await queryClient.invalidateQueries({ queryKey: ["settlements"] });
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      navigation.replace("SettlementReceiptPreview", { settlementId: settlement._id });
    },
  });

  if (loanQuery.isLoading || settlementQuery.isLoading) return <Screen><LoadingState label="Checking settlement..." /></Screen>;
  if (loanQuery.isError || !loanQuery.data) {
    return <Screen><ErrorState message="Settlement details load nahi ho sake." onRetry={loanQuery.refetch} /></Screen>;
  }

  const loan = loanQuery.data.loan;
  const existingSettlement = settlementQuery.data;
  const canSettle = loan.remainingAmount === 0 && loan.status === "COMPLETED";

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Settlement</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Completed loan ko professionally close karein.</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-black uppercase text-muted">Contact</Text>
            <Text className="mt-1 text-xl font-black text-dark">{contactName(loan.contactId)}</Text>
            <Text className="mt-3 text-xs font-black uppercase text-muted">Loan Amount</Text>
            <Text className="mt-1 text-2xl font-black text-primary">{formatCurrency(loan.amount)}</Text>
          </View>
          <StatusBadge value={loan.status} />
        </View>

        <View className="mt-5 flex-row justify-between rounded-lg bg-background-soft p-4">
          <View>
            <Text className="text-xs font-bold uppercase text-muted">Paid</Text>
            <Text className="mt-1 text-base font-black text-success">{formatCurrency(loan.paidAmount)}</Text>
          </View>
          <View>
            <Text className="text-xs font-bold uppercase text-muted">Remaining</Text>
            <Text className="mt-1 text-base font-black text-danger">{formatCurrency(loan.remainingAmount)}</Text>
          </View>
        </View>

        {existingSettlement ? (
          <View className="mt-5 rounded-lg border border-border bg-background-soft p-4">
            <View className="flex-row items-center gap-3">
              <CheckCircle2 color={theme.success} size={20} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-dark">Already Settled</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{existingSettlement.settlementNumber}</Text>
              </View>
            </View>
            <View className="mt-4">
              <AppButton
                title="View Settlement Receipt"
                icon={ReceiptText}
                variant="secondary"
                onPress={() => navigation.navigate("SettlementReceiptPreview", { settlementId: existingSettlement._id })}
              />
            </View>
          </View>
        ) : null}
      </View>

      {!existingSettlement ? (
        <View className="gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Settlement Note</Text>
            <TextInput
              value={settlementNote}
              onChangeText={setSettlementNote}
              placeholder="Optional closing note"
              placeholderTextColor={theme.placeholder}
              multiline
              style={{
                minHeight: 110,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
                fontFamily: fontFamily.semiBold,
                fontSize: 15,
                paddingHorizontal: 18,
                paddingVertical: 14,
                textAlignVertical: "top",
              }}
            />
          </View>

          {!canSettle ? (
            <Text className="text-sm font-semibold text-danger">
              Settlement se pehle final payment add karein. Remaining amount zero honi chahiye.
            </Text>
          ) : null}

          {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}

          <AppButton
            title="Confirm Settlement"
            icon={Save}
            loading={mutation.isPending}
            disabled={!canSettle}
            onPress={() => mutation.mutate()}
          />
        </View>
      ) : null}
    </Screen>
  );
};
