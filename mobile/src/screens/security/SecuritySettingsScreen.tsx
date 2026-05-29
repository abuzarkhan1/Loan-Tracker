import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Fingerprint, KeyRound, Lock, RotateCcw } from "lucide-react-native";
import { Text, TouchableOpacity, View, Switch } from "react-native";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { AutoLockOption, useSecurity } from "../../providers/SecurityProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { showAlert } from "../../providers/AlertProvider";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SecuritySettings">;

const autoLockOptions: { label: string; value: AutoLockOption }[] = [
  { label: "Immediately", value: "immediate" },
  { label: "1 minute", value: "1m" },
  { label: "5 minutes", value: "5m" },
  { label: "15 minutes", value: "15m" },
];

export const SecuritySettingsScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const { biometricAvailable, hasPin, lockNow, resetPin, saveSettings, settings } = useSecurity();

  const handleAppLockToggle = async (enabled: boolean) => {
    if (enabled && !hasPin) {
      navigation.navigate("SetPin");
      return;
    }
    await saveSettings({ appLockEnabled: enabled });
  };

  const confirmReset = () => {
    showAlert({
      title: "Reset PIN",
      message: "App lock disable ho jayega aur PIN remove ho jayega.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void resetPin() },
      ],
    });
  };

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">Security & App Lock</Text>
        <Text className="mt-1 text-sm font-medium text-muted">Fingerprint, Face ID, aur 4-digit PIN.</Text>
      </View>

      <View className="mt-6 gap-5 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-peach">
            <Lock color={theme.primaryDark} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">App Lock</Text>
            <Text className="mt-1 text-sm font-medium text-muted">App open hone se pehle unlock required.</Text>
          </View>
          <Switch
            value={settings.appLockEnabled}
            onValueChange={(value) => void handleAppLockToggle(value)}
            thumbColor={theme.white}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <View className="h-px bg-border" />

        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-background-soft">
            <Fingerprint color={theme.primary} size={24} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-dark">Biometric Lock</Text>
            <Text className="mt-1 text-sm font-medium text-muted">
              {biometricAvailable ? "Fingerprint/Face ID available." : "Biometric not available on this device."}
            </Text>
          </View>
          <Switch
            value={settings.biometricEnabled}
            disabled={!hasPin || !biometricAvailable}
            onValueChange={(value) => void saveSettings({ biometricEnabled: value })}
            thumbColor={theme.white}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </View>

      <View className="mt-5 gap-4 rounded-lg border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-base font-bold text-dark">Auto-lock after inactivity</Text>
        <View className="flex-row flex-wrap gap-2">
          {autoLockOptions.map((option) => {
            const selected = settings.autoLockAfter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.85}
                onPress={() => void saveSettings({ autoLockAfter: option.value })}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? theme.primary : theme.border,
                  backgroundColor: selected ? theme.primary : theme.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: selected ? theme.white : theme.muted, fontFamily: fontFamily.bold, fontSize: 12 }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mt-6 gap-3">
        <AppButton title={hasPin ? "Change PIN" : "Set PIN"} icon={KeyRound} onPress={() => navigation.navigate(hasPin ? "ChangePin" : "SetPin")} />
        <AppButton title="Lock Now" variant="secondary" icon={Lock} disabled={!settings.appLockEnabled || !hasPin} onPress={lockNow} />
        {hasPin ? <AppButton title="Reset PIN" variant="danger" icon={RotateCcw} onPress={confirmReset} /> : null}
      </View>
    </Screen>
  );
};
