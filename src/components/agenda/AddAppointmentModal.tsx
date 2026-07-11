"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useAgendaStore, type AppointmentType } from "@/store/useAgendaStore";
import { Button } from "@/components/ui/Button";

const TYPES: { value: AppointmentType; label: string }[] = [
  { value: "reuniao", label: "Reunião" },
  { value: "pessoal", label: "Pessoal" },
  { value: "saude", label: "Saúde" },
  { value: "outro", label: "Outro" },
];

export function AddAppointmentModal({ onClose, defaultDate }: { onClose: () => void; defaultDate?: Date }) {
  const add = useAgendaStore((s) => s.add);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AppointmentType>("reuniao");
  const [date, setDate] = useState(() => {
    const d = defaultDate ?? new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [description, setDescription] = useState("");

  function save() {
    if (!title.trim() || !date) return;
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const [eh, emin] = endTime.split(":").map(Number);
    const dateMs = new Date(y, m - 1, d, allDay ? 0 : h, allDay ? 0 : min).getTime();
    const endMs = new Date(y, m - 1, d, allDay ? 23 : eh, allDay ? 59 : emin).getTime();
    add({ title: title.trim(), date: dateMs, endDate: endMs, type, description, allDay });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-ink/6">
          <h2 className="font-bold text-base">Novo compromisso</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-2 transition text-muted">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do compromisso"
            autoFocus
            className="w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm font-medium outline-none focus:ring-2 focus:ring-ink/15"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`py-2 rounded-xl text-xs font-semibold transition ${
                  type === t.value ? "bg-ink text-lime" : "bg-surface-2 hover:bg-ink/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15" />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded" />
                <span className="text-xs text-muted">dia todo</span>
              </label>
            </div>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Início</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">Fim</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15" />
              </div>
            </div>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm resize-none outline-none focus:ring-2 focus:ring-ink/15"
          />
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <Button variant="light" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={save} disabled={!title.trim()} className="flex-1">Salvar</Button>
        </div>
      </div>
    </div>
  );
}
