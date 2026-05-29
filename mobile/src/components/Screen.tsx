import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useAppTheme } from "../providers/ThemeProvider";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  className?: string;
  keyboardAware?: boolean;
  refreshable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshLabel?: string;
}>;

export const Screen = ({
  children,
  scroll = true,
  className = "",
  keyboardAware = true,
  refreshable = true,
  refreshing,
  onRefresh,
  refreshLabel = "Refreshing...",
}: ScreenProps) => {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshInProgress = refreshing ?? isRefreshing;

  const handleRefresh = useCallback(async () => {
    if (!refreshable) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await queryClient.refetchQueries({ type: "active" });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, queryClient, refreshable]);

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

  const refreshIndicator = refreshInProgress ? (
    <View
      className="mb-4 flex-row items-center justify-center gap-2 rounded-full border px-4 py-2"
      style={{ backgroundColor: theme.card, borderColor: theme.border, ...theme.shadowSoft }}
    >
      <ActivityIndicator size="small" color={theme.primary} />
      <Text className="text-xs font-extrabold" style={{ color: theme.muted }}>
        {refreshLabel}
      </Text>
    </View>
  ) : null;

  const refreshControl = refreshable ? (
    <RefreshControl
      refreshing={refreshInProgress}
      onRefresh={handleRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
      progressBackgroundColor={theme.card}
    />
  ) : undefined;

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`px-5 ${className}`}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      scrollIndicatorInsets={{ bottom: contentBottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      {refreshIndicator}
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-5 ${className}`} style={{ paddingBottom: contentBottomPadding }}>
      {refreshIndicator}
      {children}
    </View>
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
