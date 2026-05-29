import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "RestoreConfirmation">;

export const RestoreConfirmationScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"MERGE" | "REPLACE">("MERGE");
  const { backupId } = route.params;
  const backupQuery = useQuery({ queryKey: ["backup", backupId], queryFn: () => api.getBackup(backupId) });
  const restoreMutation = useMutation({
    mutationFn: () => api.restoreBackup(backupId, mode),
    onSuccess: async () => {
      queryClient.clear();
      navigation.navigate("MainTabs", { screen: "Dashboard" });
    },
  });

  if (backupQuery.isLoading) return <Screen><LoadingState label="Loading backup..." /></Screen>;
  if (backupQuery.isError || !backupQuery.data) return <Screen><ErrorState message="Backup load nahi ho saka." onRetry={backupQuery.refetch} /></Screen>;

  const backup = backupQuery.data;
  return (
    <Screen className="pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
          <DatabaseBackup color={theme.primaryDark} size={26} />
        </View>
        <Text className="mt-4 text-2xl font-black text-dark">Restore Backup</Text>
        <Text className="mt-2 text-sm font-semibold text-muted">{formatDate(backup.createdAt)}</Text>
        <Text className="mt-4 text-sm font-medium leading-6 text-muted">
          Merge keeps current data and adds backup data. Replace removes current account data first, then restores this backup.
        </Text>
      </View>

      <View className="mt-5 flex-row gap-3">
        {(["MERGE", "REPLACE"] as const).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setMode(item)}
            className="flex-1 rounded-2xl border p-4"
            style={{ borderColor: mode === item ? theme.primary : theme.border, backgroundColor: mode === item ? theme.peach : theme.card }}
          >
            <Text style={{ color: mode === item ? theme.primaryDark : theme.text, fontWeight: "900", textAlign: "center" }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {restoreMutation.isError ? <Text className="mt-4 text-sm font-bold text-danger">{getErrorMessage(restoreMutation.error)}</Text> : null}

      <View className="mt-6">
        <AppButton
          title={mode === "REPLACE" ? "Replace & Restore" : "Merge Backup"}
          icon={DatabaseBackup}
          loading={restoreMutation.isPending}
          onPress={() => restoreMutation.mutate()}
        />
      </View>
    </Screen>
  );
};
