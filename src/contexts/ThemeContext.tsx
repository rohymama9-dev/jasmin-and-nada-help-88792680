import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import '../styles/themes.css'; // Will create this

type Theme = 'light' | 'dark' | 'hacker' | 'win98' | 'neon-dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('app-theme') as Theme) || 'light';
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all possible theme classes
    root.classList.remove('dark', 'theme-hacker', 'theme-win98', 'theme-neon-dark');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme !== 'light') {
      root.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' || theme === 'hacker' || theme === 'neon-dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
