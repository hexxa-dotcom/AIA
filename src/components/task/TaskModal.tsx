"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Flag, Tag, Trash2, ChevronDown, Target, DollarSign, Repeat } from "lucide-react";
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

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setRecurrence(task.recurrence);
    }
  }, [task?.id]); // eslint-disable-line

  if (!taskId || !task) return null;

  function save() {
    const newTitle = title.trim() || task!.title;
    const renamed = newTitle !== task!.title;
    updateTask(task!.id, { title: newTitle, description, recurrence });
    if (renamed) logActivity(task!.id, "renamed", { title: newTitle });
  }

  function handleRecurrenceChange(type: RecurrenceType | undefined) {
    if (!type) {
      setRecurrence(undefined);
      updateTask(task!.id, { recurrence: undefined });
    } else {
      const next: Recurrence = { type };
      setRecurrence(next);
      updateTask(task!.id, { recurrence: next });
    }
  }

  function toggleDay(day: number) {
    if (!recurrence || recurrence.type !== "weekly") return;
    const days = recurrence.daysOfWeek ?? [];
    const next: Recurrence = {
      ...recurrence,
      daysOfWeek: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    };
    setRecurrence(next);
    updateTask(task!.id, { recurrence: next });
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

  const dueDateValue = task.dueDate
    ? new Date(task.dueDate).toISOString().slice(0, 16)
    : "";

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <div className="p-6 overflow-y-auto">
          <DialogTitle>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              className="text-xl font-bold border-0 p-0 focus:ring-0 bg-transparent"
            />
          </DialogTitle>

          {isSupabaseEnabled() && (
            <div className="mt-3 flex gap-1 border-b border-ink/5 -mx-1 px-1">
              {(["details", "activity"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-2 -mb-px border-b-2 transition ${
                    tab === t
                      ? "border-ink font-semibold text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t === "details" ? "Detalhes" : "Atividade"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
            <div className="space-y-5">
              {tab === "details" ? (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-muted mb-1 block">
                      Descrição
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={save}
                      rows={4}
                      placeholder="Adicione contexto, links, anotações..."
                    />
                  </div>

                  <SubtaskList taskId={task.id} />
                  <TaskTimer taskId={task.id} />
                  <HourlyRateBlock task={task} updateTask={updateTask} />
                  <ReminderConfig taskId={task.id} dueDate={task.dueDate} />
                </>
              ) : (
                <ActivityFeed taskId={task.id} />
              )}
            </div>

            <aside className="space-y-3">
              <Button
                variant={task.column === "done" ? "light" : "primary"}
                onClick={handleComplete}
                className="w-full"
              >
                {task.column === "done" ? "Reabrir tarefa" : "Concluir tarefa"}
              </Button>

              {task.column !== "done" && (
                <Button
                  variant="dark"
                  className="w-full"
                  onClick={() => {
                    setFocused(task.id);
                    onClose();
                    router.push("/foco");
                  }}
                >
                  <Target size={14} />
                  Focar nesta tarefa
                </Button>
              )}

              <PropertyRow icon={<Flag size={13} />} label="Prioridade">
                <PrioritySelect
                  value={task.priority}
                  onChange={(p) => {
                    updateTask(task.id, { priority: p });
                    logActivity(task.id, "priority_changed", { to: p });
                  }}
                />
              </PropertyRow>

              <PropertyRow icon={<Calendar size={13} />} label="Prazo">
                <input
                  type="datetime-local"
                  value={dueDateValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    const newDue = v ? new Date(v).getTime() : undefined;
                    updateTask(task.id, { dueDate: newDue });
                    logActivity(task.id, "due_changed", { to: newDue });
                  }}
                  className="text-xs bg-transparent outline-none w-full"
                />
              </PropertyRow>

              <PropertyRow icon={<Repeat size={13} />} label="Repetir">
                <RecurrenceSelect
                  recurrence={recurrence}
                  onTypeChange={handleRecurrenceChange}
                  onToggleDay={toggleDay}
                />
              </PropertyRow>

              {isSupabaseEnabled() && <AssigneeSelect taskId={task.id} />}

              <TaskCollaborators task={task} />

              <PropertyRow icon={<Tag size={13} />} label="Tags">
                <div className="flex flex-wrap gap-1 mb-1">
                  {task.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => removeTag(t)}
                      className="text-[10px] bg-sage/40 px-2 py-0.5 rounded-full hover:bg-danger hover:text-white transition"
                    >
                      #{t} ×
                    </button>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="adicionar tag"
                  className="text-xs bg-transparent outline-none w-full"
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  onBlur={addTag}
                />
              </PropertyRow>

              <div className="pt-2">
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs text-danger hover:bg-danger/10 py-2 rounded-full transition"
                >
                  <Trash2 size={12} />
                  Excluir tarefa
                </button>
              </div>
            </aside>
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
    <div className="bg-surface-2 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">
        {icon}
        {label}
      </div>
      {children}
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
