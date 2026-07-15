"use client";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDuration, cn } from "@/lib/utils";
import { Target, Focus, ListTodo, Users, ShieldAlert, Share2, Crown, Trash2, LayoutGrid, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Props {
  onShare: () => void;
  onStart?: () => void; // kept for backwards compatibility if needed
}

export function ProjectOverview({ onShare }: Props) {
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const board = useTaskStore((s) => s.boards.find((b) => b.id === activeBoardId));
  const updateBoard = useTaskStore((s) => s.updateBoard);
  const deleteBoard = useTaskStore((s) => s.deleteBoard);
  const meEmail = useAuthStore((s) => s.user?.email) || "usuario@aia.com";

  const [name, setName] = useState(board?.name || "");
  const [emoji, setEmoji] = useState(board?.emoji || "📁");
  const [scope, setScope] = useState(board?.scope || "");
  const [okrs, setOkrs] = useState(board?.okrs || "");
  const [kpis, setKpis] = useState(board?.kpis || "");
  const [budget, setBudget] = useState(board?.budget || 0);

  useEffect(() => {
    if (board) {
      setName(board.name || "");
      setEmoji(board.emoji || "📁");
      setScope(board.scope || "");
      setOkrs(board.okrs || "");
      setKpis(board.kpis || "");
      setBudget(board.budget || 0);
    }
  }, [board?.id]);

  if (!board) return null;

  const isViewer = Boolean(board.sharedBy && board.collaborators?.find((c) => c.email === meEmail)?.role === "viewer");
  const isForeign = Boolean(board.sharedBy);

  function handleSave() {
    if (!board || isViewer) return;
    updateBoard(board.id, { name, emoji, scope, okrs, kpis, budget });
  }

  const projectTasks = useTaskStore.getState().tasks.filter((t) => t.boardId === board?.id);
  
  // Progress calculations
  const totalTasks = projectTasks.length;
  const doneTasks = projectTasks.filter(t => t.column === 'done').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const pendingTasks = totalTasks - doneTasks;
  
  // Deadline calculations
  const lastDueDateTask = projectTasks.filter(t => t.dueDate).sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0))[0];
  let daysLeftText = "Sem prazo definido";
  let isLate = false;
  if (lastDueDateTask && lastDueDateTask.dueDate) {
    const msLeft = lastDueDateTask.dueDate - Date.now();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      isLate = true;
      daysLeftText = `${Math.abs(daysLeft)} dias atrasado`;
    } else if (daysLeft === 0) {
      daysLeftText = "Prazo encerra hoje";
    } else {
      daysLeftText = `${daysLeft} dias restantes`;
    }
  }

  const totalTimeSpent = projectTasks.reduce((acc, t) => acc + (t.totalTimeSec || 0), 0);
  const totalCost = projectTasks.reduce((acc, t) => {
    const hours = (t.totalTimeSec || 0) / 3600;
    return acc + hours * (t.hourlyRate || 0);
  }, 0);

  function handleDelete() {
    if (!board || isViewer) return;
    if (confirm("Tem certeza que deseja excluir este projeto e todas as suas tarefas? Esta ação é irreversível.")) {
      deleteBoard(board.id);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Coluna Principal: Definições do Projeto */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Identificação */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink grid place-items-center">
              <LayoutGrid size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">Identificação</h3>
          </div>
          <div className="flex gap-3">
            <div className="w-16">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Ícone</label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                onBlur={handleSave}
                disabled={isViewer}
                className="w-full text-2xl bg-transparent border-b border-ink/10 outline-none text-center pb-1 disabled:opacity-50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Nome do Projeto</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSave}
                disabled={isViewer}
                placeholder="Ex: Novo Aplicativo Mobile"
                className="w-full text-base font-semibold bg-transparent border-b border-ink/10 outline-none pb-1 disabled:opacity-50 focus:border-ink/30 transition"
              />
            </div>
          </div>
        </div>

        {/* Escopo */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-info/10 text-info grid place-items-center">
              <Focus size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">Escopo do Projeto</h3>
          </div>
          {isViewer ? (
            <div className="text-sm text-muted whitespace-pre-wrap">{scope || "Nenhum escopo definido."}</div>
          ) : (
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              onBlur={handleSave}
              placeholder="Descreva o objetivo geral e o escopo deste projeto..."
              className="w-full min-h-[100px] bg-transparent resize-none text-sm outline-none placeholder:text-muted/50"
            />
          )}
        </div>

        {/* OKRs */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 grid place-items-center">
              <Target size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">OKRs (Objectives & Key Results)</h3>
          </div>
          {isViewer ? (
            <div className="text-sm text-muted whitespace-pre-wrap">{okrs || "Nenhum OKR definido."}</div>
          ) : (
            <textarea
              value={okrs}
              onChange={(e) => setOkrs(e.target.value)}
              onBlur={handleSave}
              placeholder={"Ex:\nO1: Lançar versão 1.0\nKR1: Terminar design\nKR2: Homologar código..."}
              className="w-full min-h-[100px] bg-transparent resize-none text-sm outline-none placeholder:text-muted/50"
            />
          )}
        </div>

        {/* KPIs */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning grid place-items-center">
              <ListTodo size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">KPIs (Key Performance Indicators)</h3>
          </div>
          {isViewer ? (
            <div className="text-sm text-muted whitespace-pre-wrap">{kpis || "Nenhum KPI definido."}</div>
          ) : (
            <textarea
              value={kpis}
              onChange={(e) => setKpis(e.target.value)}
              onBlur={handleSave}
              placeholder={"Como vamos medir o sucesso?\nEx: 100 usuários ativos na primeira semana..."}
              className="w-full min-h-[100px] bg-transparent resize-none text-sm outline-none placeholder:text-muted/50"
            />
          )}
        </div>
        
      </div>

      {/* Coluna Lateral: Métricas, Equipe e Danger Zone */}
      <div className="flex flex-col gap-4">

        {/* Visão Geral (Progresso) */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-ink/10 text-ink grid place-items-center">
              <Target size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">Progresso</h3>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-ink leading-none">{progressPct}%</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Concluído</span>
            </div>
            <div className="h-2 rounded-full w-full bg-ink/5 overflow-hidden">
              <div 
                className="h-full bg-lime transition-all duration-500 ease-out" 
                style={{ width: `${progressPct}%` }} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-2 p-3 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Tarefas Restantes</span>
              <span className="font-bold text-ink text-sm">
                {pendingTasks === 0 ? "Tudo pronto!" : `${pendingTasks} pendente${pendingTasks === 1 ? '' : 's'}`}
              </span>
            </div>
            <div className={cn("bg-surface-2 p-3 rounded-2xl flex flex-col justify-center", isLate && "bg-danger/10")}>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 block", isLate ? "text-danger" : "text-muted")}>
                Prazo Final
              </span>
              <span className={cn("font-bold text-sm", isLate ? "text-danger" : "text-ink")}>
                {daysLeftText}
              </span>
            </div>
          </div>
        </div>

        {/* Métricas do Projeto */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-lime/10 text-lime-dark grid place-items-center">
              <Clock size={16} />
            </div>
            <h3 className="font-bold text-ink text-lg">Métricas e Custos</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted block">Orçamento (Budget)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted">R$</span>
                <input
                  type="number"
                  value={budget || ""}
                  onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                  onBlur={handleSave}
                  disabled={isViewer}
                  placeholder="0,00"
                  className="w-full text-lg font-bold bg-transparent border-b border-ink/10 outline-none pb-1 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink/5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Tempo Total</span>
                <span className="text-base font-bold text-ink tabular-nums">{formatDuration(totalTimeSpent)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">Custo Total</span>
                <span className="text-base font-bold text-ink tabular-nums">
                  {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Equipe */}
        <div className="glass rounded-3xl overflow-hidden flex flex-col">
          <div className="p-5 border-b bg-black/[0.02] flex items-center justify-between" style={{ borderColor: "var(--flat-border)" }}>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-ink" />
              <h3 className="font-bold text-ink">Equipe e Acessos</h3>
            </div>
            {!isViewer && !isForeign && (
              <button
                onClick={onShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-surface rounded-xl text-xs font-bold hover:bg-black/80 transition"
              >
                <Share2 size={12} />
                Convidar
              </button>
            )}
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-4">
            {/* Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ink/10 text-ink grid place-items-center font-bold text-xs">
                  O
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{isForeign ? board.sharedBy : "Você"}</p>
                  <p className="text-[10px] text-muted">Proprietário (Admin)</p>
                </div>
              </div>
              <Crown size={14} className="text-warning" />
            </div>

            {/* Outros colaboradores */}
            {board.collaborators?.map((c) => (
              <div key={c.email} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-2 border grid place-items-center font-bold text-xs text-muted" style={{ borderColor: "var(--flat-border)" }}>
                    {c.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{c.name || c.email}</p>
                    <p className="text-[10px] text-muted capitalize">
                      {c.role === "admin" ? "Administrador" : "Visualizador"}
                      {c.status === "pending" && " (Pendente)"}
                    </p>
                  </div>
                </div>
                {c.role === "admin" && <ShieldAlert size={12} className="text-muted/50" />}
              </div>
            ))}

            {!board.collaborators?.length && !isForeign && (
              <div className="mt-4 p-4 rounded-2xl bg-surface-2 border text-center text-xs text-muted" style={{ borderColor: "var(--flat-border)" }}>
                Este projeto é particular. <br/> Clique em <strong>Convidar</strong> para trazer sua equipe.
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {!isViewer && (
          <div className="glass rounded-3xl p-5 border border-danger/20 bg-danger/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-danger" />
              <h3 className="font-bold text-danger">Zona de Perigo</h3>
            </div>
            <p className="text-xs text-danger/80 mb-4">
              A exclusão do projeto removerá todas as tarefas, configurações e tempo registrado permanentemente.
            </p>
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-danger text-white rounded-xl text-sm font-bold hover:bg-danger/90 transition shadow-sm"
            >
              <Trash2 size={16} />
              Excluir Projeto
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
