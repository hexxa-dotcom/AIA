"use client";
import { getSupabase } from "@/lib/supabase";

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
    id: r.id,
    userId: r.user_id,
    email: r.email,
    name: r.name,
    invitedBy: r.invited_by,
    invitedAt: new Date(r.invited_at).getTime(),
    joinedAt: r.joined_at ? new Date(r.joined_at).getTime() : null,
  };
}

export async function listMembers(): Promise<Member[]> {
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
  const supabase = getSupabase();
  if (!supabase) return { ok: false, magicLinkSent: false, error: "Supabase não inicializado" };

  // 1) cria registro em workspace_members (idempotente via unique email)
  const { error: insertErr } = await supabase.from("workspace_members").insert({
    email: opts.email.trim().toLowerCase(),
    name: opts.name?.trim() || null,
    invited_by: opts.invitedBy,
  });
  // 23505 = unique violation (já existe), ignoramos
  if (insertErr && (insertErr as any).code !== "23505") {
    return { ok: false, magicLinkSent: false, error: insertErr.message };
  }

  // 2) manda magic link via signInWithOtp (cria user se não existir)
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
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("workspace_members").delete().eq("id", id);
}

export async function updateMemberName(id: string, name: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("workspace_members").update({ name }).eq("id", id);
}
