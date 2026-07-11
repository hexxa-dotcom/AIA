"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { useAuthStore } from "@/store/useAuthStore";
import { ID, Query } from "appwrite";

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
    id: r.$id || r.id,
    taskId: r.taskId || r.task_id,
    userId: r.userId || r.user_id,
    action: r.action,
    payload: r.payload ? (typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload) : null,
    at: r.at ? r.at : new Date(r.at).getTime(),
  };
}

export async function listActivity(taskId: string): Promise<ActivityItem[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "task_activity", [
      Query.equal("taskId", taskId),
      Query.orderAsc("at"),
    ]);
    return res.documents.map(rowToActivity);
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const userId = useAuthStore.getState().user?.id ?? null;
    const docId = ID.unique();
    const permissions = [
      `read("users")`,
      ...(userId ? [`update("user:${userId}")`, `delete("user:${userId}")`] : []),
    ];
    await databases.createDocument(
      databaseId,
      "task_activity",
      docId,
      {
        taskId,
        userId,
        action,
        payload: payload ? JSON.stringify(payload) : null,
        at: Date.now(),
      },
      permissions,
    );
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  const userId = useAuthStore.getState().user?.id ?? null;
  await supabase
    .from("task_activity")
    .insert({ task_id: taskId, user_id: userId, action, payload: payload ?? null });
}

