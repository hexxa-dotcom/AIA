"use client";
import { useState, useMemo } from "react";
import { 
  Plus, ChevronLeft, ChevronRight, Inbox, Sparkles, 
  TrendingUp, TrendingDown, DollarSign, PieChart, 
  ArrowUpRight, ArrowDownRight, Trash2, LineChart, Coins,
  Award, Wallet, Home, Users, CreditCard, AlertCircle, FileText, Check
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { ExpenseList, CartaoList } from "@/components/finance/ExpenseList";
import { ExpenseEditor } from "@/components/finance/ExpenseEditor";
import { ExpenseInbox } from "@/components/finance/ExpenseInbox";
import { CardStatementImporter } from "@/components/finance/CardStatementImporter";
import { useFinanceStore, isExpenseActiveInMonth } from "@/store/useFinanceStore";
import { useInvestmentStore, type InvestmentAsset } from "@/store/useInvestmentStore";
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

type Tab = "personal" | "casa" | "familia" | "cartoes" | "dividas" | "investimentos";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "personal", label: "Pessoal", emoji: "" },
  { id: "casa", label: "Casa", emoji: "" },
  { id: "familia", label: "Compartilhadas", emoji: "" },
  { id: "cartoes", label: "Cartões", emoji: "" },
  { id: "dividas", label: "Dívidas", emoji: "" },
  { id: "investimentos", label: "Investimentos", emoji: "" },
];

const TAB_META: Record<
  Tab,
  { title: string; subtitle: string; color: string }
> = {
  personal: {
    title: "Contas Pessoais",
    subtitle: "Suas despesas e lançamentos individuais",
    color: "bg-ink text-lime",
  },
  casa: {
    title: "Casa",
    subtitle: "Contas, aluguel e manutenção do lar",
    color: "bg-lime/80 text-ink",
  },
  familia: {
    title: "Despesas Compartilhadas",
    subtitle: "Família e contas divididas entre membros",
    color: "bg-sage/60 text-ink",
  },
  cartoes: {
    title: "Cartões de Crédito",
    subtitle: "Fatura acumulada e limites de crédito",
    color: "bg-info/15 text-info",
  },
  dividas: {
    title: "Controle de Dívidas",
    subtitle: "Contas em atraso, parcelamentos e pendências",
    color: "bg-danger text-surface",
  },
  investimentos: {
    title: "Carteira de Investimentos",
    subtitle: "Acompanhe seus aportes, distribuição de ativos e rentabilidade média",
    color: "bg-success/20 text-success border border-success/30",
  },
};

const TAB_EMOJI: Record<Tab, string> = {
  personal: "",
  casa: "",
  familia: "",
  cartoes: "",
  dividas: "",
  investimentos: "",
};

function InvestimentosTabContent() {
  const { assets, addAsset, removeAsset } = useInvestmentStore();
  const [showAdd, setShowAdd] = useState(false);

  // States do form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InvestmentAsset["category"]>("Ações");
  const [value, setValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [yieldPct, setYieldPct] = useState("");

  const totalAlocado = useMemo(() => {
    return assets.reduce((acc, a) => acc + (a.value * a.quantity), 0);
  }, [assets]);

  const totalLucro = useMemo(() => {
    return assets.reduce((acc, a) => acc + ((a.value * a.quantity) * (a.yieldPct / 100)), 0);
  }, [assets]);

  const yieldMedio = useMemo(() => {
    return totalAlocado > 0 ? (totalLucro / totalAlocado) * 100 : 0;
  }, [totalAlocado, totalLucro]);

  const alocacaoCategorias = useMemo(() => {
    const cats: InvestmentAsset["category"][] = ["Ações", "Renda Fixa", "FIIs", "Cripto", "Outros"];
    return cats.map((cat) => {
      const catAssets = assets.filter((a) => a.category === cat);
      const catTotal = catAssets.reduce((acc, a) => acc + (a.value * a.quantity), 0);
      const pct = totalAlocado > 0 ? Math.round((catTotal / totalAlocado) * 100) : 0;
      return { cat, total: catTotal, pct };
    });
  }, [assets, totalAlocado]);

  const categoryColors: Record<InvestmentAsset["category"], string> = {
    "Ações": "bg-purple-500",
    "Renda Fixa": "bg-info",
    "FIIs": "bg-amber-500",
    "Cripto": "bg-lime",
    "Outros": "bg-muted"
  };

  const categoryTexts: Record<InvestmentAsset["category"], string> = {
    "Ações": "text-purple-500 bg-purple-500/10 border-purple-500/20",
    "Renda Fixa": "text-info bg-info/10 border-info/20",
    "FIIs": "text-amber-500 bg-amber-500/10 border-amber-500/20",
    "Cripto": "text-lime bg-lime/10 border-lime/20",
    "Outros": "text-muted bg-muted/10 border-muted/20"
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value || !quantity) return;
    
    addAsset({
      name: name.trim(),
      category,
      value: Number(value),
      quantity: Number(quantity),
      yieldPct: yieldPct ? Number(yieldPct) : 0
    });

    setName("");
    setCategory("Ações");
    setValue("");
    setQuantity("");
    setYieldPct("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 text-left mt-2">
      {/* Resumo Financeiro da Carteira */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-5 border border-flat flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Total Alocado</p>
            <p className="text-xl font-black text-ink mt-1">R$ {totalAlocado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-ink/5 grid place-items-center shrink-0">
            <DollarSign size={18} className="text-ink/60" />
          </div>
        </div>

        <div className="glass rounded-3xl p-5 border border-flat flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Lucro / Rendimento</p>
            <p className={cn("text-xl font-black mt-1", totalLucro >= 0 ? "text-success" : "text-danger")}>
              {totalLucro >= 0 ? "+" : ""}R$ {totalLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={cn("w-10 h-10 rounded-2xl grid place-items-center shrink-0", totalLucro >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            {totalLucro >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </div>
        </div>

        <div className="glass rounded-3xl p-5 border border-flat flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-bold">Rentabilidade Média</p>
            <p className={cn("text-xl font-black mt-1", yieldMedio >= 0 ? "text-success" : "text-danger")}>
              {yieldMedio >= 0 ? "+" : ""}{yieldMedio.toFixed(2)}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-ink/5 grid place-items-center shrink-0">
            <PieChart size={18} className="text-ink/60" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Esquerda: Alocação & Aporte (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Gráfico de Alocação */}
          <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5 border-b border-flat pb-2.5">
              <PieChart size={13} /> Distribuição da Carteira
            </h3>
            <div className="space-y-3">
              {alocacaoCategorias.map((item) => (
                <div key={item.cat} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-ink">
                    <span>{item.cat}</span>
                    <span className="text-muted">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-flat">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-300", categoryColors[item.cat])}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de aporte */}
          <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted">Aporte / Novo Ativo</h3>
              <button 
                onClick={() => setShowAdd(!showAdd)}
                className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Novo Aporte
              </button>
            </div>

            <AnimatePresence>
              {showAdd && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAdd}
                  className="bg-surface-2 border border-flat p-4 rounded-2xl space-y-3 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Código / Nome</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: PETR4, Tesouro"
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      >
                        <option value="Ações">Ações</option>
                        <option value="Renda Fixa">Renda Fixa</option>
                        <option value="FIIs">FIIs</option>
                        <option value="Cripto">Cripto</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Qtd</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="10"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Valor Unit (R$)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="35.50"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-muted block mb-1">Rendimento %</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="8.5"
                        value={yieldPct}
                        onChange={(e) => setYieldPct(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-flat rounded-xl text-xs outline-none focus:ring-2 focus:ring-ink/10 text-ink"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="primary" size="sm" className="flex-1">
                      Salvar Ativo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
                      Cancelar
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Direita: Tabela de Ativos (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {assets.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-muted border border-dashed border-flat">
              <PieChart size={32} className="mx-auto mb-3 opacity-25" />
              <p className="font-bold text-sm text-ink">Carteira vazia</p>
              <p className="text-xs text-muted mt-1">Insira seus primeiros ativos clicando em "Novo Aporte" ao lado.</p>
            </div>
          ) : (
            <div className="glass rounded-3xl p-5 border border-flat space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted border-b border-flat pb-2.5">
                Meus Ativos ({assets.length})
              </h3>
              
              <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {assets.map((asset) => {
                  const totalInvestido = asset.value * asset.quantity;
                  const lucroEstimado = totalInvestido * (asset.yieldPct / 100);

                  return (
                    <div 
                      key={asset.id}
                      className="p-3.5 bg-surface-2 border border-flat rounded-2xl flex items-center justify-between gap-4 hover:scale-[1.01] hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-ink">{asset.name}</span>
                          <span className={cn("text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border", categoryTexts[asset.category])}>
                            {asset.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted mt-1 font-semibold leading-relaxed">
                          {asset.quantity.toLocaleString("pt-BR")} cotas · Méd: R$ {asset.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-ink font-mono">R$ {totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          <span className={cn("text-[9px] font-bold block mt-0.5", asset.yieldPct >= 0 ? "text-success" : "text-danger")}>
                            {asset.yieldPct >= 0 ? "+" : ""}{asset.yieldPct.toFixed(2)}% (+R$ {lucroEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                          </span>
                        </div>
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const allExpenses = useFinanceStore((s) => s.expenses);
  
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

  // Filtra despesas de acordo com a aba ativa e filtros selecionados
  const currentTabExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      if (!isExpenseActiveInMonth(e, yearMonth)) return false;
      if (tab === "personal") return e.category === "personal";
      if (tab === "casa") {
        if (imovelFilter && e.imovel !== imovelFilter && e.imovel) return false;
        return e.category === "casa";
      }
      if (tab === "familia") {
        if (memberFilter && e.familyMember !== memberFilter) return false;
        return e.category === "familia" || !!e.sharedBy;
      }
      if (tab === "dividas") return e.category === "personal" && e.group === "Dívidas";
      return false;
    });
  }, [allExpenses, tab, yearMonth, imovelFilter, memberFilter]);

  // Estatísticas de pagamento para a aba ativa (apenas despesas reais)
  const tabPaidStats = useMemo(() => {
    const despesas = currentTabExpenses.filter((e) => !e.isIncome && !e.isInvestimento);
    const total = despesas.reduce((acc, e) => acc + e.amount, 0);
    const paid = despesas.filter((e) => e.payments[yearMonth]).reduce((acc, e) => acc + e.amount, 0);
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pct };
  }, [currentTabExpenses, yearMonth]);

  // Distribuição de despesas por grupo na aba ativa (apenas despesas reais)
  const tabGroupDistribution = useMemo(() => {
    const despesas = currentTabExpenses.filter((e) => !e.isIncome && !e.isInvestimento);
    const total = despesas.reduce((acc, e) => acc + e.amount, 0);
    const groups: Record<string, number> = {};
    despesas.forEach((e) => {
      const groupName = e.group || "Geral";
      groups[groupName] = (groups[groupName] || 0) + e.amount;
    });
    return Object.entries(groups).map(([group, val]) => ({
      group,
      total: val,
      pct: total > 0 ? Math.round((val / total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [currentTabExpenses]);

  // Distribuição de gastos por cartão de crédito na aba de cartões
  const cardsDistribution = useMemo(() => {
    const cardExpenses = allExpenses.filter((e) => isExpenseActiveInMonth(e, yearMonth) && e.isCartao);
    const total = cardExpenses.reduce((acc, e) => acc + e.amount, 0);
    const groups: Record<string, number> = {};
    
    cardExpenses.forEach((e) => {
      const cardName = e.cartaoNome || "Outros";
      groups[cardName] = (groups[cardName] || 0) + e.amount;
    });

    return Object.entries(groups).map(([cardName, val]) => ({
      cardName,
      total: val,
      pct: total > 0 ? Math.round((val / total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [allExpenses, yearMonth]);

  return (
    <AppShell>
      <Topbar
        title="Finanças"
        subtitle="Controle suas finanças e compartilhamentos"
        right={
          <div className="flex items-center gap-2">
            {/* Month selector mini */}
            {tab !== "investimentos" && (
              <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-sm mr-1 border border-flat">
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
            )}

            <button
              onClick={() => setInbox(true)}
              className="relative p-2 rounded-xl hover:bg-white/60 transition bg-white shadow-sm border border-flat"
              title="Caixa de entrada"
            >
              <Inbox size={16} className="text-ink/70" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold grid place-items-center">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
            <div className="bg-white rounded-full p-1 shadow-sm border border-flat flex items-center">
              <button
                onClick={() => {
                  setEditId(null);
                  setEditing(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-ink hover:bg-surface-2 transition"
              >
                <Plus size={14} className="text-danger" strokeWidth={3} />
                <span className="hidden sm:inline">Novo Lançamento</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        }
      />

      <div className="space-y-4">

        {/* Summary */}
        {tab !== "investimentos" && <FinanceSummary yearMonth={yearMonth} />}

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
          <div className="flex items-center gap-3 mb-5 border-b border-flat pb-3">
            <div
              className={`w-9 h-9 rounded-xl ${TAB_META[tab].color} grid place-items-center text-base shrink-0`}
            >
              {TAB_EMOJI[tab]}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm text-ink">{TAB_META[tab].title}</div>
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

          {/* Renderização unificada no padrão de 2 colunas baseado em Investimentos */}
          {tab === "investimentos" ? (
            <InvestimentosTabContent />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
              
              {/* Esquerda: Filtros, Orçamento e Distribuição (col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                
                {/* Casa: property filter chips */}
                {tab === "casa" && properties.length > 1 && (
                  <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-2">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted mb-1">Filtrar por Imóvel</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setImovelFilter("")}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold transition",
                          imovelFilter === ""
                            ? "bg-ink text-lime"
                            : "bg-surface-2 text-muted hover:text-ink border border-flat",
                        )}
                      >
                        Todos
                      </button>
                      {properties.map((p) => (
                        <button
                          key={p}
                          onClick={() => setImovelFilter(imovelFilter === p ? "" : p)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-bold transition",
                            imovelFilter === p
                              ? "bg-ink text-lime"
                              : "bg-surface-2 text-muted hover:text-ink border border-flat",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compartilhadas: member filter chips */}
                {tab === "familia" && familyMembers.length > 0 && (
                  <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-2">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted mb-1">Filtrar por Membro</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => setMemberFilter("")}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold transition",
                          memberFilter === ""
                            ? "bg-ink text-lime"
                            : "bg-surface-2 text-muted hover:text-ink border border-flat",
                        )}
                      >
                        Todos
                      </button>
                      {familyMembers.map((m) => (
                        <button
                          key={m}
                          onClick={() => setMemberFilter(memberFilter === m ? "" : m)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[10px] font-bold transition",
                            memberFilter === m
                              ? "bg-ink text-lime"
                              : "bg-surface-2 text-muted hover:text-ink border border-flat",
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dívidas: warning warning panel */}
                {tab === "dividas" && (
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-danger leading-tight mb-1">Atenção às Pendências</h3>
                      <p className="text-[10px] text-danger/80 leading-relaxed">
                        Gerencie suas parcelas de longo prazo ou contas atrasadas. É possível cadastrá-las na categoria Pessoal e fixá-las no calendário.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cartões: Distribuição de Gastos por Cartão */}
                {tab === "cartoes" && cardsDistribution.length > 0 && (
                  <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5 border-b border-flat pb-2">
                      <CreditCard size={13} /> Gastos por Cartão
                    </h3>
                    <div className="space-y-3.5">
                      {cardsDistribution.map((item) => (
                        <div key={item.cardName} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-ink">
                            <span>{item.cardName}</span>
                            <span className="text-muted">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({item.pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-flat">
                            <div 
                              className="h-full rounded-full bg-info"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo de Pagamentos / Orçamento para Pessoal, Casa, Compartilhadas, Dívidas */}
                {tab !== "cartoes" && tabPaidStats.total > 0 && (
                  <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-2">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-muted">Progresso de Pagamentos</h4>
                    <div className="flex justify-between items-center text-xs font-bold text-ink mt-1">
                      <span>R$ {tabPaidStats.paid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pagos</span>
                      <span className="text-muted">Total: R$ {tabPaidStats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-flat mt-1">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-300", tabPaidStats.pct === 100 ? "bg-success" : "bg-ink")}
                        style={{ width: `${tabPaidStats.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted font-bold self-end uppercase mt-1">{tabPaidStats.pct}% concluído</span>
                  </div>
                )}

                {/* Distribuição por Categorias (Grupos) para Pessoal, Casa, Compartilhadas, Dívidas */}
                {tab !== "cartoes" && tabGroupDistribution.length > 0 && (
                  <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5 border-b border-flat pb-2">
                      <PieChart size={13} /> Distribuição de Gastos
                    </h3>
                    <div className="space-y-3.5">
                      {tabGroupDistribution.map((item) => (
                        <div key={item.group} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-ink">
                            <span>{item.group}</span>
                            <span className="text-muted">R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({item.pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-flat">
                            <div 
                              className="h-full rounded-full bg-ink"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Direita: A Listagem Principal (col-span-7) */}
              <div className="lg:col-span-7">
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
                  <ExpenseList category="personal" yearMonth={yearMonth} onEdit={openEdit} />
                )}
              </div>

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
