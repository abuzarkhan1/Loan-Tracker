import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { ReminderTemplate } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { showAlert } from "../../providers/AlertProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEditReminderTemplate">;

type TemplateType = ReminderTemplate["type"];
type Channel = ReminderTemplate["channel"];
type Language = ReminderTemplate["language"];
type Tone = ReminderTemplate["tone"];

const typeOptions: { label: string; value: TemplateType }[] = [
  { label: "Polite", value: "POLITE" },
  { label: "Normal", value: "NORMAL" },
  { label: "Strict", value: "STRICT" },
  { label: "Roman Urdu", value: "FRIENDLY_ROMAN_URDU" },
  { label: "English", value: "PROFESSIONAL_ENGLISH" },
  { label: "Short", value: "SHORT_WHATSAPP" },
  { label: "Email", value: "EMAIL_STYLE" },
];

const channelOptions: { label: string; value: Channel }[] = [
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Email", value: "EMAIL" },
  { label: "SMS", value: "SMS" },
  { label: "Copy", value: "COPY" },
];

const languageOptions: { label: string; value: Language }[] = [
  { label: "Roman Urdu", value: "ROMAN_URDU" },
  { label: "English", value: "ENGLISH" },
  { label: "Urdu Style", value: "URDU_STYLE" },
];

const toneOptions: { label: string; value: Tone }[] = [
  { label: "Polite", value: "POLITE" },
  { label: "Normal", value: "NORMAL" },
  { label: "Strict", value: "STRICT" },
  { label: "Friendly", value: "FRIENDLY" },
  { label: "Professional", value: "PROFESSIONAL" },
];

const inputStyle = (theme: ReturnType<typeof useAppTheme>["theme"], multiline = false) => ({
  minHeight: multiline ? 150 : 50,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: theme.border,
  backgroundColor: theme.input,
  color: theme.text,
  fontFamily: fontFamily.semiBold,
  fontSize: 15,
  paddingHorizontal: 18,
  paddingVertical: multiline ? 14 : 0,
  textAlignVertical: multiline ? "top" as const : "center" as const,
});

export const CreateEditReminderTemplateScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const templateId = route.params?.templateId;
  const templatesQuery = useQuery({ queryKey: ["reminderTemplates"], queryFn: () => api.getReminderTemplates({ limit: 100 }) });
  const loansQuery = useQuery({ queryKey: ["loans", "template-preview"], queryFn: () => api.getLoans({ limit: 1 }) });
  const existing = templatesQuery.data?.templates.find((template) => template._id === templateId);
  const [form, setForm] = useState({
    name: "",
    type: "POLITE" as TemplateType,
    channel: "WHATSAPP" as Channel,
    language: "ROMAN_URDU" as Language,
    tone: "POLITE" as Tone,
    subjectTemplate: "",
    bodyTemplate: "Assalam o alaikum {contactName}, {remainingAmount} baqi hai. Due date {dueDate} hai.",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        type: existing.type,
        channel: existing.channel,
        language: existing.language,
        tone: existing.tone,
        subjectTemplate: existing.subjectTemplate || "",
        bodyTemplate: existing.bodyTemplate,
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, isDefault: false };
      return templateId ? api.updateReminderTemplate(templateId, payload) : api.createReminderTemplate(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminderTemplates"] });
      navigation.goBack();
    },
  });

  const previewMutation = useMutation({
    mutationFn: () => {
      const loanId = loansQuery.data?.loans[0]?._id;
      if (!loanId) throw new Error("Preview ke liye pehle ek loan add karein.");
      return api.previewReminderTemplate({
        templateId,
        loanId,
        subjectTemplate: form.subjectTemplate,
        bodyTemplate: form.bodyTemplate,
      });
    },
    onSuccess: (data) => {
      showAlert({
        title: data.subject || "Message Preview",
        message: data.body,
      });
    },
  });

  if (templatesQuery.isLoading && templateId) return <Screen><LoadingState label="Loading template..." /></Screen>;
  if (templatesQuery.isError) return <Screen><ErrorState message="Template load nahi ho saka." onRetry={templatesQuery.refetch} /></Screen>;

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{templateId ? "Edit Template" : "Create Template"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Variables: {"{contactName}"}, {"{remainingAmount}"}, {"{dueDate}"}, {"{overdueDays}"}.</Text>
      </View>

      <View className="gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Template Name</Text>
          <TextInput
            value={form.name}
            onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
            placeholder="Friendly WhatsApp reminder"
            placeholderTextColor={theme.placeholder}
            style={inputStyle(theme)}
          />
        </View>

        <FormSelect label="Channel" value={form.channel} options={channelOptions} onChange={(channel) => setForm((prev) => ({ ...prev, channel }))} />
        <FormSelect label="Language" value={form.language} options={languageOptions} onChange={(language) => setForm((prev) => ({ ...prev, language }))} />
        <FormSelect label="Tone" value={form.tone} options={toneOptions} onChange={(tone) => setForm((prev) => ({ ...prev, tone }))} />
        <FormSelect label="Template Type" value={form.type} options={typeOptions} onChange={(type) => setForm((prev) => ({ ...prev, type }))} />

        {form.channel === "EMAIL" ? (
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Subject Template</Text>
            <TextInput
              value={form.subjectTemplate}
              onChangeText={(subjectTemplate) => setForm((prev) => ({ ...prev, subjectTemplate }))}
              placeholder="Payment reminder for {contactName}"
              placeholderTextColor={theme.placeholder}
              style={inputStyle(theme)}
            />
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Body Template</Text>
          <TextInput
            value={form.bodyTemplate}
            onChangeText={(bodyTemplate) => setForm((prev) => ({ ...prev, bodyTemplate }))}
            placeholder="Reminder body"
            placeholderTextColor={theme.placeholder}
            multiline
            style={inputStyle(theme, true)}
          />
        </View>
      </View>

      {(saveMutation.isError || previewMutation.isError) ? (
        <Text className="text-sm font-semibold text-danger">{getErrorMessage(saveMutation.error || previewMutation.error)}</Text>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton title="Preview" icon={Eye} variant="secondary" loading={previewMutation.isPending} onPress={() => previewMutation.mutate()} />
        </View>
        <View className="flex-1">
          <AppButton
            title="Save"
            icon={Save}
            loading={saveMutation.isPending}
            disabled={!form.name.trim() || !form.bodyTemplate.trim()}
            onPress={() => saveMutation.mutate()}
          />
        </View>
      </View>
    </Screen>
  );
};
