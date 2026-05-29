import { Text, TextProps } from "react-native";
import { usePrivacy } from "../providers/PrivacyProvider";
import { formatCurrency } from "../utils/format";

type AmountTextProps = TextProps & {
  amount?: number;
  value?: string;
  prefix?: string;
  suffix?: string;
  hiddenLabel?: string;
  privacyScope?: "DASHBOARD" | "EVERYWHERE";
};

export const AmountText = ({
  amount,
  value,
  prefix = "",
  suffix = "",
  hiddenLabel = "Rs. ****",
  privacyScope = "EVERYWHERE",
  children,
  ...props
}: AmountTextProps) => {
  const { amountsHidden, settings } = usePrivacy();
  const shouldHide =
    settings.privacyModeEnabled &&
    amountsHidden &&
    (settings.scope === "EVERYWHERE" || privacyScope === "DASHBOARD");
  const display = shouldHide ? hiddenLabel : value || (amount !== undefined ? `${prefix}${formatCurrency(amount)}${suffix}` : children);
  return <Text {...props}>{display}</Text>;
};
