import { create } from "zustand";
import { persist } from "zustand/middleware";

// 2 modos: claro (branco creme + cores) e escuro (inverte + cores)
export type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  zenMode: boolean;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  setZenMode: (z: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "light",
      zenMode: false,
      toggle: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setTheme: (t) => set({ theme: t }),
      setZenMode: (z) => set({ zenMode: z }),
    }),
    {
      name: "aia-theme",
      version: 4,
      migrate: (persisted) => {
        const st = persisted as { theme?: string; zenMode?: boolean };
        const map: Record<string, Theme> = {
          light: "light", creme: "light",
          dark: "dark", foco: "light",
        };
        return { 
          theme: map[st?.theme || ""] || "light",
          zenMode: st?.zenMode ?? false
        };
      },
    }
  )
);
