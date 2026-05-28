import { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: LucideIcon;
};

export const AppButton = ({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon: Icon,
}: AppButtonProps) => {
  const { theme } = useAppTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === "primary" ? theme.primary : variant === "danger" ? theme.primaryDark : variant === "secondary" ? theme.card : "transparent";
  const borderColor =
    variant === "primary" ? theme.primary : variant === "danger" ? theme.primaryDark : variant === "secondary" ? theme.border : "transparent";
  const textColor = variant === "primary" || variant === "danger" ? theme.white : variant === "secondary" ? theme.text : theme.primary;
  const iconColor = textColor;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      className={isDisabled ? "opacity-60" : ""}
      style={[
        {
          minHeight: 50,
          borderRadius: 999,
          borderWidth: 1,
          borderColor,
          backgroundColor,
          paddingHorizontal: 28,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
        variant === "primary" ? { shadowColor: theme.primary, shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 5 } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon ? <Icon color={iconColor} size={18} /> : null}
          <Text style={{ color: textColor, fontFamily: fontFamily.bold, fontSize: 14 }}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
