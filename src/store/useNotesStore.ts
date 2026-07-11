"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId } from "@/lib/id";

export interface NoteItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface QuickNote {
  id:        string;
  title?:    string;
  text:      string;
  type:      "text" | "list";
  items:     NoteItem[];
  pinned:    boolean;
  createdAt: number;
}

export const MAX_PINNED = 4;

interface State {
  notes: QuickNote[];
}

interface Actions {
  add:        (type: "text" | "list") => string;
  update:     (id: string, updates: Partial<QuickNote>) => void;
  remove:     (id: string) => void;
  togglePin:  (id: string) => void;
  pinned:     () => QuickNote[];
}

export const useNotesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      notes: [],

      add: (type) => {
        const id = genId();
        set((s) => ({
          notes: [{ id, title: "", text: "", type, items: [], pinned: false, createdAt: Date.now() }, ...s.notes],
        }));
        return id;
      },

      update: (id, updates) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)) })),

      remove: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      togglePin: (id) =>
        set((s) => {
          const note      = s.notes.find((n) => n.id === id);
          if (!note) return s;
          const pinCount  = s.notes.filter((n) => n.pinned).length;
          // Block pin if already at max (unless unpinning)
          if (!note.pinned && pinCount >= MAX_PINNED) return s;
          return {
            notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
          };
        }),

      pinned: () => get().notes.filter((n) => n.pinned),
    }),
    { 
      name: "hexxa-quick-notes",
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // migrate old notes to new format
          const oldState = persistedState as any;
          return {
            notes: (oldState?.notes || []).map((n: any) => ({
              ...n,
              title: n.title || "",
              type: n.type || "text",
              items: n.items || [],
            }))
          };
        }
        return persistedState;
      }
    },
  ),
);
