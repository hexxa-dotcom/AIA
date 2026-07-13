"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckSquare,
  Wallet,
  AlertCircle,
  KeyRound,
  ThermometerSun,
  Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { useTaskStore } from "@/store/useTaskStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAiStore } from "@/store/useAiStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { chatComplete } from "@/lib/ai/chat";
import { getTodaysMessage } from "@/lib/motivational";

// ── helpers ───────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function minToHHMM(min: number) {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ── types ─────────────────────────────────────────────────────────────────────

interface DayData {
  routines: { title: string; emoji?: string; start: string; end: string }[];
  tasks: { title: string; priority: string; column: string }[];
  bills: { name: string; amount: number; category: string }[];
}

// ── data collector ────────────────────────────────────────────────────────────

function collectDay(): DayData {
  const now = new Date();
  const dayOfMonth = now.getDate();

  const routineBlocks = useRoutineStore.getState().blocksForDate(now);
  const allTasks = useTaskStore.getState().tasks;
  const allExpenses = useFinanceStore.getState().expenses;

  const routines = routineBlocks.map((b) => ({
    title: b.title,
    emoji: b.emoji,
    start: minToHHMM(b.startMinute),
    end: minToHHMM(b.endMinute),
  }));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = allTasks
    .filter((t) => {
      if (t.column === "done") return false;
      if (t.column === "today" || t.column === "doing") return true;
      if (
        t.dueDate &&
        t.dueDate >= startOfDay.getTime() &&
        t.dueDate <= endOfDay.getTime()
      )
        return true;
      return false;
    })
    .map((t) => ({ title: t.title, priority: t.priority, column: t.column }));

  const bills = allExpenses
    .filter((e) => e.isActive && e.dueDay === dayOfMonth)
    .map((e) => ({ name: e.name, amount: e.amount, category: e.category }));

  return { routines, tasks, bills };
}

// ── prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(data: DayData): string {
  const dow = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ][new Date().getDay()];
  const date = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
  const lines: string[] = [`Hoje é ${dow}, ${date}.`, ""];

  if (data.routines.length > 0) {
    lines.push(`ROTINAS DO DIA (${data.routines.length}):`);
    data.routines.forEach((r) =>
      lines.push(`- ${r.title}: ${r.start} – ${r.end}`),
    );
    lines.push("");
  }
  if (data.tasks.length > 0) {
    lines.push(`TAREFAS PARA HOJE (${data.tasks.length}):`);
    data.tasks.forEach((t) => {
      const col =
        t.column === "today"
          ? "a fazer"
          : t.column === "doing"
            ? "em andamento"
            : "com prazo hoje";
      lines.push(`- [${t.priority.toUpperCase()}] ${t.title} (${col})`);
    });
    lines.push("");
  }
  if (data.bills.length > 0) {
    lines.push(`CONTAS COM VENCIMENTO HOJE (${data.bills.length}):`);
    data.bills.forEach((b) =>
      lines.push(`- ${b.name}: R$ ${fmt(b.amount)} (${b.category})`),
    );
    lines.push("");
  }
  if (!data.routines.length && !data.tasks.length && !data.bills.length) {
    lines.push("Sem atividades registradas para hoje.");
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Você é o assistente pessoal do AIA OS, um app de produtividade.
Gere um briefing matinal conciso e motivador em português (pt-BR) com base nas atividades do dia.
Use no máximo 4 frases curtas. Seja direto, positivo e prático.
Não repita cada item individualmente — faça um resumo inteligente destacando o que é mais importante.
Termine com uma frase de incentivo adaptada à carga do dia (leve, moderada ou intensa).
Não use markdown, asteriscos ou listas — apenas texto corrido.`;

// ── main component ────────────────────────────────────────────────────────────

const CACHE_PREFIX = "aia-briefing-";
const COLLAPSED_PREFIX = "aia-briefing-col-";

export function FeedDailyBriefing() {
  const provider = useAiStore((s) => s.provider);
  const apiKey = useAiStore((s) => s.provider === "groq" ? s.groqKey : s.apiKey);
  const model = useAiStore((s) => s.models.system);

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false); // detalhe do dia
  const [collapsed, setCollapsed] = useState(false); // card recolhido
  const [dayData, setDayData] = useState<DayData | null>(null);
  const generatingRef = useRef(false);
  const motivationalStyle = usePerfilStore((s) => s.motivationalStyle ?? "famous");
  const message = useMemo(() => getTodaysMessage(motivationalStyle), [motivationalStyle]);

  async function generate(force = false) {
    if (generatingRef.current) return;
    const key = CACHE_PREFIX + todayKey();
    if (!force) {
      const cached = localStorage.getItem(key);
      if (cached) {
        setText(cached);
        return;
      }
    }
    if (!apiKey?.trim()) {
      setError("no-key");
      return;
    }

    generatingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = collectDay();
      setDayData(data);
      
      const stylePrompts = {
        biblia: "Por favor, inclua um Provérbio bíblico inspirador e sua referência (ex: Provérbios 16:3) adequado para motivar o dia do usuário.",
        stoic: "Por favor, inclua uma citação estoica clássica (ex: Sêneca, Marco Aurélio, Epicteto) adequada para inspirar foco, controle mental e resiliência.",
        startup: "Por favor, inclua uma frase de mentalidade startup, inovação, execução ágil ou negócios (ex: Steve Jobs, Reid Hoffman, Paul Graham, etc.).",
        famous: "Por favor, inclua uma citação famosa motivadora geral (ex: Albert Einstein, Winston Churchill, etc.).",
      };
      const finalSystemPrompt = `${SYSTEM_PROMPT}\n${stylePrompts[motivationalStyle] || stylePrompts.famous}`;

      const result = await chatComplete({
        provider,
        apiKey,
        model,
        messages: [{ role: "user", content: buildPrompt(data) }],
        system: finalSystemPrompt,
        maxTokens: 300,
        temperature: 0.65,
      });
      setText(result.trim());
      localStorage.setItem(key, result.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar briefing");
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  }

  // Carregar estado de colapso salvo
  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSED_PREFIX + todayKey());
    if (saved === "1") setCollapsed(true);

    const data = collectDay();
    setDayData(data);
    const cached = localStorage.getItem(CACHE_PREFIX + todayKey());
    if (cached) {
      setText(cached);
      return;
    }
    if (apiKey?.trim()) generate();
    else setError("no-key");
  }, []); // eslint-disable-line

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    if (next) {
      localStorage.setItem(COLLAPSED_PREFIX + todayKey(), "1");
    } else {
      localStorage.removeItem(COLLAPSED_PREFIX + todayKey());
    }
  }

  const dow = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ][new Date().getDay()];
  const now = new Date();
  const dateShort = now.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  const dateFmt = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  const hasData =
    dayData &&
    dayData.routines.length + dayData.tasks.length + dayData.bills.length > 0;

  return (
    <div className="glass rounded-3xl overflow-hidden border flex flex-col" style={{ borderColor: "var(--flat-border)" }}>
      {/* ── Top Section: Quote, Date, Temp ── */}
      <div className="p-4 sm:p-5 flex items-start justify-between">
        {/* Left side: Quote */}
        <div className="min-w-0 flex-1 pr-4">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight text-ink mb-1">
            "{message.text}"
          </h1>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
              — {message.author}
            </p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--flat-border)" }} />

      {/* ── Header — Briefing Toggle ── */}
      <button
        onClick={toggleCollapse}
        className="w-full flex items-center justify-between px-5 py-3 text-left group hover:bg-ink/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl grid place-items-center shrink-0 shadow-sm"
            style={{ background: "var(--color-surface-2)" }}
          >
            <Sparkles size={13} style={{ color: "var(--color-ink)" }} />
          </div>
          <div>
            <p
              className="font-bold text-sm leading-tight"
              style={{ color: "var(--color-ink)" }}
            >
              Resumo Inteligente do Dia
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>
              O que você precisa saber hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chips — visíveis quando recolhido */}
          {collapsed && hasData && (
            <div className="flex items-center gap-1.5">
              {dayData!.routines.length > 0 && (
                <span
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-muted)",
                  }}
                >
                  <Clock size={8} /> {dayData!.routines.length} rotina
                  {dayData!.routines.length !== 1 ? "s" : ""}
                </span>
              )}
              {dayData!.tasks.length > 0 && (
                <span
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-muted)",
                  }}
                >
                  <CheckSquare size={8} /> {dayData!.tasks.length} tarefa
                  {dayData!.tasks.length !== 1 ? "s" : ""}
                </span>
              )}
              {dayData!.bills.length > 0 && (
                <span
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-muted)",
                  }}
                >
                  <Wallet size={8} /> {dayData!.bills.length}
                </span>
              )}
            </div>
          )}

          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            style={{ color: "var(--color-muted)" }}
          >
            <ChevronDown size={15} />
          </motion.div>
        </div>
      </button>

      {/* ── Body — animado ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {/* Loading */}
              {loading && (
                <div
                  className="flex items-center gap-2"
                  style={{ color: "var(--color-muted)" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--color-ink)" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.2,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs">Analisando seu dia…</span>
                </div>
              )}

              {/* Sem chave */}
              {!loading && error === "no-key" && (
                <div className="flex items-start gap-2.5">
                  <KeyRound
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--color-muted)" }}
                  />
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-muted)" }}
                    >
                      Configure sua chave de IA para gerar o resumo automático.
                    </p>
                    <Link
                      href="/copilot"
                      className="text-[11px] underline underline-offset-2 hover:opacity-80 mt-1 inline-block"
                      style={{ color: "var(--color-ink)" }}
                    >
                      Configurar chave →
                    </Link>
                  </div>
                </div>
              )}

              {/* Erro */}
              {!loading && error && error !== "no-key" && (
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={13}
                    className="text-danger mt-0.5 shrink-0"
                  />
                  <p className="text-[11px] text-danger/80 flex-1">{error}</p>
                  <button
                    onClick={() => generate(true)}
                    className="text-[10px] underline shrink-0"
                    style={{ color: "var(--color-ink)" }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Texto IA */}
              {!loading && text && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-ink)" }}
                >
                  {text}
                </p>
              )}

              {/* Chips de resumo */}
              {hasData && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {dayData!.routines.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--color-surface-2)",
                        color: "var(--color-ink)",
                      }}
                    >
                      <Clock size={9} /> {dayData!.routines.length} rotina
                      {dayData!.routines.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {dayData!.tasks.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--color-surface-2)",
                        color: "var(--color-muted)",
                      }}
                    >
                      <CheckSquare size={9} /> {dayData!.tasks.length} tarefa
                      {dayData!.tasks.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {dayData!.bills.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: "var(--color-surface-2)",
                        color: "var(--color-muted)",
                      }}
                    >
                      <Wallet size={9} /> {dayData!.bills.length} conta
                      {dayData!.bills.length !== 1 ? "s" : ""} vencem hoje
                    </span>
                  )}

                  {/* Regenerar */}
                  {text && !loading && (
                    <button
                      onClick={() => generate(true)}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full ml-auto transition hover:bg-white/10"
                      style={{ color: "var(--color-muted)" }}
                    >
                      <RefreshCw size={8} /> Regenerar
                    </button>
                  )}
                </div>
              )}

              {/* Toggle detalhe */}
              {hasData && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-medium transition hover:opacity-80"
                  style={{ color: "var(--color-muted)" }}
                >
                  {expanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {expanded ? "Ocultar detalhes" : "Ver detalhes do dia"}
                </button>
              )}

              {/* Detalhe expandido */}
              <AnimatePresence>
                {expanded && hasData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="space-y-4 pt-2 border-t"
                      style={{ borderColor: "var(--flat-border)" }}
                    >
                      {dayData!.routines.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {" "}
                            Rotinas
                          </p>
                          <div className="space-y-1">
                            {dayData!.routines.map((r, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5"
                              >
                                <span className="text-base leading-none">
                                  
                                </span>
                                <p
                                  className="flex-1 text-xs font-medium truncate"
                                  style={{ color: "var(--color-ink)" }}
                                >
                                  {r.title}
                                </p>
                                <span
                                  className="text-[10px] shrink-0 tabular-nums"
                                  style={{ color: "var(--color-muted)" }}
                                >
                                  {r.start} – {r.end}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dayData!.tasks.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {" "}
                            Tarefas
                          </p>
                          <div className="space-y-1">
                            {dayData!.tasks.map((t, i) => {
                              const c: Record<string, string> = {
                                urgent: "var(--prio-urgent)",
                                high: "var(--prio-high)",
                                medium: "var(--prio-medium)",
                                low: "var(--prio-low)",
                              };
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-2.5"
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{
                                      background: c[t.priority] ?? "#888",
                                    }}
                                  />
                                  <p
                                    className="flex-1 text-xs truncate"
                                    style={{ color: "var(--color-ink)" }}
                                  >
                                    {t.title}
                                  </p>
                                  <span
                                    className="text-[9px] shrink-0"
                                    style={{ color: "var(--color-muted)" }}
                                  >
                                    {t.column === "today"
                                      ? "hoje"
                                      : t.column === "doing"
                                        ? "em andamento"
                                        : "prazo hoje"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {dayData!.bills.length > 0 && (
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-2"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {" "}
                            Contas vencem hoje
                          </p>
                          <div className="space-y-1">
                            {dayData!.bills.map((b, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5"
                              >
                                <p
                                  className="flex-1 text-xs truncate"
                                  style={{ color: "var(--color-ink)" }}
                                >
                                  {b.name}
                                </p>
                                <span
                                  className="text-[11px] font-semibold shrink-0 tabular-nums"
                                  style={{ color: "var(--color-muted)" }}
                                >
                                  R$ {fmt(b.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
