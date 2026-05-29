import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Mail, MessageCircle, Plus, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { RecoveryItem } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import { shareToWhatsApp } from "../../utils/share";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RecoveryFilter = "ALL" | "TODAY_DUE" | "OVERDUE" | "PROMISE_DUE" | "HIGH_PENDING" | "REMINDER_SUGGESTED" | "RECENTLY_PAID";

const filterOptions: { label: string; value: RecoveryFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Due Today", value: "TODAY_DUE" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Promises", value: "PROMISE_DUE" },
  { label: "High Pending", value: "HIGH_PENDING" },
  { label: "Suggested", value: "REMINDER_SUGGESTED" },
  { label: "Paid", value: "RECENTLY_PAID" },
];

const severityIcon = {
  INFO: Clock,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  DANGER: AlertTriangle,
};

const reminderMessage = (item: RecoveryItem) => [
  `Assalam o alaikum ${item.contactName},`,
  `${formatCurrency(item.remainingAmount)} amount pending hai.`,
  item.dueDate ? `Due date: ${formatDate(item.dueDate)}` : undefined,
  item.overdueDays ? `${item.overdueDays} din overdue hai.` : undefined,
].filter(Boolean).join("\n");

const RecoveryCard = ({ item }: { item: RecoveryItem }) => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const Icon = severityIcon[item.severity] || Clock;
  const toneColor = item.severity === "DANGER" ? theme.danger : item.severity === "SUCCESS" ? theme.success : theme.primary;
  const followUpMutation = useMutation({
    mutationFn: () =>
      api.createFollowUp({
        contactId: item.contactId,
        loanId: item.loanId,
        channel: "WHATSAPP",
        type: "REMINDER",
        status: "SENT",
        message: reminderMessage(item),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["followUps"] });
      await queryClient.invalidateQueries({ queryKey: ["communications"] });
      await queryClient.invalidateQueries({ queryKey: ["recovery"] });
    },
  });

  return (
    <View className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
          <Icon color={toneColor} size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-black uppercase text-muted">{item.type.replace(/_/g, " ")}</Text>
          <Text className="mt-1 text-base font-black text-dark">{item.contactName}</Text>
          <Text className="mt-1 text-2xl font-black text-primary">{formatCurrency(item.remainingAmount)}</Text>
          <Text className="mt-1 text-sm font-semibold text-muted">
            {item.dueDate ? `Due ${formatDate(item.dueDate)}` : "No due date"}{item.overdueDays ? ` · ${item.overdueDays} days overdue` : ""}
          </Text>
          {item.lastFollowUpAt ? <Text className="mt-1 text-xs font-bold text-muted">Last follow-up {formatDate(item.lastFollowUpAt)}</Text> : null}
          <Text className="mt-3 text-sm font-semibold text-dark">{item.nextSuggestedAction}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            void shareToWhatsApp(reminderMessage(item));
            if (item.contactId) followUpMutation.mutate();
          }}
          className="flex-row items-center gap-2 rounded-full border border-border bg-background-soft px-3 py-2"
        >
          <MessageCircle color={theme.primary} size={15} />
          <Text className="text-xs font-bold text-dark">WhatsApp</Text>
        </TouchableOpacity>
        {item.loanId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("SendEmail", { kind: "OVERDUE_REMINDER", loanId: item.loanId })}
            className="flex-row items-center gap-2 rounded-full border border-border bg-background-soft px-3 py-2"
          >
            <Mail color={theme.primary} size={15} />
            <Text className="text-xs font-bold text-dark">Email</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("FollowUpTimeline", { contactId: item.contactId, loanId: item.loanId })}
          className="flex-row items-center gap-2 rounded-full border border-border bg-background-soft px-3 py-2"
        >
          <Clock color={theme.primary} size={15} />
          <Text className="text-xs font-bold text-dark">Follow-up</Text>
        </TouchableOpacity>
        {item.loanId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("QuickAddPayment", { loanId: item.loanId, contactId: item.contactId })}
            className="flex-row items-center gap-2 rounded-full border border-border bg-background-soft px-3 py-2"
          >
            <Plus color={theme.primary} size={15} />
            <Text className="text-xs font-bold text-dark">Payment</Text>
          </TouchableOpacity>
        ) : null}
        {item.contactId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ContactLoanProfile", { contactId: item.contactId! })}
            className="flex-row items-center gap-2 rounded-full border border-border bg-background-soft px-3 py-2"
          >
            <UserRound color={theme.primary} size={15} />
            <Text className="text-xs font-bold text-dark">Profile</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const RecoverySection = ({ title, items }: { title: string; items: RecoveryItem[] }) => {
  if (!items.length) return null;
  return (
    <View className="gap-3">
      <Text className="text-lg font-black text-dark">{title}</Text>
      {items.map((item) => <RecoveryCard key={item.id} item={item} />)}
    </View>
  );
};

export const RecoveryCenterScreen = () => {
  const { theme } = useAppTheme();
  const recoveryQuery = useQuery({ queryKey: ["recovery", "center"], queryFn: api.getRecoveryCenter });
  const navigation = useNavigation<Navigation>();
  const [filter, setFilter] = useState<RecoveryFilter>("ALL");

  if (recoveryQuery.isLoading) return <Screen><LoadingState label="Checking recovery actions..." /></Screen>;
  if (recoveryQuery.isError) return <Screen><ErrorState message="Recovery Center load nahi ho saka." onRetry={recoveryQuery.refetch} /></Screen>;

  const data = recoveryQuery.data;
  const totalAttention =
    (data?.todayDueLoans.length || 0) +
    (data?.overdueLoans.length || 0) +
    (data?.promiseDue.length || 0) +
    (data?.highPendingContacts.length || 0);
  const show = (section: RecoveryFilter) => filter === "ALL" || filter === section;

  return (
    <Screen className="gap-6 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Recovery Center</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Aaj kis contact par action lena hai, clear view.</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <AlertTriangle color={totalAttention ? theme.primaryDark : theme.success} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">{totalAttention} items need attention</Text>
            <Text className="mt-1 text-sm font-medium text-muted">{data?.noActionNeededSummary.message}</Text>
          </View>
        </View>
        <View className="mt-4">
          <AppButton title="Add Quick Payment" icon={Plus} variant="secondary" onPress={() => navigation.navigate("QuickAddPayment")} />
        </View>
      </View>

      {data?.noActionNeededSummary.clear ? (
        <EmptyState title="Everything is clear" subtitle="No recovery action needed right now." />
      ) : null}

      <FormSelect label="Filter" value={filter} options={filterOptions} onChange={setFilter} />

      {show("TODAY_DUE") ? <RecoverySection title="Due Today" items={data?.todayDueLoans || []} /> : null}
      {show("OVERDUE") ? <RecoverySection title="Overdue" items={data?.overdueLoans || []} /> : null}
      {show("PROMISE_DUE") ? <RecoverySection title="Promises Due" items={data?.promiseDue || []} /> : null}
      {show("HIGH_PENDING") ? <RecoverySection title="High Pending Contacts" items={data?.highPendingContacts || []} /> : null}
      {show("REMINDER_SUGGESTED") ? <RecoverySection title="Reminder Suggested" items={data?.reminderSuggested || []} /> : null}
      {show("RECENTLY_PAID") ? <RecoverySection title="Recently Paid" items={data?.recentlyPaid || []} /> : null}
    </Screen>
  );
};
