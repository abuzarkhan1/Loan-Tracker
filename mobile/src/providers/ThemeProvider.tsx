import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { AppTheme, ThemeMode, themes } from "../utils/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
};

const THEME_KEY = "loan-tracker-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const nativeWind = useNativeWindColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const nextMode: ThemeMode = stored === "dark" ? "dark" : "light";
      setModeState(nextMode);
      nativeWind.setColorScheme(nextMode);
    };

    void loadTheme();
  }, [nativeWind]);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    nativeWind.setColorScheme(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: themes[mode],
      setMode,
      toggleMode: () => setMode(mode === "light" ? "dark" : "light"),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
};
