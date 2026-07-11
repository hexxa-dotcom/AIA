"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PinnedMessage {
  id: string;
  type: "message" | "task" | "note";
  content: string;
  fromUser?: string;
  taskRef?: string;
  pinnedAt: number;
}

interface State {
  pinnedMessages: PinnedMessage[];
  hydrated: boolean;
}

interface Actions {
  pin: (id: string, type: "message" | "task" | "note", content: string, fromUser?: string, taskRef?: string) => void;
  unpin: (id: string) => void;
  setHydrated: (h: boolean) => void;
}

export const useFeedStore = create<State & Actions>()(
  persist(
    (set) => ({
      pinnedMessages: [],
      hydrated: false,

      pin: (id, type, content, fromUser, taskRef) =>
        set((s) => ({
          pinnedMessages: [
            ...s.pinnedMessages,
            {
              id,
              type,
              content,
              fromUser,
              taskRef,
              pinnedAt: Date.now(),
            },
          ],
        })),

      unpin: (id) =>
        set((s) => ({
          pinnedMessages: s.pinnedMessages.filter((m) => m.id !== id),
        })),

      setHydrated: (h) => set({ hydrated: h }),
    }),
    {
      name: "aia-feed",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      },
    },
  ),
);
