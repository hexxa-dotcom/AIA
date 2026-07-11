"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, List, Clock, CalendarDays, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { RoutineTimeline } from "@/components/routine/RoutineTimeline";
import { RoutineListView } from "@/components/routine/RoutineListView";
import { RoutineWeekView } from "@/components/routine/RoutineWeekView";
import { RoutineEditor } from "@/components/routine/RoutineEditor";
import { RoutineWorkoutsView } from "@/components/routine/RoutineWorkoutsView";
import type { RoutineBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "timeline" | "lista" | "semana" | "treinos";

const VIEWS: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "timeline", label: "Dia",    Icon: Clock        },
  { id: "lista",    label: "Lista",  Icon: List         },
  { id: "semana",   label: "Semana", Icon: CalendarDays },
  { id: "treinos",  label: "Treinos",Icon: Dumbbell     },
];

export default function RoutinePage() {
  const [view, setView]           = useState<View>("timeline");
  const [date, setDate]           = useState(new Date());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing]     = useState<RoutineBlock | null>(null);

  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  function shift(d: number) {
    const n = new Date(date);
    n.setDate(n.getDate() + d);
    setDate(n);
  }

  function shiftWeek(d: number) {
    const n = new Date(date);
    n.setDate(n.getDate() + d * 7);
    setDate(n);
  }

  function openEdit(b: RoutineBlock) {
    setEditing(b);
    setEditorOpen(true);
  }

  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return (
    <AppShell>
      <Topbar
        title="Rotina"
        subtitle="Seus blocos fixos e tarefas agendadas"
        right={
          <Button variant="dark" onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus size={14} />
            Novo bloco
          </Button>
        }
      />

      {/* toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* view switcher */}
        <div className="flex items-center bg-white rounded-full p-1.5 gap-1 shadow-sm mt-2">
          {VIEWS.map(({ id, label: l, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all",
                view === id ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink",
              )}
            >
              <Icon size={14} />
              {l}
            </button>
          ))}
        </div>

        {/* day nav */}
        {view !== "semana" && view !== "treinos" && (
          <div className="flex items-center bg-white rounded-full px-3 py-1.5 gap-1 ml-auto">
            <button onClick={() => shift(-1)} className="p-1 rounded-full hover:bg-surface-2">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setDate(new Date())} className="text-xs font-semibold px-2">
              Hoje
            </button>
            <button onClick={() => shift(1)} className="p-1 rounded-full hover:bg-surface-2">
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-muted ml-1 capitalize hidden sm:inline">{label}</span>
          </div>
        )}

        {/* week nav */}
        {view === "semana" && (
          <div className="flex items-center bg-white rounded-full px-3 py-1.5 gap-1 ml-auto">
            <button onClick={() => shiftWeek(-1)} className="p-1 rounded-full hover:bg-surface-2">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setDate(new Date())} className="text-xs font-semibold px-2">
              Esta semana
            </button>
            <button onClick={() => shiftWeek(1)} className="p-1 rounded-full hover:bg-surface-2">
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-muted ml-1 hidden sm:inline">{weekLabel}</span>
          </div>
        )}
      </div>

      {/* content */}
      <div className="max-h-[calc(100dvh-220px)] overflow-y-auto">
        {view === "timeline" && <RoutineTimeline date={date} onEdit={openEdit} />}
        {view === "lista"    && <RoutineListView  date={date} onEdit={openEdit} />}
        {view === "semana"   && <RoutineWeekView  date={date} />}
        {view === "treinos"  && <RoutineWorkoutsView />}
      </div>

      <RoutineEditor open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} />
    </AppShell>
  );
}
