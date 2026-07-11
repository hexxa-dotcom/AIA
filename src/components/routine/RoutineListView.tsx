"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, Clock, Sunrise, Sun, Moon } from "lucide-react";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useTaskStore } from "@/store/useTaskStore";
import { minutesToTime } from "@/lib/utils";
import type { RoutineBlock } from "@/lib/types";

function activeOn(b: RoutineBlock, date: Date): boolean {
  const dow = date.getDay();
  switch (b.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "weekly":
    case "custom":
      return b.weekdays?.includes(dow) ?? false;
  }
}

function duration(startMin: number, endMin: number): string {
  const mins = endMin - startMin;
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

type Period = { label: string; icon: React.ReactNode; range: [number, number] };
const PERIODS: Period[] = [
  { label: "Manhã", icon: <Sunrise size={13} />, range: [0, 719] },
  { label: "Tarde", icon: <Sun size={13} />, range: [720, 1079] },
  { label: "Noite", icon: <Moon size={13} />, range: [1080, 1439] },
];

export function RoutineListView({
  date,
  onEdit,
}: {
  date: Date;
  onEdit: (b: RoutineBlock) => void;
}) {
  const allBlocks = useRoutineStore((s) => s.blocks);
  const deleteBlock = useRoutineStore((s) => s.deleteBlock);
  const tasks = useTaskStore((s) => s.tasks);

  const blocks = useMemo(
    () =>
      allBlocks
        .filter((b) => activeOn(b, date))
        .sort((a, b) => a.startMinute - b.startMinute),
    [allBlocks, date],
  );

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

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();
  const nowMinute = now.getHours() * 60 + now.getMinutes();

  if (blocks.length === 0 && scheduledTasks.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 flex flex-col items-center gap-3 text-center">
        <Clock size={32} className="text-muted/40" />
        <p className="font-semibold text-sm">Nenhum bloco para este dia</p>
        <p className="text-xs text-muted">
          Crie um bloco de rotina para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {PERIODS.map(({ label, icon, range }) => {
        const periodBlocks = blocks.filter(
          (b) => b.startMinute >= range[0] && b.startMinute <= range[1],
        );
        const periodTasks = scheduledTasks.filter((t) => {
          if (!t.scheduledStart) return false;
          const s = new Date(t.scheduledStart);
          const m = s.getHours() * 60 + s.getMinutes();
          return m >= range[0] && m <= range[1];
        });
        if (periodBlocks.length === 0 && periodTasks.length === 0) return null;

        return (
          <div key={label} className="glass rounded-3xl overflow-hidden">
            {/* period header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <span className="text-muted">{icon}</span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-muted">
                {label}
              </span>
              <span className="ml-auto text-[10px] text-muted">
                {periodBlocks.length + periodTasks.length} item
                {periodBlocks.length + periodTasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="divide-y divide-ink/5">
              {/* routine blocks */}
              {periodBlocks.map((b, i) => {
                const isActive =
                  sameDay &&
                  nowMinute >= b.startMinute &&
                  nowMinute < b.endMinute;
                const isPast = sameDay && nowMinute >= b.endMinute;
                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 group"
                  >
                    {/* color bar */}
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{
                        backgroundColor: b.color,
                        opacity: isPast ? 0.35 : 1,
                      }}
                    />

                    {/* emoji */}
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: b.color + "30" }}
                    >
                      
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm truncate ${isPast ? "text-muted" : ""}`}
                      >
                        {b.title}
                        {isActive && (
                          <span className="ml-2 text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">
                            AGORA
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted font-mono">
                        {minutesToTime(b.startMinute)} –{" "}
                        {minutesToTime(b.endMinute)}
                        <span className="ml-2 text-ink/30">·</span>
                        <span className="ml-2">
                          {duration(b.startMinute, b.endMinute)}
                        </span>
                      </p>
                    </div>

                    {/* actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(b)}
                        className="p-1.5 rounded-xl hover:bg-surface-2 text-muted hover:text-ink"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="p-1.5 rounded-xl hover:bg-danger/10 text-muted hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* scheduled tasks */}
              {periodTasks.map((t) => {
                if (!t.scheduledStart || !t.scheduledEnd) return null;
                const s = new Date(t.scheduledStart);
                const e = new Date(t.scheduledEnd);
                const sMin = s.getHours() * 60 + s.getMinutes();
                const eMin = e.getHours() * 60 + e.getMinutes();
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1 self-stretch rounded-full shrink-0 bg-lime" />
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-lime/20">
                      <span className="text-[10px] font-bold text-ink uppercase">
                        task
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm truncate ${t.column === "done" ? "line-through text-muted" : ""}`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[11px] text-muted font-mono">
                        {minutesToTime(sMin)} – {minutesToTime(eMin)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
