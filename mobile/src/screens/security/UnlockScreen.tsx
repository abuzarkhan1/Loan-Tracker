import { Fingerprint } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { BrandLogo } from "../../components/BrandLogo";
import { PinKeypad } from "../../components/PinKeypad";
import { Screen } from "../../components/Screen";
import { useSecurity } from "../../providers/SecurityProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

export const UnlockScreen = () => {
  const { theme } = useAppTheme();
  const { biometricAvailable, lockedUntil, settings, unlockWithBiometric, verifyPin, wrongAttempts } = useSecurity();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lockSecondsLeft = lockedUntil ? Math.max(Math.ceil((lockedUntil - Date.now()) / 1000), 0) : 0;

  useEffect(() => {
    const tryUnlock = async () => {
      if (settings.biometricEnabled && biometricAvailable) {
        await unlockWithBiometric();
      }
    };

    void tryUnlock();
  }, [biometricAvailable, settings.biometricEnabled, unlockWithBiometric]);

  useEffect(() => {
    const checkPin = async () => {
      if (pin.length !== 4) return;
      const valid = await verifyPin(pin);
      if (!valid) {
        setError("Wrong PIN. Dobara try karein.");
        setPin("");
      }
    };

    void checkPin();
  }, [pin, verifyPin]);

  return (
    <Screen scroll={false} className="items-center justify-center px-8" refreshable={false}>
      <BrandLogo size={82} />
      <Text className="mt-6 text-2xl font-black text-dark">Unlock Loan Tracker</Text>
      <Text className="mt-2 text-center text-sm font-medium text-muted">Apna 4-digit PIN enter karein.</Text>

      <View className="mt-8 w-full rounded-lg border border-border bg-card p-6" style={theme.shadowSoft}>
        <PinKeypad value={pin} onChange={(value) => {
          setError(null);
          setPin(value);
        }} />

        {error ? (
          <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 13, textAlign: "center", marginTop: 16 }}>
            {lockSecondsLeft > 0 ? `Too many attempts. ${lockSecondsLeft}s baad try karein.` : error}
          </Text>
        ) : null}

        {wrongAttempts > 0 && !error ? (
          <Text style={{ color: theme.muted, fontFamily: fontFamily.semiBold, fontSize: 12, textAlign: "center", marginTop: 16 }}>
            Attempts: {wrongAttempts}/5
          </Text>
        ) : null}

        {settings.biometricEnabled && biometricAvailable ? (
          <View className="mt-5">
            <AppButton title="Use Biometric" icon={Fingerprint} variant="secondary" onPress={() => void unlockWithBiometric()} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
};
