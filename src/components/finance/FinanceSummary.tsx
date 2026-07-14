"use client";
import { useMemo } from "react";
import { Share2, Sparkles, DollarSign, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import {
  useFinanceStore,
  isExpenseActiveInMonth,
} from "@/store/useFinanceStore";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtShort(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CATS = [
  {
    key: "personal" as const,
    label: "Pessoal",
    emoji: "",
    color: "var(--color-info)",
    bg: "color-mix(in srgb, var(--color-info) 12%, transparent)",
    border: "1px solid color-mix(in srgb, var(--color-info) 20%, transparent)",
  },
  {
    key: "casa" as const,
    label: "Casa",
    emoji: "",
    color: "var(--color-success)",
    bg: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    border: "1px solid color-mix(in srgb, var(--color-success) 20%, transparent)",
  },
  {
    key: "familia" as const,
    label: "Compartilhadas",
    emoji: "",
    color: "var(--color-warning)",
    bg: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    border: "1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)",
  },
] as const;

export function FinanceSummary({ yearMonth }: { yearMonth: string }) {
  const all = useFinanceStore((s) => s.expenses);
  const pendingInvites = useFinanceStore((s) => s.pendingCount());
  const expenses = all.filter((e) => isExpenseActiveInMonth(e, yearMonth));

  // Despesas puras (filtrando fora receitas e investimentos)
  const despesasExpenses = useMemo(() => {
    return expenses.filter((e) => !e.isIncome && !e.isInvestimento);
  }, [expenses]);

  // Entradas de dinheiro (Receitas)
  const totalReceitas = useMemo(() => {
    return expenses.filter((e) => e.isIncome).reduce((a, e) => a + e.amount, 0);
  }, [expenses]);

  // Investimentos lançados na planilha de finanças
  const totalInvestimentos = useMemo(() => {
    return expenses.filter((e) => e.isInvestimento).reduce((a, e) => a + e.amount, 0);
  }, [expenses]);

  const catTotals = useMemo(() => {
    return {
      personal: despesasExpenses
        .filter((e) => e.category === "personal")
        .reduce((a, e) => a + e.amount, 0),
      casa: despesasExpenses
        .filter((e) => e.category === "casa")
        .reduce((a, e) => a + e.amount, 0),
      familia: despesasExpenses
        .filter((e) => e.category === "familia")
        .reduce((a, e) => a + e.amount, 0),
    };
  }, [despesasExpenses]);

  const total = catTotals.personal + catTotals.casa + catTotals.familia;
  const paid = despesasExpenses
    .filter((e) => e.payments[yearMonth])
    .reduce((a, e) => a + e.amount, 0);
  const pending = total - paid;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  const sharedCount = despesasExpenses.filter(
    (e) => (e.sharedWith?.length ?? 0) > 0 || e.sharedBy,
  ).length;

  const custoVida = despesasExpenses
    .filter((e) => e.tipo === "recorrente")
    .reduce((a, e) => a + e.amount, 0);

  const despesasNaoRecorrentes = despesasExpenses
    .filter((e) => e.tipo === "unico" || e.tipo === "parcela")
    .reduce((a, e) => a + e.amount, 0);

  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const highestCat = catEntries[0] && catEntries[0][1] > 0 ? catEntries[0] : null;
  const highestCatLabel = highestCat ? CATS.find((c) => c.key === highestCat[0])?.label : "Nenhuma";

  const categoryPending = {
    personal: despesasExpenses.filter((e) => e.category === "personal" && !e.payments[yearMonth]).length,
    casa: despesasExpenses.filter((e) => e.category === "casa" && !e.payments[yearMonth]).length,
    familia: despesasExpenses.filter((e) => e.category === "familia" && !e.payments[yearMonth]).length,
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
    <div className="space-y-4">
      {/* ── CARD UNIFICADO: TOTAL DO MÊS E INSIGHTS (PRETO PREMIUM) ── */}
      <div className="bg-[#141414] rounded-3xl p-5 shadow-sm text-white border border-white/10 relative overflow-hidden">
        {/* Glow decorativo de fundo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-success/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch relative z-10 text-left">
          
          {/* Coluna 1: Total do Mês e Progresso de Pagamentos (col-span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-5 md:pb-0 md:pr-6">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
                    Total do mês (Despesas)
                  </p>
                  <p className="text-3xl font-black tracking-tight text-white mt-1.5">
                    {fmt(total)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-success/20 text-success">
                    {Math.round(paidPct)}% quitado
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    {despesasExpenses.length} despesa{despesasExpenses.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Barra de progresso do pagamento das despesas */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-white"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>

            {/* Chips de Estatísticas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Pago</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{fmtShort(paid)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Pendente</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{fmtShort(pending)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Itens</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{despesasExpenses.length}</p>
              </div>
            </div>
          </div>

          {/* Coluna 2: Insights do Mês e Fluxos Financeiros (col-span-5) */}
          <div className="md:col-span-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={14} className="text-success animate-pulse" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-white">Insights & Fluxos</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 p-2 px-3 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Custo de Vida (Fixas)</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmtShort(custoVida)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-2 px-3 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Não Recorrentes</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmtShort(despesasNaoRecorrentes)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-2 px-3 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Entradas (Mês)</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmtShort(totalReceitas)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-2 px-3 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Investido (Mês)</p>
                  <p className="text-sm font-bold text-white mt-0.5">{fmtShort(totalInvestimentos)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Dica & Atenção</p>
                <p className="text-[11px] text-slate-200 leading-relaxed font-semibold mt-0.5">
                  {dica}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Category breakdown ── */}
      {total > 0 && (
        <div className="bg-white rounded-3xl p-4 shadow-sm text-left">
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
            {CATS.map(({ key, label, color, bg, border }) => {
              const val = catTotals[key];
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return (
                <div
                  key={key}
                  className="rounded-2xl p-3 relative"
                  style={{ background: bg, border }}
                >
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

      {/* ── Shared / invite notice ── */}
      {(sharedCount > 0 || pendingInvites > 0) && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
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
