"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, Eye, Check, XCircle, Flag, Clock } from "lucide-react";
import {
  useTaskInviteStore,
  type TaskInvite,
} from "@/store/useTaskInviteStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuthStore } from "@/store/useAuthStore";
import { genId } from "@/lib/id";
import type { Task } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const ROLE_LABEL: Record<string, string> = {
  responsavel: "Responsável",
  acompanhante: "Acompanhante",
};

const ROLE_COLOR: Record<string, string> = {
  responsavel: "bg-lime/30 text-ink",
  acompanhante: "bg-sage/40 text-ink",
};

function InviteCard({
  invite,
  onAccept,
  onReject,
}: {
  invite: TaskInvite;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isPending = invite.status === "pending";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-ink/5"
    >
      {/* from + role */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ink text-lime grid place-items-center text-[11px] font-bold uppercase shrink-0">
            {invite.fromEmail[0]}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate">
              {invite.fromEmail}
            </p>
            <p className="text-[10px] text-muted">te convidou para colaborar</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLOR[invite.role]}`}
        >
          {invite.role === "responsavel" ? (
            <UserCheck size={9} />
          ) : (
            <Eye size={9} />
          )}
          {ROLE_LABEL[invite.role]}
        </span>
      </div>

      {/* task preview */}
      <div className="bg-surface-2 rounded-xl p-3 mb-3 space-y-1.5">
        <p className="font-semibold text-sm leading-tight">
          {invite.taskSnapshot.title}
        </p>
        {invite.taskSnapshot.description && (
          <p className="text-[11px] text-muted line-clamp-2">
            {invite.taskSnapshot.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="flex items-center gap-0.5 text-[10px] bg-white rounded-full px-2 py-0.5">
            <Flag size={9} />{" "}
            {PRIORITY_LABEL[invite.taskSnapshot.priority] ??
              invite.taskSnapshot.priority}
          </span>
          {invite.taskSnapshot.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] bg-white rounded-full px-2 py-0.5">
              <Clock size={9} />
              {new Date(invite.taskSnapshot.dueDate).toLocaleDateString(
                "pt-BR",
                { day: "numeric", month: "short" },
              )}
            </span>
          )}
          {invite.taskSnapshot.subtasks.length > 0 && (
            <span className="text-[10px] bg-white rounded-full px-2 py-0.5">
              {invite.taskSnapshot.subtasks.length} subtarefa
              {invite.taskSnapshot.subtasks.length !== 1 ? "s" : ""}
            </span>
          )}
          {invite.taskSnapshot.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[10px] bg-sage/40 rounded-full px-2 py-0.5"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="flex gap-2">
          <button
            onClick={() => onReject(invite.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-ink/10 text-[12px] font-semibold hover:bg-danger/5 hover:border-danger/30 hover:text-danger transition"
          >
            <XCircle size={13} /> Recusar
          </button>
          <button
            onClick={() => onAccept(invite.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-ink text-lime text-[12px] font-semibold hover:opacity-90 transition"
          >
            <Check size={13} /> Aceitar tarefa
          </button>
        </div>
      ) : (
        <div
          className={`text-center text-[11px] font-semibold py-1.5 rounded-xl ${
            invite.status === "accepted"
              ? "bg-success/10 text-success"
              : "bg-surface-2 text-muted"
          }`}
        >
          {invite.status === "accepted"
            ? "Tarefa aceita — aparece no seu Kanban"
            : "Recusado"}
        </div>
      )}
    </motion.div>
  );
}

export function TaskInviteInbox({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const invites = useTaskInviteStore((s) => s.invites);
  const receive = useTaskInviteStore((s) => s.receive);
  const acceptFn = useTaskInviteStore((s) => s.accept);
  const rejectFn = useTaskInviteStore((s) => s.reject);
  const importTask = useTaskStore((s) => s.importTask);
  const tasks = useTaskStore((s) => s.tasks);
  const boards = useTaskStore((s) => s.boards);

  // Pull from localStorage on mount
  useEffect(() => {
    if (!user?.email) return;
    try {
      const key = `aia-task-invites-${user.email}`;
      const raw = JSON.parse(localStorage.getItem(key) ?? "[]") as TaskInvite[];
      raw.forEach((inv) => receive(inv));
    } catch {
      /* ignore */
    }
  }, [user?.email]); // eslint-disable-line

  function handleAccept(inviteId: string) {
    const invite = acceptFn(inviteId);
    if (!invite) return;

    const defaultBoard = boards[0];
    if (!defaultBoard) return;

    const newTask: Task = {
      id: genId(),
      boardId: defaultBoard.id,
      column: "backlog",
      order: tasks.filter((t) => t.boardId === defaultBoard.id).length,
      title: invite.taskSnapshot.title,
      description: invite.taskSnapshot.description,
      priority: invite.taskSnapshot.priority,
      dueDate: invite.taskSnapshot.dueDate,
      startDate: undefined,
      tags: invite.taskSnapshot.tags,
      subtasks: invite.taskSnapshot.subtasks.map((s) => ({
        ...s,
        id: genId(),
      })),
      assignees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTimeSec: 0,
      sharedFrom: { email: invite.fromEmail },
    };
    importTask(newTask);
  }

  const sorted = [...invites].sort((a, b) => b.createdAt - a.createdAt);
  const pending = sorted.filter((i) => i.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="w-full max-w-md bg-surface-1 rounded-3xl overflow-hidden shadow-2xl max-h-[85dvh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5 shrink-0">
          <div>
            <h2 className="font-bold text-base">Tarefas compartilhadas</h2>
            <p className="text-[11px] text-muted mt-0.5">
              {pending > 0 ? `${pending} aguardando resposta` : "Tudo em dia"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 text-muted hover:text-ink transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-3xl"></p>
              <p className="text-sm font-semibold">
                Nenhuma tarefa compartilhada
              </p>
              <p className="text-[12px] text-muted">
                Quando alguém te delegar ou convidar para acompanhar uma tarefa,
                ela aparecerá aqui.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {sorted.map((inv) => (
                <InviteCard
                  key={inv.id}
                  invite={inv}
                  onAccept={handleAccept}
                  onReject={rejectFn}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
