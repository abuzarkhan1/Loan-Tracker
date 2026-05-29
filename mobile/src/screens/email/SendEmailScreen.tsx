import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SendEmail">;

const metaByKind: Record<RootStackParamList["SendEmail"]["kind"], { title: string; subject: string; body: string }> = {
  PAYMENT_RECEIPT: {
    title: "Send Payment Receipt",
    subject: "Payment receipt",
    body: "Please find the payment receipt attached.",
  },
  LOAN_SUMMARY: {
    title: "Send Loan Summary",
    subject: "Loan summary",
    body: "Please find the latest loan summary.",
  },
  CONTACT_STATEMENT: {
    title: "Send Contact Statement",
    subject: "Loan Tracker statement",
    body: "Please find your statement attached.",
  },
  MONTHLY_REPORT: {
    title: "Send Monthly Report",
    subject: "Monthly loan report",
    body: "Please find the monthly report attached.",
  },
  OVERDUE_REMINDER: {
    title: "Send Overdue Reminder",
    subject: "Loan payment reminder",
    body: "This is a polite reminder for the pending loan amount.",
  },
  PAYMENT_REQUEST: {
    title: "Send Payment Request",
    subject: "Payment request",
    body: "Please review the payment request summary.",
  },
  SETTLEMENT_CONFIRMATION: {
    title: "Send Settlement Confirmation",
    subject: "Loan settlement confirmation",
    body: "Please find the settlement confirmation details.",
  },
};

export const SendEmailScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { kind, paymentId, loanId, contactId, settlementId, defaultEmail } = route.params;
  const meta = useMemo(() => metaByKind[kind], [kind]);
  const prefsQuery = useQuery({ queryKey: ["email", "preferences"], queryFn: api.getEmailPreferences });
  const [toEmail, setToEmail] = useState(defaultEmail || "");
  const [subject, setSubject] = useState(meta.subject);
  const [message, setMessage] = useState(meta.body);
  const [attachPdf, setAttachPdf] = useState(true);

  useEffect(() => {
    if (!toEmail && prefsQuery.data?.defaultRecipientEmail) {
      setToEmail(prefsQuery.data.defaultRecipientEmail);
    }
  }, [prefsQuery.data?.defaultRecipientEmail, toEmail]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { toEmail, subject, message, attachPdf };
      if (kind === "PAYMENT_RECEIPT" && paymentId) return api.sendPaymentReceiptEmail(paymentId, payload);
      if (kind === "LOAN_SUMMARY" && loanId) return api.sendLoanSummaryEmail(loanId, payload);
      if (kind === "CONTACT_STATEMENT" && contactId) return api.sendContactStatementEmail(contactId, payload);
      if (kind === "MONTHLY_REPORT") return api.sendMonthlyReportEmail(payload);
      if (kind === "OVERDUE_REMINDER" && loanId) return api.sendOverdueReminderEmail(loanId, payload);
      if (kind === "PAYMENT_REQUEST" && loanId) return api.sendPaymentRequestEmail(loanId, payload);
      if (kind === "SETTLEMENT_CONFIRMATION" && settlementId) return api.sendSettlementEmail(settlementId, payload);
      if (kind === "SETTLEMENT_CONFIRMATION" && loanId) return api.sendSettlementConfirmationEmail(loanId, payload);
      throw new Error("Missing email context");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["email"] });
      await queryClient.invalidateQueries({ queryKey: ["communications"] });
      showAlert({ title: "Email queued", message: "Email queue mein add ho gayi. Logs mein status check kar sakte hain." });
      navigation.goBack();
    },
  });

  if (prefsQuery.isLoading) return <Screen><LoadingState label="Preparing email..." /></Screen>;
  if (prefsQuery.isError) return <Screen><ErrorState message="Email settings load nahi ho sakin." onRetry={prefsQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{meta.title}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Professional email preview ke sath bhejein.</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <Mail color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Email Details</Text>
            <Text className="mt-1 text-sm font-medium text-muted">{kind.replace(/_/g, " ")}</Text>
          </View>
        </View>

        <View className="mt-5 gap-4">
          {[
            { label: "Recipient Email", value: toEmail, setValue: setToEmail, placeholder: "person@example.com", keyboardType: "email-address" as const },
            { label: "Subject", value: subject, setValue: setSubject, placeholder: "Email subject" },
          ].map((field) => (
            <View key={field.label} style={{ gap: 6 }}>
              <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>{field.label}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.setValue}
                placeholder={field.placeholder}
                placeholderTextColor={theme.placeholder}
                autoCapitalize="none"
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
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Message Preview</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Email message"
              placeholderTextColor={theme.placeholder}
              style={{
                minHeight: 140,
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

          <View className="flex-row items-center justify-between rounded-lg border border-border bg-background-soft p-4">
            <View className="flex-1">
              <Text className="text-sm font-bold text-dark">Attach PDF if available</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">Receipt/report nahi hai to backend generate ya skip karega.</Text>
            </View>
            <Switch
              value={attachPdf}
              onValueChange={setAttachPdf}
              trackColor={{ false: theme.border, true: theme.peach }}
              thumbColor={attachPdf ? theme.primary : theme.muted}
            />
          </View>
        </View>
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}

      <AppButton
        title="Send Email"
        icon={Send}
        loading={mutation.isPending}
        disabled={!toEmail.trim() || !subject.trim()}
        onPress={() => mutation.mutate()}
      />
    </Screen>
  );
};
