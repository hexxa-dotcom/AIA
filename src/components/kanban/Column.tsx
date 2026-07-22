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
  const activeBoard = useTaskStore((s) => s.boards.find((b) => b.id === s.activeBoardId));
  const updateBoard = useTaskStore((s) => s.updateBoard);
  
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const displayTitle = activeBoard?.columns?.[column] || meta.title;
  const [editTitle, setEditTitle] = useState(displayTitle);

  function commitTitle() {
    if (!editTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    if (activeBoard && editTitle.trim() !== displayTitle) {
      updateBoard(activeBoard.id, {
        columns: {
          ...(activeBoard.columns || {}),
          [column]: editTitle.trim(),
        },
      });
    }
    setIsEditingTitle(false);
  }

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
            
            {isEditingTitle && !isViewer ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => e.key === "Enter" && commitTitle()}
                className="font-bold text-sm bg-transparent outline-none w-28 border-b border-ink/20"
              />
            ) : (
              <h2
                className={cn("font-bold text-sm", !isViewer && "cursor-pointer hover:opacity-70 transition")}
                onClick={() => {
                  if (isViewer) return;
                  setEditTitle(displayTitle);
                  setIsEditingTitle(true);
                }}
                title={!isViewer ? "Clique para editar o nome da etapa" : undefined}
              >
                {displayTitle}
              </h2>
            )}

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
          "flex-1 flex flex-col gap-4 min-h-[200px] p-2 rounded-2xl transition-colors",
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
