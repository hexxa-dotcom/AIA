"use client";
import { getSupabase } from "@/lib/supabase";
import type {
  Achievement,
  Board,
  ColumnKey,
  GameState,
  Priority,
  RoutineBlock,
  RoutineRecurrence,
  Subtask,
  Task,
  TimeEntry,
  XPEvent,
} from "@/lib/types";

export interface SupabaseSnapshot {
  boards: Board[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  routines: RoutineBlock[];
  game: GameState | null;
}

function rowToTask(row: any, subtasks: any[]): Task {
  return {
    id: row.id,
    boardId: row.board_id,
    column: row.column_key as ColumnKey,
    order: row.position ?? 0,
    title: row.title,
    description: row.description ?? undefined,
    priority: (row.priority ?? "medium") as Priority,
    dueDate: row.due_date ? new Date(row.due_date).getTime() : undefined,
    startDate: row.start_date ? new Date(row.start_date).getTime() : undefined,
    scheduledStart: row.scheduled_start ? new Date(row.scheduled_start).getTime() : undefined,
    scheduledEnd: row.scheduled_end ? new Date(row.scheduled_end).getTime() : undefined,
    tags: row.tags ?? [],
    coverColor: row.cover_color ?? undefined,
    totalTimeSec: row.total_time_sec ?? 0,
    hourlyRate: row.hourly_rate ?? undefined,
    recurrence: row.recurrence ?? undefined,
    collaborators: row.collaborators ?? undefined,
    sharedFrom: row.shared_from ?? undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    assignees: [],
    subtasks: subtasks
      .filter((s) => s.task_id === row.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(
        (s): Subtask => ({
          id: s.id,
          title: s.title,
          done: s.done,
          doneAt: s.done_at ? new Date(s.done_at).getTime() : undefined,
          createdAt: new Date(s.created_at).getTime(),
        }),
      ),
  };
}

function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    board_id: t.boardId,
    user_id: userId,
    column_key: t.column,
    position: t.order,
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    start_date: t.startDate ? new Date(t.startDate).toISOString() : null,
    scheduled_start: t.scheduledStart ? new Date(t.scheduledStart).toISOString() : null,
    scheduled_end: t.scheduledEnd ? new Date(t.scheduledEnd).toISOString() : null,
    tags: t.tags,
    cover_color: t.coverColor ?? null,
    total_time_sec: t.totalTimeSec,
    hourly_rate: t.hourlyRate ?? null,
    recurrence: t.recurrence ?? null,
    collaborators: t.collaborators ?? null,
    shared_from: t.sharedFrom ?? null,
    completed_at: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    updated_at: new Date(t.updatedAt).toISOString(),
  };
}

function subtaskToRow(s: Subtask, taskId: string, position: number) {
  return {
    id: s.id,
    task_id: taskId,
    title: s.title,
    done: s.done,
    done_at: s.doneAt ? new Date(s.doneAt).toISOString() : null,
    position,
  };
}

function rowToRoutine(r: any): RoutineBlock {
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji ?? undefined,
    startMinute: r.start_minute,
    endMinute: r.end_minute,
    recurrence: r.recurrence as RoutineRecurrence,
    weekdays: r.weekdays ?? undefined,
    color: r.color ?? "#d6d6d2",
    isFlexible: r.is_flexible ?? false,
  };
}

function routineToRow(b: RoutineBlock, userId: string) {
  return {
    id: b.id,
    user_id: userId,
    title: b.title,
    emoji: b.emoji ?? null,
    start_minute: b.startMinute,
    end_minute: b.endMinute,
    recurrence: b.recurrence,
    weekdays: b.weekdays ?? [],
    color: b.color,
    is_flexible: b.isFlexible,
  };
}

export async function pullAll(userId: string): Promise<SupabaseSnapshot> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");

  const [boardsRes, tasksRes, subsRes, timeRes, routineRes, gameRes, achRes, xpRes] = await Promise.all([
    supabase.from("boards").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId).order("position", { ascending: true }),
    supabase.from("subtasks").select("*"),
    supabase.from("time_entries").select("*").eq("user_id", userId),
    supabase.from("routine_blocks").select("*").eq("user_id", userId),
    supabase.from("game_state").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("achievements").select("*").eq("user_id", userId),
    supabase.from("xp_events").select("*").eq("user_id", userId).order("at", { ascending: false }).limit(100),
  ]);

  const errors = [boardsRes, tasksRes, subsRes, timeRes, routineRes, achRes, xpRes].find((r) => r.error);
  if (errors?.error) throw errors.error;

  const boards = (boardsRes.data ?? []).map(
    (b): Board => ({
      id: b.id,
      name: b.name,
      emoji: b.emoji ?? undefined,
      createdAt: new Date(b.created_at).getTime(),
    }),
  );

  const tasks = (tasksRes.data ?? []).map((row) => rowToTask(row, subsRes.data ?? []));

  const timeEntries = (timeRes.data ?? []).map(
    (e): TimeEntry => ({
      id: e.id,
      taskId: e.task_id,
      startedAt: new Date(e.started_at).getTime(),
      endedAt: e.ended_at ? new Date(e.ended_at).getTime() : undefined,
      durationSec: e.duration_sec ?? 0,
      note: e.note ?? undefined,
    }),
  );

  const routines = (routineRes.data ?? []).map(rowToRoutine);

  const achievements: Achievement[] = (achRes.data ?? []).map((a) => ({
    id: a.id,
    key: a.key,
    title: "",
    description: "",
    emoji: "",
    unlockedAt: new Date(a.unlocked_at).getTime(),
  }));

  const history: XPEvent[] = (xpRes.data ?? []).map((x) => ({
    id: x.id,
    amount: x.amount,
    reason: x.reason ?? "",
    at: new Date(x.at).getTime(),
  }));

  const gameRow = gameRes.data;
  const game: GameState | null = gameRow
    ? {
        xp: gameRow.xp ?? 0,
        level: gameRow.level ?? 1,
        streakDays: gameRow.streak_days ?? 0,
        lastActiveDay: gameRow.last_active_day ?? undefined,
        todayXp: 0,
        achievements,
        history,
      }
    : null;

  return { boards, tasks, timeEntries, routines, game };
}

export async function pushAll(
  userId: string,
  snapshot: SupabaseSnapshot,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");

  const boardRows = snapshot.boards.map((b) => ({
    id: b.id,
    user_id: userId,
    name: b.name,
    emoji: b.emoji ?? null,
  }));
  if (boardRows.length > 0) {
    const { error } = await supabase.from("boards").upsert(boardRows, { onConflict: "id" });
    if (error) throw new Error(`${error.message} [code=${error.code} hint=${error.hint ?? ""} details=${error.details ?? ""}]`);
  }

  const taskRows = snapshot.tasks.map((t) => taskToRow(t, userId));
  if (taskRows.length > 0) {
    const { error } = await supabase.from("tasks").upsert(taskRows, { onConflict: "id" });
    if (error) throw new Error(`${error.message} [code=${error.code} hint=${error.hint ?? ""} details=${error.details ?? ""}]`);
  }

  const subRows = snapshot.tasks.flatMap((t) =>
    t.subtasks.map((s, i) => subtaskToRow(s, t.id, i)),
  );
  if (subRows.length > 0) {
    const { error } = await supabase.from("subtasks").upsert(subRows, { onConflict: "id" });
    if (error) throw new Error(`${error.message} [code=${error.code} hint=${error.hint ?? ""} details=${error.details ?? ""}]`);
  }

  const routineRows = snapshot.routines.map((r) => routineToRow(r, userId));
  if (routineRows.length > 0) {
    const { error } = await supabase
      .from("routine_blocks")
      .upsert(routineRows, { onConflict: "id" });
    if (error) throw new Error(`${error.message} [code=${error.code} hint=${error.hint ?? ""} details=${error.details ?? ""}]`);
  }

  if (snapshot.game) {
    const { error } = await supabase.from("game_state").upsert(
      {
        user_id: userId,
        xp: snapshot.game.xp,
        level: snapshot.game.level,
        streak_days: snapshot.game.streakDays,
        last_active_day: snapshot.game.lastActiveDay ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`${error.message} [code=${error.code} hint=${error.hint ?? ""} details=${error.details ?? ""}]`);
  }
}

export async function deleteTaskRemote(taskId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("tasks").delete().eq("id", taskId);
}

export async function deleteRoutineRemote(id: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("routine_blocks").delete().eq("id", id);
}
