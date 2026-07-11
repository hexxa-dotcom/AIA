"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

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
    id: r.$id || r.id,
    fromUser: r.fromUser || r.from_user,
    toUser: r.toUser || r.to_user,
    body: r.body,
    taskRef: r.taskRef || r.task_ref,
    readAt: r.readAt ? r.readAt : (r.read_at ? new Date(r.read_at).getTime() : null),
    createdAt: r.createdAt ? r.createdAt : new Date(r.created_at).getTime(),
  };
}

async function listAllDocuments(collectionId: string, queries: any[] = []): Promise<any[]> {
  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado");
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";

  let allDocs: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await databases.listDocuments(databaseId, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset),
    ]);
    allDocs = allDocs.concat(res.documents);
    if (res.documents.length < limit) break;
    offset += limit;
  }
  return allDocs;
}

export async function listDmsWith(
  meId: string,
  otherId: string,
): Promise<DmMessage[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";

    // Busca nas duas direções e mescla localmente
    const [res1, res2] = await Promise.all([
      databases.listDocuments(databaseId, "dm_messages", [
        Query.equal("fromUser", meId),
        Query.equal("toUser", otherId),
        Query.limit(100),
      ]),
      databases.listDocuments(databaseId, "dm_messages", [
        Query.equal("fromUser", otherId),
        Query.equal("toUser", meId),
        Query.limit(100),
      ]),
    ]);

    const merged = [...res1.documents, ...res2.documents]
      .map(rowToMsg)
      .sort((a, b) => a.createdAt - b.createdAt);
    return merged;
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = ID.unique();
    const permissions = [
      `read("user:${opts.fromUser}")`,
      `read("user:${opts.toUser}")`,
      `update("user:${opts.fromUser}")`,
      `delete("user:${opts.fromUser}")`,
    ];
    const data = await databases.createDocument(
      databaseId,
      "dm_messages",
      docId,
      {
        fromUser: opts.fromUser,
        toUser: opts.toUser,
        body: opts.body || null,
        taskRef: opts.taskRef || null,
        readAt: null,
        createdAt: Date.now(),
      },
      permissions,
    );
    return rowToMsg(data);
  }

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
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";

    try {
      const res = await databases.listDocuments(databaseId, "dm_messages", [
        Query.equal("fromUser", otherId),
        Query.equal("toUser", meId),
        Query.isNull("readAt"),
        Query.limit(100),
      ]);

      for (const doc of res.documents) {
        await databases.updateDocument(databaseId, "dm_messages", doc.$id, {
          readAt: Date.now(),
        });
      }
    } catch (e) {}
    return;
  }

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
  if (isAppwriteEnabled()) {
    const [res1, res2] = await Promise.all([
      listAllDocuments("dm_messages", [Query.equal("fromUser", meId)]),
      listAllDocuments("dm_messages", [Query.equal("toUser", meId)]),
    ]);

    const allMsgs = [...res1, ...res2]
      .map(rowToMsg)
      .sort((a, b) => b.createdAt - a.createdAt);

    const map = new Map<string, { lastMsg: DmMessage; unread: number }>();
    for (const m of allMsgs) {
      const otherId = m.fromUser === meId ? m.toUser : m.fromUser;
      if (!map.has(otherId)) {
        map.set(otherId, { lastMsg: m, unread: 0 });
      }
      const entry = map.get(otherId)!;
      if (m.toUser === meId && !m.readAt) entry.unread += 1;
    }
    return Array.from(map.entries()).map(([otherId, v]) => ({ otherId, ...v }));
  }

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

