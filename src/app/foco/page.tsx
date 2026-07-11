"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Target, LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { FocusView } from "@/components/focus/FocusView";
import { useTaskStore } from "@/store/useTaskStore";
import { cn, relativeDue } from "@/lib/utils";
import { PriorityBadge } from "@/components/task/PriorityBadge";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

export default function FocusPage() {
  const setFocused = useTaskStore((s) => s.setFocused);
  const allTasks = useTaskStore((s) => s.tasks);
  const focusedId = useTaskStore((s) => s.focusedTaskId);

  const tasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.column !== "done")
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [allTasks],
  );

  const focused = useMemo(
    () => (focusedId ? allTasks.find((t) => t.id === focusedId) : undefined),
    [allTasks, focusedId],
  );

  return (
    <AppShell>
      <Topbar
        title="Em execução"
        subtitle="A tarefa selecionada vira o foco do dia. Quebre em subtarefas e execute uma por vez."
      />

      {focused ? (
        <FocusView taskId={focused.id} />
      ) : (
        <div>
          <div className="glass rounded-3xl p-6 mb-4 flex items-center gap-3">
            <Target size={32} className="text-warning" />
            <div className="flex-1">
              <div className="font-bold text-sm">Nenhuma tarefa em execução</div>
              <p className="text-xs text-muted">Selecione abaixo ou volte ao Kanban para escolher.</p>
            </div>
            <Link href="/projetos" className="text-xs flex items-center gap-1 text-ink hover:underline">
              <LayoutGrid size={12} /> Ir ao Kanban
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map((t) => {
              const due = relativeDue(t.dueDate);
              const done = t.subtasks.filter((s) => s.done).length;
              const total = t.subtasks.length;
              return (
                <button
                  key={t.id}
                  onClick={() => setFocused(t.id)}
                  className="text-left glass rounded-2xl p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityBadge priority={t.priority} />
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
                  <h3 className="font-bold text-sm leading-tight mb-1">{t.title}</h3>
                  {total > 0 && (
                    <div className="text-[10px] text-muted">
                      {done}/{total} subtarefas
                    </div>
                  )}
                </button>
              );
            })}
            {tasks.length === 0 && (
              <div className="col-span-full text-center py-10 text-muted text-sm">
                Sem tarefas abertas. Crie no Kanban.
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
