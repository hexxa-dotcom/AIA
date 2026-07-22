"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";

export interface TextDocument {
  id: string;
  title: string;
  content: string; // HTML format from Quill
  createdAt: number;
  updatedAt: number;
}

interface State {
  texts: TextDocument[];
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  addText: (title: string, content: string) => string;
  updateText: (id: string, title: string, content: string) => void;
  removeText: (id: string) => void;
}

export const useTextsStore = create<State & Actions>()(
  persist(
    (set) => ({
      texts: [],
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      addText: (title, content) => {
        const id = nanoid();
        const now = Date.now();
        set((s) => ({
          texts: [
            { id, title, content, createdAt: now, updatedAt: now },
            ...s.texts,
          ],
        }));
        return id;
      },

      updateText: (id, title, content) =>
        set((s) => ({
          texts: s.texts.map((t) =>
            t.id === id ? { ...t, title, content, updatedAt: Date.now() } : t
          ),
        })),

      removeText: (id) =>
        set((s) => ({
          texts: s.texts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "aia-texts-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
