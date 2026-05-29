import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react-native";
import { Text, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate, formatTime } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "CommunicationTimeline">;

export const CommunicationTimelineScreen = ({ route }: Props) => {
  const { theme } = useAppTheme();
  const { contactId } = route.params;
  const timelineQuery = useQuery({
    queryKey: ["communications", contactId],
    queryFn: () => api.getCommunicationTimeline(contactId, { limit: 80 }),
  });

  if (timelineQuery.isLoading) return <Screen><LoadingState label="Loading communication timeline..." /></Screen>;
  if (timelineQuery.isError) return <Screen><ErrorState message="Communication timeline load nahi ho saki." onRetry={timelineQuery.refetch} /></Screen>;

  const items = timelineQuery.data?.items || [];

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Communication Timeline</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Email, WhatsApp, promises, requests aur settlements.</Text>
      </View>

      <View className="mt-5 gap-3">
        {items.length ? (
          items.map((item) => (
            <View key={item.id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                  <MessageSquareText color={theme.primaryDark} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-xs font-black uppercase text-muted">{item.channel}</Text>
                    <StatusBadge value={item.status} />
                  </View>
                  <Text className="mt-2 text-base font-black text-dark">{item.title}</Text>
                  <Text className="mt-1 text-sm font-semibold text-muted">{item.description}</Text>
                  <Text className="mt-2 text-xs font-bold text-primary">{formatDate(item.createdAt)} · {formatTime(item.createdAt)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No communication yet" subtitle="Emails, follow-ups aur requests yahan show hongay." />
        )}
      </View>
    </Screen>
  );
};
