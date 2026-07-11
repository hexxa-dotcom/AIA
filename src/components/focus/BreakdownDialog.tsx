"use client";
import { useState } from "react";
import { Sparkles, Check, Loader2, AlertCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useAiStore } from "@/store/useAiStore";
import { useTaskStore } from "@/store/useTaskStore";
import { suggestSubtasks } from "@/lib/ai/breakdown";
import { cn } from "@/lib/utils";

export function BreakdownDialog({
  open,
  onClose,
  taskId,
}: {
  open: boolean;
  onClose: () => void;
  taskId: string;
}) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const addMany = useTaskStore((s) => s.addManySubtasks);
  const apiKey = useAiStore((s) => s.apiKey);
  const model = useAiStore((s) => s.models.system);

  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const hasKey = !!apiKey;

  async function generate() {
    if (!task || !hasKey) return;
    setBusy(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    try {
      const result = await suggestSubtasks({
        apiKey,
        model,
        task,
        extraContext: extra.trim() || undefined,
      });
      setSuggestions(result);
      setSelected(new Set(result.map((_, i) => i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setBusy(false);
    }
  }

  function toggle(i: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function applyAll() {
    if (!task) return;
    const titles = suggestions.filter((_, i) => selected.has(i));
    if (titles.length === 0) return;
    addMany(task.id, titles);
    onClose();
    setSuggestions([]);
    setExtra("");
  }

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">
        <div className="p-6 overflow-y-auto">
          <DialogTitle>
            <span className="flex items-center gap-2">
              <Sparkles size={18} className="text-warning" />
              Quebrar com IA
            </span>
          </DialogTitle>
          <p className="text-xs text-muted mt-1">
            Via Groq — rápido e gratuito
          </p>

          <div className="mt-4 space-y-3">
            <div className="bg-surface-2 rounded-2xl p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted">
                Tarefa
              </div>
              <div className="font-bold">{task.title}</div>
              {task.description && (
                <div className="text-xs text-muted mt-1 line-clamp-2">
                  {task.description}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Contexto extra (opcional)
              </label>
              <Textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={2}
                placeholder="Ex: focar só na parte de pesquisa; ignorar etapa de design..."
              />
            </div>

            {!hasKey && (
              <div className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} />
                Configure a chave Groq em AIA OS → Configurar.
              </div>
            )}

            {error && (
              <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                    Sugestões ({selected.size}/{suggestions.length})
                  </span>
                  <button
                    onClick={() =>
                      setSelected(
                        selected.size === suggestions.length
                          ? new Set()
                          : new Set(suggestions.map((_, i) => i)),
                      )
                    }
                    className="text-[10px] text-muted hover:text-ink"
                  >
                    {selected.size === suggestions.length
                      ? "Desmarcar todas"
                      : "Marcar todas"}
                  </button>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={cn(
                      "w-full flex items-start gap-2 p-2 rounded-xl text-left text-sm transition",
                      selected.has(i)
                        ? "bg-lime/30 hover:bg-lime/40"
                        : "bg-surface-2 hover:bg-black/5 opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md border-2 shrink-0 mt-0.5 grid place-items-center",
                        selected.has(i)
                          ? "bg-lime border-lime"
                          : "border-ink/30",
                      )}
                    >
                      {selected.has(i) && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="light" className="flex-1">
                  <X size={14} /> Cancelar
                </Button>
              </DialogClose>
              {suggestions.length === 0 ? (
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={busy || !hasKey}
                  onClick={generate}
                >
                  {busy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Pensando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Gerar sugestões
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button variant="light" onClick={generate} disabled={busy}>
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Regenerar"
                    )}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={applyAll}
                    disabled={selected.size === 0}
                  >
                    Adicionar {selected.size}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
