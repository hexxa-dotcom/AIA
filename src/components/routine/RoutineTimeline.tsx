"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Pencil, BookOpen, Dumbbell, Calendar, Coffee, Sparkles, GraduationCap } from "lucide-react";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useStudiesStore } from "@/store/useStudiesStore";
import { minutesToTime, cn } from "@/lib/utils";
import type { RoutineBlock } from "@/lib/types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 56; // px per hour

function activeOn(block: RoutineBlock, date: Date): boolean {
  const dow = date.getDay();
  switch (block.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "weekly":
    case "custom":
      return block.weekdays?.includes(dow) ?? false;
  }
}

export function RoutineTimeline({ date, onEdit }: { date: Date; onEdit: (b: RoutineBlock) => void }) {
  const allBlocks = useRoutineStore((s) => s.blocks);
  const deleteBlock = useRoutineStore((s) => s.deleteBlock);
  const tasks = useTaskStore((s) => s.tasks);
  const workoutPlans = useWorkoutStore((s) => s.plans);
  const studyItems = useStudiesStore((s) => s.items);
  const blocks = useMemo(
    () => allBlocks.filter((b) => activeOn(b, date)).sort((a, b) => a.startMinute - b.startMinute),
    [allBlocks, date],
  );
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();
  const nowMinute = now.getHours() * 60 + now.getMinutes();

  // tasks scheduled today
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  const scheduledTasks = tasks.filter(
    (t) =>
      t.scheduledStart &&
      t.scheduledEnd &&
      t.scheduledStart >= dayStart.getTime() &&
      t.scheduledStart <= dayEnd.getTime(),
  );

  return (
    <div className="relative glass rounded-3xl p-4 overflow-hidden">
      <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
        {/* grid horária */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-ink/5 flex items-start"
            style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          >
            <span className="text-[10px] text-muted w-12 -mt-1.5 pl-1">{String(h).padStart(2, "0")}:00</span>
            <div className="flex-1 ml-2" />
          </div>
        ))}

        {/* now indicator */}
        {sameDay && (
          <div
            className="absolute left-12 right-2 flex items-center z-30 pointer-events-none"
            style={{ top: (nowMinute / 60) * HOUR_HEIGHT }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-danger -ml-1" />
            <div className="flex-1 h-px bg-danger" />
            <span className="text-[10px] font-semibold bg-danger text-white px-2 rounded-full ml-1">
              {minutesToTime(nowMinute)}
            </span>
          </div>
        )}

        {/* routine blocks */}
        {blocks.map((b) => {
          const top = (b.startMinute / 60) * HOUR_HEIGHT;
          const height = ((b.endMinute - b.startMinute) / 60) * HOUR_HEIGHT;
          
          let icon = null;
          let contextInfo = null;
          if (b.activityType === "workout") {
            icon = <Dumbbell size={12} />;
            const plan = workoutPlans.find(w => w.id === b.linkedId);
            if (plan) contextInfo = `Série: ${plan.title}`;
          } else if (b.activityType === "reading") {
            icon = <BookOpen size={12} />;
            const book = studyItems.find(i => i.id === b.linkedId);
            if (book) contextInfo = `Livro: ${book.title}`;
          } else if (b.activityType === "study") {
            icon = <GraduationCap size={12} />;
            const course = studyItems.find(i => i.id === b.linkedId);
            if (course) contextInfo = `Curso: ${course.title}`;
          } else if (b.activityType === "meeting") {
            icon = <Calendar size={12} />;
          } else if (b.activityType === "break") {
            icon = <Coffee size={12} />;
          }

          return (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-14 right-2 rounded-xl px-3 py-2 group shadow-sm border border-ink/5"
              style={{ top, height, backgroundColor: b.color + "60" }}
            >
              <div className="flex items-start justify-between h-full">
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    {icon}
                    <span>{b.title}</span>
                  </div>
                  {contextInfo && (
                    <div className="text-[10px] text-ink/80 mt-0.5 truncate max-w-[200px] bg-white/40 px-1.5 rounded inline-block">
                      {contextInfo}
                    </div>
                  )}
                  <div className="text-[10px] text-ink/70 font-mono mt-1">
                    {minutesToTime(b.startMinute)} – {minutesToTime(b.endMinute)}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button onClick={() => onEdit(b)} className="p-1 hover:bg-white/40 rounded">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => deleteBlock(b.id)} className="p-1 hover:bg-white/40 rounded">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* scheduled tasks */}
        {scheduledTasks.map((t) => {
          if (!t.scheduledStart || !t.scheduledEnd) return null;
          const start = new Date(t.scheduledStart);
          const end = new Date(t.scheduledEnd);
          const sMin = start.getHours() * 60 + start.getMinutes();
          const eMin = end.getHours() * 60 + end.getMinutes();
          const top = (sMin / 60) * HOUR_HEIGHT;
          const height = Math.max(((eMin - sMin) / 60) * HOUR_HEIGHT, 24);
          return (
            <div
              key={t.id}
              className="absolute right-2 rounded-xl px-2 py-1 bg-lime border border-ink/20 shadow-sm z-10"
              style={{ top, height, left: "auto", width: "40%" }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink/60">tarefa</div>
              <div className={cn("text-xs font-bold", t.column === "done" && "line-through")}>{t.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
