"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Board } from "@/components/kanban/Board";
import { ListView } from "@/components/views/ListView";
import { TimelineView } from "@/components/views/TimelineView";
import { useTaskStore } from "@/store/useTaskStore";
import { LayoutGrid, List, Calendar, Folder, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectInbox } from "@/components/kanban/ProjectInbox";
import { ProjectShareModal } from "@/components/kanban/ProjectShareModal";
import { Share2, Info, Users } from "lucide-react";
import { ProjectOverview } from "@/components/kanban/ProjectOverview";
import { TaskInviteInbox } from "@/components/task/TaskInviteInbox";
import { useTaskInviteStore } from "@/store/useTaskInviteStore";

type ViewMode = "overview" | "kanban" | "list" | "timeline";
type PageMode = "kanban" | "projects";

export default function ProjetosPage() {
  const boards = useTaskStore((s) => s.boards);
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const switchBoard = useTaskStore((s) => s.switchBoard);
  const createBoard = useTaskStore((s) => s.createBoard);

  const [pageMode, setPageMode] = useState<PageMode>("kanban");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [isSharing, setIsSharing] = useState(false);
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  
  const pendingTaskInvites = useTaskInviteStore((s) => s.pendingCount());

  // Define the default board as the first board created, or a specific "general" board.
  const defaultBoard = boards[0]; 
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  // Se for pageMode kanban, garanta que o board ativo seja o defaultBoard.
  useEffect(() => {
    if (pageMode === "kanban" && defaultBoard && activeBoardId !== defaultBoard.id) {
      switchBoard(defaultBoard.id);
    }
  }, [pageMode, activeBoardId, defaultBoard, switchBoard]);

  // Se o usuário selecionou um board complexo, vá para o modo projetos.
  useEffect(() => {
    if (activeBoardId && defaultBoard && activeBoardId !== defaultBoard.id) {
      setPageMode("projects");
    }
  }, [activeBoardId, defaultBoard]);

  const views: { mode: ViewMode; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
    { mode: "overview", label: "Configurações", Icon: Info },
    { mode: "kanban", label: "Kanban", Icon: LayoutGrid },
    { mode: "list", label: "Lista", Icon: List },
    { mode: "timeline", label: "Timeline", Icon: Calendar },
  ];

  const complexBoards = boards.filter(b => b.id !== defaultBoard?.id);

  function handleCreateProject() {
    const name = prompt("Nome do novo projeto complexo:");
    if (name) {
      const newId = createBoard(name, "📁");
      switchBoard(newId);
      setViewMode("overview");
      setPageMode("projects");
    }
  }

  return (
    <AppShell>
      <Topbar
        title={
          <div className="flex gap-4 items-center">
            <button
              onClick={() => {
                setPageMode("kanban");
                if (viewMode === "overview") setViewMode("kanban");
              }}
              className={cn(
                "text-lg font-black transition",
                pageMode === "kanban" ? "text-ink border-b-2 border-ink" : "text-muted hover:text-ink/80 border-b-2 border-transparent"
              )}
            >
              Tarefas
            </button>
            <button
              onClick={() => {
                setPageMode("projects");
                if (activeBoardId === defaultBoard?.id) switchBoard("");
              }}
              className={cn(
                "text-lg font-black transition",
                pageMode === "projects" ? "text-ink border-b-2 border-ink" : "text-muted hover:text-ink/80 border-b-2 border-transparent"
              )}
            >
              Projetos
            </button>
          </div>
        }
        subtitle=""
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

      {pageMode === "kanban" ? (
        <div className="pt-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-bold text-ink">Suas Tarefas</h2>
              <p className="text-sm text-muted mt-1">Gerencie suas tarefas rápidas e do dia a dia.</p>
            </div>
          </div>
          
          <div className="flex gap-1 mb-6 bg-white rounded-full p-1.5 w-fit shadow-sm overflow-x-auto">
            {views.filter(v => v.mode !== "overview").map(({ mode, label, Icon }) => (
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

          {viewMode === "kanban" && <Board />}
          {viewMode === "list" && <ListView />}
          {viewMode === "timeline" && <TimelineView />}
          {(viewMode === "overview") && <Board />} {/* Fallback just in case */}
        </div>
      ) : (
        <div className="pt-4">
          {activeBoard && activeBoard.id !== defaultBoard?.id ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => switchBoard("")}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 hover:bg-surface text-ink transition border border-ink/5"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                    <span>{activeBoard.emoji}</span> {activeBoard.name}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-0.5">Visão do Projeto</p>
                </div>
              </div>

              <div className="flex gap-1 mb-6 bg-white rounded-full p-1.5 w-fit shadow-sm overflow-x-auto">
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
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold text-ink">Seus Projetos Complexos</h2>
                  <p className="text-sm text-muted mt-1">Gerencie projetos que exigem acompanhamento, equipe e metas.</p>
                </div>
                <button
                  onClick={handleCreateProject}
                  className="bg-ink text-surface px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black/80 transition flex items-center gap-2 shadow-sm"
                >
                  <Plus size={16} />
                  Criar Novo Projeto
                </button>
              </div>
              
              {complexBoards.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-ink/10 rounded-3xl text-muted flex flex-col items-center">
                  <Folder size={48} className="mb-4 opacity-20" />
                  <p className="font-semibold text-ink">Nenhum projeto complexo</p>
                  <p className="text-xs mt-1 max-w-sm mx-auto">Os projetos criados aqui possuem orçamentos, time tracking, OKRs, e múltiplos convidados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {complexBoards.map((b) => {
                    const bTasks = useTaskStore.getState().tasks.filter(t => t.boardId === b.id);
                    const done = bTasks.filter(t => t.column === "done").length;
                    const pct = bTasks.length ? Math.round((done / bTasks.length) * 100) : 0;
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          switchBoard(b.id);
                          setViewMode("overview");
                        }}
                        className="bg-surface-2 border p-5 rounded-3xl text-left hover:border-ink/20 transition flex flex-col gap-3 group shadow-sm hover:shadow-md"
                        style={{ borderColor: "var(--flat-border)" }}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="text-2xl">{b.emoji || "📁"}</span>
                          <span className="text-xs font-bold px-2 py-1 bg-ink/5 rounded-lg text-ink group-hover:bg-ink group-hover:text-surface transition">Abrir</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-ink truncate text-lg">{b.name}</h3>
                          <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                            {b.sharedBy ? `Compartilhado por ${b.sharedBy}` : (b.collaborators?.length ? "Projeto de equipe" : "Projeto pessoal")}
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
              )}
            </div>
          )}
        </div>
      )}

      {showTaskInbox && (
        <TaskInviteInbox
          onClose={() => setShowTaskInbox(false)}
        />
      )}
    </AppShell>
  );
}
