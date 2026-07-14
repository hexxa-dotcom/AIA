import { X, Calendar, Check, Trash2 } from "lucide-react";
import { useAgendaInviteStore } from "@/store/useAgendaInviteStore";

export function AgendaInviteInbox({ onClose }: { onClose: () => void }) {
  const invites = useAgendaInviteStore((s) => s.invites);
  const acceptInvite = useAgendaInviteStore((s) => s.acceptInvite);
  const rejectInvite = useAgendaInviteStore((s) => s.rejectInvite);
  
  const pending = invites.filter(i => i.status === "pending");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-ink/6">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Calendar size={18} className="text-ink" />
            Convites de Agenda
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-2 transition text-muted">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {pending.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Calendar size={32} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-sm text-ink">Nenhum convite pendente</p>
              <p className="text-xs mt-1 max-w-[200px] mx-auto">Você não tem novos convites para eventos na agenda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pending.map(invite => {
                const appt = invite.appointment;
                return (
                  <div key={invite.id} className="p-4 rounded-2xl bg-surface-2 border border-flat flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-ink text-sm truncate">{appt.title}</h3>
                        <p className="text-xs text-muted truncate">Por {invite.fromEmail}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-info/10 text-info shrink-0">
                        {appt.type}
                      </span>
                    </div>
                    
                    <div className="text-xs font-semibold text-ink/70">
                      📅 {new Date(appt.date).toLocaleDateString("pt-BR")} às {new Date(appt.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => acceptInvite(invite.id)}
                        className="flex-1 py-1.5 bg-ink text-surface rounded-xl text-xs font-bold hover:bg-ink/90 transition flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Aceitar
                      </button>
                      <button 
                        onClick={() => rejectInvite(invite.id)}
                        className="flex-1 py-1.5 bg-danger/10 text-danger rounded-xl text-xs font-bold hover:bg-danger/20 transition flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={14} /> Recusar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
