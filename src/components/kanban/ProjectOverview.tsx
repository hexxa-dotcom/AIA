"use client";
import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Target, Focus, ListTodo, Users, ShieldAlert, Share2, Crown } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Props {
  onShare: () => void;
  onStart: () => void;
}

export function ProjectOverview({ onShare, onStart }: Props) {
  const activeBoardId = useTaskStore((s) => s.activeBoardId);
  const board = useTaskStore((s) => s.boards.find((b) => b.id === activeBoardId));
  const updateBoard = useTaskStore((s) => s.updateBoard);
  const meEmail = useAuthStore((s) => s.user?.email) || "usuario@aia.com";

  const [scope, setScope] = useState(board?.scope || "");
  const [okrs, setOkrs] = useState(board?.okrs || "");
  const [kpis, setKpis] = useState(board?.kpis || "");

  useEffect(() => {
    if (board) {
      setScope(board.scope || "");
      setOkrs(board.okrs || "");
      setKpis(board.kpis || "");
    }
  }, [board?.id]);

  if (!board) return null;

  const isViewer = Boolean(board.sharedBy && board.collaborators?.find((c) => c.email === meEmail)?.role === "viewer");
  const isForeign = Boolean(board.sharedBy);

  function handleSave() {
    if (!board || isViewer) return;
    updateBoard(board.id, { scope, okrs, kpis });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Coluna Principal: Definições do Projeto */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
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
              placeholder="Ex:\nO1: Lançar versão 1.0\nKR1: Terminar design\nKR2: Homologar código..."
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
              placeholder="Como vamos medir o sucesso?\nEx: 100 usuários ativos na primeira semana..."
              className="w-full min-h-[100px] bg-transparent resize-none text-sm outline-none placeholder:text-muted/50"
            />
          )}
        </div>
        
        {/* Botão de Iniciar */}
        {!isViewer && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onStart}
              className="px-6 py-3 bg-ink text-surface rounded-xl font-bold hover:bg-black/80 transition shadow-sm"
            >
              Salvar e Iniciar Projeto →
            </button>
          </div>
        )}
      </div>

      {/* Coluna Lateral: Equipe e Compartilhamento */}
      <div className="flex flex-col gap-4">
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
            {/* Owner (Se não for foreign, é o current user) */}
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
      </div>
    </div>
  );
}
