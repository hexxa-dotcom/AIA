"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useWorkoutStore } from "@/store/useWorkoutStore";
import { useStudiesStore } from "@/store/useStudiesStore";
import type { RoutineBlock, RoutineRecurrence, ActivityType } from "@/lib/types";
import { minutesToTime, timeToMinutes } from "@/lib/utils";
import { BookOpen, Dumbbell, Calendar, Coffee, Sparkles, GraduationCap } from "lucide-react";

const COLORS = [
  "#ffffff",
  "#f0f0ee",
  "#e0e0de",
  "#d0d0ce",
  "#bcbcba",
  "#a8a8a6",
  "#909090",
];

const RECURRENCES: { value: RoutineRecurrence; label: string }[] = [
  { value: "daily", label: "Todos os dias" },
  { value: "weekdays", label: "Dias úteis (seg-sex)" },
  { value: "weekends", label: "Fim de semana" },
  { value: "weekly", label: "Dias específicos" },
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
  { type: "custom", label: "Geral", icon: <Sparkles size={14} /> },
  { type: "workout", label: "Treino", icon: <Dumbbell size={14} /> },
  { type: "reading", label: "Leitura", icon: <BookOpen size={14} /> },
  { type: "study", label: "Estudo", icon: <GraduationCap size={14} /> },
  { type: "meeting", label: "Reunião", icon: <Calendar size={14} /> },
  { type: "break", label: "Pausa", icon: <Coffee size={14} /> },
];

export function RoutineEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: RoutineBlock | null;
}) {
  const addBlock = useRoutineStore((s) => s.addBlock);
  const updateBlock = useRoutineStore((s) => s.updateBlock);

  // External Stores
  const workoutPlans = useWorkoutStore((s) => s.plans);
  const addWorkoutPlan = useWorkoutStore((s) => s.addPlan);
  const studyItems = useStudiesStore((s) => s.items);

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [recurrence, setRecurrence] = useState<RoutineRecurrence>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [flexible, setFlexible] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("custom");
  const [linkedId, setLinkedId] = useState<string>("");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setEmoji(editing.emoji ?? "");
      setStart(minutesToTime(editing.startMinute));
      setEnd(minutesToTime(editing.endMinute));
      setRecurrence(editing.recurrence);
      setWeekdays(editing.weekdays ?? []);
      setColor(editing.color);
      setFlexible(editing.isFlexible);
      setActivityType(editing.activityType ?? "custom");
      setLinkedId(editing.linkedId ?? "");
    } else if (open) {
      setTitle("");
      setEmoji("");
      setStart("08:00");
      setEnd("09:00");
      setRecurrence("daily");
      setWeekdays([]);
      setColor(COLORS[0]);
      setFlexible(false);
      setActivityType("custom");
      setLinkedId("");
    }
  }, [editing, open]);

  // Preenchimento Automático
  useEffect(() => {
    if (!editing && title === "") {
      const selectedType = ACTIVITY_TYPES.find(t => t.type === activityType);
      if (selectedType && activityType !== "custom") {
        setTitle(selectedType.label);
      }
    }
  }, [activityType]);


  function handleSave() {
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      emoji: emoji.trim() || undefined,
      startMinute: timeToMinutes(start),
      endMinute: timeToMinutes(end),
      recurrence,
      weekdays: recurrence === "weekly" ? weekdays : undefined,
      color,
      isFlexible: flexible,
      activityType,
      linkedId: linkedId || undefined,
    };
    if (editing) updateBlock(editing.id, data);
    else addBlock(data);
    onClose();
  }

  function handleCreateWorkout() {
    const name = prompt("Nome do novo treino (ex: Treino A - Peito):");
    if (name) {
      addWorkoutPlan({ title: name });
      // Idealmente, deveríamos pegar o ID gerado, mas para simplificar:
      // O usuário seleciona no dropdown em seguida.
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <DialogTitle>
            {editing ? "Editar Atividade" : "Nova Atividade"}
          </DialogTitle>
          
          <div className="space-y-5 mt-5">
            {/* Seletor de Tipo */}
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-2">
                Tipo de Atividade
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => {
                      setActivityType(t.type);
                      setLinkedId(""); // reset link
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition ${
                      activityType === t.type
                        ? "bg-ink text-surface border-ink"
                        : "bg-surface text-muted border-ink/10 hover:bg-surface-2"
                    }`}
                  >
                    {t.icon}
                    <span className="text-[10px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Contexto Específico */}
            {activityType === "workout" && (
              <div className="p-3 bg-surface-2 rounded-xl border border-ink/5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                  Vincular Treino
                </label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-surface border border-ink/10 rounded-lg text-sm px-2 outline-none text-ink"
                    value={linkedId}
                    onChange={(e) => setLinkedId(e.target.value)}
                  >
                    <option value="">Selecione um treino...</option>
                    {workoutPlans.map(w => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                  <Button variant="light" onClick={handleCreateWorkout} className="text-xs px-2 py-1 h-auto">
                    + Novo
                  </Button>
                </div>
              </div>
            )}

            {(activityType === "reading" || activityType === "study") && (
              <div className="p-3 bg-surface-2 rounded-xl border border-ink/5">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                  Vincular Livro / Curso
                </label>
                <select 
                  className="w-full bg-surface border border-ink/10 rounded-lg text-sm px-2 py-1.5 outline-none text-ink"
                  value={linkedId}
                  onChange={(e) => setLinkedId(e.target.value)}
                >
                  <option value="">Nenhum vínculo (Livre)</option>
                  {studyItems.filter(i => activityType === 'reading' ? i.type === 'book' : i.type === 'course').map(i => (
                    <option key={i.id} value={i.id}>{i.title}</option>
                  ))}
                </select>
                <p className="text-[9px] text-muted mt-1">Vá na seção de Estudos para gerenciar sua biblioteca.</p>
              </div>
            )}

            {/* Campos Padrões */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                  Título
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do bloco..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                    Início
                  </label>
                  <Input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                    Fim
                  </label>
                  <Input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                  Recorrência
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RECURRENCES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRecurrence(r.value)}
                      className={`text-xs py-2 rounded-xl border transition ${
                        recurrence === r.value
                          ? "bg-ink text-surface border-ink"
                          : "border-ink/10 hover:bg-surface-2"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {recurrence === "weekly" && (
                  <div className="flex gap-1 mt-2">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setWeekdays((w) =>
                            w.includes(i)
                              ? w.filter((x) => x !== i)
                              : [...w, i].sort(),
                          )
                        }
                        className={`flex-1 text-[10px] py-1.5 rounded-lg transition ${
                          weekdays.includes(i)
                            ? "bg-ink text-surface"
                            : "bg-surface-2 hover:bg-black/5"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                  Cor
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border border-ink/10 transition ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={flexible}
                  onChange={(e) => setFlexible(e.target.checked)}
                />
                Bloco flexível (pode mover dentro do dia)
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="light" className="flex-1">
                  Cancelar
                </Button>
              </DialogClose>
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
