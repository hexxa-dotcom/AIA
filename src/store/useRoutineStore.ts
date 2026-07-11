"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import type { RoutineBlock, RoutineRecurrence } from "@/lib/types";

interface State {
  blocks: RoutineBlock[];
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  bulkSet: (blocks: RoutineBlock[]) => void;
  addBlock: (input: Omit<RoutineBlock, "id">) => void;
  updateBlock: (id: string, patch: Partial<RoutineBlock>) => void;
  deleteBlock: (id: string) => void;
  blocksForDate: (date: Date) => RoutineBlock[];
}

function activeOn(block: RoutineBlock, date: Date): boolean {
  const dow = date.getDay();
  switch (block.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "weekly":
      return block.weekdays?.includes(dow) ?? false;
    case "custom":
      return block.weekdays?.includes(dow) ?? false;
  }
}

export const useRoutineStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      blocks: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      bulkSet: (blocks) => set({ blocks }),

      addBlock: (input) => {
        const block: RoutineBlock = { id: nanoid(), ...input };
        set((s) => ({ blocks: [...s.blocks, block] }));
      },

      updateBlock: (id, patch) =>
        set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      deleteBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

      blocksForDate: (date) =>
        get()
          .blocks.filter((b) => activeOn(b, date))
          .sort((a, b) => a.startMinute - b.startMinute),
    }),
    {
      name: "hexxa-routine-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export type { RoutineRecurrence };
