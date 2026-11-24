import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type Preference = 'light' | 'dark' | 'system';
type Theme = 'light' | 'dark';
const normalize = (value: string | null | undefined): Preference =>
  value === 'light' || value === 'dark' ? value : 'system';

const ThemeContext = createContext<{
  preference: Preference;
  theme: Theme;
  setPreference: (value: Preference) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<Preference>(() =>
    normalize(document.documentElement.dataset.themePreference));
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const transitionTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = preference === 'system' ? (scheme.matches ? 'dark' : 'light') : preference;
      const root = document.documentElement;
      if (root.dataset.theme !== resolved && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.clearTimeout(transitionTimer.current);
        root.classList.add('theme-switching');
        transitionTimer.current = window.setTimeout(() => root.classList.remove('theme-switching'), 220);
      }
      root.dataset.theme = resolved;
      root.dataset.themePreference = preference;
      root.style.colorScheme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#202123' : '#f7f8f7');
      setTheme(resolved);
    };
    apply();
    scheme.addEventListener('change', apply);
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'wager.theme' || event.key === null) setPreferenceState(normalize(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      scheme.removeEventListener('change', apply);
      window.removeEventListener('storage', onStorage);
    };
  }, [preference]);

  useEffect(() => () => {
    window.clearTimeout(transitionTimer.current);
    document.documentElement.classList.remove('theme-switching');
  }, []);

  const setPreference = (value: Preference) => {
    setPreferenceState(value);
    try { localStorage.setItem('wager.theme', value); } catch { /* Theme still works when storage is unavailable. */ }
  };
  return <ThemeContext.Provider value={{ preference, theme, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is required');
  return value;
}
