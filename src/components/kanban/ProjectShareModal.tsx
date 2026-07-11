"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Users, ShieldAlert } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { BoardRole } from "@/lib/types";

interface Props {
  boardId: string;
  onClose: () => void;
}

export function ProjectShareModal({ boardId, onClose }: Props) {
  const board = useTaskStore((s) => s.boards.find((b) => b.id === boardId));
  const sendInvite = useTaskStore((s) => s.sendInvite);
  const meName = useProfileStore((s) => s.profile.name);
  const meEmail = useAuthStore((s) => s.user?.email) || "usuario@hexxa.com";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("viewer");
  const [sent, setSent] = useState(false);

  if (!board) return null;

  function handleSend() {
    if (!board) return;
    if (!email.includes("@")) return;
    
    sendInvite({
      fromEmail: meEmail,
      fromName: meName,
      toEmail: email,
      role,
      board: {
        name: board.name,
        emoji: board.emoji,
      }
    });

    setSent(true);
    setTimeout(onClose, 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--flat-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 text-info grid place-items-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-bold text-ink">Compartilhar Projeto</h3>
              <p className="text-xs text-muted">{board.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:bg-black/5 rounded-full transition">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {sent ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={20} />
              </div>
              <h4 className="font-bold text-ink text-lg">Convite Enviado!</h4>
              <p className="text-sm text-muted">
                Um convite foi enviado para a caixa postal de <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-ink mb-2">E-mail do Participante</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@hexxa.com"
                  className="w-full bg-surface-2 border px-4 py-3 rounded-xl text-sm outline-none transition focus:border-ink/20"
                  style={{ borderColor: "var(--flat-border)" }}
                  autoFocus
                />
              </div>

              {/* Permissão */}
              <div>
                <label className="block text-xs font-bold text-ink mb-2">Nível de Acesso</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole("viewer")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      role === "viewer" ? "bg-info/10 border-info text-info" : "bg-surface-2 border-transparent text-muted hover:border-ink/10"
                    }`}
                    style={{ borderColor: role === "viewer" ? "var(--color-info)" : "var(--flat-border)" }}
                  >
                    <span className="text-sm font-bold">Visualizador</span>
                    <span className="text-[10px] leading-tight">Pode apenas acompanhar o progresso e timeline.</span>
                  </button>

                  <button
                    onClick={() => setRole("admin")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      role === "admin" ? "bg-warning/10 border-warning text-warning" : "bg-surface-2 border-transparent text-muted hover:border-ink/10"
                    }`}
                    style={{ borderColor: role === "admin" ? "var(--color-warning)" : "var(--flat-border)" }}
                  >
                    <span className="text-sm font-bold flex items-center gap-1">
                      Administrador <ShieldAlert size={12} />
                    </span>
                    <span className="text-[10px] leading-tight">Pode criar, editar e concluir tarefas livremente.</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="p-5 border-t bg-black/[0.01] flex justify-end gap-3" style={{ borderColor: "var(--flat-border)" }}>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted hover:text-ink transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={!email.includes("@")}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-ink text-surface hover:bg-black/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={14} />
              Enviar Convite
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
