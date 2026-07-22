"use client";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useCollapse } from "@/hooks/useCollapse";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { minutesToTime } from "@/lib/utils";

import { useMemo } from "react";

export function FeedRoutineWidget() {
  const { collapsed, toggle } = useCollapse("routine-widget");
  const allBlocks = useRoutineStore((s) => s.blocks);
  const blocks = useMemo(() => {
    return useRoutineStore.getState().blocksForDate(new Date());
  }, [allBlocks]);

  // Simulating completion status since RoutineBlocks don't have intrinsic completion in types yet.
  // In a real app, this would check against a log or useTaskStore integration.
  const total = blocks.length;
  const completed = 0; // Placeholder

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
            <Calendar size={14} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink leading-tight">Rotina Diária</p>
            <p className="text-[10px] text-muted">{total} blocos hoje</p>
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
              {blocks.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted mb-2">Nenhuma rotina para hoje.</p>
                  <Link href="/rotina" className="text-[10px] font-bold text-ink underline">
                    Configurar Rotina
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {blocks.slice(0, 3).map((b) => (
                    <div key={b.id} className="p-3 bg-surface-2 rounded-2xl border flex items-center justify-between" style={{ borderColor: "var(--flat-border)" }}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                          style={{ backgroundColor: `${b.color}20`, color: "var(--color-ink)" }}
                        >
                          {b.emoji || <Clock size={12} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight">{b.title}</p>
                          <p className="text-[10px] text-muted mt-0.5">
                            {minutesToTime(b.startMinute)} - {minutesToTime(b.endMinute)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {blocks.length > 3 && (
                    <Link href="/rotina" className="block w-full py-2 text-center text-[10px] font-bold text-muted hover:text-ink transition">
                      Ver todos os {blocks.length} blocos
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
