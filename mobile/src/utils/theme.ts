export type ThemeMode = "light" | "dark";

export type AppTheme = {
  mode: ThemeMode;
  background: string;
  backgroundSoft: string;
  backgroundGradient: [string, string, string];
  heroOverlay: string;
  card: string;
  surface: string;
  input: string;
  text: string;
  muted: string;
  primary: string;
  primaryDark: string;
  success: string;
  warning: string;
  danger: string;
  peach: string;
  mint: string;
  yellow: string;
  white: string;
  border: string;
  pill: string;
  footer: string;
  footerText: string;
  footerMuted: string;
  placeholder: string;
  shadowColor: string;
  shadowSoft: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  shadowElevated: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
};

const warmShadow = "#583020";

export const lightTheme: AppTheme = {
  mode: "light",
  background: "#fffaf4",
  backgroundSoft: "#fff7ef",
  backgroundGradient: ["#fff8f0", "#fffaf4", "#ffffff"],
  heroOverlay: "rgba(255, 232, 216, 0.95)",
  card: "#ffffff",
  surface: "#fff7ef",
  input: "#ffffff",
  text: "#25212b",
  muted: "#6f6577",
  primary: "#f36f56",
  primaryDark: "#d95441",
  success: "#1b7d62",
  warning: "#8a6d1f",
  danger: "#d95441",
  peach: "#ffe4d3",
  mint: "#d9f1d7",
  yellow: "#ffd56a",
  white: "#ffffff",
  border: "rgba(80, 61, 52, 0.14)",
  pill: "#fff7ef",
  footer: "#2b2631",
  footerText: "#f5f0eb",
  footerMuted: "#a89fb0",
  placeholder: "rgba(111, 101, 119, 0.6)",
  shadowColor: "rgba(88, 48, 32, 0.12)",
  shadowSoft: {
    shadowColor: warmShadow,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: warmShadow,
    shadowOpacity: 0.12,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
};

export const darkTheme: AppTheme = {
  mode: "dark",
  background: "#1a161f",
  backgroundSoft: "#25212b",
  backgroundGradient: ["#1a161f", "#1e1a24", "#25212b"],
  heroOverlay: "rgba(37, 33, 43, 0.94)",
  card: "#25212b",
  surface: "#2b2631",
  input: "#332d3a",
  text: "#f5f0eb",
  muted: "#a89fb0",
  primary: "#f36f56",
  primaryDark: "#d95441",
  success: "#d9f1d7",
  warning: "#ffd56a",
  danger: "#f36f56",
  peach: "rgba(255, 228, 211, 0.14)",
  mint: "rgba(217, 241, 215, 0.14)",
  yellow: "rgba(255, 213, 106, 0.15)",
  white: "#ffffff",
  border: "rgba(255, 255, 255, 0.08)",
  pill: "#332d3a",
  footer: "#15121a",
  footerText: "#f5f0eb",
  footerMuted: "#a89fb0",
  placeholder: "rgba(168, 159, 176, 0.6)",
  shadowColor: "rgba(0, 0, 0, 0.4)",
  shadowSoft: {
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
};

export const themes: Record<ThemeMode, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const colors = lightTheme;

export const fontFamily = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
};
