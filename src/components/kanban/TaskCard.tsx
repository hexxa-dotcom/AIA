"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, CheckSquare, Clock, Play, Timer, UserCheck, Eye, Link2, Repeat } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@/lib/types";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { cn, formatDuration, relativeDue, priorityColor } from "@/lib/utils";
import { useTimerStore } from "@/store/useTimerStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { XP_REWARDS } from "@/lib/xp";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const startTimer = useTimerStore((s) => s.start);
  const activeId = useTimerStore((s) => s.active?.taskId);
  
  const allTasks = useTaskStore((s) => s.tasks);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const addXp = useGameStore((s) => s.addXp);

  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const totalSubs = task.subtasks.length;
  const subPct = totalSubs > 0 ? (doneSubs / totalSubs) * 100 : 0;
  const due = relativeDue(task.dueDate);
  const isTimingThis = activeId === task.id;

  // Calculando número visual baseado na ordem cronológica de criação da board atual
  const boardTasks = allTasks.filter(t => t.boardId === task.boardId).sort((a,b) => a.createdAt - b.createdAt);
  const visualNumber = boardTasks.findIndex(t => t.id === task.id) + 1;

  function handleToggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    if (task.column === "done") {
      reopenTask(task.id);
    } else {
      completeTask(task.id);
      const { leveledUp } = addXp(XP_REWARDS.taskDone, `Tarefa concluída: ${task.title}`);
      fireConfetti("soft");
      if (leveledUp) setTimeout(() => fireLevelUp(), 400);
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      layout
      className={cn(
        "group relative bg-surface-2 rounded-2xl p-6 cursor-pointer select-none transition border border-ink/5 shadow-sm hover:shadow-md hover:border-ink/10",
        isDragging && "dragging shadow-xl scale-105 opacity-80",
        task.column === "done" && "opacity-60 bg-transparent border-transparent",
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-no-open]")) return;
        onOpen(task.id);
      }}
      {...attributes}
      {...listeners}
    >
      {/* tira de cor da prioridade */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r"
        style={{ backgroundColor: priorityColor(task.priority) }}
      />
      <div className="pl-2">
        {/* shared badge */}
        {task.sharedFrom && (
          <div className="flex items-center gap-1 mb-2 text-[10px] text-muted">
            <Link2 size={9} />
            <span className="truncate">de {task.sharedFrom.name ?? task.sharedFrom.email}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2 pr-2">
            <span className="text-[9px] font-bold text-muted bg-ink/5 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
              #{visualNumber}
            </span>
            <h3 className={cn("font-medium tracking-tight text-sm leading-tight", task.column === "done" && "line-through text-muted")}>
              {task.title}
            </h3>
          </div>
          
          <button 
            data-no-open
            onClick={handleToggleDone}
            className={cn(
              "shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center transition-colors",
              task.column === "done" 
                ? "bg-lime border-lime text-ink" 
                : "border-ink/20 text-transparent hover:border-lime hover:text-lime hover:bg-lime/10"
            )}
            title={task.column === "done" ? "Reabrir tarefa" : "Concluir tarefa"}
          >
            <Check size={10} strokeWidth={4} />
          </button>
        </div>

        {task.description && (
          <p className="text-[11px] text-muted line-clamp-2 mb-4">{task.description}</p>
        )}

        {totalSubs > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] text-muted mb-1">
              <span className="flex items-center gap-1">
                <CheckSquare size={11} />
                {doneSubs}/{totalSubs} subtarefas
              </span>
              <span className="font-semibold">{Math.round(subPct)}%</span>
            </div>
            <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                className="h-full bg-lime"
                initial={{ width: 0 }}
                animate={{ width: `${subPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-1">
          <PriorityBadge priority={task.priority} />
          {task.clientType && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted bg-ink/5 px-2 py-0.5 rounded-full">
              {task.clientType}
            </span>
          )}
          {due.label && (
            <span
              className={cn(
                "text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full",
                due.tone === "late" && "bg-danger/15 text-danger",
                due.tone === "soon" && "bg-warning/15 text-warning",
                due.tone === "ok" && "bg-surface-2 text-muted",
              )}
            >
              <Clock size={10} />
              {due.label}
            </span>
          )}
          {task.totalTimeSec > 0 && (
            <span className="text-[10px] flex items-center gap-1 text-muted">
              <Timer size={10} />
              {formatDuration(task.totalTimeSec)}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] bg-sage/40 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
          {task.clientType === "pessoal" && (
            <span className="text-[10px] flex items-center gap-1 bg-info/15 text-info px-2 py-0.5 rounded-full font-semibold">
              <UserCheck size={10} />
              Pessoal
            </span>
          )}
          {task.clientType === "profissional" && (
            <span className="text-[10px] flex items-center gap-1 bg-lime/15 text-lime px-2 py-0.5 rounded-full font-semibold">
              <UserCheck size={10} />
              {task.clientName || "Profissional"}
            </span>
          )}
          {task.recurrence && (
            <span
              className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(14,11,12,0.06)", color: "rgba(14,11,12,0.40)" }}
            >
              <Repeat size={8} />
              {task.recurrence.type === "daily"
                ? "Diário"
                : task.recurrence.type === "weekly"
                ? "Semanal"
                : "Mensal"}
            </span>
          )}
        </div>

        {/* collaborator avatar stack */}
        {(task.collaborators?.length ?? 0) > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {task.collaborators!.filter((c) => c.status === "accepted").slice(0, 3).map((c) => (
                <div
                  key={c.email}
                  title={`${c.role === "responsavel" ? "Responsável" : "Acompanhante"}: ${c.email}`}
                  className="w-5 h-5 rounded-full bg-ink text-lime grid place-items-center text-[8px] font-bold uppercase border border-white"
                >
                  {c.email[0]}
                </div>
              ))}
            </div>
            {task.collaborators!.filter((c) => c.status === "pending").length > 0 && (
              <span className="text-[9px] text-muted">
                +{task.collaborators!.filter((c) => c.status === "pending").length} pendente
              </span>
            )}
          </div>
        )}

        {!isTimingThis && task.column !== "done" && (
          <button
            data-no-open
            onClick={(e) => {
              e.stopPropagation();
              startTimer(task.id);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-ink text-lime p-1.5 rounded-full hover:scale-110"
            aria-label="Iniciar timer"
          >
            <Play size={11} fill="currentColor" />
          </button>
        )}
        {isTimingThis && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-ink text-lime text-[10px] px-2 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 bg-lime rounded-full animate-pulse" />
            ativo
          </div>
        )}
      </div>
    </motion.div>
  );
}
