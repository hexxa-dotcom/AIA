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
}: {
  category: ExpenseCategory;
  yearMonth: string;
  onEdit: (id: string) => void;
  imovelFilter?: string;
  memberFilter?: string;
  includeShared?: boolean;
}) {
  const all = useFinanceStore((s) => s.expenses);
  const togglePaid = useFinanceStore((s) => s.togglePaid);
  const remove = useFinanceStore((s) => s.remove);

  let expenses = all.filter((e) => {
    if (!isExpenseActiveInMonth(e, yearMonth)) return false;
    if (includeShared && e.sharedBy) return true;
    return e.category === category;
  });

  if (imovelFilter) {
    expenses = expenses.filter((e) => e.imovel === imovelFilter || !e.imovel);
  }
  if (memberFilter) {
    expenses = expenses.filter((e) => e.familyMember === memberFilter);
  }

  const groups = expenses.reduce<Record<string, RecurringExpense[]>>(
    (acc, e) => {
      const key = e.group || "Geral";
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
    return <EmptyState icon="" />;
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
                <CreditCard size={14} style={{ color: "#8c8c88" }} />
                <span
                  className="text-sm font-bold"
                  style={{ color: "#8c8c88" }}
                >
                  {cartao}
                </span>
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

function ExpenseRow({
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
  const isPaid = expense.payments[yearMonth] ?? false;
  const parcela = parcelaLabel(expense, yearMonth);
  const isShared = (expense.sharedWith?.length ?? 0) > 0;
  const isReceived = Boolean(expense.sharedBy);

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl group transition-all"
      style={{
        background: isPaid
          ? "rgba(150,150,150,0.05)"
          : "rgba(255,255,255,0.85)",
        border: `1.5px solid ${isPaid ? "rgba(150,150,150,0.20)" : "rgba(0,0,0,0.06)"}`,
        boxShadow: isPaid ? "none" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* circle checkbox */}
      <button
        onClick={onToggle}
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
        style={{
          background: isPaid ? "#1a1a1a" : "transparent",
          border: `2px solid ${isPaid ? "#1a1a1a" : "rgba(0,0,0,0.18)"}`,
        }}
      >
        {isPaid && <Check size={10} color="#fff" strokeWidth={3} />}
      </button>

      {/* name + meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold leading-snug truncate"
          style={{ color: isPaid ? "#999" : "#141414" }}
        >
          {expense.name}
        </p>
        <div className="flex items-center flex-wrap gap-1 mt-0.5">
          <span className="text-[10px] text-muted">dia {expense.dueDay}</span>

          {expense.tipo === "recorrente" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-muted">
              <RefreshCw size={7} /> recorrente
            </span>
          )}
          {expense.tipo === "unico" && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(150,150,150,0.12)", color: "#8c8c88" }}
            >
              <Zap size={7} /> único
            </span>
          )}
          {parcela && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(0,0,0,0.16)", color: "#141414" }}
            >
              <Layers size={7} /> {parcela}
            </span>
          )}
          {expense.isCartao && !showCategory && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px]"
              style={{ color: "#8c8c88" }}
            >
              <CreditCard size={7} /> {expense.cartaoNome || "Cartão"}
            </span>
          )}
          {expense.imovel && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(40,40,40,0.12)", color: "#3d3d3d" }}
            >
              <Home size={7} /> {expense.imovel}
            </span>
          )}
          {expense.familyMember && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(40,40,40,0.12)", color: "#555552" }}
            >
              <Users size={7} /> {expense.familyMember}
            </span>
          )}
          {isShared && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(0,0,0,0.09)", color: "#141414" }}
            >
              <Share2 size={7} /> {expense.sharedWith!.length}
            </span>
          )}
          {isReceived && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(150,150,150,0.30)", color: "#3d3d3d" }}
            >
              <UserCheck size={7} /> {expense.sharedBy}
            </span>
          )}
          {showCategory && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted">
              {CAT_LABEL[expense.category]}
            </span>
          )}
        </div>
      </div>

      {/* amount + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p
          className="text-sm font-bold tabular-nums"
          style={{ color: isPaid ? "#1a1a1a" : "#141414" }}
        >
          {fmt(expense.amount)}
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
}: {
  paidCnt: number;
  total: number;
  paidAmt: number;
  totalAmt: number;
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
          {paidCnt} de {total} pago{paidCnt !== 1 ? "s" : ""} · {pct}%
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
}: {
  icon?: string | null;
  isCartao?: boolean;
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
          : "Nenhuma despesa cadastrada"}
      </p>
      <p className="text-[11px] text-muted/60">
        {isCartao
          ? 'Marque despesas como"cobrado no cartão".'
          : 'Clique em"Nova despesa"para começar.'}
      </p>
    </div>
  );
}
