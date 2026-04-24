import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg text-ink-400 hover:text-ink-950 dark:hover:text-ink-100 hover:bg-slate-200 dark:hover:bg-ink-800/60 transition-colors"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
