"use client";
import { useEffect, useState } from "react";
import { Pause, Play, Square, Timer } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { formatStopwatch, formatDuration } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";

export function TaskTimer({ taskId }: { taskId: string }) {
  const active = useTimerStore((s) => s.active);
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const stop = useTimerStore((s) => s.stop);
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const [, setTick] = useState(0);

  const isActive = active?.taskId === taskId;
  useEffect(() => {
    if (!isActive || active?.paused) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [isActive, active?.paused]);

  if (!task) return null;
  const live = isActive ? useTimerStore.getState().elapsedSec() : 0;

  return (
    <div className="bg-surface-2 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted flex items-center gap-1">
          <Timer size={12} />
          Cronômetro
        </span>
        <span className="text-[11px] text-muted">
          Total: <strong className="text-ink">{formatDuration(task.totalTimeSec)}</strong>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">
          {isActive ? formatStopwatch(live) : "00:00:00"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isActive && (
            <button
              onClick={() => start(taskId)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-ink text-lime font-semibold text-xs sm:text-sm hover:scale-105 transition whitespace-nowrap"
            >
              <Play size={12} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" />
              Iniciar
            </button>
          )}
          {isActive && active?.paused && (
            <button
              onClick={resume}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-lime text-ink font-semibold text-xs sm:text-sm hover:scale-105 transition whitespace-nowrap"
            >
              <Play size={12} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" />
              Continuar
            </button>
          )}
          {isActive && !active?.paused && (
            <button
              onClick={pause}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white text-ink font-semibold text-xs sm:text-sm border border-ink/10 hover:bg-surface-2 transition whitespace-nowrap"
            >
              <Pause size={12} className="sm:w-[14px] sm:h-[14px]" />
              Pausar
            </button>
          )}
          {isActive && (
            <button
              onClick={() => stop()}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-danger text-white font-semibold text-xs sm:text-sm hover:opacity-90 transition whitespace-nowrap"
            >
              <Square size={12} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" />
              Parar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
