import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-extrabold text-dark shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/20 sm:h-12 sm:px-4"
    >
      <span className="grid size-7 place-items-center rounded-full bg-background-soft text-primary sm:size-8">
        <Icon size={17} strokeWidth={2.5} />
      </span>
      {compact ? null : <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
};
