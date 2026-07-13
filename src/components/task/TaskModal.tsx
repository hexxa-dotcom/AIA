"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Flag, Tag, Trash2, ChevronDown, Target, DollarSign, Repeat, User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SubtaskList } from "./SubtaskList";
import { TaskTimer } from "./TaskTimer";
import { ReminderConfig } from "./ReminderConfig";
import { AssigneeSelect } from "@/components/team/AssigneeSelect";
import { TaskCollaborators } from "./TaskCollaborators";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { isSupabaseEnabled } from "@/lib/supabase";
import { logActivity } from "@/lib/team/activity";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { fireConfetti, fireLevelUp } from "@/components/gamification/ConfettiBurst";
import { XP_REWARDS } from "@/lib/xp";
import type { Priority, Recurrence, RecurrenceType } from "@/lib/types";

export function TaskModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const task = useTaskStore((s) => (taskId ? s.tasks.find((t) => t.id === taskId) : null));
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const completeTask = useTaskStore((s) => s.completeTask);
  const reopenTask = useTaskStore((s) => s.reopenTask);
  const addXp = useGameStore((s) => s.addXp);
  const registerActivity = useGameStore((s) => s.registerActivity);
  const setFocused = useTaskStore((s) => s.setFocused);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tab, setTab] = useState<"details" | "activity">("details");
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(undefined);
  const [clientType, setClientType] = useState<"pessoal" | "cliente" | undefined>(undefined);
  const [clientName, setClientName] = useState("");

  const [dueDate, setDueDate] = useState<number | undefined>(task?.dueDate);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setRecurrence(task.recurrence);
      setClientType(task.clientType);
      setClientName(task.clientName ?? "");
      setDueDate(task.dueDate);
      setPriority(task.priority);
    }
  }, [task?.id]); // eslint-disable-line

  if (!taskId || !task) return null;

  function handleSave() {
    const newTitle = title.trim() || task!.title;
    const renamed = newTitle !== task!.title;
    updateTask(task!.id, { 
      title: newTitle, 
      description, 
      recurrence,
      clientType,
      clientName: clientType === "cliente" ? clientName : undefined,
      dueDate,
      priority
    });
    if (renamed) logActivity(task!.id, "renamed", { title: newTitle });
    if (priority !== task!.priority) logActivity(task!.id, "priority_changed", { to: priority });
    if (dueDate !== task!.dueDate) logActivity(task!.id, "due_changed", { to: dueDate });
    
    onClose(); // Close modal after saving
  }

  function handleComplete() {
    if (task!.column === "done") {
      reopenTask(task!.id);
      logActivity(task!.id, "reopened");
    } else {
      completeTask(task!.id);
      logActivity(task!.id, "completed");
      registerActivity();
      const { leveledUp } = addXp(XP_REWARDS.taskDone, `Tarefa concluída: ${task!.title}`);
      fireConfetti("medium");
      if (leveledUp) setTimeout(() => fireLevelUp(), 400);
    }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (!t) return;
    if (task!.tags.includes(t)) return;
    updateTask(task!.id, { tags: [...task!.tags, t] });
    setTagInput("");
  }

  function removeTag(t: string) {
    updateTask(task!.id, { tags: task!.tags.filter((x) => x !== t) });
  }

  const dueDateValue = dueDate ? new Date(dueDate).toISOString().slice(0, 16) : "";

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      {/* We increase max width here directly or use a custom class */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-surface">
        
        {/* Header Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-black font-serif border-0 p-0 focus:ring-0 bg-transparent text-ink placeholder-muted/30"
              placeholder="Título da tarefa..."
            />
          </DialogTitle>

          {isSupabaseEnabled() && (
            <div className="mt-4 flex gap-1 border-b border-ink/5 -mx-2 px-2">
              {(["details", "activity"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-4 py-2.5 -mb-px border-b-2 transition uppercase tracking-widest font-bold ${
                    tab === t
                      ? "border-ink text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t === "details" ? "Detalhes" : "Atividade"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-10">
            {/* Left Column (Main Details) */}
            <div className="space-y-8">
              {tab === "details" ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2 block">
                      Descrição e Anotações
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="bg-surface-2/50 border-ink/5 resize-none focus:bg-surface focus:border-ink/20 transition rounded-2xl"
                      placeholder="Adicione contexto, links, anotações..."
                    />
                  </div>

                  <SubtaskList taskId={task.id} />
                  
                  <div className="pt-4 border-t border-ink/5">
                    <TaskTimer taskId={task.id} />
                  </div>
                  
                  <HourlyRateBlock task={task} updateTask={updateTask} />
                  <ReminderConfig taskId={task.id} dueDate={dueDate} />
                </>
              ) : (
                <ActivityFeed taskId={task.id} />
              )}
            </div>

            {/* Right Column (Properties Sidebar) */}
            <aside className="space-y-6">
              
              <div className="flex gap-2">
                <Button
                  variant={task.column === "done" ? "light" : "primary"}
                  onClick={handleComplete}
                  className="flex-1 text-xs py-2 h-auto"
                >
                  {task.column === "done" ? "Reabrir" : "Concluir Tarefa"}
                </Button>
                {task.column !== "done" && (
                  <Button
                    variant="dark"
                    className="flex-1 text-xs py-2 h-auto"
                    onClick={() => {
                      setFocused(task.id);
                      onClose();
                      router.push("/foco");
                    }}
                  >
                    <Target size={14} className="mr-1" />
                    Focar
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <PropertyRow icon={<User size={13} />} label="Tipo de Tarefa">
                  <div className="flex flex-col gap-2">
                    <select 
                      value={clientType || ""} 
                      onChange={(e) => setClientType((e.target.value as any) || undefined)}
                      className="text-xs bg-surface-2/50 hover:bg-surface-2 rounded-xl px-3 py-2 outline-none w-full border border-ink/5 font-semibold transition"
                    >
                      <option value="">Não definido</option>
                      <option value="pessoal">Pessoal</option>
                      <option value="cliente">Cliente (Específico)</option>
                    </select>
                    {clientType === "cliente" && (
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nome do cliente..."
                        className="text-xs bg-surface-2/50 hover:bg-surface-2 focus:bg-surface rounded-xl px-3 py-2 outline-none w-full border border-ink/5 transition"
                      />
                    )}
                  </div>
                </PropertyRow>

                <PropertyRow icon={<Flag size={13} />} label="Prioridade">
                  <PrioritySelect
                    value={priority}
                    onChange={setPriority}
                  />
                </PropertyRow>

                <PropertyRow icon={<Calendar size={13} />} label="Prazo">
                  <input
                    type="datetime-local"
                    value={dueDateValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDueDate(v ? new Date(v).getTime() : undefined);
                    }}
                    className="text-xs bg-surface-2/50 hover:bg-surface-2 rounded-xl px-3 py-2 outline-none w-full border border-ink/5 font-semibold transition"
                  />
                </PropertyRow>

                <PropertyRow icon={<Repeat size={13} />} label="Repetição">
                  <select
                    value={recurrence?.type || ""}
                    onChange={(e) => {
                      const val = e.target.value as RecurrenceType | "";
                      setRecurrence(val ? { type: val } : undefined);
                    }}
                    className="text-xs bg-surface-2/50 hover:bg-surface-2 rounded-xl px-3 py-2 outline-none w-full border border-ink/5 font-semibold transition"
                  >
                    <option value="">Não repetir</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </PropertyRow>

                <PropertyRow icon={<Tag size={13} />} label="Tags">
                  <div className="flex flex-col gap-2">
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {task.tags.map((t) => (
                          <button
                            key={t}
                            onClick={() => removeTag(t)}
                            className="text-[10px] bg-ink/5 text-ink px-2 py-0.5 rounded-md hover:bg-danger hover:text-white transition group flex items-center gap-1 font-semibold"
                          >
                            #{t}
                            <span className="opacity-0 group-hover:opacity-100 scale-75">×</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Adicionar tag..."
                      className="text-xs bg-transparent border-b border-ink/10 pb-1 outline-none w-full placeholder:text-muted/50"
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      onBlur={addTag}
                    />
                  </div>
                </PropertyRow>
              </div>

              {isSupabaseEnabled() && <AssigneeSelect taskId={task.id} />}
              <TaskCollaborators task={task} />
            </aside>
          </div>
        </div>

        {/* Fixed Footer for Save Action */}
        <div className="flex items-center justify-between p-4 border-t border-ink/5 bg-surface-2/30">
          <button
            onClick={() => {
              deleteTask(task.id);
              onClose();
            }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-danger hover:bg-danger/10 px-4 py-2 rounded-full transition"
          >
            <Trash2 size={14} />
            Excluir Tarefa
          </button>

          <div className="flex items-center gap-2">
            <Button variant="light" onClick={onClose} className="px-6 py-2 text-xs">
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} className="px-6 py-2 text-xs font-bold shadow-sm">
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-ink/5 pb-3 last:border-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted">
        {icon}
        {label}
      </div>
      <div className="pl-0">{children}</div>
    </div>
  );
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Baixa", color: "#c0c0be" },
  { value: "medium", label: "Média", color: "#8c8c88" },
  { value: "high", label: "Alta", color: "#4a4a48" },
  { value: "urgent", label: "Urgente", color: "#141414" },
];

function HourlyRateBlock({
  task,
  updateTask,
}: {
  task: { id: string; totalTimeSec: number; hourlyRate?: number };
  updateTask: (id: string, patch: Record<string, unknown>) => void;
}) {
  const hours = task.totalTimeSec / 3600;
  const rate = task.hourlyRate ?? 0;
  const total = hours * rate;

  function fmt(v: number) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function fmtHours(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h === 0 && m === 0) return "0min";
    if (h === 0) return `${m}min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: "rgba(0,0,0,0.048)",
      border: "0.5px solid rgba(0,0,0,0.09)",
    }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b"
        style={{ borderColor: "rgba(0,0,0,0.09)" }}>
        <DollarSign size={13} className="text-muted" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted">
          Valor da tarefa
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Valor/hora input */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted shrink-0">R$/hora</span>
          <input
            type="number"
            min={0}
            step={10}
            value={rate || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              updateTask(task.id, { hourlyRate: isNaN(v) ? undefined : v });
            }}
            placeholder="0,00"
            className="flex-1 text-sm font-semibold bg-white/60 rounded-xl px-3 py-1.5 outline-none border focus:border-lime/60 text-right tabular-nums"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          />
        </div>

        {/* Resultado */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.60)" }}>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted">Tempo registrado</span>
            <span className="text-sm font-semibold tabular-nums">{fmtHours(task.totalTimeSec)}</span>
          </div>
          <div className="text-muted text-sm">×</div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted">Valor/hora</span>
            <span className="text-sm font-semibold tabular-nums">{fmt(rate)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: "rgba(14,11,12,0.88)" }}>
          <span className="text-xs font-semibold text-white/70">Valor total</span>
          <span className="text-lg font-bold tabular-nums" style={{ color: "#f5f5f3" }}>
            {fmt(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

const RECURRENCE_OPTIONS: { value: RecurrenceType | undefined; label: string }[] = [
  { value: undefined, label: "Não repetir" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function RecurrenceSelect({
  recurrence,
  onTypeChange,
  onToggleDay,
}: {
  recurrence: Recurrence | undefined;
  onTypeChange: (type: RecurrenceType | undefined) => void;
  onToggleDay: (day: number) => void;
}) {
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {RECURRENCE_OPTIONS.map((opt) => {
          const isActive =
            recurrence?.type === opt.value || (!recurrence && opt.value === undefined);
          return (
            <button
              key={opt.label}
              onClick={() => onTypeChange(opt.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition"
              style={
                isActive
                  ? { background: "#141414", color: "#f5f5f3" }
                  : { background: "rgba(14,11,12,0.06)", color: "rgba(14,11,12,0.55)" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {recurrence?.type === "weekly" && (
        <div className="flex gap-1.5 mt-2">
          {DAY_LABELS.map((day, i) => (
            <button
              key={i}
              onClick={() => onToggleDay(i)}
              className="w-8 h-8 rounded-full text-[10px] font-bold transition"
              style={
                (recurrence.daysOfWeek ?? []).includes(i)
                  ? { background: "#1a1a1a", color: "#fafafa" }
                  : { background: "rgba(14,11,12,0.06)", color: "rgba(14,11,12,0.40)" }
              }
            >
              {day[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const [open, setOpen] = useState(false);
  const current = PRIORITIES.find((p) => p.value === value)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: current.color }} />
          {current.label}
        </span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 glass rounded-xl p-1 z-10 w-full shadow-lg">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-surface-2 text-sm"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
