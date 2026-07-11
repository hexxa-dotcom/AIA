"use client";
import { getSupabase } from "@/lib/supabase";

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
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("reminders").delete().eq("id", id);
}

export async function markReminderSent(id: string): Promise<void> {
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
