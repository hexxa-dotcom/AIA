"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ChevronDown, Rocket, Users, Lock } from "lucide-react";
import Link from "next/link";
import { useCollapse } from "@/hooks/useCollapse";
import { useTaskStore } from "@/store/useTaskStore";

const COLORS = [
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
];

export function FeedProjectsWidget() {
  const { collapsed, toggle } = useCollapse("projects-widget");
  const boards = useTaskStore((s) => s.boards);
  const tasks = useTaskStore((s) => s.tasks);

  const projects = useMemo(() => {
    return boards.map((board, idx) => {
      const boardTasks = tasks.filter((t) => t.boardId === board.id);
      const total = boardTasks.length;
      const done = boardTasks.filter((t) => t.column === "done").length;
      const progress = total === 0 ? 0 : Math.round((done / total) * 100);
      
      const pendingTasks = boardTasks
        .filter((t) => t.column !== "done")
        .sort((a, b) => a.order - b.order); // Poderíamos usar dueDate ou prioridade
      
      const nextTask = pendingTasks[0] || null;

      return {
        ...board,
        total,
        done,
        progress,
        nextTask,
        color: COLORS[idx % COLORS.length]
      };
    }).sort((a, b) => b.progress - a.progress); // Opcional: ordenar
  }, [boards, tasks]);

  if (projects.length === 0) return null;

  const ongoing = projects.filter(p => p.progress < 100);

  return (
    <div className="glass rounded-3xl overflow-hidden">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "0.5px solid rgba(14,11,12,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0"
            style={{ background: "rgba(168,85,247,0.10)" }}>
            <LayoutGrid size={14} style={{ color: "var(--color-purple, #a855f7)" }} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Projetos em Andamento</p>
            <p className="text-[10px] text-muted">
              {ongoing.length} {ongoing.length === 1 ? "projeto ativo" : "projetos ativos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/projetos"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-muted hover:text-ink underline underline-offset-2 transition"
          >
            acessar painel
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
              {ongoing.slice(0, 4).map((p) => {
                const isShared = p.collaborators && p.collaborators.length > 0;
                const isForeign = !!p.sharedBy;
                return (
                  <div key={p.id} className="bg-surface-2 border p-3 rounded-2xl flex flex-col gap-2 transition hover:border-ink/20" style={{ borderColor: "var(--flat-border)" }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{p.emoji || "📁"}</span>
                        <span className="font-semibold text-sm truncate max-w-[150px]">{p.name}</span>
                        {isShared && !isForeign && <Users size={12} className="text-info ml-1" />}
                        {isForeign && <Lock size={12} className="text-warning ml-1" />}
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: p.color }}>{p.progress}%</span>
                    </div>

                    <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: "rgba(14,11,12,0.05)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.color }} />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <div className="text-[10px] text-muted truncate max-w-[200px] flex items-center gap-1">
                        {p.nextTask ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-ink/30 shrink-0" />
                            <span className="truncate">Próximo: {p.nextTask.title}</span>
                          </>
                        ) : (
                          <>
                            <Rocket size={10} className="text-success shrink-0" />
                            <span className="text-success">Nenhuma pendência mapeada</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted font-medium shrink-0 ml-2">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </div>
                );
              })}
              {ongoing.length === 0 && (
                <div className="text-center text-xs text-muted py-6">
                  Nenhum projeto em andamento.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
