"use client";
import { useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useFinanceStore, isExpenseActiveInMonth } from "@/store/useFinanceStore";
import { useGameStore } from "@/store/useGameStore";

function toYM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useMcpSync() {
  const tasks = useTaskStore((s) => s.tasks);
  const expenses = useFinanceStore((s) => s.expenses);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const streakDays = useGameStore((s) => s.streakDays);
  const todayXp = useGameStore((s) => s.todayXp);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Debounce — espera 2s após última mudança antes de sincronizar
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const now = new Date();
        const yearMonth = toYM(now);
        const activeExpenses = expenses.filter((e) => isExpenseActiveInMonth(e, yearMonth));

        await fetch("/api/mcp/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              column: t.column,
              priority: t.priority,
              dueDate: t.dueDate,
              completedAt: t.completedAt,
              tags: t.tags,
            })),
            expenses: activeExpenses.map((e) => ({
              id: e.id,
              name: e.name,
              amount: e.amount,
              dueDay: e.dueDay,
              category: e.category,
              group: e.group,
              tipo: e.tipo,
              isCartao: e.isCartao,
              cartaoNome: e.cartaoNome,
              paidThisMonth: !!e.payments[yearMonth],
            })),
            game: { level, xp, streakDays, todayXp },
            syncedAt: now.toLocaleString("pt-BR"),
          }),
        });
      } catch {
        // silencioso — sync falhou, sem impacto no usuário
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tasks, expenses, xp, level, streakDays, todayXp]);
}
