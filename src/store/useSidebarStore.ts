"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  collapsed:  boolean;
  openGroups: Record<string, boolean>;
}

interface Actions {
  toggle:      () => void;
  toggleGroup: (key: string) => void;
  openGroup:   (key: string) => void;
}

export const useSidebarStore = create<State & Actions>()(
  persist(
    (set) => ({
      collapsed:  false,
      openGroups: { profissional: true, pessoal: false },

      toggle: () => set((s) => ({ collapsed: !s.collapsed })),

      // acordeão: abrir um grupo fecha os demais (menos elementos visíveis)
      toggleGroup: (key) =>
        set((s) => ({
          openGroups: { [key]: !s.openGroups[key] },
        })),

      openGroup: (key) =>
        set((s) => (s.openGroups[key] ? s : { openGroups: { [key]: true } })),
    }),
    {
      name: "hexxa-sidebar",
      version: 1,
      // v1: acordeão — estado antigo tinha os dois grupos abertos
      migrate: () => ({ collapsed: false, openGroups: { profissional: true } }),
    },
  ),
);
