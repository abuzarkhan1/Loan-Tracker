import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BookOpen, FileText, HandCoins, Heart, Landmark, Link2, Mail, MessageSquareText, Plus, ReceiptText, Share2, ShieldCheck, UserRoundCog } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AmountText } from "../../components/AmountText";
import { AppButton } from "../../components/AppButton";
import { LoanCard } from "../../components/LoanCard";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { SummaryCard } from "../../components/SummaryCard";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatCurrency, formatDate } from "../../utils/format";
import { shareToWhatsApp } from "../../utils/share";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ContactLoanProfile">;

const sourceLabel = (source?: string) => source === "DEVICE_CONTACT" ? "Phone Contact" : "Manual";

export const ContactLoanProfileScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { contactId } = route.params;
  const contactQuery = useQuery({ queryKey: ["contact", contactId], queryFn: () => api.getContact(contactId) });
  const trustQuery = useQuery({ queryKey: ["contact", contactId, "trust"], queryFn: () => api.getContactTrustProfile(contactId) });
  const activityQuery = useQuery({ queryKey: ["activity", "contact", contactId], queryFn: () => api.getRecentActivity({ contactId, limit: 5 }) });
  const relationshipQuery = useQuery({ queryKey: ["contact", contactId, "relationship"], queryFn: () => api.getContactRelationship(contactId) });
  const promisesQuery = useQuery({ queryKey: ["promises", "contact", contactId], queryFn: () => api.getContactPromises(contactId) });
  const followUpsQuery = useQuery({ queryKey: ["followUps", "contact", contactId], queryFn: () => api.getContactFollowUps(contactId) });
  const communicationsQuery = useQuery({ queryKey: ["communications", contactId, "preview"], queryFn: () => api.getCommunicationTimeline(contactId, { limit: 5 }) });

  const favoriteMutation = useMutation({
    mutationFn: (isFavorite: boolean) => api.setContactFavorite(contactId, isFavorite),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const receiptMutation = useMutation({
    mutationFn: () => api.createContactReceipt(contactId),
    onSuccess: async (receipt) => {
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
      navigation.navigate("ReceiptPreview", { receiptId: receipt._id });
    },
  });

  const handleShare = () => {
    if (!contactQuery.data) return;
    const { contact, summary } = contactQuery.data;
    void shareToWhatsApp([
      `Contact Ledger - ${contact.name}`,
      `Total Diya: ${formatCurrency(summary.totalGiven)}`,
      `Total Liya: ${formatCurrency(summary.totalTaken)}`,
      `Total Wapis Mila: ${formatCurrency(summary.totalReceivedBack)}`,
      `Total Wapis Diya: ${formatCurrency(summary.totalPaidBack)}`,
      `Net Balance: ${formatCurrency(summary.overallBalance)}`,
    ].join("\n"));
  };

  if (contactQuery.isLoading) return <Screen><LoadingState label="Loading contact profile..." /></Screen>;
  if (contactQuery.isError || !contactQuery.data) {
    return <Screen><ErrorState message="Contact profile load nahi ho saka." onRetry={contactQuery.refetch} /></Screen>;
  }

  const { contact, summary, recentLoans } = contactQuery.data;
  const activeLoans = recentLoans.filter((loan) => loan.remainingAmount > 0);
  const trust = trustQuery.data;
  const relationship = relationshipQuery.data;
  const promises = promisesQuery.data?.promises || [];
  const followUps = followUpsQuery.data?.followUps || [];
  const communications = communicationsQuery.data?.items || [];
  const firstActiveLoan = activeLoans[0];

  return (
    <Screen className="pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
              <Text className="text-lg font-black text-primary">{contact.name.trim().charAt(0).toUpperCase()}</Text>
            </View>
            <Text className="mt-4 text-2xl font-black text-dark">{contact.name}</Text>
            <Text className="mt-2 text-sm font-semibold text-muted">{contact.phone || contact.email || "No phone or email"}</Text>
            <View className="mt-3 self-start rounded-full bg-background-soft px-3 py-1">
              <Text className="text-[10px] font-black uppercase text-muted">{sourceLabel(contact.source)}</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => favoriteMutation.mutate(!contact.isFavorite)}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background-soft"
          >
            <Heart color={theme.primary} fill={contact.isFavorite ? theme.primary : "transparent"} size={20} />
          </TouchableOpacity>
        </View>

        <View className="mt-5 rounded-2xl bg-background-soft p-4">
          <Text className="text-xs font-black uppercase text-muted">Net Balance</Text>
          <AmountText
            amount={summary.overallBalance}
            className="mt-1 text-2xl font-black"
            style={{ color: summary.overallBalance >= 0 ? theme.success : theme.danger, fontFamily: fontFamily.extraBold }}
          />
          <Text className="mt-1 text-xs font-semibold text-muted">
            Positive ka matlab mujhe lene hain, negative ka matlab mujhe dene hain.
          </Text>
        </View>

        {(receiptMutation.isError || favoriteMutation.isError) ? (
          <Text className="mt-3 text-sm font-semibold text-danger">
            {getErrorMessage(receiptMutation.error || favoriteMutation.error)}
          </Text>
        ) : null}
      </View>

      <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
        <SummaryCard label="Total Diya" value={formatCurrency(summary.totalGiven)} icon={Landmark} tone="success" />
        <SummaryCard label="Total Liya" value={formatCurrency(summary.totalTaken)} icon={Landmark} tone="danger" />
        <SummaryCard label="Wapis Mila" value={formatCurrency(summary.totalReceivedBack)} icon={Landmark} tone="primary" />
        <SummaryCard label="Wapis Diya" value={formatCurrency(summary.totalPaidBack)} icon={Landmark} tone="warning" />
      </View>

      <View className="mt-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
            <ShieldCheck color={trust?.label === "RISKY" ? theme.danger : theme.success} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-dark">Trust Profile</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">
              {trust ? `${trust.label} - Score ${trust.trustScore}/100` : "Calculating trust profile..."}
            </Text>
          </View>
        </View>
        {trust ? <Text className="mt-4 text-sm font-medium leading-6 text-muted">{trust.summary}</Text> : null}
        <View className="mt-4">
          <AppButton title="View Trust Report" icon={ShieldCheck} variant="secondary" onPress={() => navigation.navigate("ContactTrustReport", { contactId })} />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate("ContactRelationshipSettings", { contactId })}
        className="mt-5 rounded-3xl border border-border bg-card p-5"
        style={theme.shadowSoft}
      >
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
            <UserRoundCog color={theme.primary} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-dark">Relationship Notes</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">
              {relationship?.preferredReminderChannel || "WHATSAPP"} · {relationship?.preferredReminderTone || "POLITE"} · {relationship?.preferredLanguage || "ROMAN_URDU"}
            </Text>
          </View>
        </View>
        {relationship?.privateNote ? <Text className="mt-4 text-sm font-medium leading-6 text-muted">{relationship.privateNote}</Text> : null}
      </TouchableOpacity>

      <View className="mt-5 grid gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Loan Given" icon={Plus} onPress={() => navigation.navigate("LoanForm", { contactId })} />
          </View>
          <View className="flex-1">
            <AppButton title="Loan Taken" icon={Plus} variant="secondary" onPress={() => navigation.navigate("LoanForm", { contactId })} />
          </View>
        </View>
        <AppButton title="Quick Add Payment" icon={ReceiptText} variant="secondary" onPress={() => navigation.navigate("QuickAddPayment", { contactId })} />
        <AppButton
          title="Payment Request"
          icon={Link2}
          variant="secondary"
          onPress={() => {
            if (firstActiveLoan) {
              navigation.navigate("PaymentRequestPreview", { loanId: firstActiveLoan._id });
            } else {
              showAlert({ title: "No active loan", message: "Payment request create karne ke liye active loan chahiye." });
            }
          }}
        />
        <AppButton title="Send Statement Email" icon={Mail} variant="secondary" onPress={() => navigation.navigate("SendEmail", { kind: "CONTACT_STATEMENT", contactId })} />
        <AppButton title="View Ledger" icon={BookOpen} variant="secondary" onPress={() => navigation.navigate("ContactLedger", { contactId })} />
        <AppButton title="Share Summary" icon={Share2} variant="secondary" onPress={handleShare} />
        <AppButton title="Relationship Notes" icon={UserRoundCog} variant="secondary" onPress={() => navigation.navigate("ContactRelationshipSettings", { contactId })} />
        <AppButton
          title="Generate Receipt"
          icon={FileText}
          variant="secondary"
          loading={receiptMutation.isPending}
          onPress={() => receiptMutation.mutate()}
        />
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Active Loans</Text>
        <Text className="text-xs font-black uppercase text-muted">{activeLoans.length} active</Text>
      </View>
      <View className="mt-4 gap-3">
        {activeLoans.length ? (
          activeLoans.map((loan) => (
            <LoanCard key={loan._id} loan={{ ...loan, contactId: contact }} onPress={() => navigation.navigate("LoanDetail", { loanId: loan._id })} />
          ))
        ) : (
          <EmptyState title="No active loans" subtitle="Is contact ka active hisaab clear hai." />
        )}
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Promises</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Promises", { contactId })}>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 gap-3">
        {promises.length ? promises.slice(0, 3).map((promise) => (
          <View key={promise._id} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-peach">
              <HandCoins color={theme.primaryDark} size={18} />
            </View>
            <View className="flex-1">
              <AmountText amount={promise.promisedAmount} className="text-sm font-black text-dark" />
              <Text className="mt-1 text-xs font-semibold text-muted">{promise.status} · {formatDate(promise.promiseDate)}</Text>
            </View>
          </View>
        )) : <EmptyState title="No promises" subtitle="Promise to Pay yahan show hoga." />}
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Follow-up History</Text>
        <TouchableOpacity onPress={() => navigation.navigate("FollowUpTimeline", { contactId })}>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 gap-3">
        {followUps.length ? followUps.slice(0, 3).map((item) => (
          <View key={item._id} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-background-soft">
              <MessageSquareText color={theme.primary} size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-dark">{item.channel.replace("_", " ")}</Text>
              <Text numberOfLines={1} className="mt-1 text-xs font-semibold text-muted">{item.note || item.message || item.type}</Text>
            </View>
          </View>
        )) : <EmptyState title="No follow-ups" subtitle="Calls aur reminders ka timeline yahan show hoga." />}
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Communication</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CommunicationTimeline", { contactId })}>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 gap-3">
        {communications.length ? communications.slice(0, 3).map((item) => (
          <View key={item.id} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-background-soft">
              <MessageSquareText color={theme.primary} size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-dark">{item.title}</Text>
              <Text numberOfLines={1} className="mt-1 text-xs font-semibold text-muted">{item.description}</Text>
            </View>
          </View>
        )) : <EmptyState title="No communication yet" subtitle="Emails, requests aur settlements yahan show honge." />}
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Recent Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate("RecentActivity", { contactId })}>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 gap-3">
        {activityQuery.data?.activities.length ? activityQuery.data.activities.map((item) => (
          <View key={item.id} className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-background-soft">
              <Activity color={theme.primary} size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-dark">{item.title}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{item.description} - {formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )) : <EmptyState title="No recent activity" subtitle="New activity yahan show hogi." />}
      </View>

      <View className="mt-4">
        <AppButton title="Edit Contact" variant="secondary" onPress={() => navigation.navigate("ContactForm", { contactId })} />
      </View>
    </Screen>
  );
};
