"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Trash2,
  Share2,
  Inbox,
  RefreshCw,
  Layers,
  Zap,
  CreditCard,
} from "lucide-react";
import { useFinanceStore, type ExpenseInvite } from "@/store/useFinanceStore";
import { useAuthStore } from "@/store/useAuthStore";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CATEGORY_LABEL: Record<string, string> = {
  personal: "Pessoal",
  casa: "Casa",
  familia: "Família",
};

const CATEGORY_COLOR: Record<string, string> = {
  personal: "bg-ink text-lime",
  casa: "bg-lime/80 text-ink",
  familia: "bg-sage/60 text-ink",
};

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "recorrente")
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-muted bg-ink/8 px-1.5 py-0.5 rounded-full">
        <RefreshCw size={9} /> recorrente
      </span>
    );
  if (tipo === "parcela")
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-ink bg-lime/70 px-1.5 py-0.5 rounded-full font-semibold">
        <Layers size={9} /> parcelado
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-info bg-info/10 px-1.5 py-0.5 rounded-full font-semibold">
      <Zap size={9} /> único
    </span>
  );
}

export function ExpenseInbox({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const invites = useFinanceStore((s) => s.invites);
  const receiveInvite = useFinanceStore((s) => s.receiveInvite);
  const acceptInvite = useFinanceStore((s) => s.acceptInvite);
  const rejectInvite = useFinanceStore((s) => s.rejectInvite);

  // Pull invites addressed to this user from localStorage (cross-user simulation)
  useEffect(() => {
    if (!user?.email) return;
    try {
      const key = `hexxa-invites-${user.email}`;
      const raw = JSON.parse(
        localStorage.getItem(key) ?? "[]",
      ) as ExpenseInvite[];
      raw.forEach((inv) => receiveInvite(inv));
    } catch {
      /* ignore */
    }
  }, [user?.email, receiveInvite]);

  const pending = invites.filter((i) => i.status === "pending");
  const resolved = invites.filter((i) => i.status !== "pending");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: "rgba(14,11,12,0.60)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="glass w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]"
      >
        {/* drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-ink/5 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-ink grid place-items-center shrink-0">
            <Inbox size={16} className="text-lime" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base">Caixa de Entrada</h2>
            <p className="text-[11px] text-muted">
              Despesas compartilhadas com você
            </p>
          </div>
          {pending.length > 0 && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-danger text-white text-[10px] font-bold">
              {pending.length}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-2 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {invites.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-surface-2 grid place-items-center">
                <Share2 size={24} className="text-muted/50" />
              </div>
              <p className="font-semibold text-sm text-muted">
                Nenhuma despesa compartilhada
              </p>
              <p className="text-[11px] text-muted/60 max-w-[200px]">
                Quando alguém compartilhar uma despesa com você, ela aparecerá
                aqui.
              </p>
            </div>
          )}

          {/* pending */}
          {pending.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2 px-1">
                Aguardando resposta · {pending.length}
              </p>
              <div className="space-y-2">
                <AnimatePresence>
                  {pending.map((inv) => (
                    <InviteCard
                      key={inv.id}
                      invite={inv}
                      onAccept={() => acceptInvite(inv.id)}
                      onReject={() => rejectInvite(inv.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* resolved */}
          {resolved.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2 px-1 mt-4">
                Respondidas
              </p>
              <div className="space-y-2">
                {resolved.map((inv) => (
                  <InviteCard key={inv.id} invite={inv} resolved />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InviteCard({
  invite,
  onAccept,
  onReject,
  resolved,
}: {
  invite: ExpenseInvite;
  onAccept?: () => void;
  onReject?: () => void;
  resolved?: boolean;
}) {
  const e = invite.expense;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border p-4 space-y-3 ${
        resolved ? "border-ink/5 opacity-60" : "glass shadow-sm"
      }`}
    >
      {/* who sent */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-ink/10 grid place-items-center shrink-0">
          <span className="text-[11px] font-bold text-ink uppercase">
            {invite.fromEmail[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-ink truncate">
            {invite.fromEmail}
          </p>
          <p className="text-[10px] text-muted">compartilhou uma despesa</p>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[e.category] ?? "bg-surface-2 text-ink"}`}
        >
          {CATEGORY_LABEL[e.category] ?? e.category}
        </span>
      </div>

      {/* expense info */}
      <div
        className="rounded-xl p-3 space-y-1"
        style={{ background: "rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-sm truncate flex-1">{e.name}</p>
          <p className="font-bold text-sm tabular-nums shrink-0">
            {fmt(e.amount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TipoBadge tipo={e.tipo} />
          {e.isCartao && (
            <span className="flex items-center gap-0.5 text-[10px] text-info bg-info/10 px-1.5 py-0.5 rounded-full">
              <CreditCard size={9} /> {e.cartaoNome || "Cartão"}
            </span>
          )}
          {e.totalParcelas && (
            <span className="text-[10px] text-muted">{e.totalParcelas}x</span>
          )}
          <span className="text-[10px] text-muted">· vence dia {e.dueDay}</span>
        </div>
        {e.notes && <p className="text-[11px] text-muted">{e.notes}</p>}
      </div>

      {/* actions */}
      {!resolved && (
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-ink/15 text-xs font-semibold text-muted hover:bg-surface-2 transition"
          >
            <Trash2 size={13} /> Recusar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ink text-lime text-xs font-semibold hover:opacity-90 transition"
          >
            <Check size={13} /> Aceitar
          </button>
        </div>
      )}

      {resolved && (
        <p
          className={`text-center text-[11px] font-semibold ${
            invite.status === "accepted" ? "text-success" : "text-muted"
          }`}
        >
          {invite.status === "accepted"
            ? "Adicionada às suas despesas"
            : "Recusada"}
        </p>
      )}
    </motion.div>
  );
}
