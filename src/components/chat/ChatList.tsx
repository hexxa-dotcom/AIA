"use client";
import { useEffect, useMemo } from "react";
import { Inbox } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useTeamStore } from "@/store/useTeamStore";
import { cn } from "@/lib/utils";

export function ChatList() {
  const me = useAuthStore((s) => s.user);
  const members = useTeamStore((s) => s.members);
  const loadMembers = useTeamStore((s) => s.load);
  const memberLoaded = useTeamStore((s) => s.loaded);

  const active = useChatStore((s) => s.active);
  const inbox = useChatStore((s) => s.inbox);
  const open = useChatStore((s) => s.open);
  const refreshInbox = useChatStore((s) => s.refreshInbox);

  useEffect(() => {
    if (!memberLoaded) loadMembers();
  }, [memberLoaded, loadMembers]);

  useEffect(() => {
    if (me) refreshInbox(me.id);
  }, [me, refreshInbox]);

  const memberById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const m of members) {
      if (m.userId) map.set(m.userId, { name: m.name ?? m.email.split("@")[0], email: m.email });
    }
    return map;
  }, [members]);

  const rows = useMemo(() => {
    // todos os membros, com inbox merged
    const withMe = (id: string) => id !== me?.id;
    const seenIds = new Set(inbox.map((i) => i.otherId));
    const restMembers = members.filter((m) => m.userId && withMe(m.userId) && !seenIds.has(m.userId!));
    return [
      ...inbox,
      ...restMembers.map((m) => ({
        otherId: m.userId!,
        lastMsg: null as any,
        unread: 0,
      })),
    ];
  }, [inbox, members, me]);

  return (
    <div className="glass rounded-3xl h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-ink/5 flex items-center gap-2">
        <Inbox size={14} />
        <span className="font-bold text-sm">Conversas</span>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-muted text-xs italic">
          Sem ninguém na equipe ainda. Convide alguém em /equipe.
        </div>
      ) : (
        <ul className="divide-y divide-ink/5">
          {rows.map((row) => {
            const m = memberById.get(row.otherId);
            const isActive = active === row.otherId;
            const initial = (m?.name ?? "?").charAt(0).toUpperCase();
            return (
              <li key={row.otherId}>
                <button
                  onClick={() => me && open(row.otherId, me.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition text-left",
                    isActive && "bg-lime/15",
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-ink text-lime grid place-items-center font-bold text-sm">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{m?.name ?? "?"}</span>
                      {row.lastMsg && (
                        <span className="text-[10px] text-muted">
                          {new Date(row.lastMsg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {row.lastMsg?.body ?? <em>começar conversa</em>}
                    </div>
                  </div>
                  {row.unread > 0 && (
                    <span className="bg-lime text-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {row.unread}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
