"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskModal } from "@/components/task/TaskModal";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { cn, todayKey } from "@/lib/utils";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const dow = x.getDay();
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function TimelineView() {
  const tasks = useTaskStore((s) => s.tasks);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));
  const [openId, setOpenId] = useState<string | null>(null);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [anchor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const d of days) {
      const key = todayKey(d);
      map.set(key, []);
    }
    const list = tasks.filter((t) => t.boardId === activeBoardId);
    for (const t of list) {
      const ref = t.dueDate ?? t.scheduledStart;
      if (!ref) continue;
      const key = todayKey(new Date(ref));
      if (map.has(key)) map.get(key)!.push(t);
    }
    return map;
  }, [tasks, days, activeBoardId]);

  function shiftWeek(by: number) {
    const d = new Date(anchor);
    d.setDate(d.getDate() + by * 7);
    setAnchor(d);
  }

  const today = todayKey();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 glass rounded-full px-3 py-1.5 w-fit">
        <button onClick={() => shiftWeek(-1)} className="p-1.5 rounded-full hover:bg-surface-2">
          <ChevronLeft size={14} />
        </button>
        <button onClick={() => setAnchor(startOfWeek(new Date()))} className="text-xs font-semibold px-3">
          Esta semana
        </button>
        <button onClick={() => shiftWeek(1)} className="p-1.5 rounded-full hover:bg-surface-2">
          <ChevronRight size={14} />
        </button>
        <span className="text-xs text-muted ml-2">
          {anchor.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} –{" "}
          {new Date(anchor.getTime() + 6 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const key = todayKey(d);
          const isToday = key === today;
          const items = tasksByDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "glass rounded-2xl p-3 min-h-[300px] flex flex-col",
                isToday && "ring-2 ring-lime",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted">{WEEKDAYS[i]}</div>
                <div
                  className={cn(
                    "text-sm font-bold w-7 h-7 rounded-full grid place-items-center",
                    isToday && "bg-lime",
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {items.length === 0 ? (
                  <div className="text-[10px] text-muted italic text-center pt-4">vazio</div>
                ) : (
                  items.map((t) => (
                    <motion.button
                      key={t.id}
                      layout
                      onClick={() => setOpenId(t.id)}
                      className={cn(
                        "text-left text-xs bg-surface-2 hover:bg-black/5 px-2 py-1.5 rounded-lg",
                        t.column === "done" && "opacity-50 line-through",
                      )}
                    >
                      <div className="font-semibold truncate">{t.title}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <PriorityBadge priority={t.priority} />
                        {t.dueDate && (
                          <span className="text-[10px] text-muted flex items-center gap-0.5">
                            <Clock size={9} />
                            {new Date(t.dueDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
