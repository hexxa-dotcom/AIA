"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  color?: string;
  exercises?: Exercise[];
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  dateStr: string; // YYYY-MM-DD
}

interface State {
  plans: WorkoutPlan[];
  logs: WorkoutLog[];
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  addPlan: (input: Omit<WorkoutPlan, "id">) => void;
  updatePlan: (id: string, patch: Partial<WorkoutPlan>) => void;
  deletePlan: (id: string) => void;
  logWorkout: (workoutId: string, dateStr: string) => void;
  unlogWorkout: (logId: string) => void;
}

export const useWorkoutStore = create<State & Actions>()(
  persist(
    (set) => ({
      plans: [],
      logs: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addPlan: (input) => {
        set((s) => ({
          plans: [...s.plans, { id: nanoid(), exercises: [], ...input }],
        }));
      },
      updatePlan: (id, patch) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePlan: (id) =>
        set((s) => ({
          plans: s.plans.filter((p) => p.id !== id),
          logs: s.logs.filter((l) => l.workoutId !== id),
        })),

      logWorkout: (workoutId, dateStr) =>
        set((s) => ({
          logs: [...s.logs, { id: nanoid(), workoutId, dateStr }],
        })),
      unlogWorkout: (logId) =>
        set((s) => ({ logs: s.logs.filter((l) => l.id !== logId) })),
    }),
    {
      name: "aia-workout-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
