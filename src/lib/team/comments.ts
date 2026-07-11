"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

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
    id: r.$id || r.id,
    taskId: r.taskId || r.task_id,
    userId: r.userId || r.user_id,
    body: r.body,
    mentions: r.mentions ?? [],
    createdAt: r.createdAt ? r.createdAt : new Date(r.created_at).getTime(),
  };
}

export async function listComments(taskId: string): Promise<CommentItem[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "task_comments", [
      Query.equal("taskId", taskId),
      Query.orderAsc("createdAt"),
    ]);
    return res.documents.map(rowToComment);
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = ID.unique();
    const permissions = [
      `read("users")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
    ];
    const data = await databases.createDocument(
      databaseId,
      "task_comments",
      docId,
      {
        taskId,
        userId,
        body,
        mentions,
        createdAt: Date.now(),
      },
      permissions,
    );
    return rowToComment(data);
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.deleteDocument(databaseId, "task_comments", id);
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("task_comments").delete().eq("id", id);
}

