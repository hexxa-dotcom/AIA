"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useViewStore, randomPostitColor } from "@/store/useViewStore";
import { TaskModal } from "@/components/task/TaskModal";
import { cn } from "@/lib/utils";

export function PostitsView() {
  const allTasks = useTaskStore((s) => s.tasks);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const tasks = useMemo(
    () =>
      allTasks.filter(
        (t) => t.boardId === activeBoardId && t.column !== "done",
      ),
    [allTasks, activeBoardId],
  );
  const positions = useViewStore((s) => s.postitPositions);
  const setPostitPos = useViewStore((s) => s.setPostitPos);
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Garante que toda tarefa tenha uma posição inicial
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const w = c.clientWidth;
    let dirty = false;
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!positions[t.id]) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 20 + col * (w / 4);
        const y = 20 + row * 200;
        setPostitPos(t.id, x, y, randomPostitColor());
        dirty = true;
      }
    }
    if (dirty) {
      /* state update queued via setPostitPos */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]);

  return (
    <div
      ref={containerRef}
      className="relative glass rounded-3xl"
      style={{
        minHeight: "calc(100vh - 200px)",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 12px)",
      }}
    >
      {tasks.length === 0 && (
        <div className="absolute inset-0 grid place-items-center text-muted text-sm italic">
          Sem tarefas abertas — crie no Kanban
        </div>
      )}
      {tasks.map((t, i) => {
        const pos = positions[t.id] ?? {
          x: 20 + (i % 4) * 240,
          y: 20 + Math.floor(i / 4) * 200,
          color: "#ffffff",
        };
        const subs = t.subtasks.length;
        const subsDone = t.subtasks.filter((s) => s.done).length;
        return (
          <motion.div
            key={t.id}
            drag
            dragMomentum={false}
            dragConstraints={containerRef}
            onDragEnd={(_, info) => {
              const newX = pos.x + info.offset.x;
              const newY = pos.y + info.offset.y;
              setPostitPos(t.id, Math.max(0, newX), Math.max(0, newY));
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              rotate: (parseInt(t.id.slice(-2), 16) % 7) - 3,
            }}
            whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
            whileDrag={{
              scale: 1.06,
              rotate: 0,
              zIndex: 20,
              cursor: "grabbing",
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: 260,
              minHeight: 200,
              background: pos.color,
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
            }}
            className="rounded p-4 cursor-grab flex flex-col"
            onDoubleClick={() => setOpenId(t.id)}
          >
            <div className="text-sm font-bold mb-2 text-ink whitespace-normal break-words">
              {t.title}
            </div>
            {t.description && (
              <p className="text-[11px] text-ink/70 line-clamp-3 mb-2 whitespace-normal break-words">
                {t.description}
              </p>
            )}
            {subs > 0 && (
              <div className="mt-auto text-[10px] text-ink/60 font-mono">
                {subsDone}/{subs}
              </div>
            )}
            {t.tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {t.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] bg-black/10 px-1.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="text-[9px] text-ink/40 mt-2">
              double click p/ abrir
            </div>
          </motion.div>
        );
      })}
      <TaskModal taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
