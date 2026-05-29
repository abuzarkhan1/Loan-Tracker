import { Text, TextProps } from "react-native";
import { usePrivacy } from "../providers/PrivacyProvider";

const amountPattern = /Rs\.?\s*[-+]?\d[\d,]*(?:\.\d+)?/gi;

type SensitiveTextProps = TextProps & {
  children: string;
  privacyScope?: "DASHBOARD" | "EVERYWHERE";
};

export const SensitiveText = ({ children, privacyScope = "EVERYWHERE", ...props }: SensitiveTextProps) => {
  const { amountsHidden, settings } = usePrivacy();
  const shouldHide =
    settings.privacyModeEnabled &&
    amountsHidden &&
    (settings.scope === "EVERYWHERE" || privacyScope === "DASHBOARD");
  const text = shouldHide ? children.replace(amountPattern, "Rs. ****") : children;
  return <Text {...props}>{text}</Text>;
};
