"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import type { ActiveTimer } from "@/lib/types";
import { useTaskStore } from "./useTaskStore";

interface State {
  active?: ActiveTimer;
}

interface Actions {
  start: (taskId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => number;
  elapsedSec: () => number;
}

export const useTimerStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      active: undefined,

      start: (taskId) => {
        const cur = get().active;
        if (cur) get().stop();
        set({ active: { taskId, startedAt: Date.now(), accumulatedSec: 0, paused: false } });
        import("../store/useSoundStore").then(({ playSound }) => playSound("taskStart"));
      },

      pause: () => {
        const a = get().active;
        if (!a || a.paused) return;
        const elapsed = Math.floor((Date.now() - a.startedAt) / 1000);
        set({ active: { ...a, accumulatedSec: a.accumulatedSec + elapsed, paused: true, startedAt: Date.now() } });
      },

      resume: () => {
        const a = get().active;
        if (!a || !a.paused) return;
        set({ active: { ...a, paused: false, startedAt: Date.now() } });
      },

      stop: () => {
        const a = get().active;
        if (!a) return 0;
        const extra = a.paused ? 0 : Math.floor((Date.now() - a.startedAt) / 1000);
        const total = a.accumulatedSec + extra;
        if (total > 0) {
          useTaskStore.getState().addTimeEntry({
            id: nanoid(),
            taskId: a.taskId,
            startedAt: a.startedAt - a.accumulatedSec * 1000,
            endedAt: Date.now(),
            durationSec: total,
          });
        }
        set({ active: undefined });
        return total;
      },

      elapsedSec: () => {
        const a = get().active;
        if (!a) return 0;
        const extra = a.paused ? 0 : Math.floor((Date.now() - a.startedAt) / 1000);
        return a.accumulatedSec + extra;
      },
    }),
    { name: "aia-timer-store" },
  ),
);
