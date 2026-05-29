import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, History, Mic, Settings2 } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/StateViews";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { usePrivacy } from "../../providers/PrivacyProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SmartTextEntry">;

const examples = ["Ali ko 5000 diye", "Food par 800 kharch kiye", "Salary 120000 receive hui", "Electricity bill 4500 due on 15 June"];

export const SmartTextEntryScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const { settings } = usePrivacy();
  const [text, setText] = useState("");
  const historyQuery = useQuery({ queryKey: ["smart-entry", "history", "preview"], queryFn: () => api.getSmartEntryHistory({ limit: 5 }) });
  const parseMutation = useMutation({
    mutationFn: () => api.parseSmartEntry({
      inputType: "TEXT",
      text,
      language: settings.smartEntryLanguagePreference,
      saveTranscript: settings.saveSmartEntryHistory,
    }),
    onSuccess: (result) => navigation.navigate("ParsedEntryConfirmation", { result }),
  });

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-peach">
            <Sparkles color={theme.primary} size={21} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Smart Entry</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">Type Roman Urdu or English. You confirm before anything saves.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("SmartEntrySettings")} className="h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
            <Settings2 color={theme.primary} size={18} />
          </TouchableOpacity>
        </View>
        {!settings.smartEntryEnabled ? (
          <View className="mt-4 rounded-2xl bg-peach p-4">
            <Text className="text-sm font-bold text-danger">Smart Entry is disabled in settings.</Text>
          </View>
        ) : null}
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="e.g. Ali ko 5000 diye"
          placeholderTextColor={theme.placeholder}
          className="mt-5 min-h-28 rounded-2xl border border-border bg-background-soft p-4 text-base text-dark"
          style={{ fontFamily: fontFamily.semiBold, textAlignVertical: "top" }}
        />
        {parseMutation.isError ? <Text className="mt-3 text-xs font-bold text-danger">{getErrorMessage(parseMutation.error)}</Text> : null}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <AppButton title="Parse Entry" icon={Sparkles} loading={parseMutation.isPending} disabled={!settings.smartEntryEnabled || text.trim().length < 2} onPress={() => parseMutation.mutate()} />
          </View>
          <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("VoiceEntry")} className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
            <Mic color={theme.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Text className="mb-3 text-base font-black text-dark">Examples</Text>
        <View className="flex-row flex-wrap gap-2">
          {examples.map((example) => (
            <TouchableOpacity key={example} activeOpacity={0.84} onPress={() => setText(example)} className="rounded-full bg-background-soft px-4 py-2">
              <Text className="text-xs font-bold text-muted">{example}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-black text-dark">Recent Commands</Text>
          <TouchableOpacity onPress={() => navigation.navigate("SmartEntryHistory")}>
            <History color={theme.primary} size={18} />
          </TouchableOpacity>
        </View>
        {historyQuery.data?.entries.length ? historyQuery.data.entries.map((entry) => (
          <View key={entry._id} className="mb-3 rounded-2xl bg-background-soft p-4">
            <Text className="text-sm font-black text-dark">{entry.originalText}</Text>
            <Text className="mt-1 text-xs font-bold uppercase text-muted">{entry.intent} • {entry.status}</Text>
          </View>
        )) : <EmptyState title="No commands yet" subtitle="Aapki smart entries yahan show hongi." />}
      </View>
    </Screen>
  );
};
