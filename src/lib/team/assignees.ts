"use client";
import { getSupabase } from "@/lib/supabase";

export async function listAssignees(taskId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("task_assignees")
    .select("user_id")
    .eq("task_id", taskId);
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string);
}

export async function addAssignee(taskId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("task_assignees")
    .insert({ task_id: taskId, user_id: userId });
  if (error && (error as any).code !== "23505") throw error;
}

export async function removeAssignee(taskId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);
}

export async function listAllAssignments(): Promise<Map<string, string[]>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase.from("task_assignees").select("task_id, user_id");
  if (error) throw error;
  const map = new Map<string, string[]>();
  for (const r of data ?? []) {
    const t = r.task_id as string;
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(r.user_id as string);
  }
  return map;
}
