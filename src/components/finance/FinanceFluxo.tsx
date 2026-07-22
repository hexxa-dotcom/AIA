"use client";
import { useMemo } from "react";
import { useFinanceStore, isExpenseActiveInMonth } from "@/store/useFinanceStore";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceFluxoProps {
  yearMonth: string;
}

export function FinanceFluxo({ yearMonth }: FinanceFluxoProps) {
  const expenses = useFinanceStore((s) => s.expenses);

  // We want to calculate cash flow for the current month, and maybe past 3 months
  const monthsData = useMemo(() => {
    // Generate array of last 4 months including current
    const [cy, cm] = yearMonth.split("-").map(Number);
    const months = [];
    for (let i = 3; i >= 0; i--) {
      let m = cm - i;
      let y = cy;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }

    return months.map(ym => {
      let tIn = 0;
      let tOut = 0;
      let tPaidIn = 0;
      let tPaidOut = 0;

      expenses.forEach(e => {
        if (!e.isInvestimento && isExpenseActiveInMonth(e, ym)) {
          const isPaid = !!e.payments[ym];
          if (e.isIncome) {
            tIn += e.amount;
            if (isPaid) tPaidIn += e.amount;
          } else {
            tOut += e.amount;
            if (isPaid) tPaidOut += e.amount;
          }
        }
      });

      return {
        yearMonth: ym,
        totalIn: tIn,
        totalOut: tOut,
        balance: tIn - tOut,
        paidIn: tPaidIn,
        paidOut: tPaidOut,
        paidBalance: tPaidIn - tPaidOut
      };
    });
  }, [expenses, yearMonth]);

  const currentMonthData = monthsData[monthsData.length - 1];
  
  // Comprometimento da renda = (Saídas / Entradas) * 100
  const commitmentPct = currentMonthData.totalIn > 0 
    ? (currentMonthData.totalOut / currentMonthData.totalIn) * 100 
    : 0;
  
  // Find max value to scale the bars correctly
  const maxAbsValue = Math.max(
    ...monthsData.flatMap(d => [d.totalIn, d.totalOut])
  ) || 1; // avoid division by 0

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
      
      {/* Cards Textuais de Resumo (Opção 1 solicitada pelo usuário) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-success/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <TrendingUp size={100} />
          </div>
          <div className="flex items-center gap-2 text-success mb-2">
            <TrendingUp size={18} />
            <h4 className="font-bold text-xs uppercase tracking-wider">Entradas</h4>
          </div>
          <p className="text-2xl font-black tracking-tight text-ink">
            R$ {currentMonthData.totalIn.toFixed(2)}
          </p>
          <div className="mt-2 text-[10px] font-medium text-muted flex items-center justify-between">
            <span>Recebido: R$ {currentMonthData.paidIn.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-danger/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <TrendingDown size={100} />
          </div>
          <div className="flex items-center gap-2 text-danger mb-2">
            <TrendingDown size={18} />
            <h4 className="font-bold text-xs uppercase tracking-wider">Saídas</h4>
          </div>
          <p className="text-2xl font-black tracking-tight text-ink">
            R$ {currentMonthData.totalOut.toFixed(2)}
          </p>
          <div className="mt-2 text-[10px] font-medium text-muted flex items-center justify-between">
            <span>Pago: R$ {currentMonthData.paidOut.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-info/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <DollarSign size={100} />
          </div>
          <div className="flex items-center gap-2 text-info mb-2">
            <DollarSign size={18} />
            <h4 className="font-bold text-xs uppercase tracking-wider">Sobras (Balanço)</h4>
          </div>
          <p className={cn("text-2xl font-black tracking-tight", currentMonthData.balance >= 0 ? "text-success" : "text-danger")}>
            R$ {currentMonthData.balance.toFixed(2)}
          </p>
          <div className="mt-2 text-[10px] font-medium text-muted flex items-center justify-between">
            <span>Atual: R$ {currentMonthData.paidBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="glass border border-flat rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Target size={100} />
          </div>
          <div className="flex items-center gap-2 text-warning mb-2">
            <Target size={18} />
            <h4 className="font-bold text-xs uppercase tracking-wider">Comprometimento</h4>
          </div>
          <p className={cn("text-2xl font-black tracking-tight", commitmentPct > 80 ? "text-danger" : commitmentPct > 50 ? "text-warning" : "text-success")}>
            {commitmentPct.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-surface-2 h-1.5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full", commitmentPct > 80 ? "bg-danger" : commitmentPct > 50 ? "bg-warning" : "bg-success")}
              style={{ width: `${Math.min(commitmentPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gráfico Visual de Barras (Opção 2 solicitada pelo usuário) */}
      <div className="glass border border-flat rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <Activity size={20} className="text-ink" />
          <h3 className="font-extrabold text-ink text-lg tracking-tight">Evolução do Fluxo de Caixa</h3>
        </div>

        <div className="h-64 flex items-end gap-2 sm:gap-6 justify-between pt-4 border-b border-dashed border-flat/50">
          {monthsData.map((data) => {
            const inHeight = (data.totalIn / maxAbsValue) * 100;
            const outHeight = (data.totalOut / maxAbsValue) * 100;
            
            // Format YYYY-MM to MMM
            const [y, m] = data.yearMonth.split("-");
            const monthName = new Date(Number(y), Number(m) - 1).toLocaleString('pt-BR', { month: 'short' });

            return (
              <div key={data.yearMonth} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                
                {/* Tooltip on hover */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-surface text-[10px] p-2 rounded-xl flex flex-col gap-1 whitespace-nowrap pointer-events-none z-10 shadow-xl">
                  <div className="font-bold border-b border-surface/20 pb-1 mb-1">{monthName.toUpperCase()} {y}</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-surface/70">Entradas</span>
                    <span className="text-success font-bold">R$ {data.totalIn.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-surface/70">Saídas</span>
                    <span className="text-danger font-bold">R$ {data.totalOut.toFixed(0)}</span>
                  </div>
                </div>

                <div className="w-full max-w-[80px] flex items-end justify-center gap-1 sm:gap-2 h-full">
                  {/* Barra Entradas */}
                  <div 
                    className="w-1/2 bg-success/20 hover:bg-success/40 border border-success/30 rounded-t-lg transition-all relative overflow-hidden"
                    style={{ height: `${Math.max(inHeight, 2)}%` }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-success/80 transition-all"
                      style={{ height: `${data.totalIn > 0 ? (data.paidIn / data.totalIn) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* Barra Saídas */}
                  <div 
                    className="w-1/2 bg-danger/20 hover:bg-danger/40 border border-danger/30 rounded-t-lg transition-all relative overflow-hidden"
                    style={{ height: `${Math.max(outHeight, 2)}%` }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-danger/80 transition-all"
                      style={{ height: `${data.totalOut > 0 ? (data.paidOut / data.totalOut) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest mt-2",
                  data.yearMonth === yearMonth ? "text-ink" : "text-muted"
                )}>
                  {monthName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success/20 border border-success/30 relative overflow-hidden">
              <div className="absolute bottom-0 w-full h-1/2 bg-success/80" />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Entradas (Escuro = Recebido)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-danger/20 border border-danger/30 relative overflow-hidden">
              <div className="absolute bottom-0 w-full h-1/2 bg-danger/80" />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Saídas (Escuro = Pago)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
