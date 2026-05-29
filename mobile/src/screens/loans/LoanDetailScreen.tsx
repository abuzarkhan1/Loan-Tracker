import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { BellRing, CalendarClock, CheckCircle2, Edit3, HandCoins, History, Image as ImageIcon, Link2, Mail, Percent, Pin, Plus, ReceiptText, Share2, Trash2 } from "lucide-react-native";
import { api, getAssetUrl } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { showAlert } from "../../providers/AlertProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatDate, formatTime, getProgress } from "../../utils/format";
import { shareToWhatsApp } from "../../utils/share";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "LoanDetail">;

const getContactName = (contactId: unknown) => {
  if (typeof contactId === "object" && contactId && "name" in contactId) {
    return String((contactId as { name: string }).name);
  }

  return "Contact";
};

const getContactId = (contactId: unknown) => {
  if (typeof contactId === "object" && contactId && "_id" in contactId) {
    return String((contactId as { _id: string })._id);
  }

  return typeof contactId === "string" ? contactId : undefined;
};

export const LoanDetailScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { loanId } = route.params;
  const loanQuery = useQuery({
    queryKey: ["loan", loanId],
    queryFn: () => api.getLoan(loanId),
  });
  const installmentsQuery = useQuery({
    queryKey: ["installments", loanId],
    queryFn: () => api.getLoanInstallments(loanId),
    enabled: Boolean(loanQuery.data?.loan.isInstallmentLoan),
  });
  const reminderQuery = useQuery({
    queryKey: ["loan", loanId, "reminder"],
    queryFn: () => api.getLoanReminder(loanId),
    enabled: Boolean(loanQuery.data?.loan),
  });
  const promisesQuery = useQuery({
    queryKey: ["promises", "loan", loanId],
    queryFn: () => api.getLoanPromises(loanId),
    enabled: Boolean(loanQuery.data?.loan),
  });
  const followUpsQuery = useQuery({
    queryKey: ["followUps", "loan", loanId],
    queryFn: () => api.getLoanFollowUps(loanId),
    enabled: Boolean(loanQuery.data?.loan),
  });
  const settlementQuery = useQuery({
    queryKey: ["settlement", "loan", loanId],
    queryFn: () => api.getLoanSettlement(loanId),
    enabled: Boolean(loanQuery.data?.loan),
  });

  const deleteLoanMutation = useMutation({
    mutationFn: () => api.deleteLoan(loanId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigation.goBack();
    },
  });

  const pinMutation = useMutation({
    mutationFn: (isPinned: boolean) => api.setLoanPinned(loanId, isPinned),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const receiptMutation = useMutation({
    mutationFn: () => api.createLoanReceipt(loanId),
    onSuccess: async (receipt) => {
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
      navigation.navigate("ReceiptPreview", { receiptId: receipt._id });
    },
  });

  const paymentReceiptMutation = useMutation({
    mutationFn: (paymentId: string) => api.createPaymentReceipt(paymentId),
    onSuccess: async (receipt) => {
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
      navigation.navigate("ReceiptPreview", { receiptId: receipt._id });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.deletePayment(paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId] });
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const confirmLoanDelete = () => {
    showAlert({
      title: "Delete loan",
      message: "Is loan ki payments bhi delete ho jayengi.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteLoanMutation.mutate() },
      ],
    });
  };

  const confirmPaymentDelete = (paymentId: string) => {
    showAlert({
      title: "Delete payment",
      message: "Loan balance dobara calculate hoga.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deletePaymentMutation.mutate(paymentId) },
      ],
    });
  };

  if (loanQuery.isLoading) return <Screen><LoadingState label="Loading loan..." /></Screen>;
  if (loanQuery.isError || !loanQuery.data) {
    return <Screen><ErrorState message="Loan load nahi ho saka." onRetry={loanQuery.refetch} /></Screen>;
  }

  const { loan, payments } = loanQuery.data;
  const progress = getProgress(loan.paidAmount, loan.amount);
  const paymentActionLabel = loan.type === "TAKEN" ? "Maine Diya" : "Wapis Mila";
  const paymentVerb = loan.type === "TAKEN" ? "Maine diya" : "Mujhe mila";
  const contactId = getContactId(loan.contactId);
  const promises = promisesQuery.data?.promises || [];
  const followUps = followUpsQuery.data?.followUps || [];
  const settlement = settlementQuery.data;
  const shareLoanSummary = () => {
    const message = [
      `Loan Summary - ${getContactName(loan.contactId)}`,
      `Total Amount: ${formatCurrency(loan.amount)}`,
      `Paid/Received: ${formatCurrency(loan.paidAmount)}`,
      `Remaining: ${formatCurrency(loan.remainingAmount)}`,
      `Status: ${loan.status.replace("_", " ")}`,
      `Due Date: ${formatDate(loan.dueDate)}`,
    ].join("\n");

    void shareToWhatsApp(message);
  };
  let cumulativePaid = 0;
  const runningBalances = [...payments]
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
    .reduce<Record<string, number>>((acc, payment) => {
      cumulativePaid += payment.amount;
      acc[payment._id] = Math.max(loan.amount - cumulativePaid, 0);
      return acc;
    }, {});

  return (
    <Screen className="pt-5">
      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark">{getContactName(loan.contactId)}</Text>
            <Text className="mt-2 text-sm font-medium text-muted">{loan.description || "No description"}</Text>
          </View>
          <View className="items-end gap-2">
            <StatusBadge value={loan.type} />
            <StatusBadge value={loan.status} />
          </View>
        </View>

        <View className="mt-5 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-xs font-bold text-muted">Paid {progress}%</Text>
            <Text className="text-xs font-bold text-muted">Baqi Raqam {formatCurrency(loan.remainingAmount)}</Text>
          </View>
          <ProgressBar progress={progress} />
        </View>

        <View className="mt-5 flex-row justify-between">
          <View>
            <Text className="text-xs font-bold uppercase text-muted">Total</Text>
            <Text className="mt-1 text-lg font-black text-dark">{formatCurrency(loan.amount)}</Text>
          </View>
          <View>
            <Text className="text-xs font-bold uppercase text-muted">Paid</Text>
            <Text className="mt-1 text-lg font-black text-success">{formatCurrency(loan.paidAmount)}</Text>
          </View>
        </View>

        <View className="mt-5 flex-row justify-between">
          <Text className="text-sm font-semibold text-muted">Issued {formatDate(loan.issueDate)}</Text>
          <Text className="text-sm font-semibold text-muted">Due {formatDate(loan.dueDate)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("LoanReminderSettings", { loanId })}
          className="mt-5 flex-row items-center gap-3 rounded-lg border border-border bg-background-soft p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-peach">
            <BellRing color={theme.primaryDark} size={20} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-dark">Reminder Status</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">
              {reminderQuery.data?.enabled
                ? `Next reminder ${formatDate(reminderQuery.data.nextReminderAt || loan.dueDate)}`
                : loan.dueDate
                  ? `Due date ${formatDate(loan.dueDate)}. Tap to setup reminder.`
                  : "No due date set for this loan."}
            </Text>
          </View>
        </TouchableOpacity>

        {(deleteLoanMutation.isError || deletePaymentMutation.isError || pinMutation.isError || receiptMutation.isError || paymentReceiptMutation.isError) ? (
          <Text className="mt-3 text-sm font-semibold text-danger">
            {getErrorMessage(deleteLoanMutation.error || deletePaymentMutation.error || pinMutation.error || receiptMutation.error || paymentReceiptMutation.error)}
          </Text>
        ) : null}

        <View className="mt-5">
          <AppButton title={paymentActionLabel} icon={Plus} onPress={() => navigation.navigate("QuickAddPayment", { loanId })} />
        </View>

        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Edit" icon={Edit3} variant="secondary" onPress={() => navigation.navigate("LoanForm", { loanId })} />
          </View>
          <View className="flex-1">
            <AppButton title="Delete" icon={Trash2} variant="danger" onPress={confirmLoanDelete} loading={deleteLoanMutation.isPending} />
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <AppButton
              title={loan.isPinned ? "Unpin" : "Pin"}
              icon={Pin}
              variant="secondary"
              loading={pinMutation.isPending}
              onPress={() => pinMutation.mutate(!loan.isPinned)}
            />
          </View>
          <View className="flex-1">
            <AppButton
              title="Receipt"
              icon={ReceiptText}
              variant="secondary"
              loading={receiptMutation.isPending}
              onPress={() => receiptMutation.mutate()}
            />
          </View>
        </View>
        <View className="mt-3">
          <AppButton title="Share Summary" icon={Share2} variant="secondary" onPress={shareLoanSummary} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Email" icon={Mail} variant="secondary" onPress={() => navigation.navigate("SendEmail", { kind: "LOAN_SUMMARY", loanId })} />
          </View>
          <View className="flex-1">
            <AppButton title="Request" icon={Link2} variant="secondary" onPress={() => navigation.navigate("PaymentRequestPreview", { loanId })} />
          </View>
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Promise" icon={HandCoins} variant="secondary" onPress={() => navigation.navigate("AddPromise", { loanId, contactId })} />
          </View>
          <View className="flex-1">
            <AppButton title="Follow-ups" icon={History} variant="secondary" onPress={() => navigation.navigate("FollowUpTimeline", { loanId, contactId })} />
          </View>
        </View>
        {loan.status === "COMPLETED" ? (
          <View className="mt-3">
            <AppButton
              title={settlement ? "View Settlement" : "Settle Loan"}
              icon={CheckCircle2}
              variant="secondary"
              onPress={() => settlement ? navigation.navigate("SettlementReceiptPreview", { settlementId: settlement._id }) : navigation.navigate("SettlementConfirmation", { loanId })}
            />
          </View>
        ) : null}
      </View>

      {loan.isInstallmentLoan ? (
        <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
              <CalendarClock color={theme.primaryDark} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-dark">Installment Progress</Text>
              <Text className="mt-1 text-sm font-medium text-muted">
                {(installmentsQuery.data || []).filter((item) => item.status === "PAID").length} paid · {(installmentsQuery.data || []).filter((item) => item.status !== "PAID").length} remaining
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <AppButton
              title="View Schedule"
              icon={CalendarClock}
              variant="secondary"
              onPress={() => navigation.navigate("InstallmentSchedule", { loanId })}
            />
          </View>
        </View>
      ) : null}

      {loan.interestEnabled ? (
        <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
          <View className="flex-row items-center gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-background-soft">
              <Percent color={theme.primary} size={24} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-dark">Interest Enabled</Text>
              <Text className="mt-1 text-sm font-medium text-muted">
                Interest {formatCurrency(loan.interestAmount)} · Total {formatCurrency(loan.totalPayableAmount)}
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <AppButton
              title="View Breakdown"
              icon={Percent}
              variant="secondary"
              onPress={() => navigation.navigate("InterestBreakdown", { loanId })}
            />
          </View>
        </View>
      ) : null}

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-peach">
              <HandCoins color={theme.primaryDark} size={20} />
            </View>
            <View>
              <Text className="text-base font-bold text-dark">Promises</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{promises.length} records</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Promises", { loanId, contactId })}>
            <Text className="text-xs font-bold text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-4 gap-3">
          {promises.slice(0, 2).map((promise) => (
            <View key={promise._id} className="rounded-lg border border-border bg-background-soft p-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-sm font-black text-dark">{formatCurrency(promise.promisedAmount)}</Text>
                <StatusBadge value={promise.status} />
              </View>
              <Text className="mt-1 text-xs font-semibold text-muted">Promise date {formatDate(promise.promiseDate)}</Text>
            </View>
          ))}
          {!promises.length ? <Text className="text-sm font-semibold text-muted">No promise recorded for this loan.</Text> : null}
        </View>
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-background-soft">
              <History color={theme.primary} size={20} />
            </View>
            <View>
              <Text className="text-base font-bold text-dark">Follow-up History</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{followUps.length} records</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("FollowUpTimeline", { loanId, contactId })}>
            <Text className="text-xs font-bold text-primary">View All</Text>
          </TouchableOpacity>
        </View>
        <View className="mt-4 gap-3">
          {followUps.slice(0, 2).map((item) => (
            <View key={item._id} className="rounded-lg border border-border bg-background-soft p-3">
              <Text className="text-sm font-black text-dark">{item.channel.replace("_", " ")}</Text>
              <Text numberOfLines={1} className="mt-1 text-xs font-semibold text-muted">{item.note || item.message || item.type}</Text>
            </View>
          ))}
          {!followUps.length ? <Text className="text-sm font-semibold text-muted">No follow-up recorded yet.</Text> : null}
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Payment History</Text>
        <Text className="text-xs font-bold uppercase text-muted">{payments.length} records</Text>
      </View>

      <View className="mt-4 gap-3">
        {payments.length ? (
          payments.map((payment) => (
            <View key={payment._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 16 }}>
                    {paymentVerb}: {formatCurrency(payment.amount)}
                  </Text>
                  <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 4 }}>
                    {payment.method} · {formatDate(payment.paymentDate)} · {formatTime(payment.createdAt)}
                  </Text>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: theme.peach,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: theme.primaryDark, fontFamily: fontFamily.extraBold, fontSize: 11 }}>
                      Baqi: {formatCurrency(runningBalances[payment._id] ?? loan.remainingAmount)}
                    </Text>
                  </View>
                  {payment.note ? <Text className="mt-2 text-sm text-dark">{payment.note}</Text> : null}
                  {payment.proof ? (
                    <View className="mt-3 flex-row items-center gap-3 rounded-lg border border-border bg-background-soft p-2">
                      {getAssetUrl(payment.proof.fileUrl) ? (
                        <Image
                          source={{ uri: getAssetUrl(payment.proof.fileUrl) }}
                          style={{ height: 42, width: 42, borderRadius: 12, backgroundColor: theme.card }}
                        />
                      ) : (
                        <View className="h-10 w-10 items-center justify-center rounded-lg bg-peach">
                          <ImageIcon color={theme.primaryDark} size={18} />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-xs font-black uppercase text-muted">Proof attached</Text>
                        <Text className="mt-1 text-xs font-semibold text-dark">{payment.proof.fileName}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="h-9 w-9 items-center justify-center rounded-lg bg-background-soft"
                    onPress={() => navigation.navigate("PaymentForm", { loanId, paymentId: payment._id })}
                  >
                    <Edit3 color={theme.primary} size={17} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-9 w-9 items-center justify-center rounded-lg bg-background-soft"
                    onPress={() => paymentReceiptMutation.mutate(payment._id)}
                  >
                    <ReceiptText color={theme.primary} size={17} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-9 w-9 items-center justify-center rounded-lg bg-background-soft"
                    onPress={() => void shareToWhatsApp([
                      `Payment Confirmation - ${getContactName(loan.contactId)}`,
                      `Amount: ${formatCurrency(payment.amount)}`,
                      `Method: ${payment.method}`,
                      `Date: ${formatDate(payment.paymentDate)}`,
                      `Remaining: ${formatCurrency(runningBalances[payment._id] ?? loan.remainingAmount)}`,
                    ].join("\n"))}
                  >
                    <Share2 color={theme.primary} size={17} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-9 w-9 items-center justify-center rounded-lg bg-peach"
                    onPress={() => confirmPaymentDelete(payment._id)}
                  >
                    <Trash2 color={theme.danger} size={17} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No payments" subtitle="Nayi Payment se partial ya full payment add karein." />
        )}
      </View>
    </Screen>
  );
};
