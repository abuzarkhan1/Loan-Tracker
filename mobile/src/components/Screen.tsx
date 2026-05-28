import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../providers/ThemeProvider";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
  keyboardAware?: boolean;
}>;

export const Screen = ({ children, scroll = true, className = "", keyboardAware = true }: ScreenProps) => {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!keyboardAware) {
      return undefined;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardAware]);

  const contentBottomPadding = useMemo(() => {
    const restingPadding = Math.max(insets.bottom + 96, 112);
    const keyboardPadding = keyboardHeight > 0 ? keyboardHeight + Math.max(insets.bottom, 16) + 28 : 0;

    return keyboardAware ? Math.max(restingPadding, keyboardPadding) : restingPadding;
  }, [insets.bottom, keyboardAware, keyboardHeight]);

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`px-5 ${className}`}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      scrollIndicatorInsets={{ bottom: contentBottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 ${className}`} style={{ paddingBottom: contentBottomPadding }}>{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <LinearGradient
        colors={theme.backgroundGradient}
        locations={[0, 0.48, 1]}
        className="absolute inset-0"
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={keyboardAware}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
