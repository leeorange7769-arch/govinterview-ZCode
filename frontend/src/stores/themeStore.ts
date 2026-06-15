import { create } from 'zustand';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // 读取本地存储的偏好
  const stored = localStorage.getItem('theme');
  const prefersDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 初始化时设置 class
  if (prefersDark) {
    document.documentElement.classList.add('dark');
  }

  return {
    dark: prefersDark,

    toggle: () =>
      set((state) => {
        const next = !state.dark;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', next);
        return { dark: next };
      }),
  };
});
