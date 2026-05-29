import * as Haptics from "expo-haptics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ReceiptText } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Loan, PaymentMethod } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "QuickAddPayment">;
const methods: PaymentMethod[] = ["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"];

const loanTitle = (loan: Loan) => {
  const contactName = typeof loan.contactId === "object" ? loan.contactId.name : "Contact";
  return `${contactName} - ${loan.type}`;
};

export const QuickAddPaymentScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [selectedLoanId, setSelectedLoanId] = useState(route.params?.loanId || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");

  const loansQuery = useQuery({
    queryKey: ["quick-add-loans", route.params?.contactId],
    queryFn: () => api.getLoans({ contactId: route.params?.contactId, limit: 50 }),
    enabled: !route.params?.loanId,
  });
  const loanQuery = useQuery({
    queryKey: ["loan", route.params?.loanId],
    queryFn: () => api.getLoan(route.params!.loanId!),
    enabled: Boolean(route.params?.loanId),
  });

  const availableLoans = useMemo(() => {
    if (route.params?.loanId && loanQuery.data?.loan) return [loanQuery.data.loan];
    return (loansQuery.data?.loans || []).filter((loan) => loan.remainingAmount > 0);
  }, [loanQuery.data?.loan, loansQuery.data?.loans, route.params?.loanId]);

  const selectedLoan = availableLoans.find((loan) => loan._id === selectedLoanId) || availableLoans[0];
  const amountNumber = Number(amount || 0);
  const validationError = !selectedLoan
    ? "Active loan select karein."
    : amountNumber <= 0
      ? "Amount greater than 0 hona chahiye."
      : amountNumber > selectedLoan.remainingAmount
        ? "Payment remaining amount se zyada nahi ho sakti."
        : null;

  const paymentMutation = useMutation({
    mutationFn: () => api.addPayment({
      loanId: selectedLoan?._id,
      amount: amountNumber,
      method,
      paymentDate: new Date().toISOString(),
      note,
    }),
    onSuccess: async (data) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["loan", data.loan._id] }),
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
      ]);
      navigation.goBack();
    },
  });

  if ((loansQuery.isLoading && !route.params?.loanId) || (loanQuery.isLoading && route.params?.loanId)) {
    return <Screen><LoadingState label="Preparing quick payment..." /></Screen>;
  }

  if (loansQuery.isError || loanQuery.isError) {
    return <Screen><ErrorState message="Active loans load nahi ho sake." onRetry={() => { loansQuery.refetch(); loanQuery.refetch(); }} /></Screen>;
  }

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Quick Add Payment</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Fast partial payment entry.</Text>
      </View>

      <View className="mt-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-peach">
          <ReceiptText color={theme.primaryDark} size={24} />
        </View>
        <Text className="mt-4 text-xs font-black uppercase text-muted">Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.placeholder}
          className="mt-1 text-4xl font-black text-dark"
        />
        {selectedLoan ? <Text className="mt-2 text-sm font-semibold text-muted">Remaining {formatCurrency(selectedLoan.remainingAmount)}</Text> : null}
      </View>

      <View className="mt-5 gap-3">
        <Text className="text-base font-black text-dark">Select Loan</Text>
        {availableLoans.length ? availableLoans.map((loan) => {
          const active = (selectedLoanId || selectedLoan?._id) === loan._id;
          return (
            <TouchableOpacity
              key={loan._id}
              activeOpacity={0.88}
              onPress={() => setSelectedLoanId(loan._id)}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
              style={theme.shadowSoft}
            >
              <View className="flex-1">
                <Text className="text-sm font-black text-dark">{loanTitle(loan)}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{formatCurrency(loan.remainingAmount)} remaining</Text>
              </View>
              {active ? <CheckCircle2 color={theme.success} size={20} /> : null}
            </TouchableOpacity>
          );
        }) : (
          <EmptyState title="No active loans" subtitle="Quick payment ke liye pehle active loan chahiye." />
        )}
      </View>

      <View className="mt-5">
        <Text className="mb-3 text-base font-black text-dark">Method</Text>
        <View className="flex-row flex-wrap gap-2">
          {methods.map((item) => (
            <TouchableOpacity
              key={item}
              activeOpacity={0.85}
              onPress={() => setMethod(item)}
              className="rounded-full border px-4 py-3"
              style={{ borderColor: method === item ? theme.primary : theme.border, backgroundColor: method === item ? theme.peach : theme.card }}
            >
              <Text style={{ color: method === item ? theme.primaryDark : theme.muted, fontWeight: "800" }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mt-5 rounded-2xl border border-border bg-card px-4" style={theme.shadowSoft}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note"
          placeholderTextColor={theme.placeholder}
          className="h-14 text-base text-dark"
        />
      </View>

      {validationError ? <Text className="mt-4 text-sm font-bold text-danger">{validationError}</Text> : null}
      {paymentMutation.isError ? <Text className="mt-4 text-sm font-bold text-danger">{getErrorMessage(paymentMutation.error)}</Text> : null}

      <View className="mt-6">
        <AppButton
          title="Save Payment"
          icon={ReceiptText}
          disabled={Boolean(validationError)}
          loading={paymentMutation.isPending}
          onPress={() => paymentMutation.mutate()}
        />
      </View>
    </Screen>
  );
};
