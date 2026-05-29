import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HandCoins, Save } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Contact, Loan } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddPromise">;

const getContactId = (value: string | Contact | undefined) => (typeof value === "object" ? value._id : value);
const getContactName = (value: string | Contact | undefined) => (typeof value === "object" ? value.name : "Contact");

export const AddPromiseScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const params = route.params || {};
  const [selectedLoanId, setSelectedLoanId] = useState(params.loanId || "");
  const [amount, setAmount] = useState("");
  const [promiseDate, setPromiseDate] = useState(toDateInput(new Date()));
  const [note, setNote] = useState("");

  const loansQuery = useQuery({
    queryKey: ["loans", "promise-select", params.contactId],
    queryFn: () => api.getLoans({ contactId: params.contactId, limit: 50, sortBy: "dueDate", sortOrder: "asc" }),
  });
  const loanDetailQuery = useQuery({
    queryKey: ["loan", selectedLoanId, "promise"],
    queryFn: () => api.getLoan(selectedLoanId),
    enabled: Boolean(selectedLoanId),
  });

  const selectedLoan = useMemo<Loan | undefined>(() => {
    if (loanDetailQuery.data?.loan) return loanDetailQuery.data.loan;
    return loansQuery.data?.loans.find((loan) => loan._id === selectedLoanId);
  }, [loanDetailQuery.data?.loan, loansQuery.data?.loans, selectedLoanId]);

  useEffect(() => {
    if (!selectedLoanId && loansQuery.data?.loans.length) {
      setSelectedLoanId(loansQuery.data.loans[0]._id);
    }
  }, [loansQuery.data?.loans, selectedLoanId]);

  useEffect(() => {
    if (selectedLoan && !amount) {
      setAmount(String(selectedLoan.remainingAmount));
    }
  }, [amount, selectedLoan]);

  const mutation = useMutation({
    mutationFn: () =>
      api.createPromise({
        contactId: params.contactId || getContactId(selectedLoan?.contactId),
        loanId: selectedLoanId,
        promisedAmount: Number(amount),
        promiseDate,
        note,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promises"] });
      await queryClient.invalidateQueries({ queryKey: ["recovery"] });
      await queryClient.invalidateQueries({ queryKey: ["communications"] });
      navigation.goBack();
    },
  });

  if (loansQuery.isLoading) return <Screen><LoadingState label="Loading active loans..." /></Screen>;
  if (loansQuery.isError) return <Screen><ErrorState message="Loans load nahi ho sake." onRetry={loansQuery.refetch} /></Screen>;

  const loans = loansQuery.data?.loans.filter((loan) => loan.remainingAmount > 0) || [];
  const disabled = !selectedLoanId || !Number(amount) || Number(amount) <= 0 || !promiseDate;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Add Promise</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Kis date par kitni payment ka promise mila?</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <HandCoins color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Select Loan</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Promise amount remaining balance se zyada nahi ho sakta.</Text>
          </View>
        </View>

        <View className="mt-5 gap-3">
          {loans.length ? (
            loans.map((loan) => {
              const selected = selectedLoanId === loan._id;
              return (
                <TouchableOpacity
                  key={loan._id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLoanId(loan._id)}
                  className="rounded-lg border p-4"
                  style={{
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.peach : theme.backgroundSoft,
                  }}
                >
                  <Text className="text-sm font-black text-dark">{getContactName(loan.contactId)}</Text>
                  <Text className="mt-1 text-xs font-bold uppercase text-muted">{loan.type} · {loan.status.replace("_", " ")}</Text>
                  <Text className="mt-2 text-base font-black text-primary">{formatCurrency(loan.remainingAmount)} remaining</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <EmptyState title="No active loans" subtitle="Promise add karne ke liye active loan chahiye." />
          )}
        </View>
      </View>

      <View className="gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        {[
          { label: "Promised Amount", value: amount, setValue: setAmount, placeholder: "5000", keyboardType: "numeric" as const },
          { label: "Promise Date", value: promiseDate, setValue: setPromiseDate, placeholder: toDateInput(new Date()) },
        ].map((field) => (
          <View key={field.label} style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>{field.label}</Text>
            <TextInput
              value={field.value}
              onChangeText={field.setValue}
              placeholder={field.placeholder}
              placeholderTextColor={theme.placeholder}
              keyboardType={field.keyboardType}
              style={{
                minHeight: 50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
                fontFamily: fontFamily.semiBold,
                fontSize: 15,
                paddingHorizontal: 18,
              }}
            />
          </View>
        ))}
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional promise note"
            placeholderTextColor={theme.placeholder}
            multiline
            style={{
              minHeight: 96,
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
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}

      <AppButton
        title="Save Promise"
        icon={Save}
        loading={mutation.isPending}
        disabled={disabled}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
};
