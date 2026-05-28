import "./global.css";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Text, TextInput, View } from "react-native";
import { AuthProvider } from "./src/providers/AuthProvider";
import { ThemeProvider, useAppTheme } from "./src/providers/ThemeProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { fontFamily } from "./src/utils/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const configureDefaultFonts = () => {
  const textDefaultProps = (Text as unknown as { defaultProps?: Record<string, unknown> }).defaultProps || {};
  const inputDefaultProps = (TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps || {};

  (Text as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
    ...textDefaultProps,
    style: [{ fontFamily: fontFamily.medium }, textDefaultProps.style],
  };

  (TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
    ...inputDefaultProps,
    style: [{ fontFamily: fontFamily.medium }, inputDefaultProps.style],
  };
};

const ThemedStatusBar = () => {
  const { mode } = useAppTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      configureDefaultFonts();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
