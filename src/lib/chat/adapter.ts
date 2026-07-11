"use client";
import { getSupabase } from "@/lib/supabase";

export interface DmMessage {
  id: string;
  fromUser: string;
  toUser: string;
  body: string | null;
  taskRef: string | null;
  readAt: number | null;
  createdAt: number;
}

function rowToMsg(r: any): DmMessage {
  return {
    id: r.id,
    fromUser: r.from_user,
    toUser: r.to_user,
    body: r.body,
    taskRef: r.task_ref,
    readAt: r.read_at ? new Date(r.read_at).getTime() : null,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listDmsWith(
  meId: string,
  otherId: string,
): Promise<DmMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("dm_messages")
    .select("*")
    .or(
      `and(from_user.eq.${meId},to_user.eq.${otherId}),and(from_user.eq.${otherId},to_user.eq.${meId})`,
    )
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMsg);
}

export async function sendDm(opts: {
  fromUser: string;
  toUser: string;
  body?: string;
  taskRef?: string;
}): Promise<DmMessage> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({
      from_user: opts.fromUser,
      to_user: opts.toUser,
      body: opts.body ?? null,
      task_ref: opts.taskRef ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToMsg(data);
}

export async function markRead(meId: string, otherId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase
    .from("dm_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("from_user", otherId)
    .eq("to_user", meId)
    .is("read_at", null);
}

export async function listInboxSummary(meId: string): Promise<{ otherId: string; lastMsg: DmMessage; unread: number }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("dm_messages")
    .select("*")
    .or(`from_user.eq.${meId},to_user.eq.${meId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const map = new Map<string, { lastMsg: DmMessage; unread: number }>();
  for (const r of data ?? []) {
    const m = rowToMsg(r);
    const otherId = m.fromUser === meId ? m.toUser : m.fromUser;
    if (!map.has(otherId)) {
      map.set(otherId, { lastMsg: m, unread: 0 });
    }
    const entry = map.get(otherId)!;
    if (m.toUser === meId && !m.readAt) entry.unread += 1;
  }
  return Array.from(map.entries()).map(([otherId, v]) => ({ otherId, ...v }));
}
