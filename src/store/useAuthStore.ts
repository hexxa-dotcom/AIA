"use client";
import { create } from "zustand";
import { getSupabase, isSupabaseEnabled } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
}

interface State {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  authChecked: boolean;
}

interface Actions {
  init: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<State & Actions>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  authChecked: false,

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    const supabase = getSupabase();
    if (!supabase) {
      set({ authChecked: true });
      return;
    }
    const { data } = await supabase.auth.getSession();
    set({
      authChecked: true,
      user: data.session?.user
        ? { id: data.session.user.id, email: data.session.user.email ?? "" }
        : null,
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          authChecked: true,
          user: { id: session.user.id, email: session.user.email ?? "" },
        });
      } else {
        set({ authChecked: true, user: null });
      }
    });
  },

  signInWithEmail: async (email) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: "Supabase não configurado" };
    set({ loading: true });
    const redirect =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    set({ loading: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  signOut: async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

export function useRequiresAuth(): "ok" | "needs-login" | "no-supabase" {
  if (!isSupabaseEnabled()) return "no-supabase";
  const user = useAuthStore((s) => s.user);
  return user ? "ok" : "needs-login";
}
