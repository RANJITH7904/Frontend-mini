import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DarkModeToggle() {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400 group-hover:rotate-45 transition-transform duration-500" />
      ) : (
        <Moon size={18} className="text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
