"use client";
import { Share2, Sparkles } from "lucide-react";
import {
  useFinanceStore,
  isExpenseActiveInMonth,
} from "@/store/useFinanceStore";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CATS = [
  {
    key: "personal" as const,
    label: "Pessoal",
    emoji: "",
    color: "var(--color-info)",
    bg: "color-mix(in srgb, var(--color-info) 8%, transparent)",
  },
  {
    key: "casa" as const,
    label: "Casa",
    emoji: "",
    color: "var(--color-success)",
    bg: "color-mix(in srgb, var(--color-success) 8%, transparent)",
  },
  {
    key: "familia" as const,
    label: "Compartilhadas",
    emoji: "",
    color: "var(--color-warning)",
    bg: "color-mix(in srgb, var(--color-warning) 8%, transparent)",
  },
] as const;

export function FinanceSummary({ yearMonth }: { yearMonth: string }) {
  const all = useFinanceStore((s) => s.expenses);
  const pendingInvites = useFinanceStore((s) => s.pendingCount());
  const expenses = all.filter((e) => isExpenseActiveInMonth(e, yearMonth));

  const catTotals = {
    personal: expenses
      .filter((e) => e.category === "personal")
      .reduce((a, e) => a + e.amount, 0),
    casa: expenses
      .filter((e) => e.category === "casa")
      .reduce((a, e) => a + e.amount, 0),
    familia: expenses
      .filter((e) => e.category === "familia")
      .reduce((a, e) => a + e.amount, 0),
  };
  const total = catTotals.personal + catTotals.casa + catTotals.familia;
  const paid = expenses
    .filter((e) => e.payments[yearMonth])
    .reduce((a, e) => a + e.amount, 0);
  const pending = total - paid;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  const sharedCount = expenses.filter(
    (e) => (e.sharedWith?.length ?? 0) > 0 || e.sharedBy,
  ).length;

  const custoVida = expenses
    .filter((e) => e.tipo === "recorrente")
    .reduce((a, e) => a + e.amount, 0);

  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const highestCat = catEntries[0] && catEntries[0][1] > 0 ? catEntries[0] : null;
  const highestCatLabel = highestCat ? CATS.find((c) => c.key === highestCat[0])?.label : "Nenhuma";

  const categoryPending = {
    personal: expenses.filter((e) => e.category === "personal" && !e.payments[yearMonth]).length,
    casa: expenses.filter((e) => e.category === "casa" && !e.payments[yearMonth]).length,
    familia: expenses.filter((e) => e.category === "familia" && !e.payments[yearMonth]).length,
  };
  const pendingEntries = Object.entries(categoryPending).sort((a, b) => b[1] - a[1]);
  const needsAttentionCat = pendingEntries[0] && pendingEntries[0][1] > 0 
    ? CATS.find((c) => c.key === pendingEntries[0][0])?.label 
    : highestCatLabel;

  let dica = "Mantenha o hábito de registrar tudo para um controle financeiro excelente.";
  if (pendingEntries[0] && pendingEntries[0][1] > 0) {
    dica = `Há contas atrasadas em ${needsAttentionCat}. Tente quitá-las logo para evitar juros.`;
  } else if (highestCat) {
    dica = `Seu maior gasto é com ${highestCatLabel}. Estipule uma meta para reduzir 10% no próximo mês.`;
  }

  return (
    <div className="space-y-3">
      {/* ── Compact hero card ── */}
      <div className="glass rounded-3xl p-4 relative overflow-hidden">
        {/* top row: label + percentage */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-muted">
              Total do mês
            </p>
            <p className="text-[1.7rem] font-bold leading-none tracking-tight text-ink">
              {fmt(total)}
            </p>
          </div>
          <div className="text-right mt-1">
            <p className="text-[10px] text-muted">
              {Math.round(paidPct)}% quitado
            </p>
            <p
              className="text-xs font-bold mt-0.5"
              style={{
                color:
                  paidPct >= 100
                    ? "var(--color-success)"
                    : "var(--color-muted)",
              }}
            >
              {expenses.length} despesa{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* progress bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mb-3"
          style={{ background: "var(--color-surface-3)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${paidPct}%`,
              background:
                paidPct >= 100 ? "var(--color-success)" : "var(--color-ink)",
            }}
          />
        </div>

        {/* bottom stats strip */}
        <div className="grid grid-cols-3 gap-1">
          <StatChip
            label="Pago"
            value={fmtShort(paid)}
            color="var(--color-success)"
          />
          <StatChip
            label="Pendente"
            value={fmtShort(pending)}
            color="var(--color-warning)"
          />
          <StatChip
            label="Itens"
            value={String(expenses.length)}
            color="var(--color-muted)"
          />
        </div>
      </div>

      {/* ── Category breakdown ── */}
      {total > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-3">
            Divisão por categoria
          </p>

          {/* Proportional segmented bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px] mb-4">
            {CATS.map(({ key, color }) => {
              const pct = total > 0 ? (catTotals[key] / total) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div
                  key={key}
                  style={{ flex: pct, background: color, minWidth: 5 }}
                  className="rounded-full"
                />
              );
            })}
          </div>

          {/* Category tiles */}
          <div className="grid grid-cols-3 gap-2">
            {CATS.map(({ key, label, emoji, color, bg }) => {
              const val = catTotals[key];
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="rounded-2xl p-3 relative"
                  style={{ background: bg }}
                >
                  <span className="text-xl block mb-2 leading-none">
                  </span>
                  <p
                    className="text-[13px] font-bold leading-tight truncate"
                    style={{ color }}
                  >
                    {fmtShort(val)}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{label}</p>
                  <span
                    className="absolute top-2.5 right-2.5 text-[10px] font-bold"
                    style={{ color, opacity: 0.6 }}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Insights ── */}
      <div className="bg-ink rounded-3xl p-4 shadow-sm text-surface">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-lime" />
          <h3 className="font-bold text-sm">Insights do Mês</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
           <div className="bg-surface-2/10 p-3 rounded-2xl border border-surface-2/5">
              <p className="text-[9px] uppercase tracking-wider text-surface-2/60 font-bold mb-1">Custo de Vida</p>
              <p className="text-lg font-bold text-lime leading-tight">{fmt(custoVida)}</p>
           </div>
           <div className="bg-surface-2/10 p-3 rounded-2xl border border-surface-2/5">
              <p className="text-[9px] uppercase tracking-wider text-surface-2/60 font-bold mb-1">Maior Gasto</p>
              <p className="text-lg font-bold text-info leading-tight">{highestCatLabel}</p>
           </div>
        </div>

        <div className="bg-surface-2/10 p-3 rounded-2xl space-y-3 border border-surface-2/5">
           <div>
              <p className="text-[9px] uppercase tracking-wider text-surface-2/60 font-bold mb-0.5">Atenção</p>
              <p className="text-[11px] text-surface-2/90 font-medium">
                Os gastos com <span className="font-bold text-surface">{needsAttentionCat}</span> precisam de acompanhamento.
              </p>
           </div>
           <div>
              <p className="text-[9px] uppercase tracking-wider text-surface-2/60 font-bold mb-0.5">Dica para o próximo mês</p>
              <p className="text-[11px] text-surface-2/90 font-medium">{dica}</p>
           </div>
        </div>
      </div>

      {/* ── Shared / invite notice ── */}
      {(sharedCount > 0 || pendingInvites > 0) && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--flat-border)",
          }}
        >
          <Share2 size={14} className="text-ink shrink-0" />
          <p className="text-[12px] font-medium text-ink/80 flex-1">
            {pendingInvites > 0
              ? `${pendingInvites} convite${pendingInvites > 1 ? "s" : ""} pendente${pendingInvites > 1 ? "s" : ""} na caixa de entrada`
              : `${sharedCount} despesa${sharedCount > 1 ? "s" : ""} compartilhada${sharedCount > 1 ? "s" : ""}`}
          </p>
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-2 py-2"
      style={{ background: "var(--color-surface-2)" }}
    >
      <p className="text-[9px] uppercase tracking-wider mb-0.5 text-muted">
        {label}
      </p>
      <p
        className="text-[13px] font-bold tabular-nums leading-tight"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
