"use client";
import { useMemo } from "react";
import { useRoutineStore } from "@/store/useRoutineStore";
import { minutesToTime } from "@/lib/utils";
import type { RoutineBlock } from "@/lib/types";
import { BookOpen, Dumbbell, Calendar, Coffee, Sparkles, GraduationCap } from "lucide-react";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_HEIGHT = 40; // px per hour

function activeOn(b: RoutineBlock, dow: number): boolean {
  switch (b.recurrence) {
    case "daily": return true;
    case "weekdays": return dow >= 1 && dow <= 5;
    case "weekends": return dow === 0 || dow === 6;
    case "weekly":
    case "custom": return b.weekdays?.includes(dow) ?? false;
  }
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // go to Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function RoutineWeekView({ date }: { date: Date }) {
  const allBlocks = useRoutineStore((s) => s.blocks);
  const weekDays  = useMemo(() => getWeekDays(date), [date]);
  const today     = new Date();
  const nowMinute = today.getHours() * 60 + today.getMinutes();

  // earliest block start across all blocks to set visible scroll start
  const minStart = useMemo(() => {
    if (allBlocks.length === 0) return 6 * 60;
    return Math.max(0, Math.min(...allBlocks.map((b) => b.startMinute)) - 60);
  }, [allBlocks]);

  const maxEnd = useMemo(() => {
    if (allBlocks.length === 0) return 22 * 60;
    return Math.min(24 * 60, Math.max(...allBlocks.map((b) => b.endMinute)) + 60);
  }, [allBlocks]);

  const visibleHours = Array.from(
    { length: Math.ceil((maxEnd - minStart) / 60) },
    (_, i) => Math.floor(minStart / 60) + i,
  );

  const gridHeight = visibleHours.length * HOUR_HEIGHT;

  return (
    <div className="bg-white rounded-3xl overflow-hidden">
      {/* day headers */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-ink/5">
        <div />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="flex flex-col items-center py-2 gap-0.5">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-muted">
                {DAY_LABELS[i]}
              </span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  isToday ? "bg-ink text-lime" : "text-ink"
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* grid body */}
      <div className="overflow-y-auto max-h-[calc(100dvh-320px)]">
        <div className="relative grid grid-cols-[40px_repeat(7,1fr)]" style={{ height: gridHeight }}>
          {/* hour labels + horizontal lines */}
          {visibleHours.map((h, idx) => (
            <div
              key={h}
              className="contents"
            >
              <div
                className="text-[9px] text-muted text-right pr-2 pt-0 leading-none"
                style={{
                  position: "absolute",
                  top: idx * HOUR_HEIGHT - 5,
                  left: 0,
                  width: 36,
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
              {/* horizontal rule across all 7 cols */}
              <div
                className="absolute left-10 right-0 border-t border-ink/5"
                style={{ top: idx * HOUR_HEIGHT }}
              />
            </div>
          ))}

          {/* day columns */}
          {weekDays.map((d, colIdx) => {
            const dow = d.getDay();
            const colBlocks = allBlocks
              .filter((b) => activeOn(b, dow))
              .sort((a, b) => a.startMinute - b.startMinute);
            const isToday = isSameDay(d, today);

            return (
              <div
                key={colIdx}
                className="relative border-l border-ink/4"
                style={{
                  gridColumn: colIdx + 2,
                  gridRow: "1",
                  height: gridHeight,
                }}
              >
                {/* today highlight strip */}
                {isToday && (
                  <div className="absolute inset-0 bg-lime/5 pointer-events-none" />
                )}

                {/* now indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                    style={{ top: ((nowMinute - minStart) / 60) * HOUR_HEIGHT }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-danger -ml-0.5 shrink-0" />
                    <div className="flex-1 h-px bg-danger" />
                  </div>
                )}

                {/* blocks */}
                {colBlocks.map((b) => {
                  const top    = ((b.startMinute - minStart) / 60) * HOUR_HEIGHT;
                  const height = Math.max(((b.endMinute - b.startMinute) / 60) * HOUR_HEIGHT, 16);
                  const isActive = isToday && nowMinute >= b.startMinute && nowMinute < b.endMinute;
                  let icon = null;
                  if (b.activityType === "workout") icon = <Dumbbell size={8} />;
                  else if (b.activityType === "reading") icon = <BookOpen size={8} />;
                  else if (b.activityType === "study") icon = <GraduationCap size={8} />;
                  else if (b.activityType === "meeting") icon = <Calendar size={8} />;
                  else if (b.activityType === "break") icon = <Coffee size={8} />;

                  return (
                    <div
                      key={b.id}
                      className="absolute inset-x-0.5 rounded-lg px-1 overflow-hidden"
                      style={{
                        top,
                        height,
                        backgroundColor: b.color + (isActive ? "cc" : "55"),
                        border: `1px solid ${b.color}88`,
                      }}
                    >
                      <p className="text-[9px] font-bold leading-tight truncate mt-0.5 flex items-center gap-0.5">
                        {icon}
                        {b.title}
                      </p>
                      {height >= 28 && (
                        <p className="text-[8px] text-ink/60 font-mono leading-none mt-0.5">
                          {minutesToTime(b.startMinute)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
