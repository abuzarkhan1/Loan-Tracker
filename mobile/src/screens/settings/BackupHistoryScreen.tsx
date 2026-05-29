import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const BackupHistoryScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const backupsQuery = useQuery({ queryKey: ["backups"], queryFn: () => api.getBackups({ limit: 50 }) });
  const deleteMutation = useMutation({
    mutationFn: api.deleteBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const confirmDelete = (backupId: string) => {
    showAlert({
      title: "Delete backup",
      message: "Yeh backup history se remove ho jayega.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(backupId) },
      ],
    });
  };

  if (backupsQuery.isLoading) return <Screen><LoadingState label="Loading backup history..." /></Screen>;
  if (backupsQuery.isError) return <Screen><ErrorState message="Backup history load nahi ho saki." onRetry={backupsQuery.refetch} /></Screen>;

  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Backup History</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Restore or delete old backups.</Text>
      <View className="mt-5 gap-3">
        {backupsQuery.data?.backups.length ? backupsQuery.data.backups.map((backup) => (
          <View key={backup._id} className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
            <TouchableOpacity className="flex-1 flex-row items-center gap-4" onPress={() => navigation.navigate("RestoreConfirmation", { backupId: backup._id })}>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
                <DatabaseBackup color={theme.primary} size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-dark">{formatDate(backup.createdAt)}</Text>
                <Text className="mt-1 text-xs font-semibold text-muted">{backup.totalContacts} contacts - {backup.totalLoans} loans - {backup.totalPayments} payments</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-xl bg-peach" onPress={() => confirmDelete(backup._id)}>
              <Trash2 color={theme.danger} size={18} />
            </TouchableOpacity>
          </View>
        )) : (
          <EmptyState title="No backups yet" subtitle="Backup & Restore screen se backup create karein." />
        )}
      </View>
    </Screen>
  );
};
