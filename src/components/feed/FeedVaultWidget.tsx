"use client";
import { useVaultStore } from "@/store/useVaultStore";
import { useCollapse } from "@/hooks/useCollapse";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, Lock, KeyRound } from "lucide-react";
import Link from "next/link";

export function FeedVaultWidget() {
  const { collapsed, toggle } = useCollapse("vault-widget");
  const entries = useVaultStore((s) => s.entries);
  const status = useVaultStore((s) => s.status);

  return (
    <div className="glass rounded-3xl overflow-hidden flex flex-col border h-full" style={{ borderColor: "var(--flat-border)" }}>
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:bg-black/[0.02]"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--flat-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-ink text-surface shadow-sm">
            <Shield size={14} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink leading-tight">Cofre de Senhas</p>
            <p className="text-[10px] text-muted">
              {status === "unlocked" ? `${entries.length} itens seguros` : "Cofre bloqueado"}
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.18 }}
          style={{ color: "rgba(14,11,12,0.28)" }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {status === "locked" || status === "no-master" ? (
                <div className="py-4 text-center bg-surface-2 rounded-2xl border border-dashed" style={{ borderColor: "var(--flat-border)" }}>
                  <Lock size={24} className="mx-auto text-ink/20 mb-2" />
                  <p className="text-xs font-semibold text-muted mb-2">Seu cofre está trancado.</p>
                  <Link href="/cofre" className="inline-block px-4 py-2 bg-white rounded-xl text-[10px] font-bold text-ink shadow-sm hover:bg-black/5 transition">
                    Desbloquear
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-surface-2 rounded-2xl border flex flex-col items-center text-center" style={{ borderColor: "var(--flat-border)" }}>
                      <KeyRound size={16} className="text-muted mb-1" />
                      <span className="text-lg font-bold text-ink">{entries.length}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted font-bold">Credenciais</span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-2xl border flex flex-col items-center text-center" style={{ borderColor: "var(--flat-border)" }}>
                      <Shield size={16} className="text-success mb-1" />
                      <span className="text-lg font-bold text-success">Seguro</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted font-bold">Status</span>
                    </div>
                  </div>
                  
                  <Link href="/cofre" className="block w-full py-2 text-center text-[10px] font-bold text-muted hover:text-ink transition">
                    Acessar Cofre
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
