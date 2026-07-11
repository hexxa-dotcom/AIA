"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export interface VaultMeta {
  verifier: string;
  salt: string;
}

export interface VaultItemRow {
  id: string;
  title: string;
  category?: string;
  encrypted_payload: string;
  iv: string;
  updated_at: string;
  created_at: string;
}

export async function fetchVaultMeta(userId: string): Promise<VaultMeta | null> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return null;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      const doc = await databases.getDocument(databaseId, "vault_meta", userId);
      return {
        verifier: doc.verifier,
        salt: doc.salt,
      };
    } catch (e: any) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("vault_meta")
    .select("verifier, salt")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function saveVaultMeta(userId: string, meta: VaultMeta): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const data = {
      userId,
      verifier: meta.verifier,
      salt: meta.salt,
      updatedAt: new Date().toISOString(),
    };
    const permissions = [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
    ];
    try {
      await databases.updateDocument(databaseId, "vault_meta", userId, data, permissions);
    } catch (e: any) {
      if (e.status === 404) {
        await databases.createDocument(databaseId, "vault_meta", userId, data, permissions);
      } else {
        throw e;
      }
    }
    return;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");
  const { error } = await supabase.from("vault_meta").upsert(
    {
      user_id: userId,
      verifier: meta.verifier,
      salt: meta.salt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function listVaultItems(userId: string): Promise<VaultItemRow[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "vault_items", [
      Query.equal("userId", userId),
      Query.orderAsc("title"),
    ]);
    return res.documents.map((r: any) => ({
      id: r.$id,
      title: r.title,
      category: r.category || undefined,
      encrypted_payload: r.encryptedPayload,
      iv: r.iv,
      updated_at: r.updatedAt,
      created_at: r.createdAt || r.updatedAt,
    }));
  }

  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", userId)
    .order("title");
  if (error) throw error;
  return (data ?? []) as VaultItemRow[];
}

export async function upsertVaultItem(
  userId: string,
  item: {
    id?: string;
    title: string;
    category?: string;
    encrypted_payload: string;
    iv: string;
  },
): Promise<string> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const docId = item.id || ID.unique();
    const now = new Date().toISOString();
    const data = {
      userId,
      title: item.title,
      category: item.category || null,
      encryptedPayload: item.encrypted_payload,
      iv: item.iv,
      updatedAt: now,
      ...(item.id ? {} : { createdAt: now }),
    };
    const permissions = [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
    ];
    if (item.id) {
      const doc = await databases.updateDocument(databaseId, "vault_items", docId, data, permissions);
      return doc.$id;
    } else {
      const doc = await databases.createDocument(databaseId, "vault_items", docId, data, permissions);
      return doc.$id;
    }
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não inicializado");
  const payload = {
    ...(item.id ? { id: item.id } : {}),
    user_id: userId,
    title: item.title,
    category: item.category ?? null,
    encrypted_payload: item.encrypted_payload,
    iv: item.iv,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("vault_items")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id;
}

export async function deleteVaultItem(id: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.deleteDocument(databaseId, "vault_items", id);
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) throw error;
}

