import React, { createContext, useContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, Shadows } from '@mui/material/styles';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider');
  return context;
};

/**
 * Аккуратные «мягкие» тени вместо резких дефолтных MUI:
 * один общий диффузный слой вместо нескольких жёстких.
 */
const softShadows = Array.from({ length: 25 }, (_, i) => {
  if (i === 0) return 'none';
  const blur = 4 + i * 4;
  const alpha = 0.04 + i * 0.006;
  return `0 1px 2px rgba(16, 24, 40, ${alpha.toFixed(3)}), 0 ${i * 2}px ${blur}px rgba(16, 24, 40, ${(alpha * 1.4).toFixed(3)})`;
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#e67e22' },
          secondary: { main: '#27ae60' },
          background: {
            default: mode === 'light' ? '#f6f7f9' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          divider: mode === 'light' ? 'rgba(16, 24, 40, 0.08)' : 'rgba(255, 255, 255, 0.1)',
        },
        shape: {
          borderRadius: 14,
        },
        shadows: softShadows as Shadows,
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 700, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700, letterSpacing: '-0.01em' },
          h6: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 10, boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme: t }) => ({
                borderRadius: 14,
                border: `1px solid ${t.palette.divider}`,
                boxShadow: softShadows[2],
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: softShadows[8],
                },
              }),
            },
          },
          MuiPaper: {
            styleOverrides: {
              outlined: ({ theme: t }) => ({ borderColor: t.palette.divider }),
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { borderRadius: 8, fontWeight: 500 },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: { borderRadius: 10 },
            },
          },
          MuiAlert: {
            styleOverrides: { root: { borderRadius: 12 } },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
