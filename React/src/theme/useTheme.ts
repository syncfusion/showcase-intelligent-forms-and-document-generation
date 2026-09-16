import { useCallback, useEffect, useState } from 'react';
import syncfusionDarkHref from '@/styles/syncfusion-dark.css?url';

/** Explicit operator choice. "system" means "follow the OS setting". */
export type ThemePreference = 'light' | 'dark' | 'system';
/** The theme actually painted, after resolving "system". */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'hrdocstudio.theme';
const DARK_LINK_ID = 'sf-theme-dark';

function readStoredPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* private mode / disabled storage — fall through to the default */
  }
  // Default to light (not "system") — the app is designed light-first; the toggle opts in to dark.
  return 'light';
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

/**
 * Applies the resolved theme to the document: our own CSS custom properties key off the
 * `data-theme` attribute (see tokens.css), and Syncfusion's own chrome (editor ribbon,
 * grid, popups) is restyled by enabling/disabling the bundled material3-dark stylesheet —
 * media queries alone can't follow a manual toggle when it disagrees with the OS.
 */
function applyResolvedTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;

  const existing = document.getElementById(DARK_LINK_ID) as HTMLLinkElement | null;

  if (resolved === 'dark') {
    if (existing) {
      existing.media = 'all';
      existing.disabled = false;
      return;
    }
    const link = document.createElement('link');
    link.id = DARK_LINK_ID;
    link.rel = 'stylesheet';
    link.href = syncfusionDarkHref;
    document.head.appendChild(link);
    return;
  }

  // Light: neutralise the dark sheet. `disabled` alone is unreliable when set before the
  // sheet has loaded (the browser applies it anyway) — the `media="not all"` guard is
  // honoured pre-load, so the Syncfusion editor chrome doesn't come up dark on a light start.
  if (existing) {
    existing.media = 'not all';
    existing.disabled = true;
  }
}

export interface ThemeApi {
  /** The operator's stored choice: 'light' | 'dark' | 'system'. */
  preference: ThemePreference;
  /** The theme currently painted. */
  resolved: ResolvedTheme;
  /** Flips between light and dark (an explicit choice — leaves "system" behind). */
  toggle: () => void;
  /** Sets an explicit preference, or 'system' to track the OS again. */
  setPreference: (pref: ThemePreference) => void;
}

export function useTheme(): ThemeApi {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readStoredPreference()));

  // Re-resolve + repaint whenever the preference changes.
  useEffect(() => {
    const next = resolve(preference);
    setResolved(next);
    applyResolvedTheme(next);
  }, [preference]);

  // While on "system", follow live OS changes.
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next: ResolvedTheme = mq.matches ? 'dark' : 'light';
      setResolved(next);
      applyResolvedTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* best effort */
    }
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setPreference]);

  return { preference, resolved, toggle, setPreference };
}
