"use client";
import { useMemo } from "react";
import { LayoutGrid } from "lucide-react";
import { PostitsView } from "@/components/views/PostitsView";
import { useTaskStore } from "@/store/useTaskStore";

export function FeedPostits() {
  const tasks = useTaskStore((s) => s.tasks);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completedAt),
    [tasks],
  );

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <LayoutGrid size={14} className="text-lime" />
        <span className="font-bold text-sm">Quadro de Tarefas</span>
        <span className="text-xs text-muted">({pendingTasks.length})</span>
      </div>
      <PostitsView />
    </div>
  );
}
