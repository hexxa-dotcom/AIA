"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, List, CalendarDays, Clock, Trash2, Inbox } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useTaskStore } from "@/store/useTaskStore";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useAgendaInviteStore } from "@/store/useAgendaInviteStore";
import { AddAppointmentModal } from "@/components/agenda/AddAppointmentModal";
import { AgendaInviteInbox } from "@/components/agenda/AgendaInviteInbox";
import { cn, todayKey } from "@/lib/utils";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type View = "mes" | "lista" | "dia" | "timeline";

const VIEW_LABELS: Record<View, string> = { mes: "Mês", lista: "Lista", dia: "Dia", timeline: "Timeline" };

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const dow = x.getDay();
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function AgendaPage() {
  const [view, setView] = useState<View>("mes");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [timelineAnchor, setTimelineAnchor] = useState<Date>(() => startOfWeek(new Date()));
  const [showInbox, setShowInbox] = useState(false);
  const pendingInvites = useAgendaInviteStore((s) => s.pendingCount());
  const tasks = useTaskStore((s) => s.tasks);
  const appointments = useAgendaStore((s) => s.appointments);
  const removeAppt = useAgendaStore((s) => s.remove);

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function shiftMonth(d: number) {
    const n = new Date(cursor); n.setMonth(n.getMonth() + d); setCursor(n);
  }

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = startDow; i > 0; i--) {
      const d = new Date(first); d.setDate(first.getDate() - i);
      cells.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), inMonth: true });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const d = new Date(last); d.setDate(last.getDate() + 1);
      cells.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
    }
    return cells;
  }, [cursor]);

  function eventsOn(date: Date) {
    const s = new Date(date); s.setHours(0, 0, 0, 0);
    const e = new Date(date); e.setHours(23, 59, 59, 999);
    const taskEvents = tasks
      .filter((t) => t.dueDate && t.dueDate >= s.getTime() && t.dueDate <= e.getTime())
      .map((t) => ({ id: t.id, title: t.title, kind: "task" as const, done: !!t.completedAt }));
    const apptEvents = appointments
      .filter((a) => a.date >= s.getTime() && a.date <= e.getTime())
      .map((a) => ({ id: a.id, title: a.title, kind: "appt" as const, done: false, type: a.type }));
    // Expenses for this day of month
    return [...apptEvents, ...taskEvents];
  }

  const todayK = todayKey();
  const todayDate = new Date();

  // --- LIST VIEW ---
  const listItems = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const future = new Date(now); future.setDate(future.getDate() + 30);

    const taskItems = tasks
      .filter((t) => t.dueDate && t.dueDate >= now.getTime() && t.dueDate <= future.getTime())
      .map((t) => ({ id: t.id, title: t.title, date: t.dueDate!, kind: "task" as const, done: !!t.completedAt, type: undefined }));

    const apptItems = appointments
      .filter((a) => a.date >= now.getTime() && a.date <= future.getTime())
      .map((a) => ({ id: a.id, title: a.title, date: a.date, kind: "appt" as const, done: false, type: a.type }));

    return [...taskItems, ...apptItems].sort((a, b) => a.date - b.date);
  }, [tasks, appointments]);

  // Group list by date label
  const listGrouped = useMemo(() => {
    const groups: Record<string, typeof listItems> = {};
    for (const item of listItems) {
      const d = new Date(item.date);
      const key = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [listItems]);

  // --- DAY VIEW ---
  const dayDate = selectedDate ?? todayDate;
  const dayLabel = dayDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h–20h

  const dayAppts = useMemo(() => {
    const s = new Date(dayDate); s.setHours(0, 0, 0, 0);
    const e = new Date(dayDate); e.setHours(23, 59, 59, 999);
    return appointments.filter((a) => a.date >= s.getTime() && a.date <= e.getTime());
  }, [appointments, dayDate]);

  const dayTasks = useMemo(() => {
    const s = new Date(dayDate); s.setHours(0, 0, 0, 0);
    const e = new Date(dayDate); e.setHours(23, 59, 59, 999);
    return tasks.filter((t) => t.dueDate && t.dueDate >= s.getTime() && t.dueDate <= e.getTime());
  }, [tasks, dayDate]);

  const TYPE_DOT: Record<string, string> = {
    reuniao: "bg-info", pessoal: "bg-warning", saude: "bg-success", outro: "bg-ink/40",
  };

  // --- TIMELINE VIEW ---
  const timelineDays = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(timelineAnchor);
      d.setDate(timelineAnchor.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [timelineAnchor]);

  function shiftTimelineWeek(by: number) {
    const d = new Date(timelineAnchor);
    d.setDate(d.getDate() + by * 7);
    setTimelineAnchor(d);
  }

  return (
    <AppShell>
      <Topbar 
        title="Agenda" 
        subtitle="Compromissos, tarefas e eventos" 
        right={
          <button
            onClick={() => setShowInbox(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition text-muted bg-white shadow-sm border border-flat"
            title="Convites de agenda"
          >
            <Inbox size={18} />
            {pendingInvites > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full grid place-items-center">
                {pendingInvites}
              </span>
            )}
          </button>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1.5">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-full hover:bg-surface-2">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="text-xs font-semibold px-3">Hoje</button>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-full hover:bg-surface-2">
            <ChevronRight size={14} />
          </button>
          <span className="text-xs text-muted ml-1 capitalize">{monthLabel}</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white rounded-full p-1.5 shadow-sm">
          {(["mes", "lista", "dia", "timeline"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("px-4 py-2 rounded-full text-xs font-semibold transition",
                view === v ? "bg-ink text-surface" : "text-muted hover:text-ink")}>
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 ml-auto px-4 py-2 rounded-full bg-ink text-lime text-xs font-bold hover:opacity-90 transition">
          <Plus size={13} /> Compromisso
        </button>
      </div>

      {/* MÊS */}
      {view === "mes" && (
        <div className="bg-white rounded-3xl p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-[10px] uppercase tracking-wider text-muted text-center font-semibold">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ date, inMonth }) => {
              const events = eventsOn(date);
              const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const isToday = k === todayK;
              return (
                <div key={k} onClick={() => { setSelectedDate(date); setView("dia"); }}
                  className={cn(
                    "min-h-[80px] rounded-xl p-1.5 flex flex-col text-[11px] transition border cursor-pointer hover:border-ink/20",
                    inMonth ? "bg-surface-2 border-transparent" : "bg-transparent border-transparent text-muted/40",
                    isToday && "ring-2 ring-lime border-transparent bg-lime/20",
                  )}>
                  <div className={cn("text-xs font-semibold", isToday && "text-ink")}>{date.getDate()}</div>
                  <div className="flex flex-col gap-0.5 overflow-hidden mt-1">
                    {events.slice(0, 3).map((ev) => (
                      <div key={ev.id} className={cn(
                        "text-[10px] truncate px-1.5 py-0.5 rounded font-semibold",
                        ev.kind === "appt" ? "bg-info/12 text-info" :
                        ev.done ? "bg-success/20 text-success line-through" : "bg-ink text-lime",
                      )}>{ev.title}</div>
                    ))}
                    {events.length > 3 && <div className="text-[10px] text-muted">+{events.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LISTA */}
      {view === "lista" && (
        <div className="space-y-4">
          {Object.keys(listGrouped).length === 0 && (
            <div className="bg-white rounded-3xl p-8 text-center text-muted text-sm">
              <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum compromisso nos próximos 30 dias.</p>
            </div>
          )}
          {Object.entries(listGrouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-[11px] uppercase tracking-wider font-bold text-muted px-1 mb-1.5 capitalize">{dateLabel}</p>
              <div className="bg-white rounded-3xl overflow-hidden">
                {items.map((item, i) => (
                  <div key={item.id} className={cn("flex items-center gap-3 px-4 py-3",
                    i < items.length - 1 && "border-b border-ink/5")}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0",
                      item.kind === "appt"
                        ? (TYPE_DOT[item.type ?? "outro"] ?? "bg-ink/40")
                        : item.done ? "bg-success" : "bg-ink")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", item.done && "line-through text-muted")}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-muted">
                        {item.kind === "task" ? "tarefa" : "compromisso"} · {
                          new Date(item.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        }
                      </p>
                    </div>
                    {item.kind === "appt" && (
                      <button onClick={() => removeAppt(item.id)}
                        className="p-1 text-muted hover:text-danger transition shrink-0">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIA */}
      {view === "dia" && (
        <div className="bg-white rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => { const d = new Date(dayDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
              className="p-1.5 rounded-full hover:bg-surface-2"><ChevronLeft size={14} /></button>
            <p className="flex-1 text-sm font-bold capitalize text-center">{dayLabel}</p>
            <button onClick={() => { const d = new Date(dayDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
              className="p-1.5 rounded-full hover:bg-surface-2"><ChevronRight size={14} /></button>
          </div>
          <div className="space-y-1">
            {HOURS.map((h) => {
              const hAppts = dayAppts.filter((a) => new Date(a.date).getHours() === h);
              const hTasks = dayTasks.filter((t) => t.dueDate && new Date(t.dueDate).getHours() === h);
              const hasItems = hAppts.length > 0 || hTasks.length > 0;
              return (
                <div key={h} className={cn("flex gap-3 min-h-[48px] rounded-xl px-3 py-2",
                  hasItems && "bg-surface-2")}>
                  <span className="text-[10px] text-muted font-mono w-8 shrink-0 pt-0.5">{h}:00</span>
                  <div className="flex-1 space-y-1">
                    {hAppts.map((a) => (
                      <div key={a.id} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-info/10 text-info text-xs font-semibold">
                        <Clock size={10} />
                        <span className="truncate">{a.title}</span>
                        <span className="ml-auto text-[10px] opacity-70">
                          {new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {a.endDate && ` – ${new Date(a.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                        <button onClick={() => removeAppt(a.id)} className="hover:text-danger transition">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    {hTasks.map((t) => (
                      <div key={t.id} className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold",
                        t.completedAt ? "bg-success/15 text-success line-through" : "bg-ink/10 text-ink")}>
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto text-[10px] opacity-60">tarefa</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {view === "timeline" && (
        <div className="bg-transparent rounded-3xl">
          <div className="flex items-center gap-2 mb-3 bg-white rounded-full px-3 py-1.5 w-fit shadow-sm">
            <button onClick={() => shiftTimelineWeek(-1)} className="p-1.5 rounded-full hover:bg-surface-2">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setTimelineAnchor(startOfWeek(new Date()))} className="text-xs font-semibold px-3">
              Esta semana
            </button>
            <button onClick={() => shiftTimelineWeek(1)} className="p-1.5 rounded-full hover:bg-surface-2">
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-muted ml-2">
              {timelineAnchor.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} –{" "}
              {new Date(timelineAnchor.getTime() + 6 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {timelineDays.map((d, i) => {
              const events = eventsOn(d);
              const key = todayKey(d);
              const isToday = key === todayK;
              return (
                <div
                  key={key}
                  className={cn(
                    "bg-white rounded-2xl p-3 min-h-[300px] flex flex-col shadow-sm border border-transparent",
                    isToday && "ring-2 ring-lime border-transparent bg-lime/5",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted">{WEEKDAYS[i]}</div>
                    <div
                      className={cn(
                        "text-sm font-bold w-7 h-7 rounded-full grid place-items-center",
                        isToday && "bg-lime text-ink",
                      )}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                    {events.length === 0 ? (
                      <div className="text-[10px] text-muted italic text-center pt-4">vazio</div>
                    ) : (
                      events.map((ev) => (
                        <div
                          key={ev.id}
                          className={cn(
                            "text-left text-xs bg-surface-2 px-2 py-1.5 rounded-lg border border-transparent hover:border-ink/10 cursor-pointer",
                            ev.kind === "appt" ? "border-info/20 bg-info/5" : "",
                            ev.done && "opacity-50 line-through",
                          )}
                        >
                          <div className={cn("font-semibold truncate", ev.kind === "appt" && "text-info")}>{ev.title}</div>
                          <div className="flex items-center gap-1 mt-0.5 justify-between">
                            <span className="text-[10px] text-muted flex items-center gap-0.5">
                              <Clock size={9} />
                              {ev.kind === "task" ? "tarefa" : (ev.type || "reuniao")}
                            </span>
                            {ev.kind === "appt" && (
                              <button onClick={(e) => { e.stopPropagation(); removeAppt(ev.id); }} className="hover:text-danger transition">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdd && <AddAppointmentModal onClose={() => setShowAdd(false)} defaultDate={selectedDate ?? undefined} />}
      {showInbox && <AgendaInviteInbox onClose={() => setShowInbox(false)} />}
    </AppShell>
  );
}
