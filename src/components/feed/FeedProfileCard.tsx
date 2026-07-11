"use client";
import { useProfileStore } from "@/store/useProfileStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useSwitchPerfil } from "@/components/layout/PerfilSwitcher";
import { Briefcase, CircleUser, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedProfileCard() {
  const profile = useProfileStore((s) => s.profile);
  const perfil = usePerfilStore((s) => s.perfil);
  const switchPerfil = useSwitchPerfil();
  
  const isProf = perfil === "profissional";
  const Icon = isProf ? Briefcase : CircleUser;
  
  return (
    <div className="glass rounded-3xl p-4 flex items-center justify-between border" style={{ borderColor: "var(--flat-border)" }}>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-surface", isProf ? "bg-ink" : "bg-ink")}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] text-muted font-bold tracking-[0.1em] uppercase">Ambiente Atual</p>
          <p className="text-sm font-semibold text-ink leading-tight">{profile?.role || (isProf ? "Profissional" : "Pessoal")}</p>
        </div>
      </div>
      
      <button
        onClick={() => switchPerfil(isProf ? "pessoal" : "profissional")}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border hover:bg-ink hover:text-surface transition-all text-xs font-medium text-ink"
        style={{ borderColor: "var(--flat-border)" }}
      >
        <ArrowRightLeft size={14} />
        <span className="hidden sm:inline">Mudar para {isProf ? "Pessoal" : "Profissional"}</span>
      </button>
    </div>
  );
}
