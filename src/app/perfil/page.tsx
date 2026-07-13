"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Zap, Star, Flame, CheckSquare, Trophy, LogOut, 
  Edit3, Check, Trash2, Plus, Lock, Heart, Award, 
  Smile, User2, Building2, Briefcase, Eye, EyeOff,
  ChevronDown, ChevronUp, Pencil, Circle, CheckCircle2, Flag, X, Target, Shield, KeyRound,
  Github, Globe, RefreshCw, Database, Bot, Cloud, Settings2, Clock
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { useTaskStore } from "@/store/useTaskStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useProfileStore, type SkillItem, type GoalItem } from "@/store/useProfileStore";
import { useAdminStore, checkIsAdmin, type UserProfile } from "@/store/useAdminStore";
import { getAppwrite } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useAiStore } from "@/store/useAiStore";
import { OPENROUTER_MODELS, GROQ_MODELS } from "@/lib/ai/models";
import { useVaultStore } from "@/store/useVaultStore";
import { usePurposeStore } from "@/store/usePurposeStore";
import { useGoalsStore, type PersonalGoal, type GoalCategory } from "@/store/useGoalsStore";
import { MasterPasswordGate } from "@/components/vault/MasterPasswordGate";
import { VaultList } from "@/components/vault/VaultList";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ACHIEVEMENTS as GLOBAL_ACHIEVEMENTS } from "@/lib/xp";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, Board } from "@/lib/types";

const AVATAR_GRADIENTS: Record<string, string> = {
  sunset: "linear-gradient(135deg, #FF5E62 0%, #FF9966 100%)",
  ocean: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
  emerald: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  neon: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
  liquid: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)",
  purple: "linear-gradient(135deg, #DA22FF 0%, #9733EE 100%)",
  candy: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
};

const MOODS = [
  { emoji: "🚀", label: "Focado" },
  { emoji: "☕", label: "Produtivo" },
  { emoji: "😊", label: "Feliz" },
  { emoji: "😴", label: "Cansado" },
  { emoji: "🧠", label: "Pensativo" },
];

const LOCAL_ACHIEVEMENTS = [
  { id: "first-task", icon: "🏆", title: "Primeira tarefa", desc: "Completou sua primeira tarefa", xp: 10 },
  { id: "streak-7", icon: "🔥", title: "Semana perfeita", desc: "7 dias de streak seguidos", xp: 50 },
  { id: "streak-30", icon: "📅", title: "Mês dedicado", desc: "30 dias de streak", xp: 200 },
  { id: "level-5", icon: "⭐", title: "Nível 5", desc: "Chegou ao nível 5", xp: 100 },
  { id: "level-10", icon: "👑", title: "Nível 10", desc: "Chegou ao nível 10", xp: 300 },
  { id: "tasks-10", icon: "⚡", title: "Produtivo", desc: "10 tarefas concluídas", xp: 30 },
  { id: "tasks-50", icon: "💪", title: "Imparável", desc: "50 tarefas concluídas", xp: 150 },
  { id: "tasks-100", icon: "🌟", title: "Centenário", desc: "100 tarefas concluídas", xp: 500 },
];

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  pessoal: "bg-sage/30 text-ink",
  profissional: "bg-info/15 text-info",
  saude: "bg-success/15 text-success",
  financeiro: "bg-lime/40 text-ink",
  outro: "bg-surface-2 text-muted",
};

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  pessoal: "Pessoal",
  profissional: "Profissional",
  saude: "Saúde",
  financeiro: "Financeiro",
  outro: "Outro",
};

function getTaskScope(task: Task, boards: Board[]): "profissional" | "pessoal" {
  const board = boards.find((b) => b.id === task.boardId);
  if (!board) return "profissional";
  if (board.scope) return board.scope as "profissional" | "pessoal";
  
  const name = board.name.toLowerCase();
  const personalKeywords = [
    "pessoal", "casa", "life", "saude", "saúde", "finanças", "financas", 
    "estudos", "hobbies", "lazer", "familia", "família", "academia", "treino"
  ];
  if (personalKeywords.some((k) => name.includes(k))) {
    return "pessoal";
  }
  return "profissional";
}

function PersonalPurposesWidget() {
  const { purposes, addPurpose, removePurpose, checkInToday, uncheckToday, toggleShowOnFeed } = usePurposeStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [days, setDays] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addPurpose(name.trim(), desc.trim(), days);
    setName("");
    setDesc("");
    setDays(30);
    setShowAdd(false);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-ink/5 pb-3">
        <div className="flex items-center gap-2">
          <Smile size={16} className="text-muted shrink-0" />
          <div>
            <h2 className="font-bold text-sm text-ink">Propósitos Pessoais & Desafios</h2>
            <p className="text-[10px] text-muted">Compromissos privados e hábitos íntimos monitorados por você.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-bold text-ink hover:underline flex items-center gap-1 shrink-0"
        >
          <Plus size={14} /> Novo Desafio
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-surface-2 border border-ink/5 p-4 rounded-2xl space-y-3 overflow-hidden text-left"
          >
            <div>
              <label className="text-[9px] uppercase font-bold text-muted block mb-1">Nome do Desafio</label>
              <input
                type="text"
                placeholder="Ex: 30 Dias Sem Álcool / Sem Redes Sociais"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-muted block mb-1">Motivação / Descrição</label>
              <input
                type="text"
                placeholder="Ex: Melhorar meu sono, foco e clareza mental."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-muted block mb-1">Meta de Dias</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-ink/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
              >
                <option value={7}>7 Dias</option>
                <option value={15}>15 Dias</option>
                <option value={30}>30 Dias</option>
                <option value={60}>60 Dias</option>
                <option value={90}>90 Dias</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={!name.trim()}>
                Criar Desafio
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {purposes.length === 0 ? (
          <p className="text-xs text-muted text-center py-4 col-span-2">Nenhum propósito ativo. Crie um acima!</p>
        ) : (
          purposes.map((p) => {
            const completedCount = p.completedDates.length;
            const isCompletedToday = p.completedDates.includes(todayStr);
            const pct = Math.round((completedCount / p.daysTotal) * 100);

            return (
              <div key={p.id} className="p-4 bg-surface-2 border border-ink/5 rounded-2xl flex flex-col gap-3 justify-between hover:scale-[1.01] hover:shadow-sm transition-all text-left">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-xs text-ink leading-tight">{p.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleShowOnFeed(p.id)}
                        title={p.showOnFeed ? "Exibindo no Feed (clique para ocultar)" : "Oculto do Feed (clique para exibir)"}
                        className={cn(
                          "p-1 rounded-md transition",
                          p.showOnFeed ? "hover:bg-ink/5 text-ink" : "hover:bg-ink/5 text-muted/50"
                        )}
                      >
                        {p.showOnFeed ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={() => removePurpose(p.id)}
                        className="p-1 rounded-md hover:bg-danger/10 text-muted hover:text-danger transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-[10px] text-muted leading-relaxed">{p.description}</p>
                  )}
                </div>

                {/* Grid de Bolinhas */}
                <div className="flex flex-wrap gap-1 bg-white/40 border border-ink/5 rounded-xl p-2.5 max-h-[85px] overflow-y-auto">
                  {Array.from({ length: p.daysTotal }).map((_, idx) => {
                    const checked = idx < completedCount;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all duration-300",
                          checked ? "bg-lime border border-lime/40 scale-105" : "bg-ink/10 border border-ink/5"
                        )}
                        title={`Dia ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                {/* Rodapé e Check-in */}
                <div className="flex items-center justify-between border-t border-ink/5 pt-2 mt-1">
                  <div className="text-[10px] font-bold text-ink">
                    {completedCount} / {p.daysTotal} dias ({pct}%)
                  </div>
                  
                  {isCompletedToday ? (
                    <button
                      onClick={() => uncheckToday(p.id)}
                      className="text-[9px] font-extrabold text-success hover:text-danger transition uppercase tracking-wider flex items-center gap-0.5 bg-lime/10 px-2.5 py-1 rounded-lg"
                    >
                      Concluído hoje ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => checkInToday(p.id)}
                      className="text-[9px] font-extrabold text-surface bg-ink hover:opacity-90 transition uppercase tracking-wider px-2.5 py-1 rounded-lg"
                    >
                      Check-in
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: PersonalGoal }) {
  const {
    updateGoal,
    deleteGoal,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
  } = useGoalsStore();
  const [open, setOpen] = useState(false);
  const [newMs, setNewMs] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);

  const daysLeft = goal.targetDate
    ? Math.ceil((goal.targetDate - Date.now()) / 86400000)
    : null;

  return (
    <div className={cn("glass rounded-3xl overflow-hidden text-left", goal.status === "concluido" && "opacity-60")}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              updateGoal(goal.id, {
                status: goal.status === "concluido" ? "ativo" : "concluido",
                completedAt: goal.status !== "concluido" ? Date.now() : undefined,
                progress: goal.status !== "concluido" ? 100 : goal.progress,
              })
            }
            className="shrink-0 mt-0.5"
          >
            {goal.status === "concluido" ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <Circle size={18} className="text-muted/30 hover:text-success transition" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => {
                  updateGoal(goal.id, { title: editTitle });
                  setEditing(false);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && (updateGoal(goal.id, { title: editTitle }), setEditing(false))
                }
                autoFocus
                className="w-full text-sm font-bold bg-surface-2 rounded-lg px-2 py-0.5 outline-none text-ink"
              />
            ) : (
              <p className={cn("text-sm font-bold leading-snug text-ink", goal.status === "concluido" && "line-through text-muted")}>
                {goal.title}
              </p>
            )}
            {goal.description && (
              <p className="text-xs text-muted mt-0.5 line-clamp-1">{goal.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", CATEGORY_COLORS[goal.category])}>
              {CATEGORY_LABELS[goal.category]}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg hover:bg-surface-2 transition text-muted"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => deleteGoal(goal.id)}
              className="p-1 rounded-lg hover:bg-danger/10 transition text-muted hover:text-danger"
            >
              <Trash2 size={11} />
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1 rounded-lg hover:bg-surface-2 transition text-muted"
            >
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-ink/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-ink rounded-full transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-muted shrink-0">{goal.progress}%</span>
          {daysLeft !== null && (
            <span className={cn("text-[11px] shrink-0 flex items-center gap-1", daysLeft < 0 ? "text-danger" : daysLeft <= 7 ? "text-warning" : "text-muted")}>
              <Flag size={10} />
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d atraso` : `${daysLeft}d restantes`}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-ink/5 px-4 py-3 space-y-2 overflow-hidden"
          >
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-2">Etapas</p>
            {goal.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2 group">
                <button onClick={() => toggleMilestone(goal.id, m.id)} className="shrink-0">
                  {m.done ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : (
                    <Circle size={14} className="text-muted/30 hover:text-success transition" />
                  )}
                </button>
                <span className={cn("text-sm flex-1 text-ink", m.done && "line-through text-muted")}>{m.title}</span>
                <button
                  onClick={() => deleteMilestone(goal.id, m.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-danger/10 text-muted hover:text-danger transition"
                >
                  <X size={11} />
                </button>
              </div>
            ))}

            <div className="flex gap-2 mt-2">
              <input
                value={newMs}
                onChange={(e) => setNewMs(e.target.value)}
                placeholder="Adicionar etapa…"
                className="flex-1 text-sm px-3 py-1.5 rounded-xl bg-surface-2 outline-none text-ink"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMs.trim()) {
                    addMilestone(goal.id, newMs.trim());
                    setNewMs("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newMs.trim()) {
                    addMilestone(goal.id, newMs.trim());
                    setNewMs("");
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-ink text-lime text-xs font-semibold"
              >
                <Plus size={12} />
              </button>
            </div>

            {goal.milestones.length === 0 && (
              <div className="pt-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={(e) => updateGoal(goal.id, { progress: Number(e.target.value) })}
                  className="w-full accent-ink"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>0%</span>
                  <span className="text-center">Progresso manual</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddGoalModal({ onClose }: { onClose: () => void }) {
  const addGoal = useGoalsStore((s) => s.addGoal);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<GoalCategory>("pessoal");
  const [targetDate, setTargetDate] = useState("");

  function save() {
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      description: desc.trim() || undefined,
      category,
      targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(14,11,12,0.60)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="glass rounded-3xl shadow-xl w-full max-w-md p-6 text-left">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-ink">Nova Meta</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Ex: Aprender inglês fluente"
              className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 text-ink"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Descrição (opcional)</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Por que essa meta é importante…"
              className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ink/15 text-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none text-ink"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Prazo (opcional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none text-ink"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-ink/15 text-sm font-semibold hover:bg-surface-2 transition text-ink"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-2xl bg-ink text-lime text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function PerfilConquistasWidget() {
  const { level, xp, streakDays } = useGameStore();
  const goals = useGoalsStore((s) => s.goals);
  const [tab, setTab] = useState<"metas" | "conquistas">("metas");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"todos" | "ativo" | "concluido">("todos");

  const filtered = goals.filter((g) => filter === "todos" || g.status === filter);
  const activeCount = goals.filter((g) => g.status === "ativo").length;
  const doneCount = goals.filter((g) => g.status === "concluido").length;

  const unlockedIds = new Set([
    ...(xp >= 10 ? ["first-task"] : []),
    ...(streakDays >= 7 ? ["streak-7"] : []),
    ...(streakDays >= 30 ? ["streak-30"] : []),
    ...(level >= 5 ? ["level-5"] : []),
    ...(level >= 10 ? ["level-10"] : []),
  ]);

  const SUB_TABS = [
    { id: "metas", label: "Minhas Metas" },
    { id: "conquistas", label: "Conquistas" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="relative flex items-center bg-surface-2 p-1.5 border border-ink/5 rounded-full w-fit select-none shadow-sm">
        {SUB_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative z-10 px-4 py-1 rounded-full text-[11px] font-bold transition-colors duration-300",
                active ? "text-ink" : "text-muted hover:text-ink"
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeConquistasSubTabPill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm border border-ink/5"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "metas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Ativas", value: activeCount, color: "text-ink" },
              { label: "Concluídas", value: doneCount, color: "text-success" },
              { label: "Total", value: goals.length, color: "text-muted" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-3xl p-4 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {(["todos", "ativo", "concluido"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-bold transition",
                    filter === f ? "bg-ink text-lime" : "bg-surface-2 text-muted hover:bg-ink/5 border border-ink/5"
                  )}
                >
                  {f === "todos" ? "Todos" : f === "ativo" ? "Ativas" : "Concluídas"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink text-lime text-xs font-bold hover:opacity-90 transition shadow-sm"
            >
              <Plus size={13} /> Nova Meta
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted border border-ink/5">
              <Target size={28} className="mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm text-ink">Nenhuma meta cadastrada</p>
              <p className="text-xs text-muted mt-1">Crie um objetivo para acompanhar seu progresso.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "conquistas" && (
        <div className="space-y-4">
          <div className="glass rounded-3xl p-5 flex items-center gap-4 border border-ink/5">
            <div className="w-12 h-12 rounded-2xl bg-ink text-lime grid place-items-center text-xl font-bold shrink-0">
              {level}
            </div>
            <div>
              <p className="font-bold text-sm text-ink">Nível {level}</p>
              <p className="text-xs text-muted">
                {xp} XP acumulados · {streakDays} dias de ofensiva
              </p>
              <p className="text-[10px] text-muted font-semibold mt-0.5">
                {unlockedIds.size} de {LOCAL_ACHIEVEMENTS.length} medalhas conquistadas
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOCAL_ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedIds.has(a.id);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "glass rounded-3xl p-4 flex items-start gap-3 border border-ink/5 transition-all",
                    !unlocked && "opacity-45 grayscale"
                  )}
                >
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-ink truncate">{a.title}</p>
                    <p className="text-[10px] text-muted leading-relaxed mt-0.5">{a.desc}</p>
                    <p className="text-[9px] font-mono text-muted/60 mt-1 font-semibold">+{a.xp} XP</p>
                  </div>
                  {unlocked && (
                    <Check size={13} className="text-success shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AdminProfilePanel() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = checkIsAdmin(currentUser?.email);
  
  const { settings, updateSetting, users, addUser, updateUserRole, removeUser, systemTools, updateSystemTools } = useAdminStore();

  if (!isAdmin) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-muted border border-flat flex flex-col items-center">
        <Shield size={24} className="mb-2 opacity-50 text-danger animate-pulse" />
        <p className="font-bold text-xs text-danger uppercase tracking-wider">Acesso Restrito 🛡️</p>
        <p className="text-[10px] text-muted mt-1.5 max-w-[280px]">
          Esta seção é exclusiva para o administrador do sistema.
        </p>
      </div>
    );
  }

  // States: User invite
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "convidado">("convidado");
  const [addingUser, setAddingUser] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(false);

  // States: Cloud Credentials
  const [vercelUrl, setVercelUrl] = useState(systemTools.vercelUrl);
  const [vercelToken, setVercelToken] = useState(systemTools.vercelToken);
  const [gitRepo, setGitRepo] = useState(systemTools.gitRepo);
  const [gitToken, setGitToken] = useState(systemTools.gitToken);
  const [appwriteEndpoint, setAppwriteEndpoint] = useState(systemTools.appwriteEndpoint);
  const [appwriteProjectId, setAppwriteProjectId] = useState(systemTools.appwriteProjectId);
  const [appwriteDatabaseId, setAppwriteDatabaseId] = useState(systemTools.appwriteDatabaseId);
  const [appwriteApiKey, setAppwriteApiKey] = useState(systemTools.appwriteApiKey);

  const [showVercelToken, setShowVercelToken] = useState(false);
  const [showGitToken, setShowGitToken] = useState(false);
  const [showAppwriteKey, setShowAppwriteKey] = useState(false);
  const [toolsSaved, setToolsSaved] = useState(false);

  // States: System Intelligence
  const aiProvider = useAiStore((s) => s.provider);
  const setAiProvider = useAiStore((s) => s.setProvider);
  const aiApiKey = useAiStore((s) => s.apiKey);
  const setAiApiKey = useAiStore((s) => s.setApiKey);
  const aiGroqKey = useAiStore((s) => s.groqKey);
  const setAiGroqKey = useAiStore((s) => s.setGroqKey);
  const aiModels = useAiStore((s) => s.models);
  const setAiModel = useAiStore((s) => s.setModel);

  const [showAiKey, setShowAiKey] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // Local briefing state initialization
  const [briefingHour, setBriefingHour] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("aia-briefing-hour") ?? "08:00" : "08:00"
  );
  const [briefingIncFin, setBriefingIncFin] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("aia-briefing-inc-finances") !== "false" : true
  );
  const [briefingIncRot, setBriefingIncRot] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("aia-briefing-inc-routine") !== "false" : true
  );

  // Sub-tabs inside admin panel
  const [adminSubTab, setAdminSubTab] = useState<"politicas" | "usuarios" | "inteligencia" | "credenciais">("politicas");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setLoadingInvite(true);

    const emailClean = newUserEmail.trim().toLowerCase();
    const nameClean = newUserName.trim();

    if (!emailClean || !newUserPass || !nameClean) {
      setInviteError("Preencha todos os campos.");
      setLoadingInvite(false);
      return;
    }

    try {
      const { account } = getAppwrite();
      if (!account) throw new Error("Banco de dados Appwrite não configurado.");
      
      const newId = ID.unique();
      // Registra a conta no Appwrite
      await account.create(newId, emailClean, newUserPass, nameClean);
      
      // Adiciona na store local de controle
      addUser({
        id: newId,
        email: emailClean,
        name: nameClean,
        role: newUserRole,
      });

      setInviteSuccess(`Usuário ${emailClean} convidado com sucesso!`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPass("");
      setNewUserRole("convidado");
      setAddingUser(false);
    } catch (err: any) {
      setInviteError(err?.message || "Falha ao registrar no Appwrite Cloud.");
    } finally {
      setLoadingInvite(false);
    }
  }

  function handleSaveTools(e: React.FormEvent) {
    e.preventDefault();
    updateSystemTools({
      vercelUrl: vercelUrl.trim(),
      vercelToken: vercelToken.trim(),
      gitRepo: gitRepo.trim(),
      gitToken: gitToken.trim(),
      appwriteEndpoint: appwriteEndpoint.trim(),
      appwriteProjectId: appwriteProjectId.trim(),
      appwriteDatabaseId: appwriteDatabaseId.trim(),
      appwriteApiKey: appwriteApiKey.trim(),
    });
    setToolsSaved(true);
    setTimeout(() => setToolsSaved(false), 2000);
  }

  function handleSaveAiConfig() {
    localStorage.setItem("aia-briefing-hour", briefingHour);
    localStorage.setItem("aia-briefing-inc-finances", String(briefingIncFin));
    localStorage.setItem("aia-briefing-inc-routine", String(briefingIncRot));
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  }

  const handleAiProviderChange = (newProvider: "openrouter" | "groq") => {
    setAiProvider(newProvider);
    if (newProvider === "groq") {
      setAiModel("system", "llama-3.1-8b-instant");
      setAiModel("chat", "llama-3.3-70b-versatile");
    } else {
      setAiModel("system", "deepseek/deepseek-chat");
      setAiModel("chat", "openai/gpt-4o-mini");
    }
  };

  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 flex flex-col gap-5 text-left animate-fadeIn">
      {/* Header do painel admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/5 pb-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-ink shrink-0" />
          <div>
            <h2 className="font-bold text-sm text-ink">Painel Administrativo</h2>
            <p className="text-[10px] text-muted">Controle de perfis, acesso a configurações e credenciais de nuvem.</p>
          </div>
        </div>

        {/* Sub-abas de navegação admin */}
        <div className="flex bg-surface-2 p-1 rounded-xl self-start sm:self-center border border-flat flex-wrap gap-0.5">
          {(["politicas", "usuarios", "inteligencia", "credenciais"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAdminSubTab(tab)}
              className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors",
                adminSubTab === tab ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink"
              )}
            >
              {tab === "politicas" ? "Políticas" : tab === "usuarios" ? "Usuários" : tab === "inteligencia" ? "Inteligência" : "Nuvem & Keys"}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Aba 1: Políticas de Convidados */}
      {adminSubTab === "politicas" && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-xs text-muted leading-relaxed">
            Defina quais telas e configurações avançadas os usuários convidados poderão acessar no sistema.
          </p>

          <div className="space-y-3 pt-1">
            {/* Modelo de IA */}
            <div className="flex items-center justify-between p-3.5 bg-surface-2/60 border border-flat rounded-2xl">
              <div className="space-y-0.5 max-w-[75%]">
                <span className="text-xs font-bold text-ink block">Alteração de Modelos de IA</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  Permite que convidados troquem o provedor de IA (OpenRouter/Groq) ou alterem chaves de API.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={settings.allowGuestsChangeAiModel}
                  onChange={(e) => updateSetting("allowGuestsChangeAiModel", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ink"></div>
              </label>
            </div>

            {/* Resetar dados */}
            <div className="flex items-center justify-between p-3.5 bg-surface-2/60 border border-flat rounded-2xl">
              <div className="space-y-0.5 max-w-[75%]">
                <span className="text-xs font-bold text-ink block">Apagar e Resetar Dados</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  Permite que convidados apaguem permanentemente os dados de finanças, tarefas e histórico local.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={settings.allowGuestsResetData}
                  onChange={(e) => updateSetting("allowGuestsResetData", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ink"></div>
              </label>
            </div>

            {/* Servidores MCP */}
            <div className="flex items-center justify-between p-3.5 bg-surface-2/60 border border-flat rounded-2xl">
              <div className="space-y-0.5 max-w-[75%]">
                <span className="text-xs font-bold text-ink block">Configuração de Servidores MCP</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  Permite que convidados vejam ou alterem ferramentas externas instaladas via MCP.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={settings.allowGuestsManageMcp}
                  onChange={(e) => updateSetting("allowGuestsManageMcp", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ink"></div>
              </label>
            </div>

            {/* Integrações */}
            <div className="flex items-center justify-between p-3.5 bg-surface-2/60 border border-flat rounded-2xl">
              <div className="space-y-0.5 max-w-[75%]">
                <span className="text-xs font-bold text-ink block">Configuração de Banco de Dados</span>
                <p className="text-[10px] text-muted leading-relaxed">
                  Permite que convidados configurem ou vejam os tokens de sincronização do Supabase ou Appwrite.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={settings.allowGuestsConfigureIntegrations}
                  onChange={(e) => updateSetting("allowGuestsConfigureIntegrations", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-3 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ink"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Aba 2: Gerenciador de Usuários e Perfis */}
      {adminSubTab === "usuarios" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-ink/5 pb-2">
            <span className="text-xs font-bold text-ink">Lista de Usuários Cadastrados ({users.length})</span>
            <button
              onClick={() => setAddingUser(!addingUser)}
              className="text-[10px] font-bold text-ink hover:underline flex items-center gap-1 shrink-0"
            >
              <Plus size={12} /> {addingUser ? "Cancelar" : "Convidar Usuário"}
            </button>
          </div>

          {/* Form para adicionar usuário / convite */}
          {addingUser && (
            <form onSubmit={handleInvite} className="bg-surface-2 p-4 border border-flat rounded-2xl space-y-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink">Novo Convite de Usuário</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome completo"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                />
                <input
                  type="email"
                  placeholder="E-mail do convidado"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                />
                <input
                  type="password"
                  placeholder="Senha Inicial"
                  required
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  className="px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "convidado")}
                  className="px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                >
                  <option value="convidado">Nível: Convidado (Acesso restrito)</option>
                  <option value="admin">Nível: Admin (Acesso total)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1.5">
                <button
                  type="submit"
                  disabled={loadingInvite}
                  className="px-4 py-1.5 bg-ink text-surface rounded-xl text-xs font-bold hover:opacity-95 transition disabled:opacity-50"
                >
                  {loadingInvite ? "Enviando Convite..." : "Criar Usuário"}
                </button>
              </div>

              {inviteError && <p className="text-[10px] text-danger font-bold">{inviteError}</p>}
            </form>
          )}

          {inviteSuccess && (
            <p className="text-[10px] text-success font-bold bg-success/10 p-2.5 rounded-xl">{inviteSuccess}</p>
          )}

          {/* Listagem de Usuários */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {users.map((u) => {
              const isMe = u.email.toLowerCase() === currentUser?.email?.toLowerCase();
              return (
                <div key={u.id} className="p-3 bg-surface-2/65 border border-flat rounded-2xl flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink truncate block">{u.name}</span>
                      {isMe && <span className="text-[8px] uppercase tracking-wider font-extrabold bg-ink text-surface px-1.5 py-0.5 rounded">Eu</span>}
                    </div>
                    <p className="text-[10px] text-muted mt-0.5 truncate">{u.email} · Criado em: {u.joinedAt}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <select
                      value={u.role}
                      disabled={isMe || u.id === "admin-default"}
                      onChange={(e) => updateUserRole(u.id, e.target.value as "admin" | "convidado")}
                      className="px-2.5 py-1 bg-white border border-flat rounded-xl text-[10px] font-bold text-ink outline-none focus:ring-1 focus:ring-ink/20"
                    >
                      <option value="admin">Admin</option>
                      <option value="convidado">Convidado</option>
                    </select>

                    <button
                      onClick={() => {
                        if (confirm(`Excluir permanentemente o usuário "${u.name}"?`)) removeUser(u.id);
                      }}
                      disabled={isMe || u.id === "admin-default"}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Aba 3: Configurações de Inteligência do Sistema */}
      {adminSubTab === "inteligencia" && (
        <div className="space-y-4 animate-fadeIn">
          <p className="text-xs text-muted leading-relaxed">
            Configure as chaves de API, modelos de Inteligência Artificial e parâmetros do Resumo Diário (Briefing da Aia).
          </p>

          <div className="space-y-4">
            {/* Provedor e Chaves */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Bot size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Provedor & Chaves</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Provedor de IA</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => handleAiProviderChange(e.target.value as "openrouter" | "groq")}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  >
                    <option value="openrouter">OpenRouter (Multiprovedores)</option>
                    <option value="groq">Groq Cloud (Llama 3.3 / Rápido)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted flex items-center justify-between">
                    {aiProvider === "groq" ? "Chave Groq API Key" : "Chave OpenRouter API Key"}
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="text-muted hover:text-ink transition"
                    >
                      {showAiKey ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </label>
                  <input
                    type={showAiKey ? "text" : "password"}
                    placeholder={aiProvider === "groq" ? "gsk_..." : "sk-or-v1-..."}
                    value={aiProvider === "groq" ? aiGroqKey : aiApiKey}
                    onChange={(e) => aiProvider === "groq" ? setAiGroqKey(e.target.value) : setAiApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modelos Recomendados */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Settings2 size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Modelos de IA Selecionados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Modelo de Briefing (Rápido)</label>
                  <input
                    list="ai-briefing-models"
                    value={aiModels.system}
                    onChange={(e) => setAiModel("system", e.target.value)}
                    placeholder="vendor/modelo"
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                  <datalist id="ai-briefing-models">
                    {aiProvider === "groq" 
                      ? GROQ_MODELS.map((m) => <option key={m.id} value={m.id} />) 
                      : OPENROUTER_MODELS.map((m) => <option key={m.id} value={m.id} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Modelo do Chat Copilot (Completo)</label>
                  <input
                    list="ai-chat-models"
                    value={aiModels.chat}
                    onChange={(e) => setAiModel("chat", e.target.value)}
                    placeholder="vendor/modelo"
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                  <datalist id="ai-chat-models">
                    {aiProvider === "groq" 
                      ? GROQ_MODELS.map((m) => <option key={m.id} value={m.id} />) 
                      : OPENROUTER_MODELS.map((m) => <option key={m.id} value={m.id} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Configuração de Resumo Diário (Briefing) */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Clock size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Resumo Diário (Briefing da Aia)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted block mb-1 font-semibold">Horário de Geração</label>
                  <select
                    value={briefingHour}
                    onChange={(e) => setBriefingHour(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs font-semibold outline-none text-ink focus:ring-2 focus:ring-ink/10"
                  >
                    {["05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00"].map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted block mb-1 font-semibold">Dados a Incluir no Resumo</label>
                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <label className="flex items-center gap-2 text-xs text-ink font-semibold select-none cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={briefingIncFin} 
                        onChange={(e) => setBriefingIncFin(e.target.checked)} 
                        className="rounded text-ink focus:ring-ink" 
                      />
                      Dados Financeiros do Mês
                    </label>
                    <label className="flex items-center gap-2 text-xs text-ink font-semibold select-none cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={briefingIncRot} 
                        onChange={(e) => setBriefingIncRot(e.target.checked)} 
                        className="rounded text-ink focus:ring-ink" 
                      />
                      Metas de Hábitos e Rotinas
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2 border-t border-ink/5">
            {aiSaved && (
              <span className="text-[10px] text-success font-bold">Configurações de Inteligência salvas!</span>
            )}
            <button
              onClick={handleSaveAiConfig}
              className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-bold hover:opacity-95 transition"
            >
              Salvar Inteligência
            </button>
          </div>
        </div>
      )}

      {/* Sub-Aba 4: Chaves e Integrações de Nuvem */}
      {adminSubTab === "credenciais" && (
        <form onSubmit={handleSaveTools} className="space-y-4 animate-fadeIn">
          <p className="text-xs text-muted leading-relaxed">
            Configure as chaves de API e URLs das ferramentas de infraestrutura (Vercel, Git/Github e Appwrite) para deploys e sincronizações em nuvem.
          </p>

          <div className="space-y-4 pt-1">
            {/* Seção Vercel */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Globe size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Integração Vercel</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">URL do Deploy</label>
                  <input
                    type="url"
                    placeholder="https://seu-projeto.vercel.app"
                    value={vercelUrl}
                    onChange={(e) => setVercelUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted flex items-center justify-between">
                    Token da API Vercel
                    <button
                      type="button"
                      onClick={() => setShowVercelToken(!showVercelToken)}
                      className="text-muted hover:text-ink transition"
                    >
                      {showVercelToken ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </label>
                  <input
                    type={showVercelToken ? "text" : "password"}
                    placeholder="Vercel CLI / Personal Token"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seção GitHub/Git */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Github size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Repositório Git & GitHub</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Repositório Remoto</label>
                  <input
                    type="text"
                    placeholder="usuario/repositorio"
                    value={gitRepo}
                    onChange={(e) => setGitRepo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted flex items-center justify-between">
                    GitHub Personal Access Token (PAT)
                    <button
                      type="button"
                      onClick={() => setShowGitToken(!showGitToken)}
                      className="text-muted hover:text-ink transition"
                    >
                      {showGitToken ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </label>
                  <input
                    type={showGitToken ? "text" : "password"}
                    placeholder="ghp_..."
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seção Appwrite */}
            <div className="bg-surface-2/40 border border-flat rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-flat pb-2">
                <Database size={14} className="text-muted" />
                <span className="text-xs font-bold text-ink">Banco Appwrite Cloud</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Endpoint da API</label>
                  <input
                    type="url"
                    placeholder="https://cloud.appwrite.io/v1"
                    value={appwriteEndpoint}
                    onChange={(e) => setAppwriteEndpoint(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Project ID</label>
                  <input
                    type="text"
                    placeholder="Appwrite project ID"
                    value={appwriteProjectId}
                    onChange={(e) => setAppwriteProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted">Database ID</label>
                  <input
                    type="text"
                    placeholder="Appwrite database ID"
                    value={appwriteDatabaseId}
                    onChange={(e) => setAppwriteDatabaseId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-muted flex items-center justify-between">
                    Admin API Secret Key
                    <button
                      type="button"
                      onClick={() => setShowAppwriteKey(!showAppwriteKey)}
                      className="text-muted hover:text-ink transition"
                    >
                      {showAppwriteKey ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </label>
                  <input
                    type={showAppwriteKey ? "text" : "password"}
                    placeholder="Chave secreta para bypass"
                    value={appwriteApiKey}
                    onChange={(e) => setAppwriteApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-2 border-t border-ink/5">
            {toolsSaved && (
              <span className="text-[10px] text-success font-bold">Configurações salvas!</span>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-bold hover:opacity-95 transition"
            >
              Salvar Credenciais
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const streakDays = useGameStore((s) => s.streakDays);
  const achievements = useGameStore((s) => s.achievements);
  const addXp = useGameStore((s) => s.addXp);
  const tasks = useTaskStore((s) => s.tasks);
  const boards = useTaskStore((s) => s.boards);
  
  const profile = useProfileStore((s) => s.profile);
  const setProfileData = useProfileStore((s) => s.setProfileData);

  const activePerfil = usePerfilStore((s) => s.perfil);
  const [rightTab, setRightTab] = useState<string>("progresso");

  const [isEditing, setIsEditing] = useState(false);
  
  // Inputs de edição
  const [editName, setEditName] = useState(profile.name || "");
  const [editRole, setEditRole] = useState(profile.role || "");
  const [editCompany, setEditCompany] = useState(profile.company || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editInterests, setEditInterests] = useState(profile.interests || "");
  const [editAvatarColor, setEditAvatarColor] = useState(profile.avatarColor || "sunset");

  // Inputs para novas habilidades e objetivos
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [newGoalName, setNewGoalName] = useState("");

  const email = user?.email ?? "";
  const userName = useMemo(() => email.split("@")[0] || "Usuário", [email]);
  const finalName = profile.name || userName;

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completedAt).length,
    [tasks]
  );

  // Cofre do Usuário
  const vaultStatus = useVaultStore((s) => s.status);
  const initVault = useVaultStore((s) => s.initFor);
  const vaultUserId = user?.id ?? "local";

  useEffect(() => {
    if (rightTab === "cofre") {
      initVault(vaultUserId);
    }
  }, [rightTab, vaultUserId, initVault]);

  // Calcula equilíbrio entre Workspace (Profissional) e Lifespace (Pessoal) nos últimos 7 dias
  const focusBalance = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCompleted = tasks.filter((t) => t.completedAt && t.completedAt >= sevenDaysAgo);
    const total = recentCompleted.length;
    
    if (total === 0) return { profPct: 50, personalPct: 50, profCount: 0, personalCount: 0, hasData: false };
    
    const profCount = recentCompleted.filter((t) => getTaskScope(t, boards) === "profissional").length;
    const personalCount = total - profCount;
    const profPct = Math.round((profCount / total) * 100);
    
    return {
      profPct,
      personalPct: 100 - profPct,
      profCount,
      personalCount,
      hasData: true
    };
  }, [tasks, boards]);

  const handleSignOut = () => {
    useAuthStore.getState().signOut();
    router.push("/login");
  };

  const handleSave = () => {
    setProfileData({
      name: editName.trim(),
      role: editRole.trim(),
      company: editCompany.trim(),
      bio: editBio.trim(),
      interests: editInterests.trim(),
      avatarColor: editAvatarColor,
    });
    setIsEditing(false);
  };

  const selectMood = (emoji: string) => {
    setProfileData({ mood: emoji });
    addXp(2, `Check-in de humor do dia: ${emoji}`);
  };

  // Habilidades
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const currentList = profile.skillsList || [];
    if (currentList.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setNewSkillName("");
      return;
    }
    const updated = [...currentList, { name: newSkillName.trim(), level: newSkillLevel }];
    setProfileData({ skillsList: updated });
    setNewSkillName("");
    setNewSkillLevel(3);
    addXp(3, `Adicionou habilidade: ${newSkillName.trim()}`);
  };

  const handleRemoveSkill = (name: string) => {
    const updated = (profile.skillsList || []).filter(s => s.name !== name);
    setProfileData({ skillsList: updated });
  };

  const handleSetSkillLevel = (name: string, level: number) => {
    const updated = (profile.skillsList || []).map(s => s.name === name ? { ...s, level } : s);
    setProfileData({ skillsList: updated });
  };

  // Objetivos rápidos
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    const currentList = profile.goalsList || [];
    const updated: GoalItem[] = [...currentList, { id: `goal-${Date.now()}`, name: newGoalName.trim(), completed: false }];
    setProfileData({ goalsList: updated });
    setNewGoalName("");
    addXp(2, `Criou meta: ${newGoalName.trim()}`);
  };

  const handleRemoveGoal = (id: string) => {
    const updated = (profile.goalsList || []).filter(g => g.id !== id);
    setProfileData({ goalsList: updated });
  };

  const handleToggleGoal = (id: string) => {
    const list = profile.goalsList || [];
    const goal = list.find(g => g.id === id);
    if (!goal) return;
    
    const wasCompleted = goal.completed;
    const updated = list.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    setProfileData({ goalsList: updated });

    if (!wasCompleted) {
      addXp(10, `Completou meta: ${goal.name}`);
    }
  };

  const stats = [
    { label: "XP Total", value: xp, Icon: Zap },
    { label: "Nível atual", value: level, Icon: Star },
    { label: "Streak de dias", value: streakDays, Icon: Flame },
    { label: "Tarefas concluídas", value: completedCount, Icon: CheckSquare },
  ];

  const isAdmin = checkIsAdmin(user?.email);

  const PROFILE_TABS = useMemo(() => {
    const tabs = [
      { id: "progresso", label: "Progresso" },
      { id: "propositos", label: "Propósitos" },
      { id: "conquistas", label: "Conquistas" },
      { id: "cofre", label: "Cofre" },
    ];
    if (isAdmin) {
      tabs.push({ id: "admin", label: "Admin" });
    }
    return tabs;
  }, [isAdmin]);

  return (
    <AppShell>
      <Topbar title="Meu Perfil" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 pb-12 px-4 md:px-0">
        
        {/* Coluna Esquerda: Cartão de Perfil + Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Bloco do Perfil */}
          <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4 text-center relative overflow-hidden">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full grid place-items-center text-3xl font-extrabold text-white shadow-lg transition-all duration-300"
                style={{ background: AVATAR_GRADIENTS[profile.avatarColor || "sunset"] }}
              >
                {finalName ? finalName[0].toUpperCase() : "?"}
              </div>
              <div 
                title={`Humor de hoje: ${MOODS.find(m => m.emoji === profile.mood)?.label || "Produtivo"}`}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-ink/5 shadow-md flex items-center justify-center text-lg animate-bounce duration-[2000ms]"
              >
                {profile.mood || "🚀"}
              </div>
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 mt-2 text-left">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Nome</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    placeholder="Seu Nome"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Cargo</label>
                    <input 
                      type="text" 
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      placeholder="Ex: Engenheiro"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Empresa</label>
                    <input 
                      type="text" 
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      placeholder="Ex: AIA Corp"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Bio</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 resize-none text-ink"
                    placeholder="Fale um pouco sobre você..."
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Interesses</label>
                  <input 
                    type="text" 
                    value={editInterests}
                    onChange={(e) => setEditInterests(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    placeholder="Ex: Tecnologia, Café, Viagens"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1 block">Cor do Avatar</label>
                  <div className="flex gap-2.5 mt-1">
                    {Object.keys(AVATAR_GRADIENTS).map((colorKey) => (
                      <button
                        key={colorKey}
                        onClick={() => setEditAvatarColor(colorKey)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all scale-100",
                          editAvatarColor === colorKey ? "border-ink scale-110 shadow-sm" : "border-transparent hover:scale-105"
                        )}
                        style={{ background: AVATAR_GRADIENTS[colorKey] }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">
                    Salvar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-1.5">
                <p className="text-xl font-extrabold text-ink">{finalName}</p>
                
                {profile.role && (
                  <p className="text-xs font-semibold text-muted">
                    {profile.role} {profile.company && `na ${profile.company}`}
                  </p>
                )}
                <p className="text-[9px] font-mono text-muted/50">{email}</p>

                {profile.bio && (
                  <p className="text-xs text-ink/75 max-w-md mt-2 italic leading-relaxed px-4">
                    "{profile.bio}"
                  </p>
                )}

                {profile.interests && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    {profile.interests.split(",").map(i => i.trim()).filter(Boolean).map(interest => (
                      <span key={interest} className="px-2 py-0.5 rounded-lg bg-ink/5 border border-ink/5 text-[9px] font-semibold text-ink/70">
                        ❤️ {interest}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mood picker */}
                <div className="mt-4 flex flex-col items-center gap-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted">Como você está hoje?</p>
                  <div className="flex gap-2 mt-1">
                    {MOODS.map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        onClick={() => selectMood(emoji)}
                        title={label}
                        className={cn(
                          "text-base p-1.5 rounded-xl hover:bg-ink/5 hover:scale-110 active:scale-95 transition-all",
                          profile.mood === emoji ? "bg-lime/20 border border-lime/30 scale-105" : "bg-transparent border border-transparent"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 size={12} />
                    Editar Perfil
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleSignOut}>
                    <LogOut size={12} />
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map(({ label, value, Icon }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center hover:scale-[1.02] transition-transform">
                <Icon size={16} className="mx-auto mb-1.5 text-muted" />
                <p className="text-xl font-black text-ink">{value}</p>
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Coluna Direita */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Menu Cápsula Deslizante com layoutId */}
          <div className="relative flex items-center bg-surface-2 p-1.5 border border-ink/5 rounded-full self-start select-none shadow-sm">
            {PROFILE_TABS.map((t) => {
              const active = rightTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id)}
                  className={cn(
                    "relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-300",
                    active ? "text-ink" : "text-muted hover:text-ink"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="activePerfilTabPill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-ink/5"
                      style={{ zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Renderização Condicional com base na Aba ativa */}
          {rightTab === "propositos" && (
            <div className="animate-fadeIn">
              <PersonalPurposesWidget />
            </div>
          )}

          {rightTab === "conquistas" && (
            <div className="animate-fadeIn">
              <PerfilConquistasWidget />
            </div>
          )}

          {rightTab === "cofre" && (
            <div className="glass rounded-3xl p-6 border border-ink/5 flex flex-col gap-4 text-left animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-ink/5 pb-3">
                <Lock size={16} className="text-muted" />
                <div>
                  <h2 className="font-bold text-sm text-ink">Cofre de Segurança Privado</h2>
                  <p className="text-[10px] text-muted">Senhas e chaves seguras cifradas localmente em seu navegador.</p>
                </div>
              </div>
              {vaultStatus === "unlocked" ? <VaultList /> : <MasterPasswordGate />}
            </div>
          )}

          {rightTab === "admin" && (
            <AdminProfilePanel />
          )}

          {/* Renderiza Meu Progresso */}
          {rightTab === "progresso" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Equilíbrio Vida / Trabalho */}
              <div className="glass rounded-3xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={15} className="text-muted" />
                    <h2 className="font-bold text-sm text-ink">Equilíbrio Vida / Trabalho</h2>
                  </div>
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Últimos 7 Dias</span>
                </div>

                {focusBalance.hasData ? (
                  <div className="space-y-2 mt-1">
                    <div className="h-3 w-full rounded-full bg-surface-2 flex overflow-hidden border border-ink/5 shadow-inner">
                      <div 
                        className="bg-ink transition-all duration-500" 
                        style={{ width: `${focusBalance.profPct}%` }}
                      />
                      <div 
                        className="bg-lime transition-all duration-500" 
                        style={{ width: `${focusBalance.personalPct}%` }}
                      />
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-[10px] font-semibold gap-1">
                      <div className="flex items-center gap-1.5 text-ink/80">
                        <span className="w-2.5 h-2.5 rounded-md bg-ink inline-block shrink-0" />
                        <span>Workspace (Profissional): {focusBalance.profPct}% ({focusBalance.profCount} tarefas)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink/80">
                        <span className="w-2.5 h-2.5 rounded-md bg-lime inline-block shrink-0" />
                        <span>Lifespace (Pessoal): {focusBalance.personalPct}% ({focusBalance.personalCount} tarefas)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted leading-relaxed mt-0.5">
                    Nenhuma tarefa concluída nos últimos 7 dias. Conclua tarefas nos seus quadros do Workspace ou Lifespace para gerar estatísticas.
                  </p>
                )}
              </div>

              {/* Objetivos & Habilidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Objetivos Rápidos */}
                <div className="glass rounded-3xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={15} className="text-muted" />
                    <h2 className="font-bold text-sm text-ink">Objetivos & Metas Rápidas</h2>
                  </div>

                  <form onSubmit={handleAddGoal} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nova meta (ex: Ler 1 livro)"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                    <button 
                      type="submit" 
                      disabled={!newGoalName.trim()}
                      className="w-8 h-8 rounded-xl bg-ink text-surface flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
                    >
                      <Plus size={14} />
                    </button>
                  </form>

                  <div className="flex flex-col gap-2 mt-1 max-h-[180px] overflow-y-auto pr-1">
                    {(profile.goalsList || []).length === 0 ? (
                      <p className="text-xs text-muted">Nenhuma meta ativa. Defina metas acima!</p>
                    ) : (
                      (profile.goalsList || []).map((goal) => (
                        <div 
                          key={goal.id} 
                          className="flex items-center justify-between bg-surface-1 border border-ink/5 p-2 px-3 rounded-xl hover:shadow-sm transition-all text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleGoal(goal.id)}
                              className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center transition-all",
                                goal.completed ? "bg-lime border-lime text-ink" : "border-ink/20 hover:border-ink/40 bg-white"
                              )}
                            >
                              {goal.completed && <Check size={10} strokeWidth={3} />}
                            </button>
                            <span className={cn(
                              "text-xs truncate transition-all",
                              goal.completed ? "line-through text-muted/65 font-medium" : "text-ink font-semibold"
                            )}>
                              {goal.name}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Habilidades */}
                <div className="glass rounded-3xl p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={15} className="text-muted" />
                    <h2 className="font-bold text-sm text-ink">Habilidades & Skills</h2>
                  </div>

                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Next.js, Design"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-surface-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                    />
                    <div className="flex items-center gap-0.5 px-1 bg-surface-2 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewSkillLevel(star)}
                          className="p-0.5"
                        >
                          <Star 
                            size={11} 
                            className={cn(
                              newSkillLevel >= star ? "text-amber-500 fill-amber-500" : "text-ink/10"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                    <button 
                      type="submit" 
                      disabled={!newSkillName.trim()}
                      className="w-8 h-8 rounded-xl bg-ink text-surface flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </form>

                  <div className="flex flex-col gap-2 mt-1 max-h-[180px] overflow-y-auto pr-1">
                    {(profile.skillsList || []).length === 0 ? (
                      <p className="text-xs text-muted">Nenhuma habilidade cadastrada.</p>
                    ) : (
                      (profile.skillsList || []).map((skill) => (
                        <div 
                          key={skill.name} 
                          className="flex items-center justify-between bg-surface-1 border border-ink/5 p-2 px-3 rounded-xl hover:shadow-sm transition-all text-left"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-ink truncate">{skill.name}</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleSetSkillLevel(skill.name, star)}
                                  className="p-px hover:scale-110 transition-transform"
                                >
                                  <Star 
                                    size={10} 
                                    className={cn(
                                      skill.level >= star ? "text-amber-500 fill-amber-500" : "text-ink/15"
                                    )} 
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Gabinete de Conquistas Rápido */}
              <div className="glass rounded-3xl p-5 flex flex-col gap-4 text-left">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-muted" />
                  <h2 className="font-bold text-sm text-ink">Gabinete de Conquistas (Resumo)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GLOBAL_ACHIEVEMENTS.map((def) => {
                    const unlocked = achievements.find((a) => a.key === def.key);
                    
                    return (
                      <div
                        key={def.key}
                        className={cn(
                          "flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                          unlocked 
                            ? "bg-white hover:shadow-md border-ink/5" 
                            : "bg-surface-2/45 border-dashed border-ink/10 opacity-70 hover:opacity-85"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0",
                          unlocked 
                            ? "bg-lime/20 text-ink border border-lime/25" 
                            : "bg-ink/5 text-muted border border-ink/5"
                        )}>
                          {unlocked ? "🏆" : <Lock size={15} className="text-muted/60" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={cn(
                              "font-bold text-xs truncate",
                              unlocked ? "text-ink" : "text-muted"
                            )}>
                              {def.title}
                            </p>
                            {unlocked && (
                              <span className="w-1.5 h-1.5 rounded-full bg-lime shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted truncate mt-0.5">{def.description}</p>
                          
                          {unlocked?.unlockedAt && (
                            <p className="text-[8px] text-muted/65 font-medium mt-1">
                              Desbloqueado em {new Date(unlocked.unlockedAt).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </AppShell>
  );
}
