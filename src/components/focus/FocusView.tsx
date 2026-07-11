"use client";
import { useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";
import { TaskTimer } from "@/components/task/TaskTimer";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { BreakdownDialog } from "./BreakdownDialog";
import { XP_REWARDS } from "@/lib/xp";
import { cn, formatDuration, relativeDue } from "@/lib/utils";

export function FocusView({ taskId }: { taskId: string }) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const updateTask = useTaskStore((s) => s.updateTask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const setFocused = useTaskStore((s) => s.setFocused);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);

  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [newSub, setNewSub] = useState("");

  if (!task) return null;

  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const next = task.subtasks.find((s) => !s.done);
  const due = relativeDue(task.dueDate);

  function handleToggle(subId: string) {
    const sub = toggleSubtask(task!.id, subId);
    if (sub?.done) {
      registerActivity();
      const { leveledUp } = addXp(XP_REWARDS.subtaskDone, "Subtarefa concluída");
      fireConfetti("soft");
      if (leveledUp) setTimeout(() => fireLevelUp(), 300);
    }
  }

  function finish() {
    if (!task) return;
    completeTask(task.id);
    registerActivity();
    const { leveledUp } = addXp(XP_REWARDS.taskDone, `Tarefa concluída: ${task.title}`);
    fireConfetti("big");
    if (leveledUp) setTimeout(() => fireLevelUp(), 400);
    setFocused(undefined);
  }

  function addSub() {
    if (!newSub.trim()) return;
    addSubtask(task!.id, newSub.trim());
    setNewSub("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                  Em execução
                </span>
                <PriorityBadge priority={task.priority} />
                {due.label && (
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      due.tone === "late" && "bg-danger/15 text-danger",
                      due.tone === "soon" && "bg-warning/15 text-warning",
                      due.tone === "ok" && "bg-surface-2 text-muted",
                    )}
                  >
                    {due.label}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold leading-tight">{task.title}</h1>
            </div>
            <Link
              href="/projetos"
              onClick={() => setFocused(undefined)}
              className="flex items-center gap-1 text-xs text-muted hover:text-ink"
            >
              <ArrowLeft size={12} /> voltar
            </Link>
          </div>

          {task.description && (
            <p className="text-sm text-muted mb-4">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold">
              Progresso: {done}/{total}
            </span>
            <span className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.span
                className="block h-full bg-lime"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </span>
            <span className="text-xs font-bold">{Math.round(pct)}%</span>
          </div>
        </div>

        {next && (
          <div className="bg-ink text-white rounded-3xl p-6 border" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-lime">
                <Target size={11} className="inline mr-1" />
                Próximo passo
              </span>
              <span className="text-[10px] text-white/60">
                {done + 1} de {total}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight mb-4">{next.title}</h2>
            <button
              onClick={() => handleToggle(next.id)}
              className="w-full bg-lime text-ink font-bold py-3 rounded-2xl hover:bg-lime-soft transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Marcar como feita
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {!next && total > 0 && (
          <div className="bg-success/15 text-success rounded-3xl p-6 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2" />
            <div className="font-bold text-lg">Todas as subtarefas concluídas!</div>
            <p className="text-xs mt-1 text-ink">Pode finalizar a tarefa quando quiser.</p>
          </div>
        )}

        <div className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Todas as subtarefas
            </h3>
            <Button
              variant="dark"
              size="sm"
              onClick={() => setBreakdownOpen(true)}
              className="bg-gradient-to-br from-warning to-danger text-white"
            >
              <Sparkles size={12} />
              Quebrar com IA
            </Button>
          </div>

          <ul className="space-y-1 mb-3">
            <AnimatePresence initial={false}>
              {task.subtasks.map((sub) => (
                <motion.li
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="group flex items-center gap-2 py-2 px-2 rounded-xl hover:bg-surface-2"
                >
                  <button
                    onClick={() => handleToggle(sub.id)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 shrink-0 grid place-items-center",
                      sub.done ? "bg-lime border-lime" : "border-ink/30 hover:border-ink",
                    )}
                  >
                    {sub.done ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <Circle size={10} className="opacity-0" />
                    )}
                  </button>
                  <span className={cn("text-sm flex-1", sub.done && "line-through text-muted")}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(task.id, sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={11} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="flex gap-2">
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSub()}
              placeholder="Adicionar subtarefa..."
              className="flex-1 rounded-xl border border-ink/10 px-3 py-2 text-sm outline-none focus:border-ink" style={{ background: "rgba(255,255,255,0.55)", border: "0.5px solid rgba(255,255,255,0.80)" }}
            />
            <button onClick={addSub} className="px-3 rounded-xl bg-ink text-lime hover:bg-ink-soft">
              +
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <TaskTimer taskId={task.id} />

        <div className="glass rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-2">
            Notas / Descrição
          </div>
          <Textarea
            value={task.description ?? ""}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
            rows={6}
            placeholder="Detalhes, links, raciocínio..."
          />
        </div>

        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">
            Tempo investido
          </div>
          <div className="text-2xl font-bold font-mono">
            {formatDuration(task.totalTimeSec)}
          </div>
        </div>

        <Button variant="primary" className="w-full" onClick={finish}>
          <CheckCircle2 size={16} />
          Finalizar tarefa
        </Button>
      </aside>

      <BreakdownDialog
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        taskId={task.id}
      />
    </div>
  );
}
