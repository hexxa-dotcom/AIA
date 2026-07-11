"use client";
import { getSupabase } from "@/lib/supabase";

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
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) throw error;
}
