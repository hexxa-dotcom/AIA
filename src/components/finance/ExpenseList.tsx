"use client";
import {
  Check,
  Pencil,
  Trash2,
  CreditCard,
  RefreshCw,
  Layers,
  Share2,
  UserCheck,
  Zap,
  Home,
  Users,
} from "lucide-react";
import {
  useFinanceStore,
  type RecurringExpense,
  type ExpenseCategory,
  isExpenseActiveInMonth,
  parcelaLabel,
} from "@/store/useFinanceStore";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── ExpenseList (por categoria) ───────────────────────────────────────────────

export function ExpenseList({
  category,
  yearMonth,
  onEdit,
  imovelFilter,
  memberFilter,
  includeShared,
  isIncomeOnly,
  isInvestimentoOnly,
  groupFilter,
}: {
  category?: ExpenseCategory;
  yearMonth: string;
  onEdit: (id: string) => void;
  imovelFilter?: string;
  memberFilter?: string;
  includeShared?: boolean;
  isIncomeOnly?: boolean;
  isInvestimentoOnly?: boolean;
  groupFilter?: string;
}) {
  const all = useFinanceStore((s) => s.expenses);
  const togglePaid = useFinanceStore((s) => s.togglePaid);
  const remove = useFinanceStore((s) => s.remove);

  let expenses = all.filter((e) => {
    if (!isExpenseActiveInMonth(e, yearMonth)) return false;
    if (isIncomeOnly) return e.isIncome;
    if (isInvestimentoOnly) return e.isInvestimento;
    if (e.isIncome || e.isInvestimento) return false;
    if (includeShared && e.sharedBy) return true;
    if (groupFilter && e.group !== groupFilter) return false;
    if (category && e.category !== category) return false;
    return true;
  });

  if (imovelFilter) {
    expenses = expenses.filter((e) => e.imovel === imovelFilter || !e.imovel);
  }
  if (memberFilter) {
    expenses = expenses.filter((e) => e.familyMember === memberFilter);
  }

  const groups = expenses.reduce<Record<string, RecurringExpense[]>>(
    (acc, e) => {
      let key = e.group || "Geral";
      if (isIncomeOnly) {
        key = e.payments[yearMonth] ? "✅ Recebidos" : "⏳ Agendados (A Receber)";
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {},
  );

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const paidAmt = expenses
    .filter((e) => e.payments[yearMonth])
    .reduce((a, e) => a + e.amount, 0);
  const paidCnt = expenses.filter((e) => e.payments[yearMonth]).length;

  if (expenses.length === 0) {
    return <EmptyState icon="" isIncomeOnly={isIncomeOnly} isInvestimentoOnly={isInvestimentoOnly} />;
  }

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([group, items]) => {
        const groupTotal = items.reduce((a, e) => a + e.amount, 0);
        return (
          <div key={group}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted">
                {group}
              </span>
              <span className="text-[11px] font-semibold text-muted tabular-nums">
                {fmt(groupTotal)}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  yearMonth={yearMonth}
                  onEdit={onEdit}
                  onToggle={() => togglePaid(e.id, yearMonth)}
                  onRemove={() => {
                    if (confirm(`Remover"${e.name}"?`)) remove(e.id);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      <FooterTotals
        paidCnt={paidCnt}
        total={expenses.length}
        paidAmt={paidAmt}
        totalAmt={total}
        isIncomeOnly={isIncomeOnly}
      />
    </div>
  );
}

// ── CartaoList ────────────────────────────────────────────────────────────────

export function CartaoList({
  yearMonth,
  onEdit,
}: {
  yearMonth: string;
  onEdit: (id: string) => void;
}) {
  const all = useFinanceStore((s) => s.expenses);
  const creditCards = useFinanceStore((s) => s.creditCards);
  const togglePaid = useFinanceStore((s) => s.togglePaid);
  const remove = useFinanceStore((s) => s.remove);

  const expenses = all.filter(
    (e) => isExpenseActiveInMonth(e, yearMonth) && e.isCartao,
  );
  const groups = expenses.reduce<Record<string, RecurringExpense[]>>(
    (acc, e) => {
      const key = e.cartaoNome || "Sem cartão";
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {},
  );

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const paidAmt = expenses
    .filter((e) => e.payments[yearMonth])
    .reduce((a, e) => a + e.amount, 0);
  const paidCnt = expenses.filter((e) => e.payments[yearMonth]).length;

  if (expenses.length === 0) {
    return <EmptyState icon={null} isCartao />;
  }

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([cartao, items]) => {
        const subtotal = items.reduce((a, e) => a + e.amount, 0);
        const paidSub = items
          .filter((e) => e.payments[yearMonth])
          .reduce((a, e) => a + e.amount, 0);
        const subPct =
          subtotal > 0 ? Math.round((paidSub / subtotal) * 100) : 0;
        return (
          <div key={cartao}>
            {/* cartão header */}
            <div
              className="flex items-center justify-between mb-2 px-3 py-2.5 rounded-2xl"
              style={{
                background: "rgba(150,150,150,0.08)",
                border: "0.5px solid rgba(150,150,150,0.18)",
              }}
              >
              <div className="flex items-center gap-2">
                <CreditCard size={14} style={{ color: "#8c8c88", flexShrink: 0 }} />
                <div className="flex flex-col">
                  <span
                    className="text-sm font-bold leading-tight"
                    style={{ color: "#8c8c88" }}
                  >
                    {cartao}
                  </span>
                  {(() => {
                    const cardInfo = creditCards.find((c) => c.name === cartao);
                    if (cardInfo) {
                      return (
                        <span className="text-[10px] text-muted">
                          Vencimento: dia {cardInfo.dueDay}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">
                  {fmt(subtotal)}
                </p>
                <p className="text-[10px] text-muted">{subPct}% pago</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {items.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  yearMonth={yearMonth}
                  onEdit={onEdit}
                  onToggle={() => togglePaid(e.id, yearMonth)}
                  onRemove={() => {
                    if (confirm(`Remover"${e.name}"?`)) remove(e.id);
                  }}
                  showCategory
                />
              ))}
            </div>
          </div>
        );
      })}

      <FooterTotals
        paidCnt={paidCnt}
        total={expenses.length}
        paidAmt={paidAmt}
        totalAmt={total}
      />
    </div>
  );
}

// ── ExpenseRow ────────────────────────────────────────────────────────────────

const CAT_LABEL: Record<ExpenseCategory, string> = {
  personal: "Pessoal",
  casa: "Casa",
  familia: "Compartilhadas",
};

export function ExpenseRow({
  expense,
  yearMonth,
  onEdit,
  onToggle,
  onRemove,
  showCategory,
}: {
  expense: RecurringExpense;
  yearMonth: string;
  onEdit: (id: string) => void;
  onToggle: () => void;
  onRemove: () => void;
  showCategory?: boolean;
}) {
  const isPaid = Boolean(expense.payments[yearMonth]);
  const payDateStr = expense.payments[yearMonth];
  const payDate = typeof payDateStr === "string" ? new Date(payDateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;
  const parcela = parcelaLabel(expense, yearMonth);
  const isShared = (expense.sharedWith?.length ?? 0) > 0;
  const isReceived = Boolean(expense.sharedBy);

  return (
    <div
      className="flex items-start gap-3.5 p-4 rounded-2xl group transition-all"
      style={{
        background: isPaid
          ? "rgba(150,150,150,0.05)"
          : "var(--color-surface)",
        border: "1.5px solid var(--flat-border)",
        opacity: isPaid ? 0.65 : 1,
        boxShadow: isPaid ? "none" : "0 1px 4px rgba(0,0,0,0.02)",
      }}
    >
      {/* circle checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all mt-0.5"
        style={{
          background: isPaid ? (expense.isIncome ? "var(--color-success)" : "var(--color-ink)") : "transparent",
          border: `1.5px solid ${isPaid ? (expense.isIncome ? "var(--color-success)" : "var(--color-ink)") : "var(--flat-border)"}`,
        }}
      >
        {isPaid && <Check size={10} color="#fff" strokeWidth={3} />}
      </button>

      {/* name + meta */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold leading-snug truncate",
            isPaid && "line-through opacity-70"
          )}
          style={{ color: isPaid ? "var(--color-muted)" : "var(--color-ink)" }}
        >
          {expense.name}
        </p>
        <div className="flex items-center flex-wrap gap-1.5 mt-1">
          <span className="text-[10px] font-medium text-muted">
            Venc. dia {expense.dueDay}
            {isPaid && payDate && ` • Pago dia ${payDate}`}
          </span>

          {expense.tipo === "recorrente" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted">
              <RefreshCw size={7} /> recorrente
            </span>
          )}
          {expense.tipo === "unico" && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--color-surface-3)", color: "var(--color-muted)" }}
            >
              <Zap size={7} /> único
            </span>
          )}
          {parcela && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--color-ink)", color: "var(--color-surface)" }}
            >
              <Layers size={7} /> {parcela}
            </span>
          )}
          {expense.isCartao && !showCategory && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px]"
              style={{ color: "var(--color-muted)" }}
            >
              <CreditCard size={7} /> {expense.cartaoNome || "Cartão"}
            </span>
          )}
          {expense.imovel && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-surface-2)", color: "var(--color-ink-soft)" }}
            >
              <Home size={7} /> {expense.imovel}
            </span>
          )}
          {expense.familyMember && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-surface-2)", color: "var(--color-ink-soft)" }}
            >
              <Users size={7} /> {expense.familyMember}
            </span>
          )}
          {isShared && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "var(--color-surface-3)", color: "var(--color-ink)" }}
            >
              <Share2 size={7} /> {expense.sharedWith!.length}
            </span>
          )}
          {isReceived && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--color-surface-3)", color: "var(--color-ink-soft)" }}
            >
              <UserCheck size={7} /> {expense.sharedBy}
            </span>
          )}
          {showCategory && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted">
              {CAT_LABEL[expense.category]}
            </span>
          )}
          {expense.isIncome && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-success/10 text-success border border-success/20">
              entrada
            </span>
          )}
          {expense.isInvestimento && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
              investimento
            </span>
          )}
        </div>

        {/* payment method & notes */}
        {(expense.formaPagamento || expense.isCartao || expense.notes) && (
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {expense.formaPagamento && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--color-surface-2)", color: "var(--color-ink-soft)", border: "1px solid var(--flat-border)" }}
              >
                <CreditCard size={9} /> {expense.formaPagamento}
              </span>
            )}
            {expense.isCartao && !showCategory && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "var(--color-surface-2)", color: "var(--color-ink-soft)", border: "1px solid var(--flat-border)" }}
              >
                <CreditCard size={9} /> {expense.cartaoNome || "Cartão"}
              </span>
            )}
            {expense.notes && (
              <p className="text-[10px] text-muted italic line-clamp-1 border-l border-flat pl-2">
                {expense.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* amount + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p
          className={cn(
            "text-base font-bold tabular-nums leading-none mt-0.5",
            isPaid && "line-through opacity-70",
            expense.isIncome && !isPaid ? "text-success" :
            expense.isInvestimento && !isPaid ? "text-purple-500" :
            isPaid ? "text-muted" : "text-ink"
          )}
        >
          {expense.isIncome ? "+" : ""} {fmt(expense.amount)}
        </p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(expense.id)}
            className="p-1 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function FooterTotals({
  paidCnt,
  total,
  paidAmt,
  totalAmt,
  isIncomeOnly,
}: {
  paidCnt: number;
  total: number;
  paidAmt: number;
  totalAmt: number;
  isIncomeOnly?: boolean;
}) {
  const pct = totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0;
  return (
    <div className="pt-3 border-t border-ink/6 space-y-2">
      <div className="h-1 rounded-full bg-ink/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100 ? "var(--color-success)" : "var(--color-ink)",
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted">
          {isIncomeOnly
            ? `${paidCnt} de ${total} recebido${paidCnt !== 1 ? "s" : ""} · ${pct}%`
            : `${paidCnt} de ${total} pago${paidCnt !== 1 ? "s" : ""} · ${pct}%`}
        </span>
        <div className="text-sm font-bold tabular-nums">
          <span className="text-success">{fmt(paidAmt)}</span>
          <span className="text-muted font-normal text-xs">
            {" "}
            / {fmt(totalAmt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  isCartao,
  isIncomeOnly,
  isInvestimentoOnly,
}: {
  icon?: string | null;
  isCartao?: boolean;
  isIncomeOnly?: boolean;
  isInvestimentoOnly?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center">
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <CreditCard size={22} className="text-muted/40" />
        )}
      </div>
      <p className="font-semibold text-sm text-muted">
        {isCartao
          ? "Nenhum lançamento de cartão"
          : isIncomeOnly
            ? "Nenhuma receita cadastrada"
            : isInvestimentoOnly
              ? "Nenhum investimento cadastrado"
              : "Nenhuma despesa cadastrada"}
      </p>
      <p className="text-[11px] text-muted/60">
        {isCartao
          ? 'Marque despesas como "cobrado no cartão".'
          : isIncomeOnly
            ? 'Clique em "Novo Lançamento" para cadastrar uma entrada.'
            : isInvestimentoOnly
              ? 'Clique em "Novo Lançamento" para cadastrar um investimento.'
              : 'Clique em "Novo Lançamento" para começar.'}
      </p>
    </div>
  );
}
