"use client";
import { useState, useMemo } from "react";
import { useFinanceStore, isExpenseActiveInMonth, parcelaLabel } from "@/store/useFinanceStore";
import { ArrowUpRight, ArrowDownRight, CreditCard, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceExtratoProps {
  yearMonth: string;
}

export function FinanceExtrato({ yearMonth }: FinanceExtratoProps) {
  const expenses = useFinanceStore((s) => s.expenses);
  const creditCards = useFinanceStore((s) => s.creditCards);
  const togglePaidExpense = useFinanceStore((s) => s.togglePaid);
  const [groupByCard, setGroupByCard] = useState(true);

  const { items, totalIn, totalOut, balance, totalPaidIn, totalPaidOut, currentBalance } = useMemo(() => {
    let activeItems = expenses.filter((e) => isExpenseActiveInMonth(e, yearMonth) && !e.isInvestimento);

    let finalItems: typeof activeItems = [];

    if (groupByCard) {
      const cardSums: Record<string, { amount: number; isPaid: boolean }> = {};
      const nonCardItems = [];

      for (const item of activeItems) {
        if (item.isCartao && item.cartaoNome) {
          if (!cardSums[item.cartaoNome]) cardSums[item.cartaoNome] = { amount: 0, isPaid: true };
          cardSums[item.cartaoNome].amount += item.amount;
          if (!item.payments[yearMonth]) cardSums[item.cartaoNome].isPaid = false;
        } else {
          nonCardItems.push(item);
        }
      }

      finalItems = [...nonCardItems];
      
      // Transform card sums into fake items for the extrato
      for (const cardName in cardSums) {
        const cardInfo = creditCards.find(c => c.name === cardName);
        const dueDay = cardInfo?.dueDay || 10;
        finalItems.push({
          id: `card-${cardName}`,
          name: `Fatura: ${cardName}`,
          amount: cardSums[cardName].amount,
          dueDay,
          category: "personal",
          group: "Cartões",
          isActive: true,
          createdAt: 0,
          tipo: "recorrente",
          isCartao: true,
          cartaoNome: cardName,
          isIncome: false,
          payments: cardSums[cardName].isPaid ? { [yearMonth]: true } : {},
        });
      }
    } else {
      finalItems = activeItems;
    }

    // Sort chronologically
    finalItems.sort((a, b) => a.dueDay - b.dueDay);

    let tIn = 0, tOut = 0, tPaidIn = 0, tPaidOut = 0;
    
    for (const item of finalItems) {
      const isPaid = !!item.payments[yearMonth];
      if (item.isIncome) {
        tIn += item.amount;
        if (isPaid) tPaidIn += item.amount;
      } else {
        tOut += item.amount;
        if (isPaid) tPaidOut += item.amount;
      }
    }

    return { 
      items: finalItems, 
      totalIn: tIn, 
      totalOut: tOut, 
      balance: tIn - tOut,
      totalPaidIn: tPaidIn,
      totalPaidOut: tPaidOut,
      currentBalance: tPaidIn - tPaidOut
    };
  }, [expenses, yearMonth, groupByCard, creditCards]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarDays size={48} />
          </div>
          <p className="text-xs uppercase tracking-wider font-bold text-muted mb-1 relative z-10">Saldo Previsto</p>
          <p className={cn("text-2xl font-black tracking-tight relative z-10", balance >= 0 ? "text-success" : "text-danger")}>
            R$ {balance.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted font-medium mt-1 relative z-10">Se tudo for pago/recebido</p>
        </div>
        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 size={48} />
          </div>
          <p className="text-xs uppercase tracking-wider font-bold text-muted mb-1 relative z-10">Saldo Atualizado</p>
          <p className={cn("text-2xl font-black tracking-tight relative z-10", currentBalance >= 0 ? "text-success" : "text-danger")}>
            R$ {currentBalance.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted font-medium mt-1 relative z-10">Baseado nos efetivados</p>
        </div>
        <div className="glass border border-flat rounded-3xl p-5 shadow-sm flex flex-col justify-center">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted font-medium text-xs uppercase tracking-wider">Total Entradas</span>
            <span className="font-bold text-success">+ R$ {totalIn.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted font-medium text-xs uppercase tracking-wider">Total Saídas</span>
            <span className="font-bold text-danger">- R$ {totalOut.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Lista do Extrato */}
      <div className="glass border border-flat rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-flat flex items-center justify-between bg-surface-1/50 flex-wrap gap-3">
          <h3 className="font-extrabold text-ink flex items-center gap-2">
            <CalendarDays size={18} className="text-ink/60" />
            Lançamentos do Mês
          </h3>
          <div className="flex items-center gap-2 bg-surface-1 p-1 rounded-xl border border-flat">
            <button 
              onClick={() => setGroupByCard(true)}
              className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors", groupByCard ? "bg-ink text-surface" : "text-muted hover:text-ink")}
            >
              Fatura Única
            </button>
            <button 
              onClick={() => setGroupByCard(false)}
              className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors", !groupByCard ? "bg-ink text-surface" : "text-muted hover:text-ink")}
            >
              Detalhar Compras
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {items.length === 0 ? (
            <p className="text-center text-sm text-muted py-8 font-medium">Nenhum lançamento encontrado neste mês.</p>
          ) : (
            items.map((item) => {
              const payDateStr = item.payments[yearMonth];
              const isPaid = Boolean(payDateStr);
              const payDate = typeof payDateStr === "string" ? new Date(payDateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : null;
              const pLabel = parcelaLabel(item, yearMonth);
              const isFakeCardItem = item.id.startsWith("card-");
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex items-center justify-between p-4 transition-colors group border-b border-flat/60 last:border-0",
                    isFakeCardItem ? "bg-info/5 hover:bg-info/10" : "hover:bg-surface-1"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-10 shrink-0">
                      <span className="text-[10px] font-bold text-muted uppercase">Dia</span>
                      <span className="text-lg font-black text-ink leading-none">{String(item.dueDay).padStart(2, "0")}</span>
                    </div>
                    
                    <div className={cn(
                      "w-10 h-10 rounded-full grid place-items-center shrink-0 border bg-surface-1",
                      item.isIncome ? "border-success/30" : isFakeCardItem ? "border-info/30" : "border-flat"
                    )}>
                      {item.isIncome ? (
                        <ArrowDownRight size={16} className="text-success" />
                      ) : item.isCartao ? (
                        <CreditCard size={16} className="text-info" />
                      ) : (
                        <ArrowUpRight size={16} className="text-danger" />
                      )}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-bold truncate max-w-[140px] sm:max-w-xs", isPaid ? "text-ink" : "text-ink/70")}>
                        {item.name} {pLabel && <span className="text-[10px] text-muted ml-1 bg-surface-2 px-1.5 py-0.5 rounded-full">{pLabel}</span>}
                      </span>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                        {item.group || item.category} {item.isCartao && !groupByCard && `• ${item.cartaoNome}`}
                        {isPaid && payDate && <span className="text-success/80"> • Pago dia {payDate}</span>}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "text-sm sm:text-base font-black tabular-nums",
                      item.isIncome ? "text-success" : "text-ink",
                      !isPaid && "opacity-60"
                    )}>
                      {item.isIncome ? "+" : "-"} R$ {item.amount.toFixed(2)}
                    </span>
                    {!isFakeCardItem ? (
                      <button 
                        onClick={() => togglePaidExpense(item.id, yearMonth)}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          isPaid ? "text-success bg-success/10 hover:bg-success/20" : "text-muted hover:text-ink hover:bg-surface-2"
                        )}
                        title={isPaid ? (item.isIncome ? "Desmarcar Recebimento" : "Desmarcar Pagamento") : (item.isIncome ? "Marcar como Recebido" : "Marcar como Pago")}
                      >
                        {isPaid ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                    ) : (
                       <div className="w-8 h-8 flex items-center justify-center">
                         {isPaid && <CheckCircle2 size={18} className="text-success" />}
                       </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
