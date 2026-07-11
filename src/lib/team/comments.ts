"use client";
import { getSupabase } from "@/lib/supabase";

export interface CommentItem {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  mentions: string[];
  createdAt: number;
}

function rowToComment(r: any): CommentItem {
  return {
    id: r.id,
    taskId: r.task_id,
    userId: r.user_id,
    body: r.body,
    mentions: r.mentions ?? [],
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listComments(taskId: string): Promise<CommentItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToComment);
}

export async function addComment(
  taskId: string,
  userId: string,
  body: string,
  mentions: string[] = [],
): Promise<CommentItem> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: userId, body, mentions })
    .select("*")
    .single();
  if (error) throw error;
  return rowToComment(data);
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("task_comments").delete().eq("id", id);
}
