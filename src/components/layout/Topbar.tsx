"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Star, CloudSun, Sun, Moon, MoreHorizontal, Focus, Eclipse, Briefcase, CircleUser, ArrowRightLeft } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { levelProgress } from "@/lib/xp";
import { ActiveTimerWidget } from "@/components/task/ActiveTimerWidget";
import { useAuthStore } from "@/store/useAuthStore";
import { useWeather } from "@/hooks/useWeather";

import { useProfileStore } from "@/store/useProfileStore";
import { useCollapseStore } from "@/store/useCollapseStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function TopbarMenu() {
  const focusMode = useCollapseStore((s) => s.focusMode);
  const setFocusMode = useCollapseStore((s) => s.setFocusMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemCls =
    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-ink/5 transition text-left";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Menu"
        className="w-10 h-10 rounded-xl grid place-items-center transition bg-surface-2 border hover:bg-ink hover:text-surface text-muted"
        style={{ borderColor: "var(--flat-border)" }}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 p-1.5 rounded-xl flat-surface fade-in border shadow-lg" style={{ borderColor: "var(--flat-border)" }}>
          <button
            className={itemCls}
            onClick={() => { setFocusMode(!focusMode); setOpen(false); }}
          >
            <Focus size={13} className="text-muted" />
            <span className="flex-1">Modo foco</span>
            <span className="text-[10px] text-muted">{focusMode ? "ativo" : "inativo"}</span>
          </button>
        </div>
      )}
    </div>
  );
}


function TopbarFull({ title, subtitle, right }: TopbarProps) {
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const userName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const greeting = useMemo(() => getGreeting(), []);
  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streakDays);
  const todayXp = useGameStore((s) => s.todayXp);
  const { level, needed, pct } = levelProgress(xp);
  const weather = useWeather();

  return (
    <header className="sticky top-2 sm:top-4 z-40 mb-4 sm:mb-6 glass border rounded-3xl px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-6" style={{ borderColor: "var(--flat-border)", boxShadow: "0 4px 24px -12px rgba(0,0,0,0.1)" }}>
      
      {/* Lado Esquerdo - Título e Saudação */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight truncate">{title}</h1>
        </div>

        {/* Barra vertical discreta de separação */}
        <div className="w-px h-6 bg-ink/20 rounded-full" />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-sm sm:text-base leading-tight">
            <span className="text-muted">{greeting},</span>
            <span className="font-semibold text-ink">{userName}</span>
          </div>
        </div>
      </div>

      {/* Centro - Gamificação Solta */}
      <div className="flex-1 flex justify-center">
        <div className="hidden lg:flex items-center gap-6">
          <div className="w-8 h-8 rounded-full bg-ink text-lime grid place-items-center text-sm font-bold shrink-0 shadow-sm">
            {level}
          </div>
          <div className="flex flex-col gap-1.5 w-32">
            <div className="flex justify-between text-[10px] sm:text-xs text-muted">
              <span className="font-bold text-ink">{xp} XP</span>
              <span className="font-medium">próx. {Math.round(needed)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden shadow-inner">
              <motion.div
                className="h-full xp-shimmer rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="w-px h-6 bg-ink/10 mx-1" />
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Flame size={15} className="text-warning" />
            <span className="font-bold text-ink">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Star size={15} className="text-lime" fill="currentColor" />
            <span className="font-bold text-ink">+{todayXp}</span>
          </div>
        </div>
      </div>

      {/* Lado Direito - Controles e Espaço */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-3 shrink-0">
        <ActiveTimerWidget />
        {right}
      </div>
    </header>
  );
}

function TopbarSimple({ title, subtitle, right }: TopbarProps) {
  return (
    <header className="sticky top-2 sm:top-4 z-40 mb-4 sm:mb-6 glass border rounded-3xl px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4" style={{ borderColor: "var(--flat-border)", boxShadow: "0 4px 24px -12px rgba(0,0,0,0.1)" }}>
      {/* Lado Esquerdo */}
      <div className="shrink-0 max-w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] sm:text-xs text-muted truncate mt-0.5">{subtitle}</p>}
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <ActiveTimerWidget />
        {right}
      </div>
    </header>
  );
}

interface TopbarProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  variant?: "full" | "simple";
}

export function Topbar({ variant = "simple", ...props }: TopbarProps) {
  if (variant === "full") return <TopbarFull {...props} />;
  return <TopbarSimple {...props} />;
}
