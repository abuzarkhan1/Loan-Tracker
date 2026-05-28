import { AlertCircle, Inbox } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { AppButton } from "./AppButton";
import { useAppTheme } from "../providers/ThemeProvider";
import { fontFamily } from "../utils/theme";

export const LoadingState = ({ label = "Loading..." }: { label?: string }) => {
  const { theme } = useAppTheme();

  return (
    <View className="items-center justify-center gap-3 py-12">
      <ActivityIndicator color={theme.primary} />
      <Text style={{ color: theme.muted, fontFamily: fontFamily.semiBold, fontSize: 14 }}>{label}</Text>
    </View>
  );
};

export const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { theme } = useAppTheme();

  return (
    <View
      className="items-center justify-center gap-2 p-8"
      style={[{ borderRadius: 28, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }, theme.shadowSoft]}
    >
      <Inbox color={theme.muted} size={28} />
      <Text style={{ color: theme.text, fontFamily: fontFamily.bold, fontSize: 16 }}>{title}</Text>
      {subtitle ? <Text style={{ color: theme.muted, fontFamily: fontFamily.medium, fontSize: 14, textAlign: "center" }}>{subtitle}</Text> : null}
    </View>
  );
};

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  const { theme } = useAppTheme();

  return (
    <View
      className="items-center justify-center gap-3 p-8"
      style={[{ borderRadius: 28, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card }, theme.shadowSoft]}
    >
      <AlertCircle color={theme.danger} size={28} />
      <Text style={{ color: theme.text, fontFamily: fontFamily.medium, fontSize: 14, textAlign: "center" }}>{message}</Text>
      {onRetry ? <AppButton title="Retry" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
};
