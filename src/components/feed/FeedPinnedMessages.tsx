"use client";
import { useMemo } from "react";
import { Pin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedStore } from "@/store/useFeedStore";
import { cn } from "@/lib/utils";

export function FeedPinnedMessages() {
  const pinnedMessages = useFeedStore((s) => s.pinnedMessages);
  const unpin = useFeedStore((s) => s.unpin);

  const sorted = useMemo(
    () => [...pinnedMessages].sort((a, b) => b.pinnedAt - a.pinnedAt),
    [pinnedMessages],
  );

  if (sorted.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Pin size={14} className="text-lime" />
        <span className="font-bold text-sm">Fixadas</span>
        <span className="text-xs text-muted">({sorted.length})</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {sorted.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                "p-3 rounded-xl text-sm flex items-start gap-2",
                msg.type === "message" && "bg-lime/15",
                msg.type === "task" && "bg-sage/15",
                msg.type === "note" && "bg-ink/8",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted mb-1">{msg.type}</p>
                <p className="break-words whitespace-pre-wrap text-xs">{msg.content}</p>
              </div>
              <button
                onClick={() => unpin(msg.id)}
                className="p-1 hover:bg-black/5 rounded-lg shrink-0"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
