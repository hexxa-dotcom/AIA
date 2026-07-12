import { create } from "zustand";
import { persist } from "zustand/middleware";

// 3 modos: claro (branco creme + cores), escuro (inverte + cores),
// foco (P&B, sem cores).
export type Theme = "light" | "dark" | "foco";

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
        const next: Record<Theme, Theme> = { light: "dark", dark: "foco", foco: "light" };
        return { theme: next[s.theme] };
      }),
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: "aia-theme",
      version: 2,
      // v2: "creme" fundiu-se ao claro; "gray" virou "foco".
      migrate: (persisted) => {
        const st = persisted as { theme?: string };
        const map: Record<string, Theme> = {
          light: "light", creme: "light",
          dark: "dark", gray: "foco", foco: "foco",
        };
        return { theme: map[st?.theme || ""] || "light" };
      },
    }
  )
);
