"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Send, Loader2, Link2, X, ChevronDown, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useRealtime } from "@/lib/realtime";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ChatPane() {
  const me = useAuthStore((s) => s.user);
  const active = useChatStore((s) => s.active);
  const threadCache = useChatStore((s) => s.threadCache);
  const send = useChatStore((s) => s.send);
  const appendIncoming = useChatStore((s) => s.appendIncoming);
  const members = useTeamStore((s) => s.members);
  const tasks = useTaskStore((s) => s.tasks);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachingTask, setAttachingTask] = useState<string | null>(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const other = members.find((m) => m.userId === active);
  const messages = useMemo(
    () => (active ? (threadCache[active] ?? []) : []),
    [active, threadCache],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useRealtime("dm_messages", (payload) => {
    if (!me) return;
    const m = payload.new;
    if (m.from_user !== me.id) {
      appendIncoming(me.id, {
        id: m.id,
        fromUser: m.from_user,
        toUser: m.to_user,
        body: m.body,
        taskRef: m.task_ref,
        readAt: m.read_at ? new Date(m.read_at).getTime() : null,
        createdAt: new Date(m.created_at).getTime(),
      });
    }
  });

  if (!active) {
    return (
      <div className="glass rounded-3xl h-full grid place-items-center text-muted text-sm">
        <div className="text-center">
          <div className="text-3xl mb-2"></div>
          Selecione uma conversa à esquerda
        </div>
      </div>
    );
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!me || (!draft.trim() && !attachingTask)) return;
    setSending(true);
    try {
      await send(me.id, draft.trim(), attachingTask ?? undefined);
      setDraft("");
      setAttachingTask(null);
    } finally {
      setSending(false);
    }
  }

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.title.toLowerCase().includes(taskSearch.toLowerCase()))
        .slice(0, 8),
    [tasks, taskSearch],
  );

  return (
    <div className="glass rounded-3xl h-full flex flex-col">
      <div className="px-4 py-3 border-b border-ink/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-ink text-lime grid place-items-center font-bold text-sm">
          {(other?.name ?? other?.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">{other?.name ?? other?.email}</div>
          {other?.email && (
            <div className="text-[10px] text-muted">{other.email}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted text-xs italic py-10">
            Sem mensagens ainda. Diga oi
          </div>
        )}
        {messages.map((m) => {
          const mine = m.fromUser === me?.id;
          const task = m.taskRef ? tasks.find((t) => t.id === m.taskRef) : null;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col max-w-[75%]",
                mine ? "ml-auto items-end" : "items-start",
              )}
            >
              {task && (
                <Link
                  href={`/`}
                  className="bg-lime/30 text-ink text-xs px-3 py-1.5 rounded-2xl flex items-center gap-1 mb-1"
                >
                  <Link2 size={10} />
                  {task.title}
                </Link>
              )}
              {m.body && (
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap",
                    mine ? "bg-ink text-white" : "bg-surface-2 text-ink",
                  )}
                >
                  {m.body}
                </div>
              )}
              <span className="text-[9px] text-muted mt-0.5">
                {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {attachingTask && (
        <div className="border-t border-ink/5 px-4 py-2 flex items-center gap-2 bg-lime/20">
          <Link2 size={12} />
          <span className="text-xs flex-1">
            {tasks.find((t) => t.id === attachingTask)?.title}
          </span>
          <button
            onClick={() => setAttachingTask(null)}
            className="p-1 hover:bg-black/5 rounded-full"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="border-t border-ink/5 p-3 relative">
        {taskPickerOpen && (
          <div className="absolute bottom-full mb-2 left-3 right-3 glass rounded-2xl shadow-lg p-2 z-10">
            <div className="relative mb-2">
              <Search
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Buscar tarefa..."
                className="w-full text-xs pl-7 pr-2 py-1.5 rounded-lg border border-ink/10 outline-none"
                autoFocus
              />
            </div>
            <ul className="max-h-48 overflow-y-auto">
              {filteredTasks.length === 0 && (
                <li className="text-[11px] text-muted text-center p-3 italic">
                  Sem resultados
                </li>
              )}
              {filteredTasks.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => {
                      setAttachingTask(t.id);
                      setTaskPickerOpen(false);
                      setTaskSearch("");
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-surface-2"
                  >
                    {t.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={submit} className="flex gap-2 items-end">
          <button
            type="button"
            onClick={() => setTaskPickerOpen((v) => !v)}
            className="p-2 rounded-xl bg-surface-2 hover:bg-black/5"
            title="Anexar tarefa"
          >
            <Link2 size={14} />
          </button>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Mensagem..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="flex-1 resize-none"
          />
          <Button
            type="submit"
            disabled={sending || (!draft.trim() && !attachingTask)}
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
