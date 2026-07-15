"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Flag, Tag, Trash2, ChevronDown, Target, Repeat, User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ReminderConfig } from "./ReminderConfig";
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
    <Dialog open={!!taskId} onOpenChange={(open) => !open && handleSave()}>
      <DialogContent size="lg" className="w-[95vw] sm:w-[600px] h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-surface">
        
        {/* Header Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 custom-scrollbar space-y-5">
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl sm:text-2xl font-black font-serif border-0 p-0 focus:ring-0 bg-transparent text-ink placeholder-muted/30"
              placeholder="Título da tarefa..."
            />
          </DialogTitle>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted mb-1 block">
              Descrição e Anotações
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-surface-2/50 border-ink/5 resize-none focus:bg-surface focus:border-ink/20 transition rounded-xl"
              placeholder="Adicione contexto, links, anotações..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="text-[10px] bg-surface-2/50 hover:bg-surface-2 rounded-lg px-2 py-1.5 outline-none w-full border border-ink/5 font-semibold transition -ml-1"
              />
            </PropertyRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PropertyRow icon={<Repeat size={13} />} label="Repetição">
              <select
                value={recurrence?.type || ""}
                onChange={(e) => {
                  const val = e.target.value as RecurrenceType | "";
                  setRecurrence(val ? { type: val } : undefined);
                }}
                className="text-[11px] bg-surface-2/50 hover:bg-surface-2 rounded-lg px-2 py-1.5 outline-none w-full border border-ink/5 font-semibold transition"
              >
                <option value="">Não repetir</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </PropertyRow>

            <PropertyRow icon={<Tag size={13} />} label="Tags">
              <div className="flex flex-col gap-1.5">
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {task.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => removeTag(t)}
                        className="text-[9px] bg-ink/5 text-ink px-1.5 py-0.5 rounded hover:bg-danger hover:text-white transition group flex items-center gap-1 font-semibold"
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
                  className="text-[11px] bg-transparent border-b border-ink/10 pb-0.5 outline-none w-full placeholder:text-muted/50"
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  onBlur={addTag}
                />
              </div>
            </PropertyRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PropertyRow icon={<User size={13} />} label="Contexto (Opcional)">
              <div className="flex flex-col gap-1.5">
                <select
                  value={clientType || ""}
                  onChange={(e) => setClientType(e.target.value as any || undefined)}
                  className="text-[11px] bg-surface-2/50 hover:bg-surface-2 rounded-lg px-2 py-1.5 outline-none w-full border border-ink/5 font-semibold transition"
                >
                  <option value="">Geral</option>
                  <option value="pessoal">Pessoal</option>
                  <option value="cliente">Profissional / Cliente</option>
                </select>
                {clientType === "cliente" && (
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nome do cliente (opcional)"
                    className="text-[11px] bg-transparent border-b border-ink/10 pb-0.5 outline-none w-full placeholder:text-muted/50 mt-1"
                  />
                )}
              </div>
            </PropertyRow>
          </div>

          <ReminderConfig taskId={task.id} dueDate={dueDate} />

        </div>

        {/* Fixed Footer for Save Action */}
        <div className="flex items-center justify-between p-4 border-t border-ink/5 bg-surface-2/30">
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteTask(task.id);
                onClose();
              }}
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-danger hover:bg-danger/10 px-3 py-2 rounded-full transition"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
            <Button
              variant={task.column === "done" ? "light" : "primary"}
              className="text-[11px] py-1.5 h-auto rounded-full px-4"
              onClick={handleComplete}
            >
              {task.column === "done" ? "Reabrir" : "Concluir"}
            </Button>
            {task.column !== "done" && (
              <Button
                variant="dark"
                className="text-[11px] py-1.5 h-auto rounded-full px-4"
                onClick={() => {
                  setFocused(task.id);
                  onClose();
                  router.push("/foco");
                }}
              >
                <Target size={12} className="mr-1" />
                Focar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={handleSave} className="px-6 py-2 text-xs font-bold shadow-sm">
              Salvar
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
