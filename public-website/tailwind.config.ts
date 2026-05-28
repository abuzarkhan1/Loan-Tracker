import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "24px",
        xl: "28px",
        "2xl": "32px",
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-soft": "rgb(var(--color-background-soft) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        dark: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        peach: "rgb(var(--color-peach) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        yellow: "rgb(var(--color-yellow) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 16px 48px rgba(88, 48, 32, 0.11)",
        elevated: "0 24px 70px rgba(88, 48, 32, 0.16)",
        "primary-glow": "0 18px 38px rgba(243, 111, 86, 0.26)",
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(135deg, rgb(var(--gradient-start)) 0%, rgb(var(--gradient-mid)) 48%, rgb(var(--gradient-end)) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
