"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { Query } from "appwrite";

export async function listAssignees(taskId: string): Promise<string[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "task_assignees", [
      Query.equal("taskId", taskId),
    ]);
    return res.documents.map((r) => r.userId as string);
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = `${taskId}_${userId}`;
    try {
      await databases.createDocument(databaseId, "task_assignees", docId, {
        taskId,
        userId,
      });
    } catch (e: any) {
      if (e.status !== 409) throw e;
    }
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("task_assignees")
    .insert({ task_id: taskId, user_id: userId });
  if (error && (error as any).code !== "23505") throw error;
}

export async function removeAssignee(taskId: string, userId: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = `${taskId}_${userId}`;
    try {
      await databases.deleteDocument(databaseId, "task_assignees", docId);
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);
}

export async function listAllAssignments(): Promise<Map<string, string[]>> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return new Map();
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "task_assignees", [
      Query.limit(1000),
    ]);
    const map = new Map<string, string[]>();
    for (const r of res.documents) {
      const t = r.taskId as string;
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r.userId as string);
    }
    return map;
  }

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

