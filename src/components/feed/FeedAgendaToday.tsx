"use client";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, ChevronDown } from "lucide-react";
import { useAgendaStore } from "@/store/useAgendaStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useCollapse } from "@/hooks/useCollapse";
import Link from "next/link";

interface AgendaItem {
  id: string; title: string; time?: string;
  kind: "appointment" | "task"; done?: boolean;
}

export function FeedAgendaToday() {
  const { collapsed, toggle } = useCollapse("agenda-today");
  const appointments = useAgendaStore((s) => s.appointments);
  const tasks = useTaskStore((s) => s.tasks);

  const items = useMemo<AgendaItem[]>(() => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const e = s + 86_400_000;
    const appts: AgendaItem[] = appointments
      .filter((a) => a.date >= s && a.date < e)
      .map((a) => ({
        id: a.id, title: a.title, kind: "appointment",
        time: a.allDay ? "dia todo"
          : new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }));
    const taskItems: AgendaItem[] = tasks
      .filter((t) => t.dueDate && t.dueDate >= s && t.dueDate < e)
      .map((t) => ({
        id: t.id, title: t.title, kind: "task", done: !!t.completedAt,
        time: new Date(t.dueDate!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }));
    return [...appts, ...taskItems].sort((a, b) =>
      a.time === "dia todo" ? -1 : b.time === "dia todo" ? 1 : (a.time ?? "").localeCompare(b.time ?? "")
    );
  }, [appointments, tasks]);

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col border h-full" style={{ borderColor: "var(--flat-border)" }}>

      {/* Header azul com colapso */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(); }}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <CalendarDays size={15} className="text-ink" />
          <div>
            <p className="font-bold text-sm text-ink">Agenda de hoje</p>
            <p className="text-[10px] text-muted">
              {items.length === 0 ? "nenhum compromisso" : `${items.length} item${items.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/calendario"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80 bg-ink text-lime"
          >
            ver agenda →
          </Link>
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.18 }}
            className="text-muted"
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </div>

      {/* Lista — animada */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex-1 p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <CalendarDays size={28} style={{ color: "rgba(14,11,12,0.12)" }} />
                  <p className="text-xs text-muted text-center">Dia livre! Nenhum compromisso.</p>
                  <Link href="/calendario" className="text-xs font-semibold underline underline-offset-2 text-muted hover:text-ink transition">
                    + Adicionar compromisso
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors"
                      style={{ background: "rgba(14,11,12,0.025)" }}
                    >
                      <div className="shrink-0">
                        {item.kind === "task"
                          ? <CheckCircle2 size={13} style={{ color: item.done ? "#1a1a1a" : "rgba(14,11,12,0.20)" }} />
                          : <Clock size={13} style={{ color: "#6e6e6a" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${item.done ? "line-through text-muted" : ""}`}>
                          {item.title}
                        </p>
                      </div>
                      {item.time && (
                        <span className="text-[10px] font-mono shrink-0"
                          style={{ color: "rgba(14,11,12,0.38)" }}>
                          {item.time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
