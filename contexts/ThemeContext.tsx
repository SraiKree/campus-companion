'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  accent: string | null;
  setAccent: (hex: string | null) => void;
  resetAccent: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  accent: null,
  setAccent: () => {},
  resetAccent: () => {},
});

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function mix(hex: string, baseHex: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(baseHex);
  const r = Math.round(r1 * weight + r2 * (1 - weight));
  const g = Math.round(g1 * weight + g2 * (1 - weight));
  const b = Math.round(b1 * weight + b2 * (1 - weight));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

const ACCENT_VAR_KEYS = [
  '--ch-accent',
  '--ch-accent-rgb',
  '--ch-accent-soft',
  '--ch-accent-softer',
  '--ch-accent-strong',
  '--ch-on-accent',
  '--ch-bg',
  '--ch-sidebar',
  '--ch-card',
  '--ch-elevated',
  '--ch-muted-bg',
  '--ch-hover',
  '--ch-nav-active',
  '--ch-ring',
] as const;

// Pick black or white text for legibility against any accent fill.
function pickOnAccent(r: number, g: number, b: number): string {
  // Relative luminance per WCAG.
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.55 ? '#1a1a1a' : '#ffffff';
}

function applyAccent(hex: string, isDark: boolean) {
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(hex);
  root.style.setProperty('--ch-accent', hex);
  root.style.setProperty('--ch-accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--ch-accent-soft', `rgba(${r},${g},${b},${isDark ? 0.14 : 0.08})`);
  root.style.setProperty('--ch-accent-softer', `rgba(${r},${g},${b},${isDark ? 0.07 : 0.04})`);
  root.style.setProperty('--ch-accent-strong', mix(hex, '#000000', 0.85));
  root.style.setProperty('--ch-on-accent', pickOnAccent(r, g, b));
  root.style.setProperty('--ch-ring', `rgba(${r},${g},${b},${isDark ? 0.40 : 0.20})`);

  if (isDark) {
    // Layered dark surfaces — each step is meaningfully lighter than the
    // previous so bg → sidebar → card → elevated read as distinct planes
    // even from a normal viewing distance, regardless of accent.
    root.style.setProperty('--ch-bg',         mix(hex, '#0a0a0c', 0.05));
    root.style.setProperty('--ch-sidebar',    mix(hex, '#15151a', 0.07));
    root.style.setProperty('--ch-card',       mix(hex, '#1f1f24', 0.07));
    root.style.setProperty('--ch-elevated',   mix(hex, '#2a2a2f', 0.09));
    root.style.setProperty('--ch-muted-bg',   mix(hex, '#25252a', 0.08));
    root.style.setProperty('--ch-hover',      `rgba(${r},${g},${b},0.11)`);
    root.style.setProperty('--ch-nav-active', mix(hex, '#303035', 0.12));
  } else {
    root.style.setProperty('--ch-bg',         mix(hex, '#f9f8f6', 0.10));
    root.style.setProperty('--ch-sidebar',    mix(hex, '#f2f0ed', 0.16));
    root.style.setProperty('--ch-card',       mix(hex, '#ffffff', 0.02));
    root.style.setProperty('--ch-elevated',   '#ffffff');
    root.style.setProperty('--ch-muted-bg',   mix(hex, '#f2f0ed', 0.12));
    root.style.setProperty('--ch-hover',      `rgba(${r},${g},${b},0.05)`);
    root.style.setProperty('--ch-nav-active', mix(hex, '#ffffff', 0.06));
  }
}

function clearAccent() {
  const root = document.documentElement;
  ACCENT_VAR_KEYS.forEach((k) => root.style.removeProperty(k));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [accent, setAccentState] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('campus-theme') as Theme | null;
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    const storedAccent = localStorage.getItem('campus-accent');
    if (storedAccent && /^#[0-9a-fA-F]{6}$/.test(storedAccent)) setAccentState(storedAccent);
  }, []);

  useEffect(() => {
    if (accent) applyAccent(accent, theme === 'dark');
    else clearAccent();
  }, [accent, theme]);

  // Mirror the theme onto <html> so Radix-portalled primitives (dialogs,
  // popovers, tooltips, dropdowns) outside the per-page .dark wrapper still
  // pick up dark-mode tokens.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('campus-theme', next);
      return next;
    });
  };

  const setAccent = useCallback((hex: string | null) => {
    if (hex && !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    if (hex) localStorage.setItem('campus-accent', hex);
    else localStorage.removeItem('campus-accent');
    setAccentState(hex);
  }, []);

  const resetAccent = useCallback(() => {
    localStorage.removeItem('campus-accent');
    setAccentState(null);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === 'dark', accent, setAccent, resetAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
