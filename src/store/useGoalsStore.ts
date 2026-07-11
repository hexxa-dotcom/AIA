import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GoalCategory = "pessoal" | "profissional" | "saude" | "financeiro" | "outro";
export type GoalStatus = "ativo" | "concluido" | "pausado";

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface PersonalGoal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number; // 0-100
  targetDate?: number;
  completedAt?: number;
  milestones: GoalMilestone[];
  createdAt: number;
}

interface State {
  goals: PersonalGoal[];
  addGoal: (g: Omit<PersonalGoal, "id" | "createdAt" | "milestones" | "status" | "progress">) => void;
  updateGoal: (id: string, patch: Partial<PersonalGoal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;
}

export const useGoalsStore = create<State>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (g) =>
        set((s) => ({
          goals: [
            ...s.goals,
            {
              ...g,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              milestones: [],
              status: "ativo",
              progress: 0,
            },
          ],
        })),

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      toggleMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, done: !m.done } : m,
            );
            const progress =
              milestones.length === 0
                ? g.progress
                : Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);
            const completedAt = progress === 100 ? Date.now() : undefined;
            const status: GoalStatus = progress === 100 ? "concluido" : g.status === "concluido" ? "ativo" : g.status;
            return { ...g, milestones, progress, completedAt, status };
          }),
        })),

      addMilestone: (goalId, title) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: [...g.milestones, { id: crypto.randomUUID(), title, done: false }] }
              : g,
          ),
        })),

      deleteMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.filter((m) => m.id !== milestoneId);
            const progress =
              milestones.length === 0 ? 0 : Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100);
            return { ...g, milestones, progress };
          }),
        })),
    }),
    { name: "hexxa-goals" },
  ),
);
