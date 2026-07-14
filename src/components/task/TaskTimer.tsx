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
    <div className="flex flex-col gap-1.5 border-b border-ink/5 pb-3 last:border-0">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-muted">
        <span className="flex items-center gap-1.5"><Timer size={13} /> Cronômetro</span>
        <span className="opacity-70">{formatDuration(task.totalTimeSec)}</span>
      </div>

      <div className="flex items-center justify-between bg-surface-2/50 border border-ink/5 rounded-lg px-2 py-1.5">
        <div className="font-mono text-sm font-bold tabular-nums">
          {isActive ? formatStopwatch(live) : "00:00:00"}
        </div>
        <div className="flex items-center gap-1">
          {!isActive && (
            <button
              onClick={() => start(taskId)}
              title="Iniciar"
              className="p-1.5 rounded bg-ink text-lime hover:scale-105 transition"
            >
              <Play size={12} fill="currentColor" />
            </button>
          )}
          {isActive && active?.paused && (
            <button
              onClick={resume}
              title="Continuar"
              className="p-1.5 rounded bg-lime text-ink hover:scale-105 transition"
            >
              <Play size={12} fill="currentColor" />
            </button>
          )}
          {isActive && !active?.paused && (
            <button
              onClick={pause}
              title="Pausar"
              className="p-1.5 rounded bg-white text-ink border border-ink/10 hover:bg-surface-2 transition"
            >
              <Pause size={12} />
            </button>
          )}
          {isActive && (
            <button
              onClick={() => stop()}
              title="Parar"
              className="p-1.5 rounded bg-danger text-white hover:opacity-90 transition"
            >
              <Square size={12} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
