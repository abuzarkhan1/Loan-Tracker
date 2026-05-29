import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RotateCcw } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate, formatTime } from "../../utils/format";

export const EmailLogsScreen = () => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const logsQuery = useQuery({ queryKey: ["email", "logs"], queryFn: () => api.getEmailLogs({ limit: 50 }) });
  const retryMutation = useMutation({
    mutationFn: api.retryEmail,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["email", "logs"] });
    },
  });

  if (logsQuery.isLoading) return <Screen><LoadingState label="Loading email logs..." /></Screen>;
  if (logsQuery.isError) return <Screen><ErrorState message="Email logs load nahi ho sake." onRetry={logsQuery.refetch} /></Screen>;

  const logs = logsQuery.data?.logs || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Email Logs</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Queued, sent aur failed email history.</Text>
      </View>

      <View className="mt-5 gap-3">
        {logs.length ? (
          logs.map((log) => (
            <View key={log._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 flex-row items-start gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                    <Mail color={theme.primaryDark} size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-black uppercase text-muted">{log.type.replace(/_/g, " ")}</Text>
                    <Text className="mt-1 text-base font-black text-dark">{log.subject}</Text>
                    <Text className="mt-1 text-sm font-semibold text-muted">{log.toEmail}</Text>
                    <Text className="mt-2 text-xs font-bold text-primary">
                      {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                    </Text>
                    {log.error ? <Text className="mt-2 text-xs font-semibold text-danger">{log.error}</Text> : null}
                    {log.status === "FAILED" ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => retryMutation.mutate(log._id)}
                        className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-border bg-background-soft px-3 py-2"
                      >
                        <RotateCcw color={theme.primary} size={14} />
                        <Text className="text-xs font-bold text-dark">Retry</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <StatusBadge value={log.status} />
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No email logs" subtitle="Email send karne ke baad history yahan show hogi." />
        )}
      </View>
    </Screen>
  );
};
