"use client";
import { useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { useTimerStore } from "@/store/useTimerStore";
import { useTaskStore } from "@/store/useTaskStore";
import { formatStopwatch } from "@/lib/utils";

export function ActiveTimerWidget() {
  const active = useTimerStore((s) => s.active);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const stop = useTimerStore((s) => s.stop);
  const task = useTaskStore((s) => (active ? s.tasks.find((t) => t.id === active.taskId) : undefined));
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active || active.paused) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [active]);

  if (!active || !task) return null;

  const elapsed = useTimerStore.getState().elapsedSec();

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-ink text-white shadow-md max-w-full overflow-hidden">
      <div className="w-2 h-2 rounded-full bg-lime animate-pulse shrink-0" />
      <div className="flex flex-col leading-tight pr-2 min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-white/80">Cronômetro</span>
        <span className="text-xs font-semibold truncate">{task.title}</span>
      </div>
      <span className="font-mono text-sm font-bold tabular-nums shrink-0">{formatStopwatch(elapsed)}</span>
      <div className="flex items-center gap-1 ml-1 shrink-0">
        {active.paused ? (
          <button onClick={resume} className="p-1.5 hover:bg-white/15 rounded-full transition" aria-label="Continuar">
            <Play size={14} />
          </button>
        ) : (
          <button onClick={pause} className="p-1.5 hover:bg-white/15 rounded-full transition" aria-label="Pausar">
            <Pause size={14} />
          </button>
        )}
        <button
          onClick={() => stop()}
          className="p-1.5 hover:bg-white/15 rounded-full transition"
          aria-label="Parar"
        >
          <Square size={14} />
        </button>
      </div>
    </div>
  );
}
