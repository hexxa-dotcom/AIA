"use client";
import { useState } from "react";
import { Users, Plus, X, AlertCircle, Check, Clock, UserCheck, Eye } from "lucide-react";
import { useTaskInviteStore } from "@/store/useTaskInviteStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTaskStore } from "@/store/useTaskStore";
import type { Task, CollaboratorRole, TaskCollaborator } from "@/lib/types";

const ROLE_LABEL: Record<CollaboratorRole, string> = {
  responsavel:  "Responsável",
  acompanhante: "Acompanhante",
};

const ROLE_ICON: Record<CollaboratorRole, React.ReactNode> = {
  responsavel:  <UserCheck size={10} />,
  acompanhante: <Eye size={10} />,
};

const STATUS_COLOR: Record<string, string> = {
  pending:  "text-warning",
  accepted: "text-success",
  rejected: "text-muted",
};

const STATUS_LABEL: Record<string, string> = {
  pending:  "Pendente",
  accepted: "Ativo",
  rejected: "Recusou",
};

function Avatar({ email, size = 7 }: { email: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-ink text-lime grid place-items-center shrink-0 text-[10px] font-bold uppercase`}
    >
      {email[0]}
    </div>
  );
}

export function TaskCollaborators({ task }: { task: Task }) {
  const user         = useAuthStore((s) => s.user);
  const updateTask   = useTaskStore((s) => s.updateTask);
  const sendInvite   = useTaskInviteStore((s) => s.send);

  const collaborators = task.collaborators ?? [];

  const [emailInput, setEmailInput] = useState("");
  const [role,       setRole]       = useState<CollaboratorRole>("responsavel");
  const [error,      setError]      = useState("");
  const [expanded,   setExpanded]   = useState(collaborators.length > 0);

  function addCollaborator() {
    const em = emailInput.trim().toLowerCase();
    if (!em || !em.includes("@")) { setError("E-mail inválido"); return; }
    if (em === user?.email)        { setError("Não pode convidar a si mesmo"); return; }
    if (collaborators.some((c) => c.email === em)) { setError("Já convidado"); return; }

    const newCollab: TaskCollaborator = {
      email:     em,
      role,
      status:    "pending",
      invitedAt: Date.now(),
    };

    // Update task with new collaborator
    updateTask(task.id, { collaborators: [...collaborators, newCollab] });

    // Send invite to target user's inbox
    if (user?.email) {
      sendInvite({
        fromEmail:    user.email,
        toEmail:      em,
        role,
        taskId:       task.id,
        taskSnapshot: {
          title:       task.title,
          description: task.description,
          priority:    task.priority,
          dueDate:     task.dueDate,
          tags:        task.tags,
          subtasks:    task.subtasks,
        },
      });
    }

    setEmailInput("");
    setError("");
  }

  function removeCollaborator(email: string) {
    updateTask(task.id, {
      collaborators: collaborators.filter((c) => c.email !== email),
    });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: expanded
          ? "1px solid rgba(0,0,0,0.12)"
          : "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* header toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition"
      >
        <div
          className={`w-8 h-8 rounded-xl grid place-items-center shrink-0 transition-colors ${
            expanded || collaborators.length > 0 ? "bg-ink" : "bg-surface-2"
          }`}
        >
          <Users size={14} className={expanded || collaborators.length > 0 ? "text-lime" : "text-muted"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Colaboradores</p>
          <p className="text-[11px] text-muted">
            {collaborators.length > 0
              ? `${collaborators.filter((c) => c.status === "accepted").length} ativo${collaborators.filter((c) => c.status === "accepted").length !== 1 ? "s" : ""}, ${collaborators.filter((c) => c.status === "pending").length} pendente${collaborators.filter((c) => c.status === "pending").length !== 1 ? "s" : ""}`
              : "Delegue ou convide para acompanhar"}
          </p>
        </div>
        {/* avatar stack */}
        {collaborators.length > 0 && (
          <div className="flex -space-x-1.5">
            {collaborators.slice(0, 3).map((c) => (
              <Avatar key={c.email} email={c.email} size={6} />
            ))}
            {collaborators.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-surface-2 border-2 border-white grid place-items-center text-[9px] font-bold text-muted">
                +{collaborators.length - 3}
              </div>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-ink/5 px-4 pb-4 pt-3 space-y-3">
          {/* existing collaborators */}
          {collaborators.length > 0 && (
            <div className="space-y-1.5">
              {collaborators.map((c) => (
                <div
                  key={c.email}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-2 group"
                >
                  <Avatar email={c.email} size={7} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{c.email}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted">
                        {ROLE_ICON[c.role]} {ROLE_LABEL[c.role]}
                      </span>
                      <span className="text-[10px] text-muted">·</span>
                      <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${STATUS_COLOR[c.status]}`}>
                        {c.status === "pending"  && <Clock    size={9} />}
                        {c.status === "accepted" && <Check    size={9} />}
                        {c.status === "rejected" && <X        size={9} />}
                        {STATUS_LABEL[c.status]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCollaborator(c.email)}
                    className="p-1 rounded-lg hover:bg-danger/10 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* role explainer */}
          <div
            className="rounded-xl p-2.5 text-[11px] text-muted/80 space-y-1 leading-relaxed"
            style={{ background: "rgba(0,0,0,0.03)" }}
          >
            <p><strong className="text-ink">Responsável</strong> — executa a tarefa, aparece no Kanban dele para aceitar.</p>
            <p><strong className="text-ink">Acompanhante</strong> — acompanha o progresso sem executar.</p>
          </div>

          {/* invite input */}
          <div className="space-y-2">
            {/* role selector */}
            <div className="flex gap-1.5">
              {(["responsavel", "acompanhante"] as CollaboratorRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                    role === r ? "bg-ink text-lime" : "bg-surface-2 text-muted hover:text-ink"
                  }`}
                >
                  {ROLE_ICON[r]} {ROLE_LABEL[r]}
                </button>
              ))}
            </div>

            {/* email + send */}
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCollaborator())}
                placeholder="email@usuario.com"
                className="flex-1 px-3 py-2.5 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
              />
              <button
                type="button"
                onClick={addCollaborator}
                className="px-3 py-2.5 rounded-xl bg-ink text-lime hover:opacity-90 transition"
              >
                <Plus size={15} />
              </button>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-[11px] text-danger">
                <AlertCircle size={11} /> {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
