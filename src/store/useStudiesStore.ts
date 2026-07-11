"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";

export interface StudyItem {
  id: string;
  type: "book" | "course";
  title: string;
  authorOrProvider?: string;
  status: "to_do" | "doing" | "done";
  currentProgress: number; // pages or classes
  totalProgress: number;
  coverUrl?: string;
  emoji?: string;
}

interface State {
  items: StudyItem[];
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  addItem: (input: Omit<StudyItem, "id">) => void;
  updateItem: (id: string, patch: Partial<StudyItem>) => void;
  deleteItem: (id: string) => void;
}

export const useStudiesStore = create<State & Actions>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addItem: (input) => {
        set((s) => ({
          items: [...s.items, { id: nanoid(), ...input }],
        }));
      },
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      deleteItem: (id) =>
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
        })),
    }),
    {
      name: "hexxa-studies-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
