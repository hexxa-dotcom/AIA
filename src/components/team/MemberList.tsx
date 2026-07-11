"use client";
import { Trash2, Mail, Clock, Check } from "lucide-react";
import { useTeamStore } from "@/store/useTeamStore";
import { removeMember } from "@/lib/team/adapter";
import { useAuthStore } from "@/store/useAuthStore";

export function MemberList() {
  const members = useTeamStore((s) => s.members);
  const me = useAuthStore((s) => s.user);
  const load = useTeamStore((s) => s.load);

  async function remove(id: string) {
    if (!confirm("Remover esse membro do workspace?")) return;
    await removeMember(id);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-2">
      <div className="text-xs uppercase tracking-wider font-semibold text-muted px-2 py-2">
        {members.length} {members.length === 1 ? "pessoa" : "pessoas"}
      </div>
      <ul className="divide-y divide-ink/5">
        {members.map((m) => {
          const isMe = me && m.userId === me.id;
          return (
            <li key={m.id} className="flex items-center gap-3 px-2 py-2 hover:bg-surface-2 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-ink text-lime grid place-items-center font-bold text-sm">
                {(m.name ?? m.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {m.name ?? m.email.split("@")[0]}
                  {isMe && <span className="text-[10px] ml-2 text-muted">(você)</span>}
                </div>
                <div className="text-[10px] text-muted truncate">{m.email}</div>
              </div>
              <div className="text-[10px]">
                {m.joinedAt ? (
                  <span className="text-success flex items-center gap-1">
                    <Check size={10} />
                    ativo
                  </span>
                ) : (
                  <span className="text-warning flex items-center gap-1">
                    <Mail size={10} />
                    pendente
                  </span>
                )}
              </div>
              {!isMe && (
                <button
                  onClick={() => remove(m.id)}
                  className="p-1 rounded hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          );
        })}
        {members.length === 0 && (
          <li className="p-6 text-center text-muted text-xs italic">
            Convide alguém pra começar a colaborar
          </li>
        )}
      </ul>
    </div>
  );
}
