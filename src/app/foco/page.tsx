"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Target, LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { FocusView } from "@/components/focus/FocusView";
import { useTaskStore } from "@/store/useTaskStore";
import { cn, relativeDue, formatDuration } from "@/lib/utils";
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
              <div className="font-bold text-sm text-ink">Que tarefas você tem para trabalhar hoje?</div>
              <p className="text-xs text-muted">Selecione abaixo a tarefa que será o seu foco agora.</p>
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
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              
              const board = useTaskStore.getState().boards.find(b => b.id === t.boardId);
              const colNames: Record<string, string> = {
                backlog: "Backlog",
                today: "Hoje",
                doing: "Em andamento",
                done: "Concluído"
              };
              const stageName = board?.columns?.[t.column] || colNames[t.column] || t.column;

              return (
                <button
                  key={t.id}
                  onClick={() => setFocused(t.id)}
                  className="text-left glass rounded-2xl p-4 hover:shadow-lg transition flex flex-col h-full"
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
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-surface-2 text-muted px-2 py-0.5 rounded-full ml-auto">
                      {stageName}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-sm leading-tight mb-4 flex-1">{t.title}</h3>
                  
                  <div className="w-full mt-auto space-y-3">
                    {/* Tempo e Progresso */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted">
                      <span>{formatDuration(t.totalTimeSec)} gastos</span>
                      {total > 0 && <span>{pct}% ({done}/{total})</span>}
                    </div>
                    
                    {/* Barra de progresso */}
                    {total > 0 && (
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-lime transition-all duration-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    )}
                  </div>
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
