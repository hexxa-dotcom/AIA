import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import type { Appointment } from "./useAgendaStore";
import { useAgendaStore } from "./useAgendaStore";

export interface AgendaInvite {
  id: string;
  appointment: Omit<Appointment, "id">;
  fromEmail: string;
  toEmail: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
}

interface State {
  invites: AgendaInvite[];
  sentInvites: AgendaInvite[];
  sendInvite: (invite: Omit<AgendaInvite, "id" | "status" | "createdAt">) => void;
  receiveInvite: (invite: AgendaInvite) => void;
  acceptInvite: (id: string) => void;
  rejectInvite: (id: string) => void;
  pendingCount: () => number;
}

export const useAgendaInviteStore = create<State>()(
  persist(
    (set, get) => ({
      invites: [],
      sentInvites: [],
      
      sendInvite: (invite) => {
        const newInvite: AgendaInvite = { ...invite, id: nanoid(), status: "pending", createdAt: Date.now() };
        set((s) => ({ sentInvites: [...s.sentInvites, newInvite] }));
        
        // Simula o recebimento imediato para fins de demonstração
        setTimeout(() => {
          get().receiveInvite(newInvite);
        }, 500);

        try {
          const key = `aia-agenda-invites-${invite.toEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as AgendaInvite[];
          localStorage.setItem(key, JSON.stringify([...existing, newInvite]));
        } catch { /* ignore */ }
      },

      receiveInvite: (invite) => {
        set((s) => {
          if (s.invites.some(i => i.id === invite.id)) return s;
          return { invites: [...s.invites, invite] };
        });
      },

      acceptInvite: (id) => {
        const invite = get().invites.find(i => i.id === id);
        if (!invite) return;

        // Adiciona na agenda local
        const appt: Omit<Appointment, "id"> = {
          ...invite.appointment,
          attendees: invite.appointment.attendees?.includes(invite.fromEmail) 
            ? invite.appointment.attendees 
            : [...(invite.appointment.attendees || []), invite.fromEmail]
        };
        useAgendaStore.getState().add(appt);

        set((s) => ({
          invites: s.invites.filter(i => i.id !== id)
        }));
      },

      rejectInvite: (id) => {
        set((s) => ({
          invites: s.invites.filter(i => i.id !== id)
        }));
      },

      pendingCount: () => {
        return get().invites.filter(i => i.status === "pending").length;
      }
    }),
    { name: "aia-agenda-invites" }
  )
);
