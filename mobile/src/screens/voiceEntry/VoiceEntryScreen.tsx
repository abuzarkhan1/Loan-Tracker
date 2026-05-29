import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Mic, MicOff, Play, Settings2, ShieldCheck, Square } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ExpoSpeechRecognitionErrorEvent, ExpoSpeechRecognitionResultEvent } from "expo-speech-recognition";
import { api } from "../../api/client";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../providers/ThemeProvider";
import { usePrivacy } from "../../providers/PrivacyProvider";
import { getErrorMessage } from "../../utils/errors";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "VoiceEntry">;
type SpeechModule = typeof import("expo-speech-recognition");
type SpeechSubscription = { remove: () => void };

const contextualStrings = [
  "loan",
  "diya",
  "diye",
  "liya",
  "liye",
  "wapis",
  "kharch",
  "salary",
  "tankhwa",
  "bill",
  "promise",
  "cash",
  "bank",
  "JazzCash",
  "EasyPaisa",
  "Ali",
  "Ahmed",
  "Rs",
];

const languageOptions = [
  { label: "English PK", value: "en-PK" },
  { label: "English US", value: "en-US" },
  { label: "Urdu PK", value: "ur-PK" },
];

const loadSpeechModule = () => {
  try {
    return require("expo-speech-recognition") as SpeechModule;
  } catch {
    return null;
  }
};

export const VoiceEntryScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const { settings } = usePrivacy();
  const speechRef = useRef<SpeechModule | null>(null);
  const subscriptionsRef = useRef<SpeechSubscription[]>([]);
  const [transcript, setTranscript] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [onDeviceAvailable, setOnDeviceAvailable] = useState(false);
  const [preferOnDevice, setPreferOnDevice] = useState(true);
  const [language, setLanguage] = useState("en-PK");
  const [voiceError, setVoiceError] = useState("");
  const [volume, setVolume] = useState(0);

  const parseMutation = useMutation({
    mutationFn: () => api.parseSmartEntry({
      inputType: "VOICE",
      text: transcript,
      language: settings.smartEntryLanguagePreference,
      saveTranscript: settings.saveVoiceTranscriptHistory,
    }),
    onSuccess: (result) => navigation.navigate("ParsedEntryConfirmation", { result }),
  });

  useEffect(() => {
    const speech = loadSpeechModule();
    speechRef.current = speech;
    if (!speech) {
      setSpeechAvailable(false);
      setVoiceError("Native speech recognition module is not available in this build. Create a new EAS/dev build after installing the dependency.");
      return undefined;
    }

    try {
      const available = speech.ExpoSpeechRecognitionModule.isRecognitionAvailable();
      const onDevice = speech.ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      setSpeechAvailable(available);
      setOnDeviceAvailable(onDevice);
      setPreferOnDevice(onDevice);
      void speech.ExpoSpeechRecognitionModule.getPermissionsAsync().then((permission) => {
        setPermissionStatus(permission.granted ? "granted" : permission.canAskAgain ? "unknown" : "denied");
      });

      subscriptionsRef.current = [
        speech.ExpoSpeechRecognitionModule.addListener("start", () => {
          setRecognizing(true);
          setVoiceError("");
        }),
        speech.ExpoSpeechRecognitionModule.addListener("end", () => setRecognizing(false)),
        speech.ExpoSpeechRecognitionModule.addListener("result", (event: ExpoSpeechRecognitionResultEvent) => {
          const bestTranscript = event.results[0]?.transcript || "";
          if (bestTranscript) setTranscript(bestTranscript);
        }),
        speech.ExpoSpeechRecognitionModule.addListener("error", (event: ExpoSpeechRecognitionErrorEvent) => {
          setRecognizing(false);
          setVoiceError(event.message || event.error);
        }),
        speech.ExpoSpeechRecognitionModule.addListener("volumechange", (event) => {
          setVolume(Math.max(0, Math.min(1, (event.value + 2) / 12)));
        }),
      ];
    } catch {
      setSpeechAvailable(false);
      setVoiceError("Speech recognition is not available on this device.");
    }

    return () => {
      subscriptionsRef.current.forEach((subscription) => subscription.remove());
      subscriptionsRef.current = [];
      try {
        speechRef.current?.ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ignore cleanup errors from native recognizer.
      }
    };
  }, []);

  const canUseOnDevice = onDeviceAvailable && preferOnDevice;
  const helperText = useMemo(() => {
    if (!speechAvailable) return "Speech service unavailable. Transcript input still works.";
    if (recognizing) return "Listening now. Speak naturally: “Ali ko 5000 diye”.";
    if (canUseOnDevice) return "On-device recognition preferred. Audio is not stored by this app.";
    return "Using device speech service. This app does not save or upload audio.";
  }, [canUseOnDevice, recognizing, speechAvailable]);

  const startListening = async () => {
    if (!settings.voiceEntryEnabled) {
      setVoiceError("Voice Entry is disabled in settings.");
      return;
    }
    const speech = speechRef.current;
    if (!speech) {
      setVoiceError("Native speech recognition module is not available in this build.");
      return;
    }
    try {
      const permission = await speech.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      setPermissionStatus(permission.granted ? "granted" : "denied");
      if (!permission.granted) {
        setVoiceError("Microphone/speech permission was not granted.");
        return;
      }
      setTranscript("");
      setVoiceError("");
      speech.ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: true,
        continuous: false,
        maxAlternatives: 3,
        contextualStrings,
        requiresOnDeviceRecognition: canUseOnDevice,
        addsPunctuation: false,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
      });
    } catch (error) {
      setRecognizing(false);
      setVoiceError(error instanceof Error ? error.message : "Speech recognition start nahi ho saka.");
    }
  };

  const stopListening = () => {
    try {
      speechRef.current?.ExpoSpeechRecognitionModule.stop();
    } catch {
      setRecognizing(false);
    }
  };

  const downloadOfflineModel = async () => {
    try {
      const result = await speechRef.current?.ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale: language });
      setVoiceError(result?.message || "Offline model request sent.");
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : "Offline model download unavailable on this device.");
    }
  };

  return (
    <Screen className="gap-5 pt-5">
      <View className="items-center rounded-3xl border border-border bg-card p-6" style={theme.shadowSoft}>
        <TouchableOpacity activeOpacity={0.86} onPress={() => navigation.navigate("SmartEntrySettings")} className="absolute right-5 top-5 h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
          <Settings2 color={theme.primary} size={18} />
        </TouchableOpacity>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-peach">
          {recognizing ? <MicOff color={theme.primary} size={34} /> : <Mic color={theme.primary} size={34} />}
        </View>
        <Text className="mt-5 text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Voice Entry</Text>
        <Text className="mt-2 text-center text-sm font-semibold text-muted">{helperText}</Text>
        {!settings.voiceEntryEnabled ? (
          <View className="mt-4 rounded-2xl bg-peach p-4">
            <Text className="text-center text-sm font-bold text-danger">Voice Entry is disabled in Smart Entry settings.</Text>
          </View>
        ) : null}
        <View className="mt-5 h-2 w-full overflow-hidden rounded-full bg-background-soft">
          <View className="h-full rounded-full bg-primary" style={{ width: `${recognizing ? Math.max(12, volume * 100) : 0}%` }} />
        </View>
      </View>

      {permissionStatus !== "granted" ? (
        <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
          <Text className="text-base font-black text-dark">Voice Permission</Text>
          <Text className="mt-2 text-sm font-semibold leading-6 text-muted">
            Microphone aur speech access sirf command ko transcript banane ke liye use hota hai. Audio backend par upload nahi hota aur app audio save nahi karti.
          </Text>
          {permissionStatus === "denied" ? (
            <Text className="mt-3 text-xs font-bold text-warning">Permission denied hai. Device settings se enable karein ya Smart Text Entry use karein.</Text>
          ) : null}
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <AppButton title="Allow Access" icon={Mic} disabled={!settings.voiceEntryEnabled || !speechAvailable} onPress={startListening} />
            </View>
            <View className="flex-1">
              <AppButton title="Use Text" variant="secondary" onPress={() => navigation.navigate("SmartTextEntry")} />
            </View>
          </View>
        </View>
      ) : null}

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xs font-black uppercase text-muted">Recognition Language</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {languageOptions.map((option) => {
            const active = language === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.86}
                onPress={() => setLanguage(option.value)}
                className="rounded-full border px-4 py-2"
                style={{ backgroundColor: active ? theme.primary : theme.pill, borderColor: active ? theme.primary : theme.border }}
              >
                <Text className="text-xs font-black" style={{ color: active ? theme.white : theme.muted }}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.86}
          onPress={() => setPreferOnDevice((value) => !value)}
          className="mt-4 flex-row items-center justify-between rounded-2xl bg-background-soft p-4"
        >
          <View className="flex-1">
            <Text className="text-sm font-black text-dark">Prefer on-device recognition</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">
              {onDeviceAvailable ? "Available on this device." : "Not available on this device/service."}
            </Text>
          </View>
          <View className="h-7 w-12 justify-center rounded-full px-1" style={{ backgroundColor: preferOnDevice ? theme.primary : theme.border }}>
            <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: preferOnDevice ? "flex-end" : "flex-start" }} />
          </View>
        </TouchableOpacity>

        {Platform.OS === "android" && !onDeviceAvailable ? (
          <TouchableOpacity activeOpacity={0.86} onPress={downloadOfflineModel} className="mt-3 rounded-2xl bg-peach p-4">
            <Text className="text-sm font-black text-primary">Download offline model</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">Supported Android devices can install local speech models.</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="mb-3 flex-row items-center gap-2">
          <ShieldCheck color={theme.success} size={18} />
          <Text className="text-sm font-black text-dark">Transcript</Text>
        </View>
        <TextInput
          value={transcript}
          onChangeText={setTranscript}
          multiline
          placeholder="Tap Start Listening or type/edit transcript here..."
          placeholderTextColor={theme.placeholder}
          className="min-h-28 rounded-2xl bg-background-soft p-4 text-dark"
          style={{ textAlignVertical: "top", fontFamily: fontFamily.semiBold }}
        />
        {voiceError ? <Text className="mt-3 text-xs font-bold text-warning">{voiceError}</Text> : null}
        {parseMutation.isError ? <Text className="mt-3 text-xs font-bold text-danger">{getErrorMessage(parseMutation.error)}</Text> : null}
        <Text className="mt-3 text-[10px] font-black uppercase text-muted">Permission: {permissionStatus}</Text>
        <Text className="mt-1 text-[10px] font-black uppercase text-muted">
          Transcript history: {settings.saveVoiceTranscriptHistory ? "saved after parse" : "not saved"}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton title={recognizing ? "Stop" : "Start Listening"} icon={recognizing ? Square : Play} disabled={!settings.voiceEntryEnabled} onPress={recognizing ? stopListening : startListening} />
        </View>
        <View className="flex-1">
          <AppButton
            title="Parse"
            icon={Mic}
            disabled={transcript.trim().length < 2}
            loading={parseMutation.isPending}
            onPress={() => parseMutation.mutate()}
          />
        </View>
      </View>
    </Screen>
  );
};
