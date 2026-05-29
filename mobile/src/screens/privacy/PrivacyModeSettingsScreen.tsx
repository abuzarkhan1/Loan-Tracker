import { Eye, EyeOff, Shield } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { Screen } from "../../components/Screen";
import { usePrivacy } from "../../providers/PrivacyProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

const ToggleRow = ({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void }) => {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} className="flex-row items-center gap-4 rounded-2xl bg-background-soft p-4">
      <View className="flex-1">
        <Text className="text-sm font-black text-dark">{title}</Text>
        <Text className="mt-1 text-xs font-semibold text-muted">{subtitle}</Text>
      </View>
      <View
        className="h-7 w-12 justify-center rounded-full px-1"
        style={{ backgroundColor: active ? theme.primary : theme.border }}
      >
        <View className="h-5 w-5 rounded-full bg-white" style={{ alignSelf: active ? "flex-end" : "flex-start" }} />
      </View>
    </TouchableOpacity>
  );
};

export const PrivacyModeSettingsScreen = () => {
  const { theme } = useAppTheme();
  const { settings, amountsHidden, toggleAmountsHidden, updateSettings } = usePrivacy();

  return (
    <Screen className="gap-5 pt-5">
      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-peach">
            <Shield color={theme.primaryDark} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>Privacy Mode</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Amounts ko public places mein quickly hide karein.</Text>
          </View>
        </View>
      </View>

      <ToggleRow
        title="Enable Privacy Mode"
        subtitle="Amount masking and quick reveal controls."
        active={settings.privacyModeEnabled}
        onPress={() => updateSettings({ privacyModeEnabled: !settings.privacyModeEnabled })}
      />
      <ToggleRow
        title="Hide Amounts by Default"
        subtitle="App open hotay hi amounts hidden rahen."
        active={settings.hideAmountsByDefault}
        onPress={() => updateSettings({ hideAmountsByDefault: !settings.hideAmountsByDefault })}
      />
      <ToggleRow
        title="Require Unlock to Reveal"
        subtitle="PIN/biometric users ke liye safer reveal flow ready."
        active={settings.requireUnlockToReveal}
        onPress={() => updateSettings({ requireUnlockToReveal: !settings.requireUnlockToReveal })}
      />
      <ToggleRow
        title="Blur in App Switcher"
        subtitle="Privacy preference backend mein save hoti hai."
        active={settings.blurInAppSwitcher}
        onPress={() => updateSettings({ blurInAppSwitcher: !settings.blurInAppSwitcher })}
      />

      <View className="rounded-3xl border border-border bg-card p-5" style={theme.shadowSoft}>
        <Text className="text-xs font-black uppercase text-muted">Scope</Text>
        <View className="mt-3 flex-row gap-2">
          {(["EVERYWHERE", "DASHBOARD_ONLY"] as const).map((scope) => {
            const active = settings.scope === scope;
            return (
              <TouchableOpacity
                key={scope}
                activeOpacity={0.86}
                onPress={() => updateSettings({ scope })}
                className="flex-1 rounded-full border py-3"
                style={{ borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.pill }}
              >
                <Text className="text-center text-xs font-black" style={{ color: active ? theme.white : theme.muted }}>
                  {scope === "EVERYWHERE" ? "Everywhere" : "Dashboard"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AppButton
        title={amountsHidden ? "Reveal Amounts" : "Hide Amounts Now"}
        icon={amountsHidden ? Eye : EyeOff}
        onPress={() => toggleAmountsHidden()}
      />
    </Screen>
  );
};
