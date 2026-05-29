import { LucideIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../utils/format";
import { fontFamily } from "../utils/theme";
import { AmountText } from "./AmountText";

export const PlanningCard = ({
  title,
  subtitle,
  amount,
  badge,
  icon: Icon,
  onPress,
}: {
  title: string;
  subtitle?: string;
  amount?: number;
  badge?: string;
  icon?: LucideIcon;
  onPress?: () => void;
}) => {
  const { theme } = useAppTheme();
  const Body = (
    <View className="rounded-3xl border border-border bg-card p-4" style={theme.shadowSoft}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-black text-dark" style={{ fontFamily: fontFamily.extraBold }}>{title}</Text>
          {subtitle ? <Text className="mt-1 text-xs font-semibold text-muted">{subtitle}</Text> : null}
        </View>
        {Icon ? (
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-background-soft">
            <Icon color={theme.primary} size={20} />
          </View>
        ) : null}
      </View>
      <View className="mt-4 flex-row items-center justify-between gap-3">
        {amount !== undefined ? <AmountText amount={amount} className="text-xl font-black text-dark" /> : <View />}
        {badge ? (
          <View className="rounded-full bg-background-soft px-3 py-2">
            <Text className="text-[10px] font-black uppercase text-muted">{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return Body;
  return <TouchableOpacity activeOpacity={0.86} onPress={onPress}>{Body}</TouchableOpacity>;
};

export const TimelineRow = ({
  title,
  subtitle,
  date,
  amount,
  tone = "neutral",
}: {
  title: string;
  subtitle?: string;
  date?: string;
  amount?: number;
  tone?: "inflow" | "outflow" | "neutral";
}) => {
  const { theme } = useAppTheme();
  const color = tone === "inflow" ? theme.success : tone === "outflow" ? theme.danger : theme.primary;
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-background-soft p-4">
      <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <View className="flex-1">
        <Text className="text-sm font-black text-dark">{title}</Text>
        <Text className="mt-1 text-xs font-semibold text-muted">{subtitle || (date ? formatDate(date) : "")}</Text>
      </View>
      {amount !== undefined ? <AmountText amount={amount} className="text-sm font-black text-dark" /> : null}
    </View>
  );
};
