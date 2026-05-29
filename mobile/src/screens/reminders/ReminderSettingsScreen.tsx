import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CalendarClock, Clock3, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { api } from "../../api/client";
import { WeekDay } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormInput } from "../../components/FormInput";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { TimePickerField } from "../../components/TimePickerField";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import {
  getDeviceTimezone,
  getNotificationPermissionStatus,
  registerForPushNotificationsAsync,
} from "../../services/notifications";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ReminderSettings">;

const weekDays: { label: string; value: WeekDay }[] = [
  { label: "Sun", value: "SUNDAY" },
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
];

const reminderSchema = z.object({
  dueSoonEnabled: z.boolean(),
  dueSoonDaysBefore: z.string().regex(/^\d+$/, "Enter days as a number").refine((value) => Number(value) <= 30, "Maximum 30 days"),
  overdueEnabled: z.boolean(),
  dailySummaryEnabled: z.boolean(),
  dailySummaryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  weeklySummaryEnabled: z.boolean(),
  weeklySummaryDay: z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]),
  weeklySummaryTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  timezone: z.string().min(1),
});

type ReminderValues = z.infer<typeof reminderSchema>;

const defaultValues: ReminderValues = {
  dueSoonEnabled: true,
  dueSoonDaysBefore: "2",
  overdueEnabled: true,
  dailySummaryEnabled: false,
  dailySummaryTime: "20:00",
  weeklySummaryEnabled: false,
  weeklySummaryDay: "SUNDAY",
  weeklySummaryTime: "20:00",
  timezone: getDeviceTimezone(),
};

const SettingsToggle = ({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  const { theme } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between gap-4">
      <View className="flex-1">
        <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 15 }}>{label}</Text>
        <Text style={{ color: theme.muted, fontFamily: fontFamily.medium, fontSize: 13, marginTop: 4 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={theme.white}
        trackColor={{ false: theme.border, true: theme.primary }}
      />
    </View>
  );
};

export const ReminderSettingsScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] = useState<string>("checking");
  const [pushError, setPushError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["reminder-settings"],
    queryFn: api.getReminderSettings,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues,
  });

  useEffect(() => {
    void getNotificationPermissionStatus().then(setPermissionStatus).catch(() => setPermissionStatus("unknown"));
  }, []);

  useEffect(() => {
    if (settingsQuery.data) {
      reset({
        dueSoonEnabled: settingsQuery.data.dueSoonEnabled,
        dueSoonDaysBefore: String(settingsQuery.data.dueSoonDaysBefore),
        overdueEnabled: settingsQuery.data.overdueEnabled,
        dailySummaryEnabled: settingsQuery.data.dailySummaryEnabled,
        dailySummaryTime: settingsQuery.data.dailySummaryTime,
        weeklySummaryEnabled: settingsQuery.data.weeklySummaryEnabled,
        weeklySummaryDay: settingsQuery.data.weeklySummaryDay,
        weeklySummaryTime: settingsQuery.data.weeklySummaryTime,
        timezone: settingsQuery.data.timezone || getDeviceTimezone(),
      });
    }
  }, [reset, settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: api.updateReminderSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminder-settings"] });
    },
  });

  const pushTokenMutation = useMutation({
    mutationFn: async () => {
      setPushError(null);
      const pushToken = await registerForPushNotificationsAsync();
      const timezone = getDeviceTimezone();
      return api.registerPushToken({ pushToken, timezone });
    },
    onSuccess: async () => {
      setPermissionStatus("granted");
      await queryClient.invalidateQueries({ queryKey: ["reminder-settings"] });
    },
    onError: (error) => {
      setPushError(getErrorMessage(error));
    },
  });

  const testMutation = useMutation({
    mutationFn: api.sendTestReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminder-logs"] });
    },
  });

  if (settingsQuery.isLoading) {
    return <Screen><LoadingState label="Loading reminder settings..." /></Screen>;
  }

  if (settingsQuery.isError) {
    return <Screen><ErrorState message="Reminder settings load nahi ho sakin." onRetry={settingsQuery.refetch} /></Screen>;
  }

  const dueSoonEnabled = watch("dueSoonEnabled");
  const dailySummaryEnabled = watch("dailySummaryEnabled");
  const weeklySummaryEnabled = watch("weeklySummaryEnabled");
  const weeklySummaryDay = watch("weeklySummaryDay");

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Reminder Settings</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Due date, overdue, aur summary notifications.</Text>
      </View>

      <View className="mt-6 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <BellRing color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Push Notifications</Text>
            <Text className="mt-1 text-sm font-medium text-muted">
              Status: {permissionStatus === "granted" ? "Enabled" : "Permission needed"}
            </Text>
          </View>
        </View>

        {pushError ? <Text className="mt-3 text-sm font-semibold text-danger">{pushError}</Text> : null}

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <AppButton
              title="Enable"
              icon={Bell}
              onPress={() => pushTokenMutation.mutate()}
              loading={pushTokenMutation.isPending}
            />
          </View>
          <View className="flex-1">
            <AppButton
              title="Test"
              icon={Send}
              variant="secondary"
              onPress={() => testMutation.mutate()}
              loading={testMutation.isPending}
            />
          </View>
        </View>
      </View>

      <View className="mt-5 gap-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Controller
          control={control}
          name="dueSoonEnabled"
          render={({ field: { value, onChange } }) => (
            <SettingsToggle
              label="Due Date Reminders"
              subtitle="Due date se pehle yaad dila dein."
              value={value}
              onChange={onChange}
            />
          )}
        />
        {dueSoonEnabled ? (
          <FormInput
            control={control}
            name="dueSoonDaysBefore"
            label="Remind me before X days"
            keyboardType="number-pad"
            error={errors.dueSoonDaysBefore?.message}
          />
        ) : null}

        <View className="h-px bg-border" />

        <Controller
          control={control}
          name="overdueEnabled"
          render={({ field: { value, onChange } }) => (
            <SettingsToggle
              label="Overdue Reminders"
              subtitle="Loan overdue ho jaye to notification."
              value={value}
              onChange={onChange}
            />
          )}
        />
      </View>

      <View className="mt-5 gap-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-background-soft">
            <CalendarClock color={theme.primary} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Summary Notifications</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Daily ya weekly hisaab ka quick overview.</Text>
          </View>
        </View>

        <Controller
          control={control}
          name="dailySummaryEnabled"
          render={({ field: { value, onChange } }) => (
            <SettingsToggle label="Daily Summary" subtitle="Har din summary bhejein." value={value} onChange={onChange} />
          )}
        />
        {dailySummaryEnabled ? (
          <Controller
            control={control}
            name="dailySummaryTime"
            render={({ field: { value, onChange } }) => (
              <TimePickerField label="Daily summary time" value={value} onChange={onChange} error={errors.dailySummaryTime?.message} />
            )}
          />
        ) : null}

        <View className="h-px bg-border" />

        <Controller
          control={control}
          name="weeklySummaryEnabled"
          render={({ field: { value, onChange } }) => (
            <SettingsToggle label="Weekly Summary" subtitle="Har haftay summary bhejein." value={value} onChange={onChange} />
          )}
        />
        {weeklySummaryEnabled ? (
          <View style={{ gap: 14 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Weekly summary day</Text>
              <View className="flex-row flex-wrap gap-2">
                {weekDays.map((day) => {
                  const selected = weeklySummaryDay === day.value;
                  return (
                    <TouchableOpacity
                      key={day.value}
                      activeOpacity={0.85}
                      onPress={() => setValue("weeklySummaryDay", day.value, { shouldDirty: true })}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? theme.primary : theme.pill,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                      }}
                    >
                      <Text style={{ color: selected ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <Controller
              control={control}
              name="weeklySummaryTime"
              render={({ field: { value, onChange } }) => (
                <TimePickerField
                  label="Weekly summary time"
                  value={value}
                  onChange={onChange}
                  error={errors.weeklySummaryTime?.message}
                />
              )}
            />
          </View>
        ) : null}
      </View>

      {(saveMutation.isError || testMutation.isError) ? (
        <Text className="mt-4 text-sm font-semibold text-danger">
          {getErrorMessage(saveMutation.error || testMutation.error)}
        </Text>
      ) : null}

      <View className="mt-6 gap-3">
        <AppButton
          title="Save Settings"
          icon={Clock3}
          loading={saveMutation.isPending}
          onPress={handleSubmit((values) =>
            saveMutation.mutate({
              ...values,
              dueSoonDaysBefore: Number(values.dueSoonDaysBefore),
            }),
          )}
        />
        <AppButton title="Notification History" variant="secondary" onPress={() => navigation.navigate("ReminderLogs")} />
      </View>
    </Screen>
  );
};
