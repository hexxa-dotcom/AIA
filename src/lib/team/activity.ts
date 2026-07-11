"use client";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export type ActivityAction =
  | "created"
  | "moved"
  | "completed"
  | "reopened"
  | "due_changed"
  | "priority_changed"
  | "assigned"
  | "unassigned"
  | "renamed";

export interface ActivityItem {
  id: string;
  taskId: string;
  userId: string | null;
  action: ActivityAction;
  payload: any;
  at: number;
}

function rowToActivity(r: any): ActivityItem {
  return {
    id: r.id,
    taskId: r.task_id,
    userId: r.user_id,
    action: r.action,
    payload: r.payload,
    at: new Date(r.at).getTime(),
  };
}

export async function listActivity(taskId: string): Promise<ActivityItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToActivity);
}

export async function logActivity(
  taskId: string,
  action: ActivityAction,
  payload?: any,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = useAuthStore.getState().user?.id ?? null;
  await supabase
    .from("task_activity")
    .insert({ task_id: taskId, user_id: userId, action, payload: payload ?? null });
}
