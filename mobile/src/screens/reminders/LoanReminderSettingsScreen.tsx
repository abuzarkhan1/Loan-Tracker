import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Clock, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "LoanReminderSettings">;
const frequencies = ["DAILY", "EVERY_2_DAYS", "WEEKLY"] as const;
const tones = ["POLITE", "NORMAL", "STRICT"] as const;

export const LoanReminderSettingsScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { loanId } = route.params;
  const reminderQuery = useQuery({ queryKey: ["loan", loanId, "reminder"], queryFn: () => api.getLoanReminder(loanId) });
  const previewQuery = useQuery({ queryKey: ["loan", loanId, "reminder-preview"], queryFn: () => api.previewLoanReminder(loanId) });
  const [enabled, setEnabled] = useState(true);
  const [remindBeforeDays, setRemindBeforeDays] = useState("1");
  const [repeatUntilPaid, setRepeatUntilPaid] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<(typeof frequencies)[number]>("DAILY");
  const [tone, setTone] = useState<(typeof tones)[number]>("NORMAL");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (!reminderQuery.data) return;
    setEnabled(reminderQuery.data.enabled);
    setRemindBeforeDays(String(reminderQuery.data.remindBeforeDays));
    setRepeatUntilPaid(reminderQuery.data.repeatUntilPaid);
    setRepeatFrequency(reminderQuery.data.repeatFrequency);
    setTone(reminderQuery.data.tone);
    setCustomMessage(reminderQuery.data.customMessage || "");
  }, [reminderQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateLoanReminder(loanId, {
      enabled,
      remindBeforeDays: Number(remindBeforeDays || 0),
      repeatUntilPaid,
      repeatFrequency,
      tone,
      customMessage,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId, "reminder"] });
      await queryClient.invalidateQueries({ queryKey: ["loan", loanId, "reminder-preview"] });
    },
  });

  const testMutation = useMutation({ mutationFn: () => api.testLoanReminder(loanId) });
  const snoozeMutation = useMutation({
    mutationFn: () => {
      const snoozedUntil = new Date();
      snoozedUntil.setDate(snoozedUntil.getDate() + 1);
      return api.snoozeLoanReminder(loanId, snoozedUntil.toISOString());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loan", loanId, "reminder"] }),
  });

  if (reminderQuery.isLoading) return <Screen><LoadingState label="Loading loan reminder..." /></Screen>;
  if (reminderQuery.isError) return <Screen><ErrorState message="Loan reminder load nahi ho saka." onRetry={reminderQuery.refetch} /></Screen>;

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Loan Reminder</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Per-loan reminder tone, repeat aur snooze.</Text>
      </View>

      <View className="mt-5 gap-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-peach">
              <BellRing color={theme.primaryDark} size={22} />
            </View>
            <View>
              <Text className="text-base font-black text-dark">Enable reminder</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">Stop automatically after completed.</Text>
            </View>
          </View>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: theme.primary, false: theme.border }} thumbColor={theme.white} />
        </View>

        <View>
          <Text className="text-xs font-black uppercase text-muted">Remind before days</Text>
          <TextInput
            value={remindBeforeDays}
            onChangeText={setRemindBeforeDays}
            keyboardType="number-pad"
            className="mt-2 rounded-2xl border border-border bg-background-soft px-4 py-4 text-base text-dark"
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-dark">Repeat until paid</Text>
          <Switch value={repeatUntilPaid} onValueChange={setRepeatUntilPaid} trackColor={{ true: theme.primary, false: theme.border }} thumbColor={theme.white} />
        </View>

        <View>
          <Text className="mb-3 text-xs font-black uppercase text-muted">Repeat frequency</Text>
          <View className="flex-row flex-wrap gap-2">
            {frequencies.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setRepeatFrequency(item)}
                className="rounded-full border px-4 py-3"
                style={{ borderColor: repeatFrequency === item ? theme.primary : theme.border, backgroundColor: repeatFrequency === item ? theme.peach : theme.card }}
              >
                <Text style={{ color: repeatFrequency === item ? theme.primaryDark : theme.muted, fontWeight: "800" }}>{item.replace(/_/g, " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="mb-3 text-xs font-black uppercase text-muted">Tone</Text>
          <View className="flex-row flex-wrap gap-2">
            {tones.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTone(item)}
                className="rounded-full border px-4 py-3"
                style={{ borderColor: tone === item ? theme.primary : theme.border, backgroundColor: tone === item ? theme.peach : theme.card }}
              >
                <Text style={{ color: tone === item ? theme.primaryDark : theme.muted, fontWeight: "800" }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs font-black uppercase text-muted">Custom message</Text>
          <TextInput
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
            placeholder="Optional custom message"
            placeholderTextColor={theme.placeholder}
            className="mt-2 min-h-[96px] rounded-2xl border border-border bg-background-soft px-4 py-4 text-base text-dark"
          />
        </View>
      </View>

      <View className="mt-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-3">
          <Clock color={theme.primary} size={20} />
          <Text className="text-base font-black text-dark">Preview</Text>
        </View>
        <Text className="mt-3 text-sm font-bold text-dark">{previewQuery.data?.title || "Loan Reminder"}</Text>
        <Text className="mt-2 text-sm font-semibold leading-6 text-muted">{previewQuery.data?.body || "Preview will update after saving."}</Text>
        <Text className="mt-3 text-xs font-bold text-primary">Next: {formatDate(reminderQuery.data?.nextReminderAt)}</Text>
      </View>

      {(saveMutation.isError || testMutation.isError || snoozeMutation.isError) ? (
        <Text className="mt-4 text-sm font-bold text-danger">{getErrorMessage(saveMutation.error || testMutation.error || snoozeMutation.error)}</Text>
      ) : null}

      <View className="mt-5 gap-3">
        <AppButton title="Save Reminder" icon={Save} loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
        <AppButton title="Test Message" icon={BellRing} variant="secondary" loading={testMutation.isPending} onPress={() => testMutation.mutate()} />
        <AppButton title="Snooze 1 Day" variant="secondary" loading={snoozeMutation.isPending} onPress={() => snoozeMutation.mutate()} />
      </View>
    </Screen>
  );
};
