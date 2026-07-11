"use client";
import { useEffect, useMemo, useState } from "react";
import { Users, Plus, X, Check } from "lucide-react";
import { useTeamStore } from "@/store/useTeamStore";
import { addAssignee, removeAssignee, listAssignees } from "@/lib/team/assignees";
import { logActivity } from "@/lib/team/activity";
import { cn } from "@/lib/utils";

export function AssigneeSelect({ taskId }: { taskId: string }) {
  const members = useTeamStore((s) => s.members);
  const load = useTeamStore((s) => s.load);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listAssignees(taskId).then(setAssignees).catch(() => {});
    if (members.length === 0) load();
  }, [taskId]); // eslint-disable-line

  const assigned = useMemo(
    () => members.filter((m) => m.userId && assignees.includes(m.userId)),
    [members, assignees],
  );

  async function toggle(userId: string, currentlyAssigned: boolean) {
    if (currentlyAssigned) {
      await removeAssignee(taskId, userId);
      setAssignees((s) => s.filter((x) => x !== userId));
      logActivity(taskId, "unassigned", { user: userId });
    } else {
      await addAssignee(taskId, userId);
      setAssignees((s) => [...s, userId]);
      logActivity(taskId, "assigned", { user: userId });
    }
  }

  return (
    <div className="bg-surface-2 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted mb-2">
        <Users size={11} />
        Atribuído a
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {assigned.map((m) => {
          const initial = (m.name ?? m.email).charAt(0).toUpperCase();
          return (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 bg-white pl-1 pr-2 py-0.5 rounded-full text-[11px]"
            >
              <span className="w-5 h-5 rounded-full bg-ink text-lime grid place-items-center text-[10px] font-bold">
                {initial}
              </span>
              {m.name ?? m.email.split("@")[0]}
              <button
                onClick={() => m.userId && toggle(m.userId, true)}
                className="p-0.5 hover:bg-danger/10 hover:text-danger rounded-full"
              >
                <X size={9} />
              </button>
            </span>
          );
        })}
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] bg-white px-2 py-1 rounded-full hover:bg-black/5 flex items-center gap-1"
        >
          <Plus size={11} />
          atribuir
        </button>
      </div>

      {open && (
        <div className="mt-2 bg-white rounded-xl border border-ink/10 p-1 max-h-56 overflow-y-auto">
          {members.length === 0 ? (
            <div className="text-[11px] text-muted text-center p-3 italic">
              Sem pessoas na equipe. Convide alguém em /equipe.
            </div>
          ) : (
            members.map((m) => {
              if (!m.userId) return null;
              const isAssigned = assignees.includes(m.userId);
              return (
                <button
                  key={m.id}
                  onClick={() => toggle(m.userId!, isAssigned)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 text-left text-xs",
                    isAssigned && "bg-lime/20",
                  )}
                >
                  <span className="w-6 h-6 rounded-full bg-ink text-lime grid place-items-center text-[10px] font-bold">
                    {(m.name ?? m.email).charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{m.name ?? m.email}</span>
                  {isAssigned && <Check size={11} className="text-success" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
