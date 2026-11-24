import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeControl() {
  const { theme, setPreference } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-control theme-toggle"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          {isDark ? <Moon size={13} /> : <Sun size={13} />}
        </span>
      </span>
      <span className="theme-toggle-label" aria-hidden="true">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
