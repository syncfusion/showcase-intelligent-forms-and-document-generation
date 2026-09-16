import { Moon, Sun } from 'lucide-react';
import type { ResolvedTheme } from './useTheme';

interface ThemeToggleProps {
  resolved: ResolvedTheme;
  onToggle: () => void;
}

/** Fixed sun/moon control, top-right corner of the template gallery. */
export function ThemeToggle({ resolved, onToggle }: ThemeToggleProps) {
  const nextLabel = resolved === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextLabel} theme`}
      title={`Switch to ${nextLabel} theme`}
    >
      {resolved === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
