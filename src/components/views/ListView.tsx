"use client";
import { useMemo, useState } from "react";
import { Check, Clock, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { TaskModal } from "@/components/task/TaskModal";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { cn, formatDuration, relativeDue } from "@/lib/utils";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";
import { XP_REWARDS } from "@/lib/xp";

type SortKey = "due" | "priority" | "status" | "title";

const PRI_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
const COL_ORDER = { doing: 0, today: 1, backlog: 2, done: 3 } as const;

export function ListView() {
  const tasks = useTaskStore((s) => s.tasks);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);

  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [hideDone, setHideDone] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => {
    let list = tasks.filter((t) => t.boardId === activeBoardId);
    if (hideDone) list = list.filter((t) => t.column !== "done");
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "due":
          return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity);
        case "priority":
          return PRI_ORDER[a.priority] - PRI_ORDER[b.priority];
        case "status":
          return COL_ORDER[a.column] - COL_ORDER[b.column];
        case "title":
          return a.title.localeCompare(b.title);
      }
    });
    return list;
  }, [tasks, activeBoardId, sortKey, hideDone]);

  function toggleComplete(taskId: string, isDone: boolean) {
    if (isDone) {
      reopenTask(taskId);
    } else {
      completeTask(taskId);
      registerActivity();
      const { leveledUp } = addXp(XP_REWARDS.taskDone, "Tarefa concluída");
      fireConfetti("medium");
      if (leveledUp) setTimeout(() => fireLevelUp(), 300);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Ordenar por:</span>
        {(["due", "priority", "status", "title"] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              sortKey === k ? "bg-ink text-lime" : "glass hover:bg-surface-2",
            )}
          >
            {k === "due" ? "prazo" : k === "priority" ? "prioridade" : k === "status" ? "status" : "título"}
          </button>
        ))}
        <button
          onClick={() => setHideDone((v) => !v)}
          className={cn(
            "text-xs px-2 py-1 rounded-full ml-auto",
            hideDone ? "bg-warning/20 text-warning" : "glass hover:bg-surface-2",
          )}
        >
          {hideDone ? "mostrando abertas" : "ocultar concluídas"}
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden divide-y divide-ink/5">
        {items.length === 0 && (
          <div className="py-10 text-center text-muted text-sm italic">Nada por aqui</div>
        )}
        {items.map((t) => {
          const isDone = t.column === "done";
          const due = relativeDue(t.dueDate);
          const subs = t.subtasks.length;
          const subsDone = t.subtasks.filter((s) => s.done).length;
          return (
            <motion.div
              key={t.id}
              layout
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 cursor-pointer group"
              onClick={() => setOpenId(t.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComplete(t.id, isDone);
                }}
                className={cn(
                  "w-5 h-5 rounded-md border-2 shrink-0 grid place-items-center transition",
                  isDone ? "bg-lime border-lime" : "border-ink/30 hover:border-ink",
                )}
              >
                {isDone && <Check size={12} className="text-ink" strokeWidth={3} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-semibold truncate", isDone && "line-through text-muted")}>
                  {t.title}
                </div>
                {subs > 0 && (
                  <div className="text-[10px] text-muted">{subsDone}/{subs} subtarefas</div>
                )}
              </div>

              <PriorityBadge priority={t.priority} />

              {due.label && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1",
                    due.tone === "late" && "bg-danger/15 text-danger",
                    due.tone === "soon" && "bg-warning/15 text-warning",
                    due.tone === "ok" && "bg-surface-2 text-muted",
                  )}
                >
                  <Clock size={9} />
                  {due.label}
                </span>
              )}

              {t.totalTimeSec > 0 && (
                <span className="text-[10px] text-muted flex items-center gap-1 hidden md:flex">
                  <Timer size={10} />
                  {formatDuration(t.totalTimeSec)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <TaskModal taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
