"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Check, X, Users, RefreshCw } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { BoardInvite } from "@/lib/types";

export function ProjectInbox() {
  const invites = useTaskStore((s) => s.invites);
  const receiveInvite = useTaskStore((s) => s.receiveInvite);
  const acceptInvite = useTaskStore((s) => s.acceptInvite);
  const rejectInvite = useTaskStore((s) => s.rejectInvite);
  const meEmail = useAuthStore((s) => s.user?.email) || "usuario@hexxa.com";

  const [isOpen, setIsOpen] = useState(false);
  const pendingCount = invites.filter((i) => i.status === "pending").length;

  // Poll localStorage for invites directed to me
  useEffect(() => {
    const poll = setInterval(() => {
      if (!meEmail) return;
      const key = `hexxa-board-invites-${meEmail}`;
      try {
        const stored = JSON.parse(localStorage.getItem(key) ?? "[]") as BoardInvite[];
        stored.forEach((inv) => {
          if (inv.status === "pending") receiveInvite(inv);
        });
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(poll);
  }, [meEmail, receiveInvite]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition text-muted"
      >
        <Inbox size={18} />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full grid place-items-center">
            {pendingCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-surface border shadow-2xl rounded-3xl overflow-hidden z-50 origin-top-right"
              style={{ borderColor: "var(--flat-border)" }}
            >
              <div className="p-4 border-b bg-black/[0.02] flex items-center justify-between" style={{ borderColor: "var(--flat-border)" }}>
                <div className="flex items-center gap-2">
                  <Inbox size={14} className="text-ink" />
                  <span className="text-sm font-bold text-ink">Caixa de Entrada (Projetos)</span>
                </div>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold text-muted bg-black/5 px-2 py-0.5 rounded-full">
                    {pendingCount} novo(s)
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {invites.filter(i => i.status === "pending").length === 0 ? (
                  <div className="p-8 text-center text-muted">
                    <RefreshCw size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum convite pendente.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--flat-border)" }}>
                    {invites.filter(i => i.status === "pending").map((inv) => (
                      <div key={inv.id} className="p-4 flex flex-col gap-3 hover:bg-black/[0.01] transition">
                        <div>
                          <p className="text-xs text-muted mb-1">
                            <span className="font-bold text-ink">{inv.fromName || inv.fromEmail}</span> convidou você para o projeto:
                          </p>
                          <div className="bg-surface-2 p-3 rounded-xl border flex items-center gap-3" style={{ borderColor: "var(--flat-border)" }}>
                            <div className="w-8 h-8 rounded-lg bg-ink text-surface grid place-items-center text-sm">
                              {inv.board.emoji || "📁"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-ink truncate">{inv.board.name}</p>
                              <p className="text-[10px] text-muted flex items-center gap-1">
                                <Users size={10} />
                                Papel: <span className="font-semibold capitalize text-ink">{inv.role === "admin" ? "Administrador" : "Visualizador"}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => rejectInvite(inv.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 transition flex items-center justify-center gap-1"
                          >
                            <X size={12} /> Recusar
                          </button>
                          <button
                            onClick={() => acceptInvite(inv.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-ink hover:bg-black/80 transition flex items-center justify-center gap-1"
                          >
                            <Check size={12} /> Aceitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
