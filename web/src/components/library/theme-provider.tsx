import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;

    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme);
      setThemeState(nextTheme);
    },
    [storageKey],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, nextTheme);
      return nextTheme;
    });
  }, [storageKey]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    // Safe fallback so components never crash even outside of ThemeProvider
    const isDark =
      typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark') ||
          (!document.documentElement.classList.contains('light') &&
            window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)
        : true;

    return {
      theme: isDark ? 'dark' : 'light',
      setTheme: (nextTheme: Theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', nextTheme === 'dark');
          document.documentElement.classList.toggle('light', nextTheme === 'light');
          try {
            localStorage.setItem('theme', nextTheme);
          } catch {}
        }
      },
      toggleTheme: () => {
        if (typeof document !== 'undefined') {
          const nextIsDark = !document.documentElement.classList.contains('dark');
          document.documentElement.classList.toggle('dark', nextIsDark);
          document.documentElement.classList.toggle('light', !nextIsDark);
          try {
            localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
          } catch {}
        }
      },
    };
  }

  return context;
}
