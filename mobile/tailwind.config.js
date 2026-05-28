/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope_500Medium"],
      },
      borderRadius: {
        lg: "24px",
        xl: "28px",
        "2xl": "32px",
      },
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-soft": "rgb(var(--color-background-soft) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        dark: "rgb(var(--color-text) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        peach: "rgb(var(--color-peach) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        yellow: "rgb(var(--color-yellow) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
