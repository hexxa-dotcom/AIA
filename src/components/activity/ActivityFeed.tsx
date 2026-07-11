"use client";
import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Send, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useTeamStore } from "@/store/useTeamStore";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { listComments, addComment, deleteComment, type CommentItem } from "@/lib/team/comments";
import { listActivity, type ActivityItem, type ActivityAction } from "@/lib/team/activity";
import { useRealtime } from "@/lib/realtime";

const ACTION_LABELS: Record<ActivityAction, string> = {
  created: "criou a tarefa",
  moved: "moveu",
  completed: "concluiu",
  reopened: "reabriu",
  due_changed: "alterou o prazo",
  priority_changed: "alterou a prioridade",
  assigned: "atribuiu",
  unassigned: "desatribuiu",
  renamed: "renomeou",
};

type Item =
  | { kind: "comment"; data: CommentItem; at: number }
  | { kind: "activity"; data: ActivityItem; at: number };

export function ActivityFeed({ taskId }: { taskId: string }) {
  const user = useAuthStore((s) => s.user);
  const members = useTeamStore((s) => s.members);
  const loadMembers = useTeamStore((s) => s.load);
  const memberLoaded = useTeamStore((s) => s.loaded);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!memberLoaded) loadMembers();
  }, [memberLoaded, loadMembers]);

  useEffect(() => {
    listComments(taskId).then(setComments).catch(() => {});
    listActivity(taskId).then(setActivities).catch(() => {});
  }, [taskId]);

  useRealtime("task_comments", (payload) => {
    if (payload.new?.task_id !== taskId) return;
    listComments(taskId).then(setComments).catch(() => {});
  });
  useRealtime("task_activity", (payload) => {
    if (payload.new?.task_id !== taskId) return;
    listActivity(taskId).then(setActivities).catch(() => {});
  });

  const merged = useMemo<Item[]>(() => {
    const items: Item[] = [
      ...comments.map((c) => ({ kind: "comment" as const, data: c, at: c.createdAt })),
      ...activities.map((a) => ({ kind: "activity" as const, data: a, at: a.at })),
    ];
    items.sort((a, b) => a.at - b.at);
    return items;
  }, [comments, activities]);

  const memberById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const m of members) {
      if (!m.userId) continue;
      map.set(m.userId, { name: m.name ?? m.email.split("@")[0], email: m.email });
    }
    return map;
  }, [members]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !draft.trim()) return;
    setPosting(true);
    try {
      const c = await addComment(taskId, user.id, draft.trim());
      setComments((s) => [...s, c]);
      setDraft("");
    } finally {
      setPosting(false);
    }
  }

  async function removeMine(id: string) {
    await deleteComment(id);
    setComments((s) => s.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted flex items-center gap-1">
        <MessageSquare size={11} />
        Atividade
      </div>

      <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
        {merged.length === 0 && (
          <div className="text-xs text-muted italic py-4 text-center">
            Sem atividade ainda. Comente algo abaixo.
          </div>
        )}
        {merged.map((it) => {
          if (it.kind === "comment") {
            const m = memberById.get(it.data.userId);
            const mine = user?.id === it.data.userId;
            const initial = (m?.name ?? "?").charAt(0).toUpperCase();
            return (
              <motion.div
                key={`c-${it.data.id}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start group"
              >
                <div className="w-7 h-7 rounded-full bg-ink text-lime grid place-items-center text-[11px] font-bold shrink-0">
                  {initial}
                </div>
                <div className="flex-1 bg-surface-2 rounded-2xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{m?.name ?? "alguém"}</span>
                    <span className="text-[9px] text-muted">
                      {new Date(it.data.createdAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{it.data.body}</p>
                </div>
                {mine && (
                  <button
                    onClick={() => removeMine(it.data.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/10 hover:text-danger rounded"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </motion.div>
            );
          } else {
            const m = it.data.userId ? memberById.get(it.data.userId) : null;
            const who = m?.name ?? "alguém";
            const label = ACTION_LABELS[it.data.action] ?? it.data.action;
            const extra = extractExtra(it.data, memberById);
            return (
              <div key={`a-${it.data.id}`} className="flex items-center gap-2 text-[11px] text-muted px-1">
                <div className="w-2 h-2 rounded-full bg-muted/50 shrink-0" />
                <span>
                  <strong className="text-ink">{who}</strong> {label}
                  {extra && <span className="text-muted"> · {extra}</span>}
                </span>
                <span className="ml-auto">
                  {new Date(it.data.at).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            );
          }
        })}
      </div>

      <form onSubmit={submit} className="flex gap-2 items-end">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Comentar..."
          className="flex-1"
        />
        <Button type="submit" disabled={posting || !draft.trim()}>
          {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </Button>
      </form>
    </div>
  );
}

function extractExtra(
  a: ActivityItem,
  memberById: Map<string, { name: string; email: string }>,
): string | null {
  const p = a.payload ?? {};
  if (a.action === "moved" && p.to) return `pra ${p.to}`;
  if (a.action === "due_changed" && p.to) return new Date(p.to).toLocaleString("pt-BR");
  if (a.action === "priority_changed" && p.to) return p.to;
  if ((a.action === "assigned" || a.action === "unassigned") && p.user) {
    const m = memberById.get(p.user);
    return m?.name ?? p.user.slice(0, 6);
  }
  if (a.action === "renamed" && p.title) return `"${p.title}"`;
  return null;
}
