import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function applyClass(theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
}

function withTransition(fn) {
  const el = document.documentElement;
  el.classList.add('theme-transitioning');
  fn();
  // Remove after transition completes (250ms + small buffer)
  setTimeout(() => el.classList.remove('theme-transitioning'), 300);
}

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark';
          withTransition(() => applyClass(next));
          return { theme: next };
        }),
    }),
    { name: 'grid8-theme' }
  )
);

export function applyTheme(theme) {
  applyClass(theme);
}
