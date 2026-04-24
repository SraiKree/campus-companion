'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, RotateCcw, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const PRESETS: { name: string; hex: string }[] = [
  { name: 'Peach',      hex: '#e05252' },
  { name: 'Green',      hex: '#059669' },
  { name: 'Rose',       hex: '#e11d74' },
  { name: 'Blossom',    hex: '#c2185b' },
  { name: 'Violet',     hex: '#7c3aed' },
  { name: 'Indigo',     hex: '#4f46e5' },
  { name: 'Blue',       hex: '#2563eb' },
  { name: 'Teal',       hex: '#0d9488' },
  { name: 'Amber',      hex: '#d97706' },
  { name: 'Slate',      hex: '#475569' },
];

export default function AccentPicker() {
  const { accent, setAccent, resetAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const display = accent || '#e05252';

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="no-transition w-10 h-10 rounded-full flex items-center justify-center border"
        style={{
          backgroundColor: 'var(--ch-card)',
          borderColor: 'var(--ch-border)',
        }}
        title="Choose accent color"
        aria-label="Choose accent color"
      >
        <span
          className="w-5 h-5 rounded-full border"
          style={{ backgroundColor: display, borderColor: 'rgba(0,0,0,0.08)' }}
        />
      </button>

      {open && (
        <div
          ref={popRef}
          className="no-transition absolute right-0 top-12 z-50 w-72 rounded-2xl border p-4 shadow-lg"
          style={{
            backgroundColor: 'var(--ch-card)',
            borderColor: 'var(--ch-border)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" style={{ color: 'var(--ch-muted)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ch-text)' }}>
                Accent Color
              </p>
            </div>
            {accent && (
              <button
                onClick={resetAccent}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider hover:underline"
                style={{ color: 'var(--ch-muted)' }}
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {PRESETS.map((p) => {
              const active = accent?.toLowerCase() === p.hex.toLowerCase();
              return (
                <button
                  key={p.hex}
                  onClick={() => setAccent(p.hex)}
                  title={p.name}
                  className="no-transition w-full aspect-square rounded-lg border-2 flex items-center justify-center"
                  style={{
                    backgroundColor: p.hex,
                    borderColor: active ? 'var(--ch-text)' : 'transparent',
                  }}
                >
                  {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 p-2 rounded-xl border"
            style={{ backgroundColor: 'var(--ch-muted-bg)', borderColor: 'var(--ch-border)' }}
          >
            <label
              className="no-transition w-8 h-8 rounded-lg cursor-pointer border flex-shrink-0 relative overflow-hidden"
              style={{ borderColor: 'var(--ch-border)', backgroundColor: display }}
            >
              <input
                type="color"
                value={display}
                onChange={(e) => setAccent(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={display.toUpperCase()}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) setAccent(v);
              }}
              className="flex-1 bg-transparent text-xs font-mono tracking-wider focus:outline-none"
              style={{ color: 'var(--ch-text)' }}
            />
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--ch-muted)' }}>
              HEX
            </p>
          </div>

          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--ch-muted)' }}>
            Your chosen color tints the background, sidebar, and accents across the portal.
          </p>
        </div>
      )}
    </div>
  );
}
