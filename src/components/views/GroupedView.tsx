"use client";
import { useMemo, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useViewStore } from "@/store/useViewStore";
import { TaskModal } from "@/components/task/TaskModal";
import { TaskCard } from "@/components/kanban/TaskCard";
import { cn } from "@/lib/utils";

const PRI_GROUPS: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgente", color: "#141414" },
  high: { label: "Alta", color: "#4a4a48" },
  medium: { label: "Média", color: "#8c8c88" },
  low: { label: "Baixa", color: "#c0c0be" },
};

export function GroupedView() {
  const tasks = useTaskStore((s) => s.tasks);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const groupBy = useViewStore((s) => s.groupBy);
  const setGroupBy = useViewStore((s) => s.setGroupBy);
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const list = tasks.filter((t) => t.boardId === activeBoardId);
    const map = new Map<string, typeof list>();

    if (groupBy === "priority") {
      for (const p of ["urgent", "high", "medium", "low"]) map.set(p, []);
      for (const t of list) {
        if (!map.has(t.priority)) map.set(t.priority, []);
        map.get(t.priority)!.push(t);
      }
    } else {
      for (const t of list) {
        if (t.tags.length === 0) {
          if (!map.has("__no_tag")) map.set("__no_tag", []);
          map.get("__no_tag")!.push(t);
        }
        for (const tag of t.tags) {
          if (!map.has(tag)) map.set(tag, []);
          map.get(tag)!.push(t);
        }
      }
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [tasks, activeBoardId, groupBy]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">Agrupar por:</span>
        {(["priority", "tag"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              groupBy === g ? "bg-ink text-lime" : "glass hover:bg-surface-2",
            )}
          >
            {g === "priority" ? "prioridade" : "tag"}
          </button>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {groups.map(([key, items]) => {
          const meta =
            groupBy === "priority"
              ? PRI_GROUPS[key]
              : { label: key === "__no_tag" ? "sem tag" : `#${key}`, color: "#5b5a55" };
          return (
            <div
              key={key}
              className="min-w-[260px] max-w-[300px] glass rounded-3xl p-3 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <h2 className="font-bold text-sm capitalize">{meta.label}</h2>
                <span className="ml-auto text-[10px] bg-surface-2 px-2 py-0.5 rounded-full font-semibold">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} onOpen={setOpenId} />
                ))}
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="text-muted text-sm italic">Sem tarefas para agrupar</div>
        )}
      </div>

      <TaskModal taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
