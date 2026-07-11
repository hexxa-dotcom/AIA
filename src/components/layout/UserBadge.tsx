"use client";
import { useState } from "react";
import { LogOut, Cloud, CloudOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { useProfileStore } from "@/store/useProfileStore";
import { usePerfilStore } from "@/store/usePerfilStore";

export function UserBadge() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const profile = useProfileStore((s) => s.profile);
  const nameToUse = profile?.name || user?.email || "Usuário";

  if (!isSupabaseEnabled()) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white text-[10px] text-muted">
        <CloudOff size={12} />
        local
      </div>
    );
  }

  if (!user) return null;
  const initial = nameToUse.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-white hover:bg-surface-2 transition"
      >
        <div className="w-7 h-7 rounded-full bg-ink text-lime grid place-items-center font-bold text-xs">
          {initial}
        </div>
        <Cloud size={12} className="text-success" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg p-3 z-50">
          <div className="px-2 py-1 mb-2">
            <div className="text-[10px] uppercase tracking-wider text-muted">conectado</div>
            <div className="font-semibold text-sm truncate">{user.email}</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-2 text-sm text-danger"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
