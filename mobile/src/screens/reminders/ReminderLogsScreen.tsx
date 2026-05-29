import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Bell, CircleCheck, CircleX, Clock3 } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { NotificationStatus } from "../../api/types";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate, formatTime } from "../../utils/format";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ReminderLogs">;

const getStatusMeta = (status: NotificationStatus, theme: ReturnType<typeof useAppTheme>["theme"]) => {
  if (status === "SENT") return { icon: CircleCheck, color: theme.success, bg: theme.mint, label: "Sent" };
  if (status === "FAILED") return { icon: CircleX, color: theme.danger, bg: theme.peach, label: "Failed" };
  return { icon: Clock3, color: theme.warning, bg: theme.yellow, label: "Pending" };
};

export const ReminderLogsScreen = (_props: Props) => {
  const { theme } = useAppTheme();
  const logsQuery = useQuery({
    queryKey: ["reminder-logs"],
    queryFn: () => api.getReminderLogs({ page: 1, limit: 50 }),
  });

  if (logsQuery.isLoading) {
    return <Screen><LoadingState label="Loading notifications..." /></Screen>;
  }

  if (logsQuery.isError || !logsQuery.data) {
    return <Screen><ErrorState message="Notification history load nahi ho saki." onRetry={logsQuery.refetch} /></Screen>;
  }

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Notification History</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Reminder status aur delivery logs.</Text>
      </View>

      <View className="mt-6 gap-3">
        {logsQuery.data.logs.length ? (
          logsQuery.data.logs.map((log) => {
            const StatusIcon = getStatusMeta(log.status, theme).icon;
            const status = getStatusMeta(log.status, theme);

            return (
              <View key={log._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
                <View className="flex-row items-start gap-4">
                  <View
                    className="h-11 w-11 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.backgroundSoft }}
                  >
                    <Bell color={theme.primary} size={21} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text style={{ color: theme.text, fontFamily: fontFamily.extraBold, fontSize: 15 }}>{log.title}</Text>
                        <Text style={{ color: theme.muted, fontFamily: fontFamily.medium, fontSize: 13, marginTop: 4 }}>
                          {log.body}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          backgroundColor: status.bg,
                        }}
                      >
                        <StatusIcon color={status.color} size={13} />
                        <Text style={{ color: status.color, fontFamily: fontFamily.extraBold, fontSize: 11 }}>{status.label}</Text>
                      </View>
                    </View>

                    <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 12, marginTop: 12 }}>
                      {log.type.replace("_", " ")} · {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                    </Text>
                    {log.error ? (
                      <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 12, marginTop: 8 }}>
                        {log.error}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState title="No reminder logs" subtitle="Test notification bhejein ya reminder settings enable karein." />
        )}
      </View>
    </Screen>
  );
};
