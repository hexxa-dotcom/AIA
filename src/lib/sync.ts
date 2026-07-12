"use client";
import { useEffect, useRef } from "react";
import { pullAll, pushAll } from "@/lib/adapters";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";
import { useAuthStore } from "@/store/useAuthStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useGameStore } from "@/store/useGameStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useStudiesStore } from "@/store/useStudiesStore";
import { makeSeedData } from "@/lib/seed";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedSig = "";

function isRemoteSyncEnabled(): boolean {
  return isSupabaseEnabled() || isAppwriteEnabled();
}

function snapshotSig(): string {
  const t = useTaskStore.getState();
  const r = useRoutineStore.getState();
  const g = useGameStore.getState();
  const f = useFinanceStore.getState();
  const a = useAgendaStore.getState();
  const s = useStudiesStore.getState();
  return JSON.stringify([
    t.boards.length,
    t.tasks.map((x) => [x.id, x.updatedAt, x.column, x.order, x.subtasks.length]),
    r.blocks.map((x) => [x.id, x.title, x.startMinute]),
    [g.xp, g.level, g.streakDays, g.achievements.length],
    f.expenses.length,
    f.invites.length,
    a.appointments.length,
    s.items.length,
  ]);
}

async function pushNow(userId: string) {
  const t = useTaskStore.getState();
  const r = useRoutineStore.getState();
  const g = useGameStore.getState();
  const f = useFinanceStore.getState();
  const a = useAgendaStore.getState();
  const s = useStudiesStore.getState();
  await pushAll(userId, {
    boards: t.boards,
    tasks: t.tasks,
    timeEntries: t.timeEntries,
    routines: r.blocks,
    game: {
      xp: g.xp,
      level: g.level,
      streakDays: g.streakDays,
      lastActiveDay: g.lastActiveDay,
      todayXp: g.todayXp,
      todayDate: g.todayDate,
      achievements: g.achievements,
      history: g.history,
    },
    expenses: f.expenses,
    expenseInvites: f.invites,
    appointments: a.appointments,
    studies: s.items,
  });
}

function schedulePush(userId: string) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const sig = snapshotSig();
    if (sig === lastPushedSig) return;
    try {
      await pushNow(userId);
      lastPushedSig = sig;
    } catch (e: any) {
      console.error("[db sync] push falhou:", {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
        raw: e,
      });
    }
  }, 2000);
}

export function useSupabaseSync() {
  const user = useAuthStore((s) => s.user);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isRemoteSyncEnabled() || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await pullAll(user.id);
        if (cancelled) return;

        const seedIfEmpty = !data.boards.length;
        const tStore = useTaskStore.getState();
        const rStore = useRoutineStore.getState();
        const gStore = useGameStore.getState();

        if (seedIfEmpty) {
          const seed = makeSeedData();
          useTaskStore.setState({
            boards: [seed.board],
            activeBoardId: seed.board.id,
            tasks: seed.tasks,
            timeEntries: [],
          });
          useRoutineStore.setState({ blocks: seed.routines });
        } else {
          useTaskStore.setState({
            boards: data.boards,
            activeBoardId: data.boards[0]?.id ?? "",
            tasks: data.tasks,
            timeEntries: data.timeEntries,
          });
          useRoutineStore.setState({ blocks: data.routines });
          if (data.game) {
            useGameStore.setState({
              xp: data.game.xp,
              level: data.game.level,
              streakDays: data.game.streakDays,
              lastActiveDay: data.game.lastActiveDay,
              achievements: data.game.achievements,
              history: data.game.history,
            });
          }
          if (data.expenses) {
            useFinanceStore.setState({ expenses: data.expenses, invites: data.expenseInvites || [] });
          }
          if (data.appointments) {
            useAgendaStore.setState({ appointments: data.appointments });
          }
          if (data.studies) {
            useStudiesStore.setState({ items: data.studies });
          }
        }

        initialized.current = true;

        if (seedIfEmpty) {
          // Seed acabou de subir local; força push pra subir pro banco remoto
          lastPushedSig = "__force__";
          schedulePush(user.id);
        } else {
          lastPushedSig = snapshotSig();
        }
      } catch (e) {
        console.error("[db sync] pull falhou:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!isRemoteSyncEnabled() || !user) return;

    const unsubT = useTaskStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });
    const unsubR = useRoutineStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });
    const unsubG = useGameStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });
    const unsubF = useFinanceStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });
    const unsubA = useAgendaStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });
    const unsubS = useStudiesStore.subscribe(() => {
      if (initialized.current) schedulePush(user.id);
    });

    return () => {
      unsubT();
      unsubR();
      unsubG();
      unsubF();
      unsubA();
      unsubS();
    };
  }, [user]);
}

