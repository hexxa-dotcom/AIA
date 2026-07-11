"use client";
import { useMemo } from "react";
import { MessageSquare, Pin } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { useTeamStore } from "@/store/useTeamStore";
import { useFeedStore } from "@/store/useFeedStore";
import { cn } from "@/lib/utils";

export function FeedMessages() {
  const me = useAuthStore((s) => s.user);
  const inbox = useChatStore((s) => s.inbox);
  const members = useTeamStore((s) => s.members);
  const pin = useFeedStore((s) => s.pin);

  const memberById = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const m of members) {
      if (m.userId)
        map.set(m.userId, {
          name: m.name ?? m.email.split("@")[0],
          email: m.email,
        });
    }
    return map;
  }, [members]);

  const recentMessages = useMemo(
    () => inbox.slice(0, 5).filter((i) => i.lastMsg),
    [inbox],
  );

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-lime" />
        <span className="font-bold text-sm">Mensagens</span>
        <span className="text-xs text-muted">({recentMessages.length})</span>
      </div>

      {recentMessages.length === 0 ? (
        <div className="text-center py-6 text-muted text-xs">
          Sem mensagens ainda
        </div>
      ) : (
        <div className="space-y-2">
          {recentMessages.map((item) => {
            const m = memberById.get(item.otherId);
            const msg = item.lastMsg;
            const initial = (m?.name ?? "?").charAt(0).toUpperCase();

            return (
              <motion.div
                key={item.otherId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-lg hover:bg-surface-2 group flex items-start gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-ink text-lime grid place-items-center font-bold text-xs shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink">
                    {m?.name ?? "?"}
                  </p>
                  <p className="text-xs text-muted truncate">{msg?.body}</p>
                </div>
                <button
                  onClick={() =>
                    pin(msg?.id ?? "", "message", msg?.body ?? "", item.otherId)
                  }
                  className="p-1 opacity-0 group-hover:opacity-100 transition hover:bg-black/5 rounded-lg shrink-0"
                  title="Fixar"
                >
                  <Pin size={12} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
