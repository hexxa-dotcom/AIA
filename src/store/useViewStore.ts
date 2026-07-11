"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "kanban" | "postits" | "list" | "timeline" | "grouped";

interface State {
  mode: ViewMode;
  groupBy: "tag" | "priority";
  postitPositions: Record<string, { x: number; y: number; color: string }>;
}

interface Actions {
  setMode: (m: ViewMode) => void;
  setGroupBy: (g: "tag" | "priority") => void;
  setPostitPos: (id: string, x: number, y: number, color?: string) => void;
}

const POSTIT_COLORS = ["#ffffff", "#f5f5f3", "#ececea", "#e0e0de", "#d4d4d2", "#c8c8c6", "#bcbcba"];

export function randomPostitColor() {
  return POSTIT_COLORS[Math.floor(Math.random() * POSTIT_COLORS.length)];
}

export const useViewStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      mode: "kanban",
      groupBy: "priority",
      postitPositions: {},
      setMode: (mode) => set({ mode }),
      setGroupBy: (groupBy) => set({ groupBy }),
      setPostitPos: (id, x, y, color) =>
        set((s) => ({
          postitPositions: {
            ...s.postitPositions,
            [id]: { x, y, color: color ?? s.postitPositions[id]?.color ?? randomPostitColor() },
          },
        })),
    }),
    { name: "aia-view-store" },
  ),
);
