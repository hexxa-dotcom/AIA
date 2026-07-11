"use client";
import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";
import { XP_REWARDS } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

export function SubtaskList({ taskId }: { taskId: string }) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const addSubtask = useTaskStore((s) => s.addSubtask);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const deleteSubtask = useTaskStore((s) => s.deleteSubtask);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);
  const [newTitle, setNewTitle] = useState("");

  if (!task) return null;
  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  function handleToggle(subId: string) {
    const sub = toggleSubtask(taskId, subId);
    if (sub?.done) {
      registerActivity();
      const { leveledUp } = addXp(XP_REWARDS.subtaskDone, "Subtarefa concluída");
      fireConfetti("soft");
      if (leveledUp) setTimeout(() => fireLevelUp(), 300);
    }
  }

  function commitAdd() {
    if (!newTitle.trim()) return;
    addSubtask(taskId, newTitle.trim());
    setNewTitle("");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Subtarefas</span>
          <span className="text-[10px] bg-surface-2 px-2 py-0.5 rounded-full font-semibold">
            {done}/{total}
          </span>
        </div>
        <span className="text-xs font-semibold">{Math.round(pct)}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mb-3">
        <motion.div
          className="h-full bg-lime"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <ul className="flex flex-col gap-1 mb-3">
        <AnimatePresence initial={false}>
          {task.subtasks.map((sub) => (
            <motion.li
              key={sub.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="group flex items-center gap-2 py-1.5 px-2 rounded-xl hover:bg-surface-2 transition"
            >
              <button
                onClick={() => handleToggle(sub.id)}
                className={cn(
                  "w-5 h-5 rounded-md border-2 shrink-0 grid place-items-center transition",
                  sub.done ? "bg-lime border-lime" : "border-ink/30 hover:border-ink",
                )}
                aria-label={sub.done ? "Reabrir subtarefa" : "Concluir subtarefa"}
              >
                {sub.done && <Check size={12} className="text-ink" strokeWidth={3} />}
              </button>
              <span className={cn("text-sm flex-1", sub.done && "line-through text-muted")}>
                {sub.title}
              </span>
              <button
                onClick={() => deleteSubtask(taskId, sub.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-danger/10 hover:text-danger transition"
                aria-label="Remover"
              >
                <Trash2 size={12} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nova subtarefa..."
          onKeyDown={(e) => {
            if (e.key === "Enter") commitAdd();
          }}
        />
        <button
          onClick={commitAdd}
          className="px-3 rounded-xl bg-ink text-lime hover:bg-ink-soft transition"
          aria-label="Adicionar"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
