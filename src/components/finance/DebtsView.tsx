"use client";
import { useFinanceStore, RecurringExpense, isExpenseActiveInMonth } from "@/store/useFinanceStore";
import { AlertCircle, CalendarClock, ClockAlert } from "lucide-react";
import { ExpenseRow } from "./ExpenseList";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DebtsView({ yearMonth, onEdit }: { yearMonth: string, onEdit: (id: string) => void }) {
  const allExpenses = useFinanceStore(s => s.expenses);
  const togglePaid = useFinanceStore(s => s.togglePaid);
  const remove = useFinanceStore(s => s.remove);
  
  const [cy, cm] = yearMonth.split("-").map(Number);
  const now = new Date();
  const realY = now.getFullYear();
  const realM = now.getMonth() + 1;
  const currentDay = now.getDate();
  
  const lateThisMonth: { expense: RecurringExpense; month: string; amount: number }[] = [];
  const manualDebts: { expense: RecurringExpense; month: string; amount: number }[] = [];
  
  for (const e of allExpenses) {
    if (e.isIncome || e.isInvestimento) continue;
    
    if (isExpenseActiveInMonth(e, yearMonth)) {
      if (e.group === "Dívida") {
        manualDebts.push({ expense: e, month: yearMonth, amount: e.amount });
      } else if (!e.payments[yearMonth]) {
        // Auto-track late bills ONLY for the current real month
        if (cy === realY && cm === realM && currentDay > e.dueDay) {
          lateThisMonth.push({ expense: e, month: yearMonth, amount: e.amount });
        }
      }
    }
  }
  
  const totalLate = lateThisMonth.reduce((a, e) => a + e.amount, 0);
  const totalManual = manualDebts.reduce((a, e) => a + e.amount, 0);
  
  return (
    <div className="space-y-6 w-full">
      <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-start justify-between gap-3 w-full">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-danger leading-tight mb-1">Dívidas e Atrasos</h3>
            <p className="text-[10px] text-danger/80 leading-relaxed max-w-md">
              Acompanhe as dívidas lançadas manualmente e veja automaticamente as contas vencidas e não pagas do mês atual.
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            // we have to tell page.tsx to open editing.
            // But DebtsView only has onEdit(id) which expects an ID to edit.
            // Oh, we can just call onEdit("") to signal a new one.
            onEdit("");
          }}
          className="bg-danger text-white hover:bg-danger/90 transition px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 border-none"
        >
          Lançar Dívida
        </button>
      </div>
      
      {/* Atrasos deste Mês */}
      <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center justify-between border-b border-flat pb-2">
          <span className="flex items-center gap-1.5 text-danger"><ClockAlert size={13} /> Vencidos deste mês</span>
          <span className="font-bold text-danger">{fmt(totalLate)}</span>
        </h3>
        {lateThisMonth.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">Nenhuma conta vencida este mês!</p>
        ) : (
          <div className="space-y-1.5">
            {lateThisMonth.map((item, i) => (
              <ExpenseRow 
                key={item.expense.id + "-" + item.month + "-" + i} 
                expense={item.expense} 
                yearMonth={item.month} 
                onEdit={onEdit} 
                onToggle={() => togglePaid(item.expense.id, item.month)} 
                onRemove={() => { if(confirm("Remover despesa?")) remove(item.expense.id) }} 
                showCategory 
              />
            ))}
          </div>
        )}
      </div>

      {/* Acumulados de Meses Anteriores / Manuais */}
      <div className="glass rounded-3xl p-5 border border-flat flex flex-col gap-4 w-full">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center justify-between border-b border-flat pb-2">
          <span className="flex items-center gap-1.5 text-danger"><CalendarClock size={13} /> Dívidas Anteriores (Lançadas Manualmente)</span>
          <span className="font-bold text-danger">{fmt(totalManual)}</span>
        </h3>
        {manualDebts.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">Nenhuma dívida lançada manualmente!</p>
        ) : (
          <div className="space-y-1.5 w-full">
            {manualDebts.map((item, i) => (
              <ExpenseRow 
                key={item.expense.id + "-" + item.month + "-" + i} 
                expense={item.expense} 
                yearMonth={item.month} 
                onEdit={onEdit} 
                onToggle={() => togglePaid(item.expense.id, item.month)} 
                onRemove={() => { if(confirm("Remover despesa?")) remove(item.expense.id) }} 
                showCategory 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
