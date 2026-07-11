"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import { ACHIEVEMENTS, levelFromXp, type AchievementContext } from "@/lib/xp";
import { todayKey, daysBetween } from "@/lib/utils";
import type { Achievement, GameState, XPEvent } from "@/lib/types";

interface Actions {
  addXp: (amount: number, reason: string) => { leveledUp: boolean; newLevel: number };
  registerActivity: () => void;
  checkAchievements: (ctx: AchievementContext) => Achievement[];
  resetTodayIfNewDay: () => void;
}

const initial: GameState = {
  xp: 0,
  level: 1,
  streakDays: 0,
  todayXp: 0,
  achievements: [],
  history: [],
};

export const useGameStore = create<GameState & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      addXp: (amount, reason) => {
        const before = get().xp;
        const after = before + amount;
        const oldLevel = levelFromXp(before);
        const newLevel = levelFromXp(after);
        const today = todayKey();
        const todayXp =
          get().todayDate === today ? get().todayXp + amount : amount;
        const event: XPEvent = { id: nanoid(), amount, reason, at: Date.now() };
        set({
          xp: after,
          level: newLevel,
          todayXp,
          todayDate: today,
          history: [event, ...get().history].slice(0, 100),
        });
        return { leveledUp: newLevel > oldLevel, newLevel };
      },

      registerActivity: () => {
        const today = todayKey();
        const last = get().lastActiveDay;
        if (last === today) return;
        let streak = get().streakDays;
        if (!last) {
          streak = 1;
        } else {
          const diff = daysBetween(last, today);
          if (diff === 1) streak += 1;
          else if (diff > 1) streak = 1;
        }
        set({ lastActiveDay: today, streakDays: streak });
      },

      checkAchievements: (ctx) => {
        const have = new Set(get().achievements.map((a) => a.key));
        const fresh: Achievement[] = [];
        for (const def of ACHIEVEMENTS) {
          if (have.has(def.key)) continue;
          if (def.test(ctx)) {
            fresh.push({
              id: nanoid(),
              key: def.key,
              title: def.title,
              description: def.description,
              emoji: def.emoji,
              unlockedAt: Date.now(),
            });
          }
        }
        if (fresh.length > 0) {
          set({ achievements: [...get().achievements, ...fresh] });
        }
        return fresh;
      },

      resetTodayIfNewDay: () => {
        const today = todayKey();
        if (get().todayDate !== today) set({ todayDate: today, todayXp: 0 });
      },
    }),
    { name: "aia-game-store" },
  ),
);
