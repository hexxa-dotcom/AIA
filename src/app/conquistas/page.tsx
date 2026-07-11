"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useGameStore } from "@/store/useGameStore";
import {
  useGoalsStore,
  type PersonalGoal,
  type GoalCategory,
} from "@/store/useGoalsStore";
import {
  Trophy,
  Target,
  Plus,
  X,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Circle,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ACHIEVEMENTS = [
  {
    id: "first-task",
    icon: "",
    title: "Primeira tarefa",
    desc: "Completou sua primeira tarefa",
    xp: 10,
  },
  {
    id: "streak-7",
    icon: "",
    title: "Semana perfeita",
    desc: "7 dias de streak seguidos",
    xp: 50,
  },
  {
    id: "streak-30",
    icon: "",
    title: "Mês dedicado",
    desc: "30 dias de streak",
    xp: 200,
  },
  {
    id: "level-5",
    icon: "",
    title: "Nível 5",
    desc: "Chegou ao nível 5",
    xp: 100,
  },
  {
    id: "level-10",
    icon: "",
    title: "Nível 10",
    desc: "Chegou ao nível 10",
    xp: 300,
  },
  {
    id: "tasks-10",
    icon: "",
    title: "Produtivo",
    desc: "10 tarefas concluídas",
    xp: 30,
  },
  {
    id: "tasks-50",
    icon: "",
    title: "Imparável",
    desc: "50 tarefas concluídas",
    xp: 150,
  },
  {
    id: "tasks-100",
    icon: "",
    title: "Centenário",
    desc: "100 tarefas concluídas",
    xp: 500,
  },
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
    <div
      className={cn(
        "glass rounded-3xl overflow-hidden",
        goal.status === "concluido" && "opacity-60",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              updateGoal(goal.id, {
                status: goal.status === "concluido" ? "ativo" : "concluido",
                completedAt:
                  goal.status !== "concluido" ? Date.now() : undefined,
                progress: goal.status !== "concluido" ? 100 : goal.progress,
              })
            }
            className="shrink-0 mt-0.5"
          >
            {goal.status === "concluido" ? (
              <CheckCircle2 size={18} className="text-success" />
            ) : (
              <Circle
                size={18}
                className="text-muted/30 hover:text-success transition"
              />
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
                  e.key === "Enter" &&
                  (updateGoal(goal.id, { title: editTitle }), setEditing(false))
                }
                autoFocus
                className="w-full text-sm font-bold bg-surface-2 rounded-lg px-2 py-0.5 outline-none"
              />
            ) : (
              <p
                className={cn(
                  "text-sm font-bold leading-snug",
                  goal.status === "concluido" && "line-through text-muted",
                )}
              >
                {goal.title}
              </p>
            )}
            {goal.description && (
              <p className="text-xs text-muted mt-0.5 line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                CATEGORY_COLORS[goal.category],
              )}
            >
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
          <span className="text-[11px] font-bold text-muted shrink-0">
            {goal.progress}%
          </span>
          {daysLeft !== null && (
            <span
              className={cn(
                "text-[11px] shrink-0 flex items-center gap-1",
                daysLeft < 0
                  ? "text-danger"
                  : daysLeft <= 7
                    ? "text-warning"
                    : "text-muted",
              )}
            >
              <Flag size={10} />
              {daysLeft < 0
                ? `${Math.abs(daysLeft)}d atraso`
                : `${daysLeft}d restantes`}
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
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-2">
              Etapas
            </p>
            {goal.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleMilestone(goal.id, m.id)}
                  className="shrink-0"
                >
                  {m.done ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : (
                    <Circle
                      size={14}
                      className="text-muted/30 hover:text-success transition"
                    />
                  )}
                </button>
                <span
                  className={cn(
                    "text-sm flex-1",
                    m.done && "line-through text-muted",
                  )}
                >
                  {m.title}
                </span>
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
                className="flex-1 text-sm px-3 py-1.5 rounded-xl bg-surface-2 outline-none"
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
                  onChange={(e) =>
                    updateGoal(goal.id, { progress: Number(e.target.value) })
                  }
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
      <div className="glass rounded-3xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Nova meta</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 transition"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">
              Título
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Ex: Aprender inglês fluente"
              className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">
              Descrição (opcional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Por que essa meta é importante…"
              className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none resize-none focus:ring-2 focus:ring-ink/15"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">
                Prazo (opcional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-ink/15 text-sm font-semibold hover:bg-surface-2 transition"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!title.trim()}
            className="flex-1 py-3 rounded-2xl bg-ink text-lime text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check size={14} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConquistasPage() {
  const { level, xp, streakDays } = useGameStore();
  const goals = useGoalsStore((s) => s.goals);
  const [tab, setTab] = useState<"metas" | "conquistas">("metas");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"todos" | "ativo" | "concluido">(
    "todos",
  );

  const filtered = goals.filter(
    (g) => filter === "todos" || g.status === filter,
  );
  const activeCount = goals.filter((g) => g.status === "ativo").length;
  const doneCount = goals.filter((g) => g.status === "concluido").length;

  const unlockedIds = new Set([
    ...(xp >= 10 ? ["first-task"] : []),
    ...(streakDays >= 7 ? ["streak-7"] : []),
    ...(streakDays >= 30 ? ["streak-30"] : []),
    ...(level >= 5 ? ["level-5"] : []),
    ...(level >= 10 ? ["level-10"] : []),
  ]);

  return (
    <AppShell>
      <Topbar
        title="Conquistas & Metas"
        subtitle="Seu progresso e objetivos pessoais"
      />

      <div className="flex gap-1 mb-4 bg-white rounded-full p-1.5 w-fit shadow-sm mt-2">
        {[
          { id: "metas", label: "Minhas Metas", icon: <Target size={14} /> },
          { id: "conquistas", label: "Conquistas", icon: <Trophy size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
              tab === t.id
                ? "bg-ink text-surface"
                : "text-muted hover:text-ink",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "metas" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Ativas", value: activeCount, color: "text-ink" },
              { label: "Concluídas", value: doneCount, color: "text-success" },
              { label: "Total", value: goals.length, color: "text-muted" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-3xl p-4 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
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
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition",
                    filter === f
                      ? "bg-ink text-lime"
                      : "glass text-muted hover:bg-ink/5",
                  )}
                >
                  {f === "todos"
                    ? "Todos"
                    : f === "ativo"
                      ? "Ativas"
                      : "Concluídas"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-ink text-lime text-sm font-semibold hover:opacity-90 transition"
            >
              <Plus size={14} />
              Nova meta
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center text-muted">
              <Target size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">Nenhuma meta ainda</p>
              <p className="text-xs mt-1">Clique em"Nova meta"para começar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((g) => (
                <GoalCard key={g.id} goal={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "conquistas" && (
        <div className="space-y-3">
          <div className="glass rounded-3xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ink text-lime grid place-items-center text-2xl font-bold shrink-0">
              {level}
            </div>
            <div>
              <p className="font-bold">Nível {level}</p>
              <p className="text-xs text-muted">
                {xp} XP total · {streakDays} dias de streak
              </p>
              <p className="text-xs text-muted mt-0.5">
                {unlockedIds.size} de {ACHIEVEMENTS.length} conquistas
                desbloqueadas
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedIds.has(a.id);
              return (
                <div
                  key={a.id}
                  className={cn(
                    "glass rounded-3xl p-4 flex items-start gap-3",
                    !unlocked && "opacity-40 grayscale",
                  )}
                >
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{a.title}</p>
                    <p className="text-xs text-muted">{a.desc}</p>
                    <p className="text-[10px] text-muted mt-1">+{a.xp} XP</p>
                  </div>
                  {unlocked && (
                    <Check size={14} className="text-success shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} />}
    </AppShell>
  );
}
