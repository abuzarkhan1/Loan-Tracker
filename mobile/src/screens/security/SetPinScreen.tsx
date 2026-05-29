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

type Props = NativeStackScreenProps<RootStackParamList, "SetPin">;

export const SetPinScreen = ({ navigation }: Props) => {
  const { theme } = useAppTheme();
  const { setPin } = useSecurity();
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setError(null);
    setPinValue(value);

    if (value.length !== 4) return;

    if (step === "enter") {
      setFirstPin(value);
      setPinValue("");
      setStep("confirm");
      return;
    }

    if (value !== firstPin) {
      setError("PIN match nahi hua.");
      setPinValue("");
      setStep("enter");
      setFirstPin("");
      return;
    }

    void setPin(value).then(() => navigation.goBack());
  };

  return (
    <Screen className="pt-5">
      <View>
        <Text className="text-2xl font-black text-dark">{step === "enter" ? "Set PIN" : "Confirm PIN"}</Text>
        <Text className="mt-1 text-sm font-medium text-muted">4-digit PIN app lock ke liye use hoga.</Text>
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
