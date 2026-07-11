"use client";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";
import { XP_REWARDS } from "@/lib/xp";
import { TaskModal } from "@/components/task/TaskModal";
import { logActivity } from "@/lib/team/activity";
import type { ColumnKey } from "@/lib/types";

const COLUMNS: ColumnKey[] = ["backlog", "today", "doing", "done"];

export function Board() {
  const tasksByColumn = useTaskStore((s) => s.tasksByColumn);
  const taskById = useTaskStore((s) => s.taskById);
  const moveTask = useTaskStore((s) => s.moveTask);
  const reorderInColumn = useTaskStore((s) => s.reorderInColumn);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);
  const checkAchievements = useGameStore((s) => s.checkAchievements);
  const allTasks = useTaskStore((s) => s.tasks);
  const allTimeSec = useTaskStore((s) => s.tasks.reduce((sum, t) => sum + t.totalTimeSec, 0));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const activeBoard = useTaskStore((s) => s.boards.find((b) => b.id === s.activeBoardId));
  const meEmail = "filipe@aia.com"; // Mock, ideal seria ler do authStore/perfilStore
  const isViewer = Boolean(activeBoard?.sharedBy && activeBoard.collaborators?.find((c) => c.email === meEmail)?.role === "viewer");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleStart(ev: DragStartEvent) {
    if (isViewer) return;
    setActiveId(String(ev.active.id));
  }

  function handleEnd(ev: DragEndEvent) {
    setActiveId(null);
    if (isViewer) return;
    const activeIdLocal = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : null;
    if (!overId) return;
    const active = taskById(activeIdLocal);
    if (!active) return;

    let targetCol: ColumnKey | undefined;
    let targetIndex: number | undefined;

    if (overId.startsWith("col:")) {
      targetCol = overId.slice(4) as ColumnKey;
      targetIndex = tasksByColumn(targetCol).length;
    } else {
      const overTask = taskById(overId);
      if (!overTask) return;
      targetCol = overTask.column;
      const colTasks = tasksByColumn(targetCol).map((t) => t.id);
      targetIndex = colTasks.indexOf(overId);
      if (active.column === targetCol) {
        // reorder within same column
        const ids = colTasks.filter((id) => id !== activeIdLocal);
        ids.splice(targetIndex, 0, activeIdLocal);
        reorderInColumn(targetCol, ids);
        return;
      }
    }

    if (!targetCol) return;
    const movingToDone = targetCol === "done" && active.column !== "done";
    const prevCol = active.column;
    moveTask(activeIdLocal, targetCol, targetIndex);
    if (movingToDone) {
      logActivity(activeIdLocal, "completed", { from: prevCol });
    } else if (prevCol !== targetCol) {
      logActivity(activeIdLocal, "moved", { from: prevCol, to: targetCol });
    }

    if (movingToDone) {
      registerActivity();
      let bonus = XP_REWARDS.taskDone;
      if (active.dueDate && Date.now() < active.dueDate) bonus += XP_REWARDS.taskOnTime;
      const { leveledUp, newLevel } = addXp(bonus, `Tarefa concluída: ${active.title}`);
      fireConfetti("medium");
      if (leveledUp) {
        setTimeout(() => fireLevelUp(), 400);
      }
      const ctx = {
        totalTasksDone: allTasks.filter((t) => t.column === "done").length + 1,
        totalSubtasksDone: allTasks.reduce((s, t) => s + t.subtasks.filter((su) => su.done).length, 0),
        streakDays: useGameStore.getState().streakDays,
        level: newLevel,
        timeTrackedSec: allTimeSec,
        routinesCompleted: 0,
      };
      const fresh = checkAchievements(ctx);
      if (fresh.length > 0) {
        setTimeout(() => fireConfetti("big"), 700);
      }
    }
  }

  const active = activeId ? taskById(activeId) : null;

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleStart} onDragEnd={handleEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 md:pb-2"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {COLUMNS.map((col) => (
            <Column key={col} column={col} tasks={tasksByColumn(col)} onOpen={setOpenTaskId} isViewer={isViewer} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className="rotate-2 scale-105 opacity-90">
              <TaskCard task={active} onOpen={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </>
  );
}
