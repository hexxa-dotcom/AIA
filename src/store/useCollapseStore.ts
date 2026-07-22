"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  map: Record<string, boolean>;
  focusMode: boolean;
}

interface Actions {
  register: (key: string, defaultCollapsed: boolean) => void;
  toggle: (key: string) => void;
  setFocusMode: (on: boolean) => void;
}

export const useCollapseStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      map: {},
      focusMode: false,

      register: (key, defaultCollapsed) => {
        if (get().map[key] === undefined) {
          set((s) => ({ map: { ...s.map, [key]: defaultCollapsed } }));
        }
      },

      toggle: (key) =>
        set((s) => ({
          map: { ...s.map, [key]: !s.map[key] },
        })),

      // modo foco: colapsa todos os widgets de uma vez (nada é removido)
      setFocusMode: (on) =>
        set((s) => ({
          focusMode: on,
          map: Object.fromEntries(Object.keys(s.map).map((k) => [k, on])),
        })),
    }),
    { name: "aia-collapse" },
  ),
);
