"use client";
import { getSupabase } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

export interface Member {
  id: string;
  userId: string | null;
  email: string;
  name: string | null;
  invitedBy: string | null;
  invitedAt: number;
  joinedAt: number | null;
}

function rowToMember(r: any): Member {
  return {
    id: r.$id || r.id,
    userId: r.userId || r.user_id,
    email: r.email,
    name: r.name,
    invitedBy: r.invitedBy || r.invited_by,
    invitedAt: r.invitedAt ? r.invitedAt : new Date(r.invited_at).getTime(),
    joinedAt: r.joinedAt ? r.joinedAt : (r.joined_at ? new Date(r.joined_at).getTime() : null),
  };
}

export async function listMembers(): Promise<Member[]> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return [];
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const res = await databases.listDocuments(databaseId, "workspace_members", [
      Query.orderAsc("joinedAt"),
    ]);
    return res.documents.map(rowToMember);
  }

  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .order("joined_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(rowToMember);
}

export async function inviteByEmail(opts: {
  email: string;
  name?: string;
  invitedBy: string;
}): Promise<{ ok: boolean; magicLinkSent: boolean; error?: string }> {
  if (isAppwriteEnabled()) {
    const { databases, account } = getAppwrite();
    if (!databases || !account) return { ok: false, magicLinkSent: false, error: "Appwrite não inicializado" };

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    const emailLower = opts.email.trim().toLowerCase();

    try {
      const existing = await databases.listDocuments(databaseId, "workspace_members", [
        Query.equal("email", emailLower),
      ]);

      if (existing.documents.length === 0) {
        const docId = ID.unique();
        const permissions = [
          `read("users")`,
          `update("user:${opts.invitedBy}")`,
          `delete("user:${opts.invitedBy}")`,
        ];
        await databases.createDocument(
          databaseId,
          "workspace_members",
          docId,
          {
            email: emailLower,
            name: opts.name?.trim() || null,
            invitedBy: opts.invitedBy,
            invitedAt: Date.now(),
            userId: null,
            joinedAt: null,
          },
          permissions,
        );
      }
    } catch (e: any) {
      return { ok: false, magicLinkSent: false, error: e?.message || "Erro ao salvar convite" };
    }

    try {
      const redirect = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
      await account.createMagicURLToken(ID.unique(), emailLower, redirect);
      return { ok: true, magicLinkSent: true };
    } catch (e: any) {
      return { ok: true, magicLinkSent: false, error: e?.message || "Erro ao enviar magic link" };
    }
  }

  const supabase = getSupabase();
  if (!supabase) return { ok: false, magicLinkSent: false, error: "Supabase não inicializado" };

  const { error: insertErr } = await supabase.from("workspace_members").insert({
    email: opts.email.trim().toLowerCase(),
    name: opts.name?.trim() || null,
    invited_by: opts.invitedBy,
  });
  if (insertErr && (insertErr as any).code !== "23505") {
    return { ok: false, magicLinkSent: false, error: insertErr.message };
  }

  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
  const { error: otpErr } = await supabase.auth.signInWithOtp({
    email: opts.email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });
  if (otpErr) return { ok: true, magicLinkSent: false, error: otpErr.message };

  return { ok: true, magicLinkSent: true };
}

export async function removeMember(id: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.deleteDocument(databaseId, "workspace_members", id);
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("workspace_members").delete().eq("id", id);
}

export async function updateMemberName(id: string, name: string): Promise<void> {
  if (isAppwriteEnabled()) {
    const { databases } = getAppwrite();
    if (!databases) return;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";
    try {
      await databases.updateDocument(databaseId, "workspace_members", id, { name });
    } catch (e) {}
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("workspace_members").update({ name }).eq("id", id);
}

