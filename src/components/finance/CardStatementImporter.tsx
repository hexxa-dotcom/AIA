"use client";
import { useState } from "react";
import { X, Sparkles, Check, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useAiStore } from "@/store/useAiStore";
import { chatComplete } from "@/lib/ai/chat";
import { Button } from "@/components/ui/Button";

interface ParsedItem {
  id: string;
  name: string;
  amount: number;
  totalParcelas?: number;
  parcelaAtual?: number;
  cartaoNome?: string;
  tipo: "parcela" | "unico" | "recorrente";
  checked: boolean;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// calculate parcelaInicio from parcelaAtual and current yearMonth
function calcParcelaInicio(parcelaAtual: number, yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const totalMonths = y * 12 + m - 1;
  const inicioMonths = totalMonths - (parcelaAtual - 1);
  const iy = Math.floor(inicioMonths / 12);
  const im = (inicioMonths % 12) + 1;
  return `${iy}-${String(im).padStart(2, "0")}`;
}

const SYSTEM_PROMPT = `Você é um assistente financeiro especializado em ler extratos de cartão de crédito brasileiro.

Analise o texto do extrato fornecido e extraia TODOS os lançamentos identificando:
- Se é parcelado (X/Y), recorrente ou avulso
- Valor da parcela ou valor total
- Nome do estabelecimento/serviço
- Nome do cartão (se mencionado)

Retorne APENAS um JSON válido no formato:
{"items":[{"name":"string","amount":number,"tipo":"parcela"|"unico"|"recorrente","totalParcelas":number|null,"parcelaAtual":number|null,"cartaoNome":"string"|null}]}

Regras:
- amount = valor da parcela atual (não o total)
- Para "AMAZON 3/12 R$150,00", retorne tipo:"parcela", totalParcelas:12, parcelaAtual:3, amount:150
- Para assinaturas fixas mensais, use tipo:"recorrente"
- Para compras únicas sem parcelas, use tipo:"unico"
- Não inclua texto fora do JSON`;

export function CardStatementImporter({
  yearMonth,
  onClose,
}: {
  yearMonth: string;
  onClose: () => void;
}) {
  const add   = useFinanceStore((s) => s.add);
  const provider = useAiStore((s) => s.provider);
  const aiKey = useAiStore((s) => s.provider === "groq" ? s.groqKey : s.apiKey);
  const aiModel = useAiStore((s) => s.models.system);

  const [text,    setText]    = useState("");
  const [items,   setItems]   = useState<ParsedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function analyze() {
    if (!text.trim()) { setError("Cole o texto da fatura antes de analisar."); return; }
    if (!aiKey) { setError("Configure sua chave de API em Ajustes → IA antes de usar este recurso."); return; }

    setLoading(true);
    setError("");
    try {
      const raw = await chatComplete({
        provider,
        apiKey: aiKey,
        model: aiModel,
        messages: [{ role: "user", content: `Extrato:\n\n${text}` }],
        system: SYSTEM_PROMPT,
        maxTokens: 2000,
        temperature: 0.1,
      });

      // extract JSON — the model may wrap in ```json ... ```
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("A IA não retornou JSON válido. Tente novamente.");
      const parsed = JSON.parse(match[0]) as { items: Omit<ParsedItem, "id" | "checked">[] };

      if (!parsed.items?.length) {
        setError("Nenhum lançamento identificado. Verifique se o texto é de um extrato de cartão.");
        return;
      }

      setItems(
        parsed.items.map((item, i) => ({
          ...item,
          id: String(i),
          checked: true,
          amount: typeof item.amount === "number" ? item.amount : parseFloat(String(item.amount)) || 0,
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao analisar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(id: string) {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, checked: !it.checked } : it));
  }

  function importSelected() {
    const selected = items.filter((it) => it.checked);
    selected.forEach((it) => {
      const parcelaInicio =
        it.tipo === "parcela" && it.parcelaAtual
          ? calcParcelaInicio(it.parcelaAtual, yearMonth)
          : it.tipo === "unico"
          ? yearMonth
          : undefined;

      add({
        name:          it.name,
        amount:        it.amount,
        dueDay:        10,
        category:      "personal",
        group:         "Assinaturas",
        isActive:      true,
        tipo:          it.tipo,
        totalParcelas: it.tipo === "parcela" ? it.totalParcelas ?? undefined : undefined,
        parcelaInicio,
        isCartao:      true,
        cartaoNome:    it.cartaoNome ?? undefined,
      });
    });
    setDone(true);
  }

  const checkedCount = items.filter((it) => it.checked).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(14,11,12,0.65)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div className="glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden">

        {/* drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ink grid place-items-center">
              <Sparkles size={14} className="text-lime" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Importar fatura</h2>
              <p className="text-[10px] text-muted">IA lê o extrato e cria os lançamentos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-2 transition">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {done ? (
            /* ── Success screen ── */
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-success/15 grid place-items-center">
                <Check size={28} className="text-success" />
              </div>
              <p className="font-bold text-base">{checkedCount} lançamento{checkedCount !== 1 ? "s" : ""} importado{checkedCount !== 1 ? "s" : ""}!</p>
              <p className="text-[12px] text-muted">As despesas foram adicionadas em Cartões. Você pode editar cada uma individualmente.</p>
              <Button size="md" onClick={onClose} className="mt-2">Fechar</Button>
            </div>
          ) : items.length === 0 ? (
            /* ── Paste screen ── */
            <>
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3"
                style={{ background: "rgba(0,0,0,0.048)", border: "0.5px solid rgba(0,0,0,0.08)" }}
              >
                <FileText size={14} className="text-ink/50 mt-0.5 shrink-0" />
                <p className="text-[11px] text-ink/60 leading-relaxed">
                  Abra a fatura do cartão em PDF ou no app do banco, selecione todos os lançamentos e cole aqui. A IA vai identificar parcelas, totais e cartões automaticamente.
                </p>
              </div>

              <div>
                <span className="block text-[10px] uppercase tracking-widest font-semibold text-muted mb-2">
                  Texto da fatura
                </span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"AMAZON.COM.BR        3/12    R$ 89,90\nNETFLIX BRASIL        -       R$ 44,90\nPOSTMATE DELIVERIES   1/6     R$ 120,00\n..."}
                  rows={10}
                  className="block w-full px-4 py-3 rounded-2xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15 font-mono resize-none"
                />
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-[12px] text-danger">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </>
          ) : (
            /* ── Review screen ── */
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">
                  {items.length} lançamento{items.length !== 1 ? "s" : ""} encontrado{items.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setItems([])}
                  className="text-[11px] text-muted hover:text-ink transition"
                >
                  ← Reanalisar
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggleItem(it.id)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all"
                    style={{
                      background: it.checked ? "rgba(0,0,0,0.048)" : "rgba(255,255,255,0.6)",
                      border: `1.5px solid ${it.checked ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.07)"}`,
                    }}
                  >
                    {/* checkbox */}
                    <div
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: it.checked ? "#141414" : "transparent",
                        border: `2px solid ${it.checked ? "#141414" : "rgba(0,0,0,0.18)"}`,
                      }}
                    >
                      {it.checked && <Check size={10} color="#f5f5f3" strokeWidth={3} />}
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{it.name}</p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {it.tipo === "parcela" && it.totalParcelas && it.parcelaAtual && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,0,0,0.14)", color: "#141414" }}>
                            {it.parcelaAtual}/{it.totalParcelas}x
                          </span>
                        )}
                        {it.tipo === "recorrente" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(40,40,40,0.15)", color: "#3d3d3d" }}>
                            recorrente
                          </span>
                        )}
                        {it.cartaoNome && (
                          <span className="text-[9px] text-muted">{it.cartaoNome}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-bold tabular-nums shrink-0">{fmt(it.amount)}</p>
                  </button>
                ))}
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-[12px] text-danger">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </>
          )}
        </div>

        {/* footer */}
        {!done && (
          <div className="flex gap-3 px-5 py-4 border-t border-ink/5 shrink-0">
            <Button variant="ghost" size="md" onClick={onClose} className="flex-1">Cancelar</Button>
            {items.length === 0 ? (
              <Button size="md" onClick={analyze} disabled={loading} className="flex-1 gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? "Analisando…" : "Analisar com IA"}
              </Button>
            ) : (
              <Button size="md" onClick={importSelected} disabled={checkedCount === 0} className="flex-1">
                Importar {checkedCount > 0 ? `${checkedCount} ` : ""}selecionado{checkedCount !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
