"use client";
import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Inbox, Sparkles } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { ExpenseList, CartaoList } from "@/components/finance/ExpenseList";
import { ExpenseEditor } from "@/components/finance/ExpenseEditor";
import { ExpenseInbox } from "@/components/finance/ExpenseInbox";
import { CardStatementImporter } from "@/components/finance/CardStatementImporter";
import { useFinanceStore } from "@/store/useFinanceStore";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toYearMonth(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

type Tab = "personal" | "casa" | "familia" | "cartoes" | "dividas";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "personal", label: "Pessoal", emoji: "" },
  { id: "casa", label: "Casa", emoji: "" },
  { id: "familia", label: "Compartilhadas", emoji: "" },
  { id: "cartoes", label: "Cartões", emoji: "" },
  { id: "dividas", label: "Dívidas", emoji: "" },
];

const TAB_META: Record<
  Tab,
  { title: string; subtitle: string; color: string }
> = {
  personal: {
    title: "Contas Pessoais",
    subtitle: "Suas despesas individuais",
    color: "bg-ink text-lime",
  },
  casa: {
    title: "Casa",
    subtitle: "Contas e manutenção do lar",
    color: "bg-lime/80 text-ink",
  },
  familia: {
    title: "Despesas Compartilhadas",
    subtitle: "Família e despesas recebidas",
    color: "bg-sage/60 text-ink",
  },
  cartoes: {
    title: "Cartões de Crédito",
    subtitle: "Lançamentos agrupados por cartão",
    color: "bg-info/15 text-info",
  },
  dividas: {
    title: "Controle de Dívidas",
    subtitle: "Contas em atraso, empréstimos e pendências",
    color: "bg-danger text-surface",
  },
};

const TAB_EMOJI: Record<Tab, string> = {
  personal: "",
  casa: "",
  familia: "",
  cartoes: "",
  dividas: "",
};

export default function FinancasPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<Tab>("personal");
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [inbox, setInbox] = useState(false);
  const [importer, setImporter] = useState(false);
  const [imovelFilter, setImovelFilter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");

  const pendingCount = useFinanceStore((s) => s.pendingCount());
  const properties = useFinanceStore((s) => s.properties);
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const yearMonth = toYearMonth(year, month);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }
  function openEdit(id: string) {
    setEditId(id);
    setEditing(true);
  }

  return (
    <AppShell>
      <Topbar
        title="Finanças"
        subtitle="Controle suas finanças e compartilhamentos"
        right={
          <div className="flex items-center gap-2">
            {/* Month selector mini */}
            <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-sm mr-1 border border-ink/5">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-surface-2 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="text-center px-2 min-w-[80px]">
                <div className="font-bold text-xs">{MONTH_NAMES[month]}</div>
                <div className="text-[9px] text-muted leading-none">{year}</div>
              </div>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-surface-2 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              onClick={() => setInbox(true)}
              className="relative p-2 rounded-xl hover:bg-white/60 transition bg-white shadow-sm border border-ink/5"
              title="Caixa de entrada"
            >
              <Inbox size={16} className="text-ink/70" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold grid place-items-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
            <Button
              variant="dark"
              onClick={() => {
                setEditId(null);
                setEditing(true);
              }}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Novo Lançamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-4">


        {/* Summary */}
        <FinanceSummary yearMonth={yearMonth} />

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-full p-1.5 w-fit shadow-sm mt-2">
          {TABS.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition",
                tab === id
                  ? "bg-ink text-surface"
                  : "text-muted hover:text-ink",
              )}
            >
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          {/* header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-9 h-9 rounded-xl ${TAB_META[tab].color} grid place-items-center text-base shrink-0`}
            >
              {TAB_EMOJI[tab]}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{TAB_META[tab].title}</div>
              <div className="text-[11px] text-muted">
                {TAB_META[tab].subtitle}
              </div>
            </div>
            {/* cartões tab: importar fatura button */}
            {tab === "cartoes" && (
              <button
                onClick={() => setImporter(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition hover:bg-surface-2"
                style={{
                  color: "#141414",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <Sparkles size={12} className="text-ink/60" />
                Importar fatura
              </button>
            )}
          </div>

          {/* Casa: property filter chips */}
          {tab === "casa" && properties.length > 1 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setImovelFilter("")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition",
                  imovelFilter === ""
                    ? "bg-ink text-lime"
                    : "bg-surface-2 text-muted hover:text-ink",
                )}
              >
                Todos
              </button>
              {properties.map((p) => (
                <button
                  key={p}
                  onClick={() => setImovelFilter(imovelFilter === p ? "" : p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition",
                    imovelFilter === p
                      ? "bg-ink text-lime"
                      : "bg-surface-2 text-muted hover:text-ink",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Compartilhadas: member filter chips */}
          {tab === "familia" && familyMembers.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              <button
                onClick={() => setMemberFilter("")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition",
                  memberFilter === ""
                    ? "bg-ink text-lime"
                    : "bg-surface-2 text-muted hover:text-ink",
                )}
              >
                Todos
              </button>
              {familyMembers.map((m) => (
                <button
                  key={m}
                  onClick={() => setMemberFilter(memberFilter === m ? "" : m)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition",
                    memberFilter === m
                      ? "bg-ink text-lime"
                      : "bg-surface-2 text-muted hover:text-ink",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {tab === "personal" && (
            <ExpenseList
              category="personal"
              yearMonth={yearMonth}
              onEdit={openEdit}
            />
          )}
          {tab === "casa" && (
            <ExpenseList
              category="casa"
              yearMonth={yearMonth}
              onEdit={openEdit}
              imovelFilter={imovelFilter || undefined}
            />
          )}
          {tab === "familia" && (
            <ExpenseList
              category="familia"
              yearMonth={yearMonth}
              onEdit={openEdit}
              memberFilter={memberFilter || undefined}
              includeShared
            />
          )}
          {tab === "cartoes" && (
            <CartaoList yearMonth={yearMonth} onEdit={openEdit} />
          )}
          {tab === "dividas" && (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start gap-3">
                <div className="mt-0.5 text-danger font-bold text-lg">!</div>
                <div>
                  <h3 className="text-sm font-bold text-danger leading-tight mb-1">Atenção às Pendências</h3>
                  <p className="text-[11px] text-danger/80">
                    Aqui você pode gerenciar suas dívidas de longo prazo ou visualizar o que está atrasado. 
                    (Você também pode cadastrar dívidas na categoria "Pessoal" e marcá-las no calendário).
                  </p>
                </div>
              </div>
              <ExpenseList category="personal" yearMonth={yearMonth} onEdit={openEdit} />
            </div>
          )}
        </div>
      </div>

      {editing && (
        <ExpenseEditor
          id={editId}
          onClose={() => {
            setEditing(false);
            setEditId(null);
          }}
        />
      )}

      {importer && (
        <CardStatementImporter
          yearMonth={yearMonth}
          onClose={() => setImporter(false)}
        />
      )}

      <AnimatePresence>
        {inbox && <ExpenseInbox onClose={() => setInbox(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}
