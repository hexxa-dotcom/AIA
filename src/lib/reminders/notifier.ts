"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export type ReminderChannel = "browser" | "email" | "both";

export interface ReminderRow {
  id: string;
  task_id: string;
  remind_at: string;
  channel: ReminderChannel;
  message: string | null;
  sent_at: string | null;
}

export interface Reminder {
  id: string;
  taskId: string;
  remindAt: number;
  channel: ReminderChannel;
  message?: string;
  sentAt?: number;
}

function rowToReminder(r: ReminderRow): Reminder {
  return {
    id: r.id,
    taskId: r.task_id,
    remindAt: new Date(r.remind_at).getTime(),
    channel: r.channel,
    message: r.message ?? undefined,
    sentAt: r.sent_at ? new Date(r.sent_at).getTime() : undefined,
  };
}

export async function listReminders(userId: string): Promise<Reminder[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "reminders", [
      Query.equal("userId", userId),
    ]);
    return res.documents.map((r: any) => ({
      id: r.$id,
      taskId: r.taskId,
      remindAt: r.remindAt,
      channel: r.channel as ReminderChannel,
      message: r.message || undefined,
      sentAt: r.sentAt || undefined,
    }));
  }

  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => rowToReminder(r as ReminderRow));
}

export async function createReminder(
  userId: string,
  reminder: Omit<Reminder, "id" | "sentAt">,
): Promise<string> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = ID.unique();
    const permissions = [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
    ];
    const data = await databases.createDocument(
      databaseId,
      "reminders",
      docId,
      {
        userId,
        taskId: reminder.taskId,
        remindAt: reminder.remindAt,
        channel: reminder.channel,
        message: reminder.message || null,
        sentAt: null,
      },
      permissions,
    );
    return data.$id;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: userId,
      task_id: reminder.taskId,
      remind_at: new Date(reminder.remindAt).toISOString(),
      channel: reminder.channel,
      message: reminder.message ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function deleteReminder(id: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.deleteDocument(databaseId, "reminders", id);
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("reminders").delete().eq("id", id);
}

export async function markReminderSent(id: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.updateDocument(databaseId, "reminders", id, {
        sentAt: Date.now(),
      });
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("reminders")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function fireNotification(title: string, options?: NotificationOptions) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  } catch (e) {
    console.warn("notification failed", e);
  }
}

