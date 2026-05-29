import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, MessageSquareText, Plus, Trash2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const ReminderTemplatesScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const templatesQuery = useQuery({ queryKey: ["reminderTemplates"], queryFn: () => api.getReminderTemplates({ limit: 100 }) });

  const deleteMutation = useMutation({
    mutationFn: api.deleteReminderTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminderTemplates"] });
    },
  });

  const confirmDelete = (id: string) => {
    showAlert({
      title: "Delete template",
      message: "Ye reminder template remove ho jayega.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ],
    });
  };

  if (templatesQuery.isLoading) return <Screen><LoadingState label="Loading templates..." /></Screen>;
  if (templatesQuery.isError) return <Screen><ErrorState message="Templates load nahi ho sake." onRetry={templatesQuery.refetch} /></Screen>;

  const templates = templatesQuery.data?.templates || [];

  return (
    <Screen className="pt-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-2xl font-black text-dark">Reminder Templates</Text>
          <Text className="mt-1 text-sm font-medium text-muted">WhatsApp, email aur copy messages customize karein.</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("CreateEditReminderTemplate")}
          className="h-11 w-11 items-center justify-center rounded-lg bg-primary"
        >
          <Plus color={theme.white} size={21} />
        </TouchableOpacity>
      </View>

      {deleteMutation.isError ? <Text className="mt-4 text-sm font-semibold text-danger">{getErrorMessage(deleteMutation.error)}</Text> : null}

      <View className="mt-5 gap-3">
        {templates.length ? (
          templates.map((template) => (
            <View key={template._id} className="rounded-lg border border-border bg-card p-4" style={theme.shadowSoft}>
              <View className="flex-row items-start gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-lg bg-peach">
                  <MessageSquareText color={theme.primaryDark} size={20} />
                </View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-base font-black text-dark">{template.name}</Text>
                    {template.isDefault ? <StatusBadge value="DEFAULT" /> : null}
                  </View>
                  <Text className="mt-1 text-xs font-black uppercase text-muted">
                    {template.channel} · {template.language} · {template.tone}
                  </Text>
                  <Text numberOfLines={3} className="mt-3 text-sm font-medium leading-5 text-muted">
                    {template.bodyTemplate}
                  </Text>
                </View>
                <View className="gap-2">
                  <TouchableOpacity
                    className="h-9 w-9 items-center justify-center rounded-lg bg-background-soft"
                    onPress={() => navigation.navigate("CreateEditReminderTemplate", { templateId: template._id })}
                  >
                    <Edit3 color={theme.primary} size={17} />
                  </TouchableOpacity>
                  {!template.isDefault ? (
                    <TouchableOpacity
                      className="h-9 w-9 items-center justify-center rounded-lg bg-peach"
                      onPress={() => confirmDelete(template._id)}
                    >
                      <Trash2 color={theme.danger} size={17} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        ) : (
          <EmptyState title="No templates" subtitle="Create template se apna reminder message banayein." />
        )}
      </View>

      <View className="mt-5">
        <AppButton title="Create Template" icon={Plus} onPress={() => navigation.navigate("CreateEditReminderTemplate")} />
      </View>
    </Screen>
  );
};
