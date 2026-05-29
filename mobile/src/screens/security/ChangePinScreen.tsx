import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Text, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { PinKeypad } from "../../components/PinKeypad";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { useSecurity } from "../../providers/SecurityProvider";
import { useAppTheme } from "../../providers/ThemeProvider";
import { fontFamily } from "../../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePin">;
type Step = "current" | "new" | "confirm";

export const ChangePinScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const { setPin, verifyPin } = useSecurity();
  const [step, setStep] = useState<Step>("current");
  const [newPin, setNewPin] = useState("");
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const title = step === "current" ? "Current PIN" : step === "new" ? "New PIN" : "Confirm New PIN";

  const handleChange = (value: string) => {
    setError(null);
    setPinValue(value);
    if (value.length !== 4) return;

    if (step === "current") {
      void verifyPin(value).then((valid) => {
        if (!valid) {
          setError("Current PIN wrong hai.");
          setPinValue("");
          return;
        }
        setPinValue("");
        setStep("new");
      });
      return;
    }

    if (step === "new") {
      setNewPin(value);
      setPinValue("");
      setStep("confirm");
      return;
    }

    if (value !== newPin) {
      setError("New PIN match nahi hua.");
      setPinValue("");
      setStep("new");
      setNewPin("");
      return;
    }

    void setPin(value).then(() => navigation.goBack());
  };

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{title}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">PIN change karne ke liye steps complete karein.</Text>
      </View>

      <View className="mt-8 rounded-lg border border-border bg-card p-6" style={theme.shadowSoft}>
        <PinKeypad value={pin} onChange={handleChange} />
        {error ? (
          <Text style={{ color: theme.danger, fontFamily: fontFamily.semiBold, fontSize: 13, textAlign: "center", marginTop: 16 }}>
            {error}
          </Text>
        ) : null}
      </View>

      <View className="mt-6">
        <AppButton title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
};
