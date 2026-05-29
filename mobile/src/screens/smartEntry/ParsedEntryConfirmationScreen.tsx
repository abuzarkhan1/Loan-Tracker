import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { AmountText } from "../../components/AmountText";
import { DatePickerField } from "../../components/DatePickerField";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ParsedEntryConfirmation">;

const contactIntents = ["CREATE_LOAN", "ADD_PAYMENT", "CREATE_PROMISE"];
const dateFields = ["date", "issueDate", "dueDate", "paymentDate", "salaryDate", "promiseDate"];
const methods = ["CASH", "BANK", "JAZZCASH", "EASYPAISA", "OTHER"];

const labelFor = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

export const ParsedEntryConfirmationScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { result } = route.params;
  const [parsed, setParsed] = useState<Record<string, unknown>>(() => {
    const initial = { ...result.parsed };
    if (contactIntents.includes(result.intent) && !initial.contactId && result.contactMatches.length === 1) {
      initial.contactId = result.contactMatches[0].contactId;
      initial.contactName = result.contactMatches[0].name;
    }
    dateFields.forEach((field) => {
      if (initial[field]) initial[field] = toDateInput(String(initial[field]));
    });
    return initial;
  });

  const updateParsed = (key: string, value: unknown) => setParsed((current) => ({ ...current, [key]: value }));
  const amountKey = parsed.promisedAmount !== undefined ? "promisedAmount" : "amount";
  const amount = Number(parsed[amountKey] || 0);
  const selectedContactId = typeof parsed.contactId === "string" ? parsed.contactId : "";
  const paymentLoanType = parsed.paymentDirection === "PAID" ? "TAKEN" : "GIVEN";
  const paymentLoansQuery = useQuery({
    queryKey: ["smart-entry", "payment-loans", selectedContactId, paymentLoanType],
    queryFn: () => api.getLoans({ contactId: selectedContactId, type: paymentLoanType, page: 1, limit: 25 }),
    enabled: result.intent === "ADD_PAYMENT" && Boolean(selectedContactId),
  });
  const activePaymentLoans = useMemo(
    () => (paymentLoansQuery.data?.loans || []).filter((loan) => loan.remainingAmount > 0 && loan.status !== "COMPLETED"),
    [paymentLoansQuery.data?.loans],
  );

  useEffect(() => {
    if (result.intent === "ADD_PAYMENT" && activePaymentLoans.length === 1 && !parsed.loanId) {
      updateParsed("loanId", activePaymentLoans[0]._id);
    }
  }, [activePaymentLoans, parsed.loanId, result.intent]);

  const computedMissing = useMemo(() => {
    const missing: string[] = [];
    if (result.intent !== "UNKNOWN" && (!amount || amount <= 0)) missing.push("amount");
    if (contactIntents.includes(result.intent) && !String(parsed.contactName || parsed.contactId || "").trim()) missing.push("contact");
    if (result.intent === "ADD_PAYMENT" && activePaymentLoans.length > 1 && !parsed.loanId) missing.push("loan");
    if ((result.intent === "CREATE_BILL" || result.intent === "CREATE_RECURRING_TRANSACTION") && !String(parsed.title || "").trim()) missing.push("title");
    return missing;
  }, [activePaymentLoans.length, amount, parsed, result.intent]);

  const confirmMutation = useMutation({
    mutationFn: () => api.confirmSmartEntry({ parseId: result.parseId, parsedData: parsed }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["smart-entry"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["finance"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["bills"] }),
      ]);
      navigation.navigate("MainTabs", { screen: "Dashboard" });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSmartEntry(result.parseId),
    onSuccess: () => navigation.goBack(),
  });

  const renderInput = (key: string, value: unknown) => {
    if (key === "contactId" || key === "loanId") return null;
    if (dateFields.includes(key)) {
      return (
        <DatePickerField
          key={key}
          label={labelFor(key)}
          value={value ? String(value) : toDateInput(new Date())}
          onChange={(next) => updateParsed(key, next)}
        />
      );
    }
    if (key === "paymentMethod") {
      return (
        <View key={key} style={{ gap: 8 }}>
          <Text className="text-xs font-black uppercase text-muted">Payment Method</Text>
          <View className="flex-row flex-wrap gap-2">
            {methods.map((method) => {
              const active = parsed.paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  activeOpacity={0.86}
                  onPress={() => updateParsed("paymentMethod", method)}
                  className="rounded-full border px-4 py-2"
                  style={{ backgroundColor: active ? theme.primary : theme.pill, borderColor: active ? theme.primary : theme.border }}
                >
                  <Text className="text-xs font-black" style={{ color: active ? theme.white : theme.muted }}>{method}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
    if (key === "loanType" || key === "paymentDirection") {
      const options = key === "loanType" ? ["GIVEN", "TAKEN"] : ["RECEIVED", "PAID"];
      return (
        <View key={key} style={{ gap: 8 }}>
          <Text className="text-xs font-black uppercase text-muted">{labelFor(key)}</Text>
          <View className="flex-row gap-2">
            {options.map((option) => {
              const active = parsed[key] === option;
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.86}
                  onPress={() => updateParsed(key, option)}
                  className="flex-1 rounded-full border py-3"
                  style={{ backgroundColor: active ? theme.primary : theme.pill, borderColor: active ? theme.primary : theme.border }}
                >
                  <Text className="text-center text-xs font-black" style={{ color: active ? theme.white : theme.muted }}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
    return (
      <View key={key} style={{ gap: 8 }}>
        <Text className="text-xs font-black uppercase text-muted">{labelFor(key)}</Text>
        <TextInput
          value={value === undefined || value === null ? "" : String(value)}
          onChangeText={(next) => updateParsed(key, key === "amount" || key === "promisedAmount" ? next.replace(/[^\d.]/g, "") : next)}
          keyboardType={key === "amount" || key === "promisedAmount" ? "numeric" : "default"}
          placeholder={`Enter ${labelFor(key).toLowerCase()}`}
          placeholderTextColor={theme.placeholder}
          className="rounded-2xl border border-border bg-input px-4 py-4 text-sm font-semibold text-dark"
        />
      </View>
    );
  };

  const editableEntries = Object.entries(parsed).filter(([key]) => key !== "contactId");

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Confirm Smart Entry</Text>
        <Text className="mt-2 text-sm font-semibold text-muted">Review and edit fields before saving.</Text>
        <View className="mt-5 gap-3">
          <View className="rounded-2xl bg-background-soft p-4">
            <Text className="text-[10px] font-black uppercase text-muted">Intent</Text>
            <Text className="mt-1 text-base font-black text-dark">{result.intent.replace(/_/g, " ")}</Text>
          </View>
          {amount ? (
            <View className="rounded-2xl bg-background-soft p-4">
              <Text className="text-[10px] font-black uppercase text-muted">Detected amount</Text>
              <AmountText amount={amount} className="mt-1 text-base font-black text-dark" />
            </View>
          ) : null}
          <Text className="text-xs font-bold text-muted">Confidence: {Math.round(result.confidence * 100)}%</Text>
        </View>
      </View>

      {result.contactMatches.length ? (
        <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
          <Text className="text-sm font-black text-dark">Possible Contact Matches</Text>
          <View className="mt-3 gap-2">
            {result.contactMatches.map((contact) => (
              <TouchableOpacity
                key={contact.contactId}
                activeOpacity={0.86}
                onPress={() => {
                  updateParsed("contactId", contact.contactId);
                  updateParsed("contactName", contact.name);
                }}
                className="rounded-2xl bg-background-soft p-4"
              >
                <Text className="text-sm font-black text-dark">{contact.name}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{contact.phone || "Saved contact"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {result.categorySuggestion ? (
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => {
            updateParsed("categoryName", result.categorySuggestion?.suggestedCategoryName);
            updateParsed("categoryId", result.categorySuggestion?.suggestedCategoryId);
            updateParsed("paymentMethod", result.categorySuggestion?.suggestedPaymentMethod);
          }}
          className="rounded-3xl border border-border bg-card p-5"
          style={theme.shadowSoft}
        >
          <Text className="text-sm font-black text-dark">Category Suggestion</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">
            {result.categorySuggestion.suggestedCategoryName} · {result.categorySuggestion.suggestedPaymentMethod} · {Math.round(result.categorySuggestion.confidence * 100)}%
          </Text>
          <Text className="mt-3 text-xs font-black text-primary">Tap to apply</Text>
        </TouchableOpacity>
      ) : null}

      {result.intent === "ADD_PAYMENT" && selectedContactId ? (
        <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
          <Text className="text-sm font-black text-dark">Select Loan for Payment</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">
            Contact ke multiple active loans hon to payment kis loan par apply karni hai, yahan select karein.
          </Text>
          <View className="mt-3 gap-2">
            {paymentLoansQuery.isLoading ? (
              <Text className="text-xs font-bold text-muted">Loading active loans...</Text>
            ) : activePaymentLoans.length ? activePaymentLoans.map((loan) => {
              const active = parsed.loanId === loan._id;
              return (
                <TouchableOpacity
                  key={loan._id}
                  activeOpacity={0.86}
                  onPress={() => updateParsed("loanId", loan._id)}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.peach : theme.backgroundSoft }}
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-black text-dark">{loan.type} • {loan.status.replace("_", " ")}</Text>
                      <Text className="mt-1 text-xs font-semibold text-muted">
                        {loan.dueDate ? `Due ${formatDate(loan.dueDate)}` : "No due date"}
                      </Text>
                    </View>
                    <AmountText amount={loan.remainingAmount} className="text-sm font-black text-dark" />
                  </View>
                </TouchableOpacity>
              );
            }) : (
              <Text className="text-xs font-bold text-danger">No active matching loan found for this contact.</Text>
            )}
          </View>
        </View>
      ) : null}

      <View className="gap-4 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-sm font-black text-dark">Editable Fields</Text>
        {editableEntries.map(([key, value]) => renderInput(key, value))}
        {!editableEntries.some(([key]) => key === "amount" || key === "promisedAmount") ? renderInput("amount", "") : null}
        {contactIntents.includes(result.intent) && !editableEntries.some(([key]) => key === "contactName") ? renderInput("contactName", "") : null}
      </View>

      {computedMissing.length ? <Text className="text-xs font-bold text-danger">Missing: {computedMissing.join(", ")}</Text> : null}
      {confirmMutation.isError ? <Text className="text-xs font-bold text-danger">{getErrorMessage(confirmMutation.error)}</Text> : null}

      <AppButton
        title="Confirm & Save"
        icon={CheckCircle2}
        loading={confirmMutation.isPending}
        disabled={Boolean(computedMissing.length) || result.intent === "UNKNOWN"}
        onPress={() => confirmMutation.mutate()}
      />
      <AppButton title="Cancel" icon={XCircle} variant="secondary" loading={cancelMutation.isPending} onPress={() => cancelMutation.mutate()} />
    </Screen>
  );
};
