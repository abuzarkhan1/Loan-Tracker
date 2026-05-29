import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MessageCircle, Save } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { FollowUp } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatTime, toDateInput } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "FollowUpTimeline">;
type Channel = FollowUp["channel"];

const channelOptions: { label: string; value: Channel }[] = [
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Email", value: "EMAIL" },
  { label: "Call", value: "CALL" },
  { label: "SMS", value: "SMS" },
  { label: "In person", value: "IN_PERSON" },
  { label: "Copy", value: "COPY" },
];

export const FollowUpTimelineScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const params = route.params || {};
  const loanQuery = useQuery({
    queryKey: ["loan", params.loanId, "follow-up-context"],
    queryFn: () => api.getLoan(params.loanId!),
    enabled: Boolean(params.loanId && !params.contactId),
  });
  const derivedContactId = useMemo(() => {
    const contact = loanQuery.data?.loan.contactId;
    if (typeof contact === "object" && contact?._id) return contact._id;
    if (typeof contact === "string") return contact;
    return params.contactId;
  }, [loanQuery.data?.loan.contactId, params.contactId]);

  const [filter, setFilter] = useState<Channel | "ALL">("ALL");
  const [channel, setChannel] = useState<Channel>("WHATSAPP");
  const [note, setNote] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");

  const followUpsQuery = useQuery({
    queryKey: ["followUps", params.contactId, params.loanId, filter],
    queryFn: () =>
      api.getFollowUps({
        contactId: params.contactId,
        loanId: params.loanId,
        channel: filter === "ALL" ? undefined : filter,
        limit: 50,
      }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.createFollowUp({
        contactId: derivedContactId,
        loanId: params.loanId,
        channel,
        type: "REMINDER",
        status: channel === "CALL" ? "CALLED" : channel === "IN_PERSON" ? "DISCUSSED" : "SENT",
        note,
        nextFollowUpAt: nextFollowUpAt || undefined,
      }),
    onSuccess: async () => {
      setNote("");
      setNextFollowUpAt("");
      await queryClient.invalidateQueries({ queryKey: ["followUps"] });
      await queryClient.invalidateQueries({ queryKey: ["recovery"] });
      await queryClient.invalidateQueries({ queryKey: ["communications"] });
    },
  });

  if (followUpsQuery.isLoading) return <Screen><LoadingState label="Loading follow-ups..." /></Screen>;
  if (followUpsQuery.isError) return <Screen><ErrorState message="Follow-up history load nahi ho saki." onRetry={followUpsQuery.refetch} /></Screen>;

  const followUps = followUpsQuery.data?.followUps || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Follow-up Timeline</Text>
        <Text className="mt-1 text-sm font-medium text-muted">WhatsApp, email, call aur in-person recovery notes.</Text>
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Mark Followed Up</Text>
        <View className="mt-4 gap-4">
          <FormSelect label="Channel" value={channel} options={channelOptions} onChange={setChannel} />
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Call kiya, payment promise mila..."
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
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Next Follow-up Date</Text>
            <TextInput
              value={nextFollowUpAt}
              onChangeText={setNextFollowUpAt}
              placeholder={toDateInput(new Date())}
              placeholderTextColor={theme.placeholder}
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
          {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
          <AppButton
            title="Save Follow-up"
            icon={Save}
            loading={mutation.isPending}
            disabled={!derivedContactId}
            onPress={() => mutation.mutate()}
          />
        </View>
      </View>

      <View className="mt-6">
        <FormSelect
          label="Filter"
          value={filter}
          options={[{ label: "All", value: "ALL" }, ...channelOptions]}
          onChange={setFilter}
        />
      </View>

      <View className="mt-5 gap-3">
        {followUps.length ? (
          followUps.map((item) => (
            <View key={item._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                  <MessageCircle color={theme.primaryDark} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-sm font-black text-dark">{item.channel.replace("_", " ")}</Text>
                    <StatusBadge value={item.status} />
                  </View>
                  <Text className="mt-2 text-sm font-semibold text-muted">{item.note || item.message || item.type}</Text>
                  <Text className="mt-2 text-xs font-bold text-primary">{formatDate(item.createdAt)} · {formatTime(item.createdAt)}</Text>
                  {item.nextFollowUpAt ? (
                    <View className="mt-3 flex-row items-center gap-2">
                      <CalendarClock color={theme.warning} size={15} />
                      <Text className="text-xs font-bold text-muted">Next: {formatDate(item.nextFollowUpAt)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No follow-ups" subtitle="Recovery calls aur reminders yahan save honge." />
        )}
      </View>
    </Screen>
  );
};
