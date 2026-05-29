import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Mail, MessageCircle, Save, Share2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { Contact, Loan, PaymentRequest } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatDate } from "../../utils/format";
import { shareText, shareToWhatsApp } from "../../utils/share";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentRequestPreview">;

const getContactName = (value: string | Contact | undefined) => (typeof value === "object" ? value.name : "Contact");
const getLoanId = (value: string | Loan | undefined) => (typeof value === "object" ? value._id : value);
const getRequestContactName = (request?: PaymentRequest, loan?: Loan) => {
  if (request && typeof request.contactId === "object") return request.contactId.name;
  if (loan && typeof loan.contactId === "object") return loan.contactId.name;
  return "Contact";
};

export const PaymentRequestPreviewScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { requestId, loanId } = route.params;
  const [amountRequested, setAmountRequested] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const requestQuery = useQuery({
    queryKey: ["paymentRequests", requestId],
    queryFn: () => api.getPaymentRequest(requestId!),
    enabled: Boolean(requestId),
  });
  const loanQuery = useQuery({
    queryKey: ["loan", loanId, "payment-request"],
    queryFn: () => api.getLoan(loanId!),
    enabled: Boolean(loanId && !requestId),
  });

  const request = requestQuery.data;
  const loan = loanQuery.data?.loan;
  const activeLoanId = loanId || getLoanId(request?.loanId);

  useEffect(() => {
    if (loan) {
      setAmountRequested(String(loan.remainingAmount));
      setMessage(`Assalam o alaikum ${getContactName(loan.contactId)}, ${formatCurrency(loan.remainingAmount)} pending hai. Payment request details yahan hain.`);
    }
  }, [loan]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPaymentRequest(activeLoanId!, {
        amountRequested: Number(amountRequested),
        message,
        expiresAt: expiresAt || undefined,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["paymentRequests"] });
      navigation.replace("PaymentRequestPreview", { requestId: created._id });
    },
  });

  const markSharedMutation = useMutation({
    mutationFn: (id: string) => api.markPaymentRequestShared(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["paymentRequests"] });
      await queryClient.invalidateQueries({ queryKey: ["communications"] });
    },
  });

  const shareMessage = useMemo(() => {
    const current = request;
    if (!current) return message;
    return [
      `Payment Request - ${getRequestContactName(current, loan)}`,
      `Amount: ${formatCurrency(current.amountRequested)}`,
      `Remaining: ${formatCurrency(current.remainingAmount)}`,
      current.dueDate ? `Due Date: ${formatDate(current.dueDate)}` : undefined,
      current.message,
      current.publicUrl ? `Link: ${current.publicUrl}` : undefined,
    ].filter(Boolean).join("\n");
  }, [loan, message, request]);

  if (requestQuery.isLoading || loanQuery.isLoading) return <Screen><LoadingState label="Preparing payment request..." /></Screen>;
  if (requestQuery.isError || loanQuery.isError) {
    return <Screen><ErrorState message="Payment request load nahi ho saka." onRetry={requestId ? requestQuery.refetch : loanQuery.refetch} /></Screen>;
  }

  if (!request && !loan) {
    return <Screen><EmptyState title="No loan selected" subtitle="Loan detail se payment request create karein." /></Screen>;
  }

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Payment Request</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Shareable summary, no payment gateway required.</Text>
      </View>

      {request ? (
        <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-black uppercase text-muted">{request.requestNumber}</Text>
              <Text className="mt-2 text-3xl font-black text-primary">{formatCurrency(request.amountRequested)}</Text>
              <Text className="mt-2 text-base font-bold text-dark">{getRequestContactName(request, loan)}</Text>
              <Text className="mt-1 text-sm font-semibold text-muted">Remaining: {formatCurrency(request.remainingAmount)}</Text>
            </View>
            <StatusBadge value={request.status} />
          </View>
          <Text className="mt-4 text-sm font-medium leading-6 text-muted">{request.message}</Text>
          {request.publicUrl ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-lg border border-border bg-background-soft p-3">
              <Link2 color={theme.primary} size={16} />
              <Text numberOfLines={1} className="flex-1 text-xs font-bold text-dark">{request.publicUrl}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
          {[
            { label: "Amount Requested", value: amountRequested, setValue: setAmountRequested, placeholder: "5000", keyboardType: "numeric" as const },
            { label: "Expiry Date", value: expiresAt, setValue: setExpiresAt, placeholder: "Optional YYYY-MM-DD" },
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
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Payment request message"
              placeholderTextColor={theme.placeholder}
              multiline
              style={{
                minHeight: 120,
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
      )}

      {(createMutation.isError || markSharedMutation.isError) ? (
        <Text className="text-sm font-semibold text-danger">{getErrorMessage(createMutation.error || markSharedMutation.error)}</Text>
      ) : null}

      {request ? (
        <View className="gap-3">
          <AppButton
            title="Share WhatsApp"
            icon={MessageCircle}
            onPress={() => {
              void shareToWhatsApp(shareMessage);
              markSharedMutation.mutate(request._id);
            }}
          />
          <AppButton
            title="Copy / Share Message"
            icon={Share2}
            variant="secondary"
            onPress={() => {
              void shareText(shareMessage);
              markSharedMutation.mutate(request._id);
            }}
          />
          {activeLoanId ? (
            <AppButton
              title="Send by Email"
              icon={Mail}
              variant="secondary"
              onPress={() => navigation.navigate("SendEmail", { kind: "PAYMENT_REQUEST", loanId: activeLoanId })}
            />
          ) : null}
        </View>
      ) : (
        <AppButton
          title="Generate Request"
          icon={Save}
          loading={createMutation.isPending}
          disabled={!activeLoanId || !Number(amountRequested) || !message.trim()}
          onPress={() => createMutation.mutate()}
        />
      )}
    </Screen>
  );
};
