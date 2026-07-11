"use client";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Settings,
  Zap,
  Plug,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAiStore } from "@/store/useAiStore";
import { chatComplete, AiError, type ChatMessage } from "@/lib/ai/chat";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useMcpTools, callMcpTool } from "@/hooks/useMcpTools";
import { NATIVE_TOOLS, executeNativeTool } from "@/lib/ai/nativeTools";
import { useTaskStore } from "@/store/useTaskStore";
import { useAgendaStore } from "@/store/useAgendaStore";
import {
  useFinanceStore,
  isExpenseActiveInMonth,
} from "@/store/useFinanceStore";
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

function buildAppContext(): string {
  const now = new Date();
  const today = now.getDate();
  const todayTs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const endOfToday = todayTs + 86_400_000;
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("pt-BR");
  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const tasks = useTaskStore.getState().tasks;
  const pending = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => !!t.completedAt);
  const overdue = pending.filter((t) => t.dueDate && t.dueDate < todayTs);
  const dueToday = pending.filter(
    (t) => t.dueDate && t.dueDate >= todayTs && t.dueDate < endOfToday,
  );

  const appointments = useAgendaStore.getState().appointments;
  const todayAppts = appointments.filter(
    (a) => a.date >= todayTs && a.date < endOfToday,
  );

  const expenses = useFinanceStore.getState().expenses;
  const activeExp = expenses.filter((e) =>
    isExpenseActiveInMonth(e, yearMonth),
  );
  const unpaidToday = activeExp.filter(
    (e) => e.dueDay === today && !e.payments?.[yearMonth],
  );
  const unpaidAll = activeExp.filter((e) => !e.payments?.[yearMonth]);
  const paidAll = activeExp.filter((e) => !!e.payments?.[yearMonth]);

  const game = useGameStore.getState();

  const lines: string[] = [
    `=== DADOS DO HEXXA — ${now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} ===`,
    "",
    `--- TAREFAS ---`,
    `Total: ${tasks.length} | Pendentes: ${pending.length} | Concluídas: ${done.length}`,
    overdue.length > 0
      ? `ATRASADAS (${overdue.length}): ${overdue.map((t) => `"${t.title}"(venceu ${fmtDate(t.dueDate!)})`).join("; ")}`
      : "Nenhuma tarefa atrasada.",
    dueToday.length > 0
      ? `VENCEM HOJE (${dueToday.length}): ${dueToday.map((t) => `"${t.title}"`).join("; ")}`
      : "Nenhuma tarefa vence hoje.",
    pending.length > 0
      ? `TODAS PENDENTES: ${pending
          .slice(0, 20)
          .map(
            (t) =>
              `"${t.title}"${t.dueDate ? ` [prazo: ${fmtDate(t.dueDate)}]` : ""}${t.priority !== "medium" ? ` [${t.priority}]` : ""}`,
          )
          .join("; ")}`
      : "",
    "",
    `--- AGENDA DE HOJE ---`,
    todayAppts.length > 0
      ? todayAppts
          .map(
            (a) =>
              `• ${fmtTime(a.date)} — ${a.title}${a.endDate ? ` até ${fmtTime(a.endDate)}` : ""}`,
          )
          .join("\n")
      : "Nenhum compromisso hoje.",
    "",
    `--- FINANÇAS (${yearMonth}) ---`,
    `Total de despesas: ${activeExp.length} | Pagas: ${paidAll.length} | A pagar: ${unpaidAll.length}`,
    unpaidToday.length > 0
      ? `VENCEM HOJE: ${unpaidToday.map((e) => `${e.name} (${fmt(e.amount)})`).join("; ")}`
      : "Nenhuma conta vence hoje.",
    unpaidAll.length > 0
      ? `A PAGAR NO MÊS: ${unpaidAll
          .slice(0, 15)
          .map((e) => `${e.name} — ${fmt(e.amount)} — dia ${e.dueDay}`)
          .join("; ")}`
      : "Todas as contas do mês estão pagas.",
    `Total a pagar: ${fmt(unpaidAll.reduce((s, e) => s + e.amount, 0))}`,
    `Total já pago: ${fmt(paidAll.reduce((s, e) => s + e.amount, 0))}`,
    "",
    `--- GAMIFICAÇÃO ---`,
    `Nível: ${game.level} | XP total: ${game.xp} | Streak: ${game.streakDays} dias | XP hoje: ${game.todayXp}`,
  ];

  return lines.filter(Boolean).join("\n");
}

function parseToolCall(
  text: string,
): { name: string; arguments: Record<string, unknown> } | null {
  const match = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function stripToolCall(text: string) {
  return text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();
}

export function ChatPanel() {
  const { provider, getActiveKey } = useAiStore();
  const apiKey = getActiveKey();
  const assistantName = useAiStore((s) => s.assistantName);
  const messages = useAiStore((s) => s.messages);
  const appendMessage = useAiStore((s) => s.appendMessage);
  const updateMessage = useAiStore((s) => s.updateMessage);
  const clearMessages = useAiStore((s) => s.clearMessages);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { tools } = useMcpTools();

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, busy]);

  function buildSystemPrompt() {
    const appCtx = buildAppContext();

    let prompt = `Você é ${assistantName}, o copilot pessoal do usuário no AIA OS — um app de produtividade. Você tem acesso completo aos dados atuais do app (tarefas, finanças, agenda, gamificação). Use esses dados para responder perguntas concretas, dar alertas úteis e sugerir ações. Seja direto, prático e responda sempre em português brasileiro.

${appCtx}

--- FERRAMENTAS DO SISTEMA (NATIVAS) ---
Você tem a capacidade de alterar e criar dados no sistema utilizando as ferramentas nativas abaixo:
${NATIVE_TOOLS.map((t) => `• ${t.name}: ${t.description} (Parâmetros: ${JSON.stringify(t.parameters)})`).join("\n")}
`;

    if (tools.length > 0) {
      prompt += `\n\n--- FERRAMENTAS MCP EXTERNAS ---\n`;
      for (const t of tools) {
        prompt += `• [${t.serverName}] ${t.name}: ${t.description}\n`;
      }
    }
    
    prompt += `\nQuando quiser executar uma ferramenta (nativa ou externa), responda SOMENTE com:\n<tool_call>{"name":"nome_da_ferramenta","arguments": {"param":"valor"}}</tool_call>\nApós receber o resultado, continue respondendo normalmente em português.`;

    return prompt;
  }

  async function send() {
    const text = input.trim();
    if (!text || busy || !apiKey) return;

    setInput("");
    setBusy(true);
    appendMessage({ role: "user", content: text });
    const placeholderId = appendMessage({ role: "assistant", content: "" });

    try {
      const history: ChatMessage[] = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text });

      let loopHistory = [...history];
      let finalReply = "";

      for (let round = 0; round < 5; round++) {
        const reply = await chatComplete({
          provider,
          apiKey,
          messages: loopHistory,
          system: buildSystemPrompt(),
        });

        const toolCall = parseToolCall(reply);
        if (!toolCall) {
          finalReply = reply;
          break;
        }

        const isNative = NATIVE_TOOLS.some((t) => t.name === toolCall.name);
        let toolResult = "";
        let toolName = toolCall.name;

        if (isNative) {
          updateMessage(placeholderId, {
            content: `Executando sistema → ${toolCall.name}…`,
          });
          toolResult = await executeNativeTool(toolCall.name, toolCall.arguments);
        } else {
          const tool = tools.find((t) => t.name === toolCall.name);
          if (!tool) {
            finalReply = `Ferramenta "${toolCall.name}" não encontrada.`;
            break;
          }
          updateMessage(placeholderId, {
            content: `Usando ${tool.serverName} → ${tool.name}…`,
          });
          toolResult = await callMcpTool(
            tool.serverUrl,
            tool.name,
            toolCall.arguments,
          );
        }

        loopHistory = [
          ...loopHistory,
          { role: "assistant", content: reply },
          {
            role: "user",
            content: `Resultado de ${toolName}:\n${toolResult}`,
          },
        ];
      }

      updateMessage(placeholderId, { content: finalReply });
    } catch (e) {
      const msg =
        e instanceof AiError
          ? `Erro ${e.status}: ${e.message}`
          : e instanceof Error
            ? e.message
            : "Falha desconhecida";
      updateMessage(placeholderId, { content: msg, error: true });
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      <div className="glass rounded-3xl flex flex-col h-[calc(100dvh-160px)] sm:h-[calc(100vh-220px)] min-h-[400px]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ink/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-ink grid place-items-center shrink-0">
              <Zap size={13} className="text-lime" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate">
                {assistantName}
              </div>
              <div className="text-[10px] text-muted">
                {providerLabel}
              </div>
            </div>
            {tools.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-success/10 text-success text-[10px] font-semibold shrink-0">
                <Plug size={9} /> {tools.length} tools
              </div>
            )}
            {apiKey && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-lime/20 text-ink text-[10px] font-semibold shrink-0">
                gratuito
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Apagar todo o histórico?")) clearMessages();
                }}
                className="p-1.5 rounded-xl hover:bg-danger/10 transition text-muted hover:text-danger"
                title="Limpar histórico"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              <Bot size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">
                {assistantName} pronto para ajudar.
              </p>
              <p className="text-[11px] mt-1 text-muted/70">
                {apiKey
                  ? tools.length > 0
                    ? `${tools.length} ferramenta${tools.length > 1 ? "s" : ""} MCP conectada${tools.length > 1 ? "s" : ""}.`
                    : "Pergunte sobre suas tarefas, finanças ou rotina."
                  : "Vá em Ajustes -> Aia para configurar sua chave."}
              </p>
            </div>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-2.5 items-start",
                m.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-7 h-7 rounded-full grid place-items-center text-xs",
                  m.role === "user"
                    ? "bg-ink text-lime"
                    : "bg-sage/60 text-ink",
                )}
              >
                {m.role === "user" ? <User size={13} /> : <Bot size={13} />}
              </div>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words leading-relaxed",
                  m.role === "user" ? "bg-ink text-white" : "bg-surface-2",
                  m.error && "bg-danger/10 text-danger border border-danger/20",
                )}
              >
                {m.taskRef && m.role === "user" && (
                  <div className="text-[10px] mb-1 opacity-70">
                    {" "}
                    contexto: {m.taskRef.title}
                  </div>
                )}
                {m.error && <AlertCircle size={12} className="inline mr-1" />}
                {m.content ? (
                  stripToolCall(m.content)
                ) : (
                  <Loader2 size={14} className="animate-spin inline" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-ink/5 p-4 space-y-2">
          {!apiKey ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-warning/10 text-sm">
              <div>
                <p className="font-semibold text-warning text-sm">
                  {" "}
                  Configure o Provedor IA
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Vá em Ajustes para adicionar suas chaves.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Pergunte para ${assistantName}…`}
                rows={2}
                className="flex-1"
              />
              <Button onClick={send} disabled={busy || !input.trim()}>
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </Button>
            </div>
          )}
          <p className="hidden sm:block text-[10px] text-muted text-center">
            Enter envia · Shift+Enter quebra linha
          </p>
        </div>
      </div>
    </>
  );
}
