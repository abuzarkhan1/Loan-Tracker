import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type WeekDay = "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

const weekDays: { label: string; value: WeekDay }[] = [
  { label: "Sun", value: "SUNDAY" },
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
];

const ToggleRow = ({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  const { theme } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between gap-4 py-2">
      <View className="flex-1">
        <Text className="text-base font-bold text-dark">{title}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: theme.peach }}
        thumbColor={value ? theme.primary : theme.muted}
      />
    </View>
  );
};

export const EmailReportsSettingsScreen = () => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const prefsQuery = useQuery({ queryKey: ["email", "preferences"], queryFn: api.getEmailPreferences });
  const [form, setForm] = useState({
    emailReportsEnabled: false,
    weeklySummaryEnabled: false,
    weeklySummaryDay: "MONDAY" as WeekDay,
    weeklySummaryTime: "09:00",
    monthlyReportEnabled: false,
    monthlyReportDay: "1",
    overdueEmailEnabled: false,
    receiptEmailEnabled: true,
    defaultRecipientEmail: "",
  });

  useEffect(() => {
    if (prefsQuery.data) {
      setForm({
        emailReportsEnabled: prefsQuery.data.emailReportsEnabled,
        weeklySummaryEnabled: prefsQuery.data.weeklySummaryEnabled,
        weeklySummaryDay: prefsQuery.data.weeklySummaryDay,
        weeklySummaryTime: prefsQuery.data.weeklySummaryTime,
        monthlyReportEnabled: prefsQuery.data.monthlyReportEnabled,
        monthlyReportDay: String(prefsQuery.data.monthlyReportDay),
        overdueEmailEnabled: prefsQuery.data.overdueEmailEnabled,
        receiptEmailEnabled: prefsQuery.data.receiptEmailEnabled,
        defaultRecipientEmail: prefsQuery.data.defaultRecipientEmail || "",
      });
    }
  }, [prefsQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      api.updateEmailPreferences({
        ...form,
        monthlyReportDay: Number(form.monthlyReportDay),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["email"] });
    },
  });

  if (prefsQuery.isLoading) return <Screen><LoadingState label="Loading email settings..." /></Screen>;
  if (prefsQuery.isError) return <Screen><ErrorState message="Email settings load nahi ho sakin." onRetry={prefsQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Email Reports</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Statements, receipts aur reminders email se bhejein.</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <Mail color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Email Preferences</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Default recipient aur automated summaries.</Text>
          </View>
        </View>

        <View className="mt-5 gap-3">
          <ToggleRow
            title="Enable email reports"
            subtitle="Manual aur scheduled email features active karein."
            value={form.emailReportsEnabled}
            onChange={(emailReportsEnabled) => setForm((prev) => ({ ...prev, emailReportsEnabled }))}
          />
          <View className="h-px bg-border" />
          <ToggleRow
            title="Weekly summary"
            subtitle="Har week financial snapshot email."
            value={form.weeklySummaryEnabled}
            onChange={(weeklySummaryEnabled) => setForm((prev) => ({ ...prev, weeklySummaryEnabled }))}
          />
          <FormSelect
            label="Weekly day"
            value={form.weeklySummaryDay}
            options={weekDays}
            onChange={(weeklySummaryDay) => setForm((prev) => ({ ...prev, weeklySummaryDay }))}
          />
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Weekly Time</Text>
            <TextInput
              value={form.weeklySummaryTime}
              onChangeText={(weeklySummaryTime) => setForm((prev) => ({ ...prev, weeklySummaryTime }))}
              placeholder="09:00"
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
          <View className="h-px bg-border" />
          <ToggleRow
            title="Monthly report"
            subtitle="Mahine ke end par statement reminder."
            value={form.monthlyReportEnabled}
            onChange={(monthlyReportEnabled) => setForm((prev) => ({ ...prev, monthlyReportEnabled }))}
          />
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Monthly Report Day</Text>
            <TextInput
              value={form.monthlyReportDay}
              onChangeText={(monthlyReportDay) => setForm((prev) => ({ ...prev, monthlyReportDay }))}
              placeholder="1"
              placeholderTextColor={theme.placeholder}
              keyboardType="numeric"
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
          <ToggleRow
            title="Overdue email reminder"
            subtitle="Overdue loans ke liye email action available rakhein."
            value={form.overdueEmailEnabled}
            onChange={(overdueEmailEnabled) => setForm((prev) => ({ ...prev, overdueEmailEnabled }))}
          />
          <ToggleRow
            title="Receipt email"
            subtitle="Payment aur settlement receipts email karein."
            value={form.receiptEmailEnabled}
            onChange={(receiptEmailEnabled) => setForm((prev) => ({ ...prev, receiptEmailEnabled }))}
          />
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Default Recipient Email</Text>
            <TextInput
              value={form.defaultRecipientEmail}
              onChangeText={(defaultRecipientEmail) => setForm((prev) => ({ ...prev, defaultRecipientEmail }))}
              placeholder="person@example.com"
              placeholderTextColor={theme.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
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
        </View>
      </View>

      {mutation.isError ? (
        <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text>
      ) : null}

      <AppButton title="Save Email Settings" icon={Save} loading={mutation.isPending} onPress={() => mutation.mutate()} />

      <Text style={{ color: theme.muted, fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 18 }}>
        SMTP/provider setup backend env se hota hai. App credentials kabhi mobile mein store nahi karta.
      </Text>
    </Screen>
  );
};
