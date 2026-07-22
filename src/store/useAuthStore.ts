"use client";
import { create } from "zustand";
import { getSupabase, isSupabaseEnabled } from "@/lib/supabase";
import { getAppwrite, isAppwriteEnabled } from "@/lib/appwrite";
import { ID } from "appwrite";

export interface AuthUser {
  id: string;
  email: string;
}

interface State {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  authChecked: boolean;
  otpUserId: string | null;
}

interface Actions {
  init: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  sendOtpToken: (email: string) => Promise<{ ok: boolean; userId?: string; error?: string }>;
  verifyOtpToken: (userId: string, secret: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<State & Actions>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,
  authChecked: false,
  otpUserId: null,

  init: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    // 1. Verificar Appwrite
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (!account) {
        set({ authChecked: true });
        return;
      }
      try {
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const userId = urlParams.get("userId");
          const secret = urlParams.get("secret");
          if (userId && secret) {
            await account.updateMagicURLSession(userId, secret);
            // limpa os parâmetros da URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        const sessionUser = await account.get();
        if (!sessionUser.email || sessionUser.email.includes("anon")) {
          try {
            await account.deleteSession("current");
          } catch {}
          set({ authChecked: true, user: null });
        } else {
          set({
            authChecked: true,
            user: { id: sessionUser.$id, email: sessionUser.email },
          });
        }
      } catch (e: any) {
        set({ authChecked: true, user: null });
      }
      return;
    }

    // 2. Verificar Supabase
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
    set({ loading: true });

    // 1. Appwrite Magic Link
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (!account) {
        set({ loading: false });
        return { ok: false, error: "Appwrite não configurado" };
      }
      try {
        const redirect =
          typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
        await account.createMagicURLToken(ID.unique(), email, redirect);
        set({ loading: false });
        return { ok: true };
      } catch (e: any) {
        set({ loading: false });
        return { ok: false, error: e?.message || "Erro ao enviar Magic Link" };
      }
    }

    // 2. Supabase Magic Link
    const supabase = getSupabase();
    if (!supabase) {
      set({ loading: false });
      return { ok: false, error: "Supabase não configurado" };
    }
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

  sendOtpToken: async (email) => {
    set({ loading: true });
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (!account) {
        set({ loading: false });
        return { ok: false, error: "Appwrite não configurado" };
      }
      try {
        const token = await account.createEmailToken(ID.unique(), email);
        set({ loading: false, otpUserId: token.userId });
        return { ok: true, userId: token.userId };
      } catch (e: any) {
        set({ loading: false });
        return { ok: false, error: e?.message || "Erro ao enviar código de acesso" };
      }
    }
    set({ loading: false });
    return { ok: false, error: "OTP só é suportado via Appwrite" };
  },

  verifyOtpToken: async (userId, secret) => {
    set({ loading: true });
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (!account) {
        set({ loading: false });
        return { ok: false, error: "Appwrite não configurado" };
      }
      try {
        await account.createSession(userId, secret);
        const sessionUser = await account.get();
        set({
          authChecked: true,
          user: { id: sessionUser.$id, email: sessionUser.email },
          otpUserId: null,
          loading: false,
        });
        return { ok: true };
      } catch (e: any) {
        set({ loading: false });
        return { ok: false, error: e?.message || "Código incorreto ou expirado" };
      }
    }
    set({ loading: false });
    return { ok: false, error: "OTP só é suportado via Appwrite" };
  },

  signInWithPassword: async (email, password) => {
    set({ loading: true });
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (!account) {
        set({ loading: false });
        return { ok: false, error: "Appwrite não configurado" };
      }
      try {
        await account.createEmailPasswordSession(email, password);
        const sessionUser = await account.get();
        set({
          authChecked: true,
          user: { id: sessionUser.$id, email: sessionUser.email },
          loading: false,
        });
        return { ok: true };
      } catch (e: any) {
        set({ loading: false });
        return { ok: false, error: e?.message || "E-mail ou senha incorretos" };
      }
    }

    const supabase = getSupabase();
    if (!supabase) {
      set({ loading: false });
      return { ok: false, error: "Nenhum provedor de persistência ativo" };
    }
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ loading: false });
        return { ok: false, error: error.message };
      }
      set({
        authChecked: true,
        user: data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
        loading: false,
      });
      return { ok: true };
    } catch (e: any) {
      set({ loading: false });
      return { ok: false, error: e?.message || "Erro de login" };
    }
  },

  signOut: async () => {
    if (isAppwriteEnabled()) {
      const { account } = getAppwrite();
      if (account) {
        try {
          await account.deleteSession("current");
        } catch (e) {}
      }
      set({ user: null });
      if (typeof window !== "undefined") localStorage.clear();
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
    if (typeof window !== "undefined") localStorage.clear();
  },
}));

export function useRequiresAuth(): "ok" | "needs-login" | "no-supabase" {
  const isEnabled = isSupabaseEnabled() || isAppwriteEnabled();
  if (!isEnabled) return "no-supabase";
  const user = useAuthStore((s) => s.user);
  return user ? "ok" : "needs-login";
}
