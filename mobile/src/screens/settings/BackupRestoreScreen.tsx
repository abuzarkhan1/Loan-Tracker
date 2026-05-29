import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ChevronRight, DatabaseBackup } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const BackupRestoreScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const backupsQuery = useQuery({ queryKey: ["backups"], queryFn: () => api.getBackups({ limit: 5 }) });
  const createMutation = useMutation({
    mutationFn: api.createBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  return (
    <Screen className="pt-5">
      <Text className="text-2xl font-black text-dark">Backup & Restore</Text>
      <Text className="mt-1 text-sm font-medium text-muted">Simple account backup for contacts, loans, payments and settings.</Text>

      <View className="mt-5 rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <DatabaseBackup color={theme.primaryDark} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-dark">Manual Backup</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Create a fresh snapshot now.</Text>
          </View>
        </View>
        {createMutation.isError ? <Text className="mt-3 text-sm font-bold text-danger">{getErrorMessage(createMutation.error)}</Text> : null}
        <View className="mt-5">
          <AppButton title="Create Backup Now" icon={Archive} loading={createMutation.isPending} onPress={() => createMutation.mutate()} />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-lg font-black text-dark">Recent Backups</Text>
        <TouchableOpacity onPress={() => navigation.navigate("BackupHistory")}>
          <Text className="text-xs font-bold text-primary">View All</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 gap-3">
        {backupsQuery.isLoading ? <LoadingState label="Loading backups..." /> : null}
        {backupsQuery.isError ? <ErrorState message="Backups load nahi ho sake." onRetry={backupsQuery.refetch} /> : null}
        {backupsQuery.data?.backups.length ? backupsQuery.data.backups.map((backup) => (
          <TouchableOpacity
            key={backup._id}
            activeOpacity={0.88}
            onPress={() => navigation.navigate("RestoreConfirmation", { backupId: backup._id })}
            className="flex-row items-center gap-4 rounded-3xl border border-border bg-card p-4"
            style={theme.shadowSoft}
          >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background-soft">
              <DatabaseBackup color={theme.primary} size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-black text-dark">{formatDate(backup.createdAt)}</Text>
              <Text className="mt-1 text-xs font-semibold text-muted">{backup.totalContacts} contacts - {backup.totalLoans} loans</Text>
            </View>
            <ChevronRight color={theme.muted} size={20} />
          </TouchableOpacity>
        )) : !backupsQuery.isLoading ? (
          <EmptyState title="No backups yet" subtitle="Create backup now se first snapshot banayein." />
        ) : null}
      </View>
    </Screen>
  );
};
