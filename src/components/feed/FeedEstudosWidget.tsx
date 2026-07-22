"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BrainCircuit, ChevronDown, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useCollapse } from "@/hooks/useCollapse";

export function FeedEstudosWidget() {
  const { collapsed, toggle } = useCollapse("estudos-widget");
  
  // Como ainda não temos um store completo de estudos, mockamos o estado inicial para exibir o card
  const [flashcards] = useState(12); // Ex: 12 flashcards pendentes
  const [courseProgress] = useState(65); // Ex: curso principal em 65%

  if (flashcards === 0 && courseProgress === 0) return null;

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col border h-full" style={{ borderColor: "var(--flat-border)" }}>
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0"
            style={{ background: "rgba(59,130,246,0.10)" }}>
            <BookOpen size={14} style={{ color: "var(--color-info)" }} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Estudos e Revisão</p>
            <p className="text-[10px] text-muted">
              {flashcards > 0 ? `${flashcards} flashcards hoje` : "Tudo revisado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/estudos"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-muted hover:text-ink underline underline-offset-2 transition"
          >
            acessar
          </Link>
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.18 }}
            style={{ color: "rgba(14,11,12,0.28)" }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </button>

      {/* Corpo animado */}
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
              {/* Summary chips */}
              <div className="flex gap-2">
                <div className="flex-1 rounded-2xl px-3 py-2.5 flex flex-col gap-0.5"
                  style={{ background: "rgba(59,130,246,0.07)", border: "1px solid var(--flat-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit size={11} style={{ color: "var(--color-info)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-info)" }}>
                      Revisão Espaçada
                    </span>
                  </div>
                  <span className="text-base font-bold tabular-nums mt-1" style={{ color: "var(--color-info)" }}>
                    {flashcards} cards
                  </span>
                  <span className="text-[10px]" style={{ color: "color-mix(in srgb, var(--color-info) 65%, transparent)" }}>
                    pendentes para hoje
                  </span>
                </div>
              </div>

              {/* Course Progress */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-2 border" style={{ borderColor: "var(--flat-border)" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">Inglês Avançado</p>
                  <p className="text-[10px] text-muted">Acesso contínuo</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-info rounded-full" style={{ width: `${courseProgress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-info">{courseProgress}%</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
