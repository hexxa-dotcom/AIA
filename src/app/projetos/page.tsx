"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Board } from "@/components/kanban/Board";
import { ListView } from "@/components/views/ListView";
import { TimelineView } from "@/components/views/TimelineView";
import { useTaskStore } from "@/store/useTaskStore";
import { LayoutGrid, List, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectInbox } from "@/components/kanban/ProjectInbox";
import { ProjectShareModal } from "@/components/kanban/ProjectShareModal";
import { Share2, Info, Users } from "lucide-react";
import { ProjectOverview } from "@/components/kanban/ProjectOverview";
import { TaskInviteInbox } from "@/components/task/TaskInviteInbox";
import { useTaskInviteStore } from "@/store/useTaskInviteStore";

type ViewMode = "overview" | "kanban" | "list" | "timeline";

export default function ProjetosPage() {
  const activeBoard = useTaskStore((s) => s.boards.find((b) => b.id === s.activeBoardId));
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [isSharing, setIsSharing] = useState(false);
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  const pendingTaskInvites = useTaskInviteStore((s) => s.pendingCount());

  const views: { mode: ViewMode; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
    { mode: "overview", label: "Visão Geral", Icon: Info },
    { mode: "kanban", label: "Kanban", Icon: LayoutGrid },
    { mode: "list", label: "Lista", Icon: List },
    { mode: "timeline", label: "Timeline", Icon: Calendar },
  ];

  const SUBTITLES: Record<ViewMode, string> = {
    overview: "Escopo, OKRs e membros do projeto.",
    kanban: "Acompanhe e mova as tarefas do projeto.",
    list: "Visão em lista de todas as pendências.",
    timeline: "Acompanhamento em linha do tempo das tarefas.",
  };

  return (
    <AppShell>
      <Topbar
        title={activeBoard ? activeBoard.name : "Projetos"}
        subtitle={SUBTITLES[viewMode]}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaskInbox(true)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition text-muted"
              title="Tarefas compartilhadas"
            >
              <Users size={18} />
              {pendingTaskInvites > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full grid place-items-center">
                  {pendingTaskInvites}
                </span>
              )}
            </button>
            <ProjectInbox />
          </div>
        }
      />

      {activeBoard ? (
        <>
          <div className="flex gap-1 mb-4 bg-white rounded-full p-1.5 w-fit shadow-sm mt-2 overflow-x-auto">
            {views.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition shrink-0",
                  viewMode === mode
                    ? "bg-ink text-surface"
                    : "text-muted hover:text-ink",
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {viewMode === "overview" && <ProjectOverview onShare={() => setIsSharing(true)} onStart={() => setViewMode("kanban")} />}
          {viewMode === "kanban" && <Board />}
          {viewMode === "list" && <ListView />}
          {viewMode === "timeline" && <TimelineView />}
          
          {isSharing && (
            <ProjectShareModal
              boardId={activeBoard.id}
              onClose={() => setIsSharing(false)}
            />
          )}

          {showTaskInbox && (
            <TaskInviteInbox
              onClose={() => setShowTaskInbox(false)}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col pt-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink">Seus Projetos</h2>
              <p className="text-sm text-muted mt-1">Selecione um projeto para abrir a timeline ou crie um novo.</p>
            </div>
            <button
              onClick={() => {
                const name = prompt("Nome do novo projeto:");
                if (name) {
                  useTaskStore.getState().createBoard(name, "📁");
                }
              }}
              className="bg-ink text-surface px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black/80 transition"
            >
              Criar Novo Projeto
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useTaskStore.getState().boards.map((b) => {
              const bTasks = useTaskStore.getState().tasks.filter(t => t.boardId === b.id);
              const done = bTasks.filter(t => t.column === "done").length;
              const pct = bTasks.length ? Math.round((done / bTasks.length) * 100) : 0;
              return (
                <button
                  key={b.id}
                  onClick={() => useTaskStore.getState().switchBoard(b.id)}
                  className="bg-surface-2 border p-5 rounded-3xl text-left hover:border-ink/20 transition flex flex-col gap-3 group"
                  style={{ borderColor: "var(--flat-border)" }}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl">{b.emoji || "📁"}</span>
                    <span className="text-xs font-bold px-2 py-1 bg-ink/5 rounded-lg text-ink group-hover:bg-ink group-hover:text-surface transition">Abrir</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-ink truncate">{b.name}</h3>
                    <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                      {b.sharedBy ? `Compartilhado por ${b.sharedBy}` : (b.collaborators?.length ? "Projeto compartilhado" : "Projeto pessoal")}
                    </p>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted mb-1.5">
                      <span>{done}/{bTasks.length} tarefas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full w-full bg-ink/5 overflow-hidden">
                      <div className="h-full bg-ink rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
