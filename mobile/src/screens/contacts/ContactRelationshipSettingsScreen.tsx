import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, UserRoundCog } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { api } from "../../api/client";
import { ContactRelationship } from "../../api/types";
import { AppButton } from "../../components/AppButton";
import { FormSelect } from "../../components/FormSelect";
import { Screen } from "../../components/Screen";
import { ErrorState, LoadingState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ContactRelationshipSettings">;
type Channel = NonNullable<ContactRelationship["preferredReminderChannel"]>;
type Tone = NonNullable<ContactRelationship["preferredReminderTone"]>;
type Language = NonNullable<ContactRelationship["preferredLanguage"]>;

const channelOptions: { label: string; value: Channel }[] = [
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Email", value: "EMAIL" },
  { label: "Call", value: "CALL" },
  { label: "SMS", value: "SMS" },
  { label: "None", value: "NONE" },
];
const toneOptions: { label: string; value: Tone }[] = [
  { label: "Polite", value: "POLITE" },
  { label: "Normal", value: "NORMAL" },
  { label: "Strict", value: "STRICT" },
  { label: "Friendly", value: "FRIENDLY" },
];
const languageOptions: { label: string; value: Language }[] = [
  { label: "Roman Urdu", value: "ROMAN_URDU" },
  { label: "English", value: "ENGLISH" },
  { label: "Urdu Style", value: "URDU_STYLE" },
];

const ToggleRow = ({ title, value, onChange }: { title: string; value: boolean; onChange: (value: boolean) => void }) => {
  const { theme } = useAppTheme();
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 text-sm font-bold text-dark">{title}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.border, true: theme.peach }}
        thumbColor={value ? theme.primary : theme.muted}
      />
    </View>
  );
};

export const ContactRelationshipSettingsScreen = ({ navigation, route }: Props) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { contactId } = route.params;
  const relationshipQuery = useQuery({ queryKey: ["contact", contactId, "relationship"], queryFn: () => api.getContactRelationship(contactId) });
  const [form, setForm] = useState<ContactRelationship>({
    preferredReminderChannel: "WHATSAPP",
    preferredReminderTone: "POLITE",
    preferredLanguage: "ROMAN_URDU",
    usuallyPaysOnTime: false,
    doNotRemindBeforeDueDate: false,
    importantContact: false,
    privateNote: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (relationshipQuery.data) {
      setForm({
        preferredReminderChannel: relationshipQuery.data.preferredReminderChannel || "WHATSAPP",
        preferredReminderTone: relationshipQuery.data.preferredReminderTone || "POLITE",
        preferredLanguage: relationshipQuery.data.preferredLanguage || "ROMAN_URDU",
        usuallyPaysOnTime: Boolean(relationshipQuery.data.usuallyPaysOnTime),
        doNotRemindBeforeDueDate: Boolean(relationshipQuery.data.doNotRemindBeforeDueDate),
        importantContact: Boolean(relationshipQuery.data.importantContact),
        privateNote: relationshipQuery.data.privateNote || "",
        tags: relationshipQuery.data.tags || [],
      });
      setTagInput((relationshipQuery.data.tags || []).join(", "));
    }
  }, [relationshipQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      api.updateContactRelationship(contactId, {
        ...form,
        tags: tagInput.split(",").map((tag) => tag.trim()).filter(Boolean),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      await queryClient.invalidateQueries({ queryKey: ["recovery"] });
      navigation.goBack();
    },
  });

  if (relationshipQuery.isLoading) return <Screen><LoadingState label="Loading relationship settings..." /></Screen>;
  if (relationshipQuery.isError) {
    return <Screen><ErrorState message="Relationship settings load nahi ho sakin." onRetry={relationshipQuery.refetch} /></Screen>;
  }

  return (
    <Screen className="gap-5 pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Relationship Notes</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Reminder channel, tone aur private notes contact-wise.</Text>
      </View>

      <View className="rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <UserRoundCog color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Recovery Preferences</Text>
            <Text className="mt-1 text-sm font-medium text-muted">Recovery Center suggestions is profile ko use karenge.</Text>
          </View>
        </View>

        <View className="mt-5 gap-4">
          <FormSelect
            label="Preferred Channel"
            value={form.preferredReminderChannel}
            options={channelOptions}
            onChange={(preferredReminderChannel) => setForm((prev) => ({ ...prev, preferredReminderChannel }))}
          />
          <FormSelect
            label="Reminder Tone"
            value={form.preferredReminderTone}
            options={toneOptions}
            onChange={(preferredReminderTone) => setForm((prev) => ({ ...prev, preferredReminderTone }))}
          />
          <FormSelect
            label="Language"
            value={form.preferredLanguage}
            options={languageOptions}
            onChange={(preferredLanguage) => setForm((prev) => ({ ...prev, preferredLanguage }))}
          />
          <ToggleRow
            title="Usually pays on time"
            value={Boolean(form.usuallyPaysOnTime)}
            onChange={(usuallyPaysOnTime) => setForm((prev) => ({ ...prev, usuallyPaysOnTime }))}
          />
          <ToggleRow
            title="Do not remind before due date"
            value={Boolean(form.doNotRemindBeforeDueDate)}
            onChange={(doNotRemindBeforeDueDate) => setForm((prev) => ({ ...prev, doNotRemindBeforeDueDate }))}
          />
          <ToggleRow
            title="Important contact"
            value={Boolean(form.importantContact)}
            onChange={(importantContact) => setForm((prev) => ({ ...prev, importantContact }))}
          />

          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Tags</Text>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="family, urgent, reliable"
              placeholderTextColor={theme.placeholder}
              style={{
                minHeight: 50,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
                fontFamily: fontFamily.semiBold,
                fontSize: 15,
                paddingHorizontal: 18,
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 13 }}>Private Note</Text>
            <TextInput
              value={form.privateNote}
              onChangeText={(privateNote) => setForm((prev) => ({ ...prev, privateNote }))}
              placeholder="Only visible inside app"
              placeholderTextColor={theme.placeholder}
              multiline
              style={{
                minHeight: 120,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.input,
                color: theme.text,
                fontFamily: fontFamily.semiBold,
                fontSize: 15,
                paddingHorizontal: 18,
                paddingVertical: 14,
                textAlignVertical: "top",
              }}
            />
          </View>
        </View>
      </View>

      {mutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(mutation.error)}</Text> : null}
      <AppButton title="Save Relationship" icon={Save} loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </Screen>
  );
};
