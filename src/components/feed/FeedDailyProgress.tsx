"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Target, ChevronDown } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useCollapse } from "@/hooks/useCollapse";
import Link from "next/link";

export function FeedDailyProgress() {
  const { collapsed, toggle } = useCollapse("daily-progress");
  const tasks = useTaskStore((s) => s.tasks);

  const { todayTasks, done, pct } = useMemo(() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const e = s + 86_400_000;
    const todayTasks = tasks.filter(
      (t) => (t.dueDate && t.dueDate >= s && t.dueDate < e) ||
             (t.createdAt && t.createdAt >= s),
    );
    const done = todayTasks.filter((t) => !!t.completedAt).length;
    const pct  = todayTasks.length === 0 ? 0 : Math.round((done / todayTasks.length) * 100);
    return { todayTasks, done, pct };
  }, [tasks]);

  const accent = pct === 100 ? "var(--color-success)" : pct >= 50 ? "var(--color-ink)" : "var(--color-warning)";

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col h-full">

      {/* Header — colapso */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-ink text-lime">
            <Target size={14} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Progresso do dia</p>
            <p className="text-[10px] text-muted">{done} de {todayTasks.length} tarefas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: accent }}>
              {pct}
            </span>
            <span className="text-xs font-bold" style={{ color: accent }}>%</span>
          </div>
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
            {/* Barra de progresso */}
            <div className="px-5 pt-3 pb-2">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(14,11,12,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}aa 100%)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Lista de tarefas */}
            {todayTasks.length === 0 ? (
              <div className="px-5 pb-5 text-xs text-muted text-center py-4">
                Nenhuma tarefa para hoje.{" "}
                <Link href="/projetos" className="underline underline-offset-2 hover:text-ink transition">
                  Criar no Kanban
                </Link>
              </div>
            ) : (
              <div className="px-5 pb-4 space-y-2">
                {todayTasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5">
                    {t.completedAt
                      ? <CheckCircle2 size={14} style={{ color: "#1a1a1a" }} className="shrink-0" />
                      : <Circle size={14} className="text-muted/25 shrink-0" />}
                    <span className={`text-xs truncate flex-1 ${t.completedAt ? "line-through text-muted" : ""}`}>
                      {t.title}
                    </span>
                  </div>
                ))}
                {todayTasks.length > 6 && (
                  <p className="text-[10px] text-muted pl-6">+ {todayTasks.length - 6} mais</p>
                )}
              </div>
            )}

            {pct === 100 && (
              <div className="mx-5 mb-4 py-2 rounded-2xl text-center text-xs font-bold"
                style={{ background: "rgba(150,150,150,0.15)", color: "#1a1a1a" }}>
                Todas concluídas!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
