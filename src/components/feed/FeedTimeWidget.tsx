"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, BarChart3 } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useCollapse } from "@/hooks/useCollapse";

function fmtHours(sec: number) {
  if (sec === 0) return "0h";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const COLORS = [
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "var(--color-ink)",
];

export function FeedTimeWidget() {
  const { collapsed, toggle } = useCollapse("time-widget");
  const timeEntries = useTaskStore((s) => s.timeEntries);
  const tasks = useTaskStore((s) => s.tasks);
  const boards = useTaskStore((s) => s.boards);
  const monthTotalSec = useTaskStore((s) => s.monthTotalSec());

  const { todaySec, weekSec, todayProjects, weekProjects } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Configura o início da semana (ex: Domingo ou Segunda. Usaremos últimos 7 dias para simplificar ou início da semana)
    const weekStart = todayStart - 6 * 86_400_000;

    let todaySec = 0;
    let weekSec = 0;
    const todayMap: Record<string, number> = {};
    const weekMap: Record<string, number> = {};

    timeEntries.forEach((entry) => {
      // Se não tiver startedAt confiável, skip
      if (!entry.startedAt) return;
      
      const isToday = entry.startedAt >= todayStart;
      const isWeek = entry.startedAt >= weekStart;

      if (!isWeek && !isToday) return;

      const task = tasks.find((t) => t.id === entry.taskId);
      const boardId = task?.boardId || "unknown";

      if (isToday) {
        todaySec += entry.durationSec;
        todayMap[boardId] = (todayMap[boardId] || 0) + entry.durationSec;
      }
      if (isWeek) {
        weekSec += entry.durationSec;
        weekMap[boardId] = (weekMap[boardId] || 0) + entry.durationSec;
      }
    });

    const mapToProjects = (map: Record<string, number>, totalSec: number) => {
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1]) // maior tempo primeiro
        .map(([bId, sec], idx) => {
          const b = boards.find((x) => x.id === bId);
          return {
            id: bId,
            name: b ? b.name : "Sem Projeto",
            sec,
            pct: totalSec > 0 ? (sec / totalSec) * 100 : 0,
            color: COLORS[idx % COLORS.length],
          };
        });
    };

    return {
      todaySec,
      weekSec,
      todayProjects: mapToProjects(todayMap, todaySec),
      weekProjects: mapToProjects(weekMap, weekSec),
    };
  }, [timeEntries, tasks, boards]);

  if (todaySec === 0 && weekSec === 0) return null;

  return (
    <div className="glass rounded-3xl overflow-hidden h-full">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-ink text-surface">
            <Clock size={14} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Horas Trabalhadas</p>
            <p className="text-[10px] text-muted">Hoje: {fmtHours(todaySec)} · Mês: {fmtHours(monthTotalSec)}</p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.18 }}
          style={{ color: "rgba(14,11,12,0.28)" }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Hoje */}
              <div className="bg-surface-2 p-4 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">Hoje</p>
                    <p className="text-xl font-bold leading-none text-ink">{fmtHours(todaySec)}</p>
                  </div>
                  <BarChart3 size={16} className="text-muted/50 mb-0.5" />
                </div>
                
                {todayProjects.length > 0 && (
                  <>
                    <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(14,11,12,0.05)" }}>
                      {todayProjects.map((p) => (
                        <div key={p.id} style={{ width: `${p.pct}%`, backgroundColor: p.color }} className="h-full" />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {todayProjects.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-medium text-ink truncate max-w-[120px]">{p.name}</span>
                          </div>
                          <span className="text-muted font-bold">{fmtHours(p.sec)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Semana */}
              <div className="bg-surface-2 p-4 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">Últimos 7 dias</p>
                    <p className="text-xl font-bold leading-none text-ink">{fmtHours(weekSec)}</p>
                  </div>
                  <BarChart3 size={16} className="text-muted/50 mb-0.5" />
                </div>
                
                {weekProjects.length > 0 && (
                  <>
                    <div className="flex h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(14,11,12,0.05)" }}>
                      {weekProjects.map((p) => (
                        <div key={p.id} style={{ width: `${p.pct}%`, backgroundColor: p.color }} className="h-full" />
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {weekProjects.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-medium text-ink truncate max-w-[120px]">{p.name}</span>
                          </div>
                          <span className="text-muted font-bold">{fmtHours(p.sec)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Mês Total */}
              <div className="bg-surface-2 p-4 rounded-2xl border" style={{ borderColor: "var(--flat-border)" }}>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-0.5">Total do Mês</p>
                    <p className="text-xl font-bold leading-none text-ink">{fmtHours(monthTotalSec)}</p>
                  </div>
                  <BarChart3 size={16} className="text-muted/50 mb-0.5" />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
