"use client";
import { usePurposeStore } from "@/store/usePurposeStore";
import { useCollapse } from "@/hooks/useCollapse";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FeedChallengesWidget() {
  const { collapsed, toggle } = useCollapse("challenges-widget");
  const { purposes, checkInToday, uncheckToday } = usePurposeStore();

  const activeChallenges = purposes.filter((p) => p.showOnFeed);

  if (activeChallenges.length === 0) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col border h-full" style={{ borderColor: "var(--flat-border)" }}>
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-ink text-surface shadow-sm">
            <Smile size={14} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink leading-tight">Desafios & Propósitos</p>
            <p className="text-[10px] text-muted">{activeChallenges.length} desafios ativos no feed</p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.18 }}
          style={{ color: "rgba(14,11,12,0.28)" }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {activeChallenges.map((p) => {
                const completedCount = p.completedDates.length;
                const isCompletedToday = p.completedDates.includes(todayStr);
                const pct = Math.round((completedCount / p.daysTotal) * 100);

                return (
                  <div 
                    key={p.id}
                    className="p-3.5 bg-surface-2 border rounded-2xl flex flex-col gap-2 text-left"
                    style={{ borderColor: "var(--flat-border)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-ink leading-tight truncate">{p.name}</span>
                      <span className="text-[9px] font-bold text-muted shrink-0">
                        {completedCount}/{p.daysTotal}d ({pct}%)
                      </span>
                    </div>

                    {/* Barra de Progresso Simples */}
                    <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full bg-lime rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[9px] text-muted italic truncate max-w-[60%]">
                        {p.description || "Compromisso pessoal ativo."}
                      </p>

                      {isCompletedToday ? (
                        <button
                          onClick={() => uncheckToday(p.id)}
                          className="text-[9px] font-extrabold text-success flex items-center gap-0.5 bg-lime/10 px-2 py-0.5 rounded-lg border border-lime/10 hover:border-danger/10 hover:text-danger hover:bg-danger/5 transition-all shrink-0"
                        >
                          Concluído ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => checkInToday(p.id)}
                          className="text-[9px] font-extrabold text-surface bg-ink hover:opacity-90 transition px-2 py-0.5 rounded-lg shrink-0"
                        >
                          Check-in (+5 XP)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <Link href="/perfil" className="block w-full py-1 text-center text-[10px] font-bold text-muted hover:text-ink transition">
                Gerenciar Propósitos no Perfil
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
