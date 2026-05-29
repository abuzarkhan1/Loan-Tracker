import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Wand2 } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { showAlert } from "../../providers/AlertProvider";
import { usePrivacy } from "../../providers/PrivacyProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

const ToggleRow = ({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void }) => {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} className="flex-row items-center gap-4 rounded-2xl bg-background-soft p-4">
      <View className="flex-1">
        <Text className="text-sm font-black text-dark">{title}</Text>
        <Text className="mt-1 text-xs font-semibold text-muted">{subtitle}</Text>
      </View>
      <View className="h-7 w-12 justify-center rounded-full px-1" style={{ backgroundColor: active ? theme.primary : theme.border }}>
        <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: active ? "flex-end" : "flex-start" }} />
      </View>
    </TouchableOpacity>
  );
};

export const SmartEntrySettingsScreen = () => {
  const { theme } = useAppTheme();
  const { settings, updateSettings } = usePrivacy();
  const queryClient = useQueryClient();
  const clearMutation = useMutation({
    mutationFn: api.clearSmartEntryHistory,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["smart-entry"] }),
  });

  const confirmClear = () => {
    showAlert({
      title: "Clear smart entry history?",
      message: "Parsed command history delete ho jayegi. Created loans/payments/transactions delete nahi honge.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => clearMutation.mutate() },
      ],
    });
  };

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <Wand2 color={theme.primaryDark} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Smart Entry Settings</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Text aur voice commands ka behavior control karein.</Text>
          </View>
        </View>
      </View>

      <ToggleRow
        title="Enable Smart Entry"
        subtitle="Text commands parse karne ki permission."
        active={settings.smartEntryEnabled}
        onPress={() => updateSettings({ smartEntryEnabled: !settings.smartEntryEnabled })}
      />
      <ToggleRow
        title="Enable Voice Entry"
        subtitle="Device speech recognition se transcript banayen."
        active={settings.voiceEntryEnabled}
        onPress={() => updateSettings({ voiceEntryEnabled: !settings.voiceEntryEnabled })}
      />
      <ToggleRow
        title="Save Text Entry History"
        subtitle="Recent text commands history mein show honge."
        active={settings.saveSmartEntryHistory}
        onPress={() => updateSettings({ saveSmartEntryHistory: !settings.saveSmartEntryHistory })}
      />
      <ToggleRow
        title="Save Voice Transcript History"
        subtitle="Off rakhein to backend transcript text store nahi karega."
        active={settings.saveVoiceTranscriptHistory}
        onPress={() => updateSettings({ saveVoiceTranscriptHistory: !settings.saveVoiceTranscriptHistory })}
      />

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xs font-black uppercase text-muted">Language Preference</Text>
        <View className="mt-3 flex-row gap-2">
          {(["MIXED", "ROMAN_URDU", "ENGLISH"] as const).map((language) => {
            const active = settings.smartEntryLanguagePreference === language;
            return (
              <TouchableOpacity
                key={language}
                activeOpacity={0.86}
                onPress={() => updateSettings({ smartEntryLanguagePreference: language })}
                className="flex-1 rounded-full border py-3"
                style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
              >
                <Text className="text-center text-[11px] font-black" style={{ color: active ? theme.white : theme.muted }}>
                  {language.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {clearMutation.isError ? <Text className="text-sm font-semibold text-danger">{getErrorMessage(clearMutation.error)}</Text> : null}
      <AppButton title="Clear Smart Entry History" icon={Trash2} variant="danger" loading={clearMutation.isPending} onPress={confirmClear} />
    </Screen>
  );
};
