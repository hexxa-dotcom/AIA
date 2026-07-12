"use client";
import { useState, useCallback } from "react";
import { Bot, RefreshCw, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAiStore } from "@/store/useAiStore";
import { useTaskStore } from "@/store/useTaskStore";
import {
  useFinanceStore,
  isExpenseActiveInMonth,
} from "@/store/useFinanceStore";
import { useGameStore } from "@/store/useGameStore";
import { chatComplete } from "@/lib/ai/chat";

function toYM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildContext(): string {
  const now = new Date();
  const today = now.getDate();
  const yearMonth = toYM(now);

  // Tasks
  const tasks = useTaskStore.getState().tasks;
  const overdue = tasks.filter(
    (t) => !t.completedAt && t.dueDate && t.dueDate < now.getTime(),
  );
  const pending = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => !!t.completedAt);

  // Finance
  const expenses = useFinanceStore.getState().expenses;
  const activeExpenses = expenses.filter((e) =>
    isExpenseActiveInMonth(e, yearMonth),
  );
  const unpaid = activeExpenses.filter((e) => !e.payments[yearMonth]);
  const dueToday = activeExpenses.filter(
    (e) => e.dueDay === today && !e.payments[yearMonth],
  );
  const dueSoon = activeExpenses.filter((e) => {
    const diff = e.dueDay - today;
    return diff > 0 && diff <= 7 && !e.payments[yearMonth];
  });
  const totalMonth = activeExpenses.reduce((a, e) => a + e.amount, 0);
  const totalPaid = activeExpenses
    .filter((e) => e.payments[yearMonth])
    .reduce((a, e) => a + e.amount, 0);

  // Game
  const game = useGameStore.getState();

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return `
Data de hoje: ${now.toLocaleDateString("pt-BR")}

=== TAREFAS ===
- Total de tarefas: ${tasks.length}
- Concluídas: ${done.length}
- Pendentes: ${pending.length}
- VENCIDAS (urgente): ${overdue.length}${
    overdue.length > 0
      ? "\n  Exemplos:" +
        overdue
          .slice(0, 3)
          .map((t) => t.title)
          .join(",")
      : ""
  }

=== FINANÇAS (${yearMonth}) ===
- Total do mês: ${fmt(totalMonth)}
- Já pago: ${fmt(totalPaid)}
- Pendente: ${fmt(totalMonth - totalPaid)}
- Contas não pagas: ${unpaid.length}
- Vencem HOJE: ${dueToday.map((e) => `${e.name} (${fmt(e.amount)})`).join(",") || "nenhuma"}
- Vencem nos próx 7 dias: ${dueSoon.map((e) => `${e.name} dia ${e.dueDay} (${fmt(e.amount)})`).join(",") || "nenhuma"}

=== GAMIFICAÇÃO ===
- Nível: ${game.level} | XP total: ${game.xp}
- Streak atual: ${game.streakDays} dias
- XP hoje: ${game.todayXp}
`.trim();
}

export function FeedAIInsights() {
  const provider = useAiStore((s) => s.provider);
  const apiKey = useAiStore((s) => s.provider === "groq" ? s.groqKey : s.apiKey);
  const model = useAiStore((s) => s.models.system);
  const assistantName = useAiStore((s) => s.assistantName);
  const config = { provider, apiKey, model };
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    if (!config.apiKey) return;
    setLoading(true);
    setError("");
    try {
      const ctx = buildContext();
      const result = await chatComplete({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        maxTokens: 600,
        temperature: 0.5,
        messages: [
          {
            role: "user",
            content: `Você é ${assistantName}, meu assistente pessoal. Com base nos dados abaixo do meu app de produtividade, me dê de 3 a 5 insights práticos e objetivos. Foque em alertas importantes, o que está bem e sugestões de melhoria. Seja direto e use emojis para facilitar a leitura. Responda em português.\n\n${ctx}`,
          },
        ],
      });
      setInsights(result);
      setGenerated(true);
    } catch (e: any) {
      setError(e.message || "Erro ao gerar insights.");
    } finally {
      setLoading(false);
    }
  }, [config, assistantName]);

  const hasKey = !!config.apiKey;

  return (
    <div className="bg-white rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-ink grid place-items-center">
            <Bot size={14} className="text-lime" />
          </div>
          <div>
            <div className="font-bold text-sm">Insights de {assistantName}</div>
            <div className="text-[11px] text-muted">
              Análise do seu app · Groq{" "}
            </div>
          </div>
        </div>

        {hasKey ? (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink text-lime text-xs font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            {generated ? "Atualizar" : "Gerar"}
          </button>
        ) : (
          <Link
            href="/copilot"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 text-xs font-semibold hover:bg-ink hover:text-white transition"
          >
            <Settings size={11} />
            Configurar
          </Link>
        )}
      </div>

      {!hasKey && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-2 text-sm text-muted">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" />
          <span>
            Configure sua chave de API na{""}
            <Link
              href="/copilot"
              className="text-ink font-semibold underline underline-offset-2"
            >
              AIA
            </Link>
            {""}
            para gerar insights automáticos sobre suas tarefas e finanças.
          </span>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 bg-surface-2 rounded-full"
              style={{ width: `${70 + i * 8}%` }}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {insights && !loading && (
        <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
          {insights}
        </div>
      )}

      {hasKey && !generated && !loading && (
        <div className="text-center py-4 text-muted text-sm">
          Clique em <strong>Gerar</strong> para analisar seus dados.
        </div>
      )}
    </div>
  );
}
