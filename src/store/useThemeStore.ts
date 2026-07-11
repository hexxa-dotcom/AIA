import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "creme" | "dark" | "gray";

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      toggle: () => set((s) => {
        const next: Record<Theme, Theme> = { light: "creme", creme: "dark", dark: "gray", gray: "light" };
        return { theme: next[s.theme] };
      }),
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: "hexxa-theme",
      version: 1,
      // v1: o antigo tema "pb" virou o visual padrão do sistema
      migrate: (persisted) => {
        const st = persisted as { theme?: string };
        const validThemes = ["light", "creme", "dark", "gray"];
        return { theme: validThemes.includes(st?.theme || "") ? st.theme : "light" } as { theme: Theme };
      },
    }
  )
);
