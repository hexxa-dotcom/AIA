"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";

export interface Tool {
  id: string;
  name: string;
  url: string;
  icon?: string;
  createdAt: number;
}

interface State {
  tools: Tool[];
  hydrated: boolean;
}

interface Actions {
  add: (name: string, url: string, icon?: string) => void;
  remove: (id: string) => void;
  update: (id: string, name: string, url: string, icon?: string) => void;
  setHydrated: (h: boolean) => void;
}

export const useToolsStore = create<State & Actions>()(
  persist(
    (set) => ({
      tools: [],
      hydrated: false,

      add: (name, url, icon) =>
        set((s) => ({
          tools: [
            ...s.tools,
            {
              id: nanoid(),
              name,
              url,
              icon,
              createdAt: Date.now(),
            },
          ],
        })),

      remove: (id) =>
        set((s) => ({
          tools: s.tools.filter((t) => t.id !== id),
        })),

      update: (id, name, url, icon) =>
        set((s) => ({
          tools: s.tools.map((t) =>
            t.id === id ? { ...t, name, url, icon } : t,
          ),
        })),

      setHydrated: (h) => set({ hydrated: h }),
    }),
    {
      name: "aia-tools",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    },
  ),
);
