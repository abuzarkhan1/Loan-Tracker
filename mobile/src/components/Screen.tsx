import { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../providers/ThemeProvider";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
}>;

export const Screen = ({ children, scroll = true, className = "" }: ScreenProps) => {
  const { theme } = useAppTheme();
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`px-5 pb-28 ${className}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 pb-28 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <LinearGradient
        colors={theme.backgroundGradient}
        locations={[0, 0.48, 1]}
        className="absolute inset-0"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
