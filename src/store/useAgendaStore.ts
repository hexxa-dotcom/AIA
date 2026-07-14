import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppointmentType = "reuniao" | "pessoal" | "saude" | "outro";

export interface Appointment {
  id: string;
  title: string;
  date: number; // ms timestamp
  endDate?: number;
  type: AppointmentType;
  description?: string;
  allDay?: boolean;
  attendees?: string[];
}

interface State {
  appointments: Appointment[];
  add: (a: Omit<Appointment, "id">) => void;
  update: (id: string, patch: Partial<Appointment>) => void;
  remove: (id: string) => void;
}

export const useAgendaStore = create<State>()(
  persist(
    (set) => ({
      appointments: [],
      add: (a) =>
        set((s) => ({ appointments: [...s.appointments, { ...a, id: crypto.randomUUID() }] })),
      update: (id, patch) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      remove: (id) => set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),
    }),
    { name: "aia-agenda" },
  ),
);
