import { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { AmountText } from "./AmountText";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

type MoneySummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "muted";
  privacyScope?: "DASHBOARD" | "EVERYWHERE";
};

export const MoneySummaryCard = ({ title, value, subtitle, icon: Icon, tone = "primary", privacyScope = "EVERYWHERE" }: MoneySummaryCardProps) => {
  const { theme } = useAppTheme();
  const iconColor =
    tone === "success" ? theme.success : tone === "warning" ? theme.warning : tone === "danger" ? theme.danger : tone === "muted" ? theme.muted : theme.primary;
  const iconBackground =
    tone === "success" ? theme.mint : tone === "warning" ? theme.yellow : tone === "danger" ? theme.peach : theme.backgroundSoft;

  return (
    <View className="flex-1 rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text style={{ color: theme.muted, fontFamily: fontFamily.bold, fontSize: 11, textTransform: "uppercase" }}>{title}</Text>
          <AmountText value={value} privacyScope={privacyScope} className="mt-2 text-lg font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>
            {value}
          </AmountText>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: iconBackground }}>
          <Icon color={iconColor} size={20} />
        </View>
      </View>
      {subtitle ? (
        /\d|Rs\.?/i.test(subtitle) ? (
          <AmountText value={subtitle} privacyScope={privacyScope} hiddenLabel="Hidden" className="mt-2 text-xs font-semibold text-muted" />
        ) : (
          <Text className="mt-2 text-xs font-semibold text-muted">{subtitle}</Text>
        )
      ) : null}
    </View>
  );
};
