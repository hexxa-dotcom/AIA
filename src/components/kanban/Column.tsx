"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { useTaskStore } from "@/store/useTaskStore";
import type { ColumnKey, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

const META: Record<ColumnKey, { title: string; subtitle: string; tone: string }> = {
  backlog: { title: "Backlog", subtitle: "ideias e próximas", tone: "bg-surface-2" },
  today: { title: "Hoje", subtitle: "o que vou fazer", tone: "bg-sage/40" },
  doing: { title: "Em andamento", subtitle: "no foco agora", tone: "bg-lime/30" },
  done: { title: "Concluído", subtitle: "feito hoje", tone: "bg-ink/10" },
};

export function Column({ column, tasks, onOpen, isViewer }: { column: ColumnKey; tasks: Task[]; onOpen: (id: string) => void; isViewer?: boolean }) {
  const meta = META[column];
  const { setNodeRef, isOver } = useDroppable({ id: `col:${column}` });
  const createTask = useTaskStore((s) => s.createTask);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  function commitAdd() {
    if (!title.trim()) {
      setAdding(false);
      return;
    }
    createTask({ title: title.trim(), column });
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="flex-1 min-w-[280px] md:min-w-0 max-w-[360px] md:max-w-none flex flex-col glass rounded-3xl p-3"
      style={{ scrollSnapAlign: "start" }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", meta.tone.replace("bg-", "bg-").split(" ")[0])} />
            <h2 className="font-bold text-sm">{meta.title}</h2>
            <span className="text-[10px] bg-surface-2 px-2 py-0.5 rounded-full font-semibold">
              {tasks.length}
            </span>
          </div>
          <p className="text-[10px] text-muted ml-4">{meta.subtitle}</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setAdding(true)}
            className="p-1.5 rounded-full hover:bg-surface-2 transition"
            aria-label="Adicionar tarefa"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-3 min-h-[200px] p-1 rounded-2xl transition-colors",
          isOver && "bg-lime/20",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>

        {adding && (
          <div className="glass rounded-2xl p-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa..."
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              onBlur={commitAdd}
            />
          </div>
        )}

        {tasks.length === 0 && !adding && (
          <div className="text-[11px] text-muted text-center py-6 italic">
            sem tarefas aqui
          </div>
        )}
      </div>
    </div>
  );
}
