"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, AlertTriangle, Clock, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useFinanceStore, isExpenseActiveInMonth } from "@/store/useFinanceStore";
import { useCollapse } from "@/hooks/useCollapse";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toYM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function FeedFinanceWidget() {
  const { collapsed, toggle } = useCollapse("finance-widget");
  const all = useFinanceStore((s) => s.expenses);
  const now = new Date();
  const today = now.getDate();
  const yearMonth = toYM(now);
  const active = all.filter((e) => isExpenseActiveInMonth(e, yearMonth));
  const dueToday = active.filter((e) => e.dueDay === today && !e.payments[yearMonth]);
  const dueSoon  = active.filter((e) => { const d = e.dueDay - today; return d > 0 && d <= 7 && !e.payments[yearMonth]; });

  if (dueToday.length === 0 && dueSoon.length === 0) return null;

  const totalToday = dueToday.reduce((s, e) => s + e.amount, 0);
  const totalSoon  = dueSoon.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="glass rounded-3xl overflow-hidden">

      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "0.5px solid rgba(14,11,12,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0"
            style={{ background: "rgba(220,38,38,0.10)" }}>
            <CreditCard size={14} style={{ color: "var(--color-danger)" }} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Contas a Pagar</p>
            <p className="text-[10px] text-muted">
              {dueToday.length > 0 ? `${dueToday.length} vence${dueToday.length > 1 ? "m" : ""} hoje` : `${dueSoon.length} nos próximos 7 dias`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/financas"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-muted hover:text-ink underline underline-offset-2 transition"
          >
            ver todas
          </Link>
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.18 }}
            style={{ color: "rgba(14,11,12,0.28)" }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </div>
      </button>

      {/* Corpo animado */}
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
            <div className="p-4 space-y-3">
              {/* Summary chips */}
              <div className="flex gap-2">
                {dueToday.length > 0 && (
                  <div className="flex-1 rounded-2xl px-3 py-2.5 flex flex-col gap-0.5"
                    style={{ background: "rgba(220,38,38,0.07)", border: "0.5px solid rgba(220,38,38,0.18)" }}>
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={11} style={{ color: "var(--color-danger)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-danger)" }}>
                        Vence hoje
                      </span>
                    </div>
                    <span className="text-base font-bold tabular-nums" style={{ color: "var(--color-danger)" }}>
                      {fmt(totalToday)}
                    </span>
                    <span className="text-[10px]" style={{ color: "color-mix(in srgb, var(--color-danger) 65%, transparent)" }}>
                      {dueToday.length} conta{dueToday.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {dueSoon.length > 0 && (
                  <div className="flex-1 rounded-2xl px-3 py-2.5 flex flex-col gap-0.5"
                    style={{ background: "rgba(150,150,150,0.07)", border: "0.5px solid rgba(150,150,150,0.18)" }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} style={{ color: "var(--color-warning)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-warning)" }}>
                        Próx. 7 dias
                      </span>
                    </div>
                    <span className="text-base font-bold tabular-nums" style={{ color: "var(--color-warning)" }}>
                      {fmt(totalSoon)}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(150,150,150,0.65)" }}>
                      {dueSoon.length} conta{dueSoon.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Items list */}
              <div className="space-y-1.5">
                {[...dueToday.map(e => ({ ...e, urgent: true })), ...dueSoon.map(e => ({ ...e, urgent: false }))]
                  .slice(0, 5)
                  .map((e) => (
                    <div key={e.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ background: e.urgent ? "rgba(220,38,38,0.04)" : "rgba(150,150,150,0.04)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{e.name}</p>
                        <p className="text-[10px] text-muted">
                          {e.urgent ? "vence hoje" : `dia ${e.dueDay}`}
                          {e.isCartao && e.cartaoNome ? ` · ${e.cartaoNome}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-bold tabular-nums ml-2 shrink-0"
                        style={{ color: e.urgent ? "var(--color-danger)" : "var(--color-warning)" }}>
                        {fmt(e.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
