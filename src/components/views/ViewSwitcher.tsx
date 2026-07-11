"use client";
import { LayoutGrid, StickyNote, List, GanttChart, Layers } from "lucide-react";
import { useViewStore, type ViewMode } from "@/store/useViewStore";
import { cn } from "@/lib/utils";

const VIEWS: { mode: ViewMode; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { mode: "kanban", label: "Kanban", Icon: LayoutGrid },
  { mode: "postits", label: "Mural", Icon: StickyNote },
  { mode: "list", label: "Lista", Icon: List },
  { mode: "timeline", label: "Timeline", Icon: GanttChart },
  { mode: "grouped", label: "Agrupada", Icon: Layers },
];

export function ViewSwitcher() {
  const mode = useViewStore((s) => s.mode);
  const setMode = useViewStore((s) => s.setMode);
  return (
    <div className="bg-white rounded-full p-1 flex items-center gap-1">
      {VIEWS.map(({ mode: m, label, Icon }) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition",
            mode === m ? "bg-ink text-lime font-semibold" : "text-muted hover:text-ink",
          )}
          title={label}
        >
          <Icon size={12} />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
