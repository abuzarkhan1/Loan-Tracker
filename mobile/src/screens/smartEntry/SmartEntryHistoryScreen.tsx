import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate } from "../../utils/format";

export const SmartEntryHistoryScreen = () => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["smart-entry", "history"], queryFn: () => api.getSmartEntryHistory({ limit: 50 }) });
  const deleteMutation = useMutation({
    mutationFn: api.deleteSmartEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["smart-entry"] }),
  });
  if (query.isLoading) return <Screen><LoadingState label="Loading smart entries..." /></Screen>;
  if (query.isError) return <Screen><ErrorState message="Smart entry history load nahi ho saki." onRetry={query.refetch} /></Screen>;
  return (
    <Screen className="gap-4 pt-5">
      <Text className="text-2xl font-black text-dark">Smart Entry History</Text>
      {query.data?.entries.length ? query.data.entries.map((entry) => (
        <View key={entry._id} className="rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-black text-dark">{entry.transcriptSaved ? entry.originalText : "Transcript not saved"}</Text>
              <Text className="mt-1 text-xs font-bold uppercase text-muted">{entry.intent} • {entry.status} • {formatDate(entry.createdAt)}</Text>
              {entry.createdEntityType ? (
                <Text className="mt-1 text-xs font-semibold text-muted">Created: {entry.createdEntityType}</Text>
              ) : null}
              <Text className="mt-1 text-[10px] font-black uppercase text-muted">Audio stored: {entry.audioStored ? "Yes" : "No"}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.86} onPress={() => deleteMutation.mutate(entry._id)} className="h-10 w-10 items-center justify-center rounded-full bg-background-soft">
              <Trash2 color={theme.danger} size={17} />
            </TouchableOpacity>
          </View>
        </View>
      )) : <EmptyState title="No smart entries" subtitle="Text ya voice command parse karein." />}
    </Screen>
  );
};
