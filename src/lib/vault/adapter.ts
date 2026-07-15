"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query, Permission, Role } from "appwrite";

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
  if (userId === "local") {
    const localMeta = localStorage.getItem("aia_vault_meta_local");
    if (localMeta) return JSON.parse(localMeta);
    return null;
  }

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
      console.error("[Vault] fetchVaultMeta Appwrite Error:", e);
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
  if (error) {
    console.error("[Vault] fetchVaultMeta Supabase Error:", error);
    throw error;
  }
  return data ?? null;
}

export async function saveVaultMeta(userId: string, meta: VaultMeta): Promise<void> {
  if (userId === "local") {
    localStorage.setItem("aia_vault_meta_local", JSON.stringify(meta));
    return;
  }

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
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];
    try {
      await databases.updateDocument(databaseId, "vault_meta", userId, data, permissions);
    } catch (e: any) {
      if (e.code === 404 || e.status === 404) {
        try {
          await databases.createDocument(databaseId, "vault_meta", userId, data, permissions);
        } catch (createErr) {
          console.error("[Vault] saveVaultMeta Create Error:", createErr);
          throw createErr;
        }
      } else {
        console.error("[Vault] saveVaultMeta Update Error:", e);
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
  if (error) {
    console.error("[Vault] saveVaultMeta Supabase Error:", error);
    throw error;
  }
}

export async function listVaultItems(userId: string): Promise<VaultItemRow[]> {
  if (userId === "local") {
    const items = localStorage.getItem("aia_vault_items_local");
    if (!items) return [];
    return JSON.parse(items);
  }

  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
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
    } catch (e) {
      console.error("[Vault] listVaultItems Appwrite Error:", e);
      return [];
    }
  }

  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", userId)
    .order("title");
  if (error) {
    console.error("[Vault] listVaultItems Supabase Error:", error);
    throw error;
  }
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
  const docId = item.id || ID.unique();
  const now = new Date().toISOString();

  if (userId === "local") {
    const items: VaultItemRow[] = JSON.parse(localStorage.getItem("aia_vault_items_local") || "[]");
    const existingIndex = items.findIndex((i) => i.id === docId);
    const row: VaultItemRow = {
      id: docId,
      title: item.title,
      category: item.category,
      encrypted_payload: item.encrypted_payload,
      iv: item.iv,
      updated_at: now,
      created_at: existingIndex >= 0 ? items[existingIndex].created_at : now,
    };
    if (existingIndex >= 0) {
      items[existingIndex] = row;
    } else {
      items.push(row);
    }
    localStorage.setItem("aia_vault_items_local", JSON.stringify(items));
    return docId;
  }

  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) throw new Error("Appwrite não inicializado");
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
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
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ];
    try {
      if (item.id) {
        const doc = await databases.updateDocument(databaseId, "vault_items", docId, data, permissions);
        return doc.$id;
      } else {
        const doc = await databases.createDocument(databaseId, "vault_items", docId, data, permissions);
        return doc.$id;
      }
    } catch (e) {
      console.error("[Vault] upsertVaultItem Appwrite Error:", e);
      throw e;
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
    updated_at: now,
  };
  const { data, error } = await supabase
    .from("vault_items")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();
  if (error) {
    console.error("[Vault] upsertVaultItem Supabase Error:", error);
    throw error;
  }
  return data!.id;
}

export async function deleteVaultItem(id: string, userId?: string): Promise<void> {
  if (userId === "local" || !userId) {
    // Para simplificar, quando não há Appwrite/Supabase, a gente assume que tá apagando local também.
    // O delete local vai falhar silenciosamente se não for "local", mas é seguro.
    try {
      const items = JSON.parse(localStorage.getItem("aia_vault_items_local") || "[]");
      const filtered = items.filter((i: any) => i.id !== id);
      localStorage.setItem("aia_vault_items_local", JSON.stringify(filtered));
    } catch (e) {}
  }

  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.deleteDocument(databaseId, "vault_items", id);
    } catch (e) {
      console.error("[Vault] deleteVaultItem Appwrite Error:", e);
    }
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) {
    console.error("[Vault] deleteVaultItem Supabase Error:", error);
    throw error;
  }
}
