"use client";
import { create } from "zustand";
import { listMembers, type Member } from "@/lib/team/adapter";

interface State {
  members: Member[];
  loading: boolean;
  lastError: string | null;
  loaded: boolean;
}

interface Actions {
  load: () => Promise<void>;
  upsertLocal: (m: Member) => void;
}

export const useTeamStore = create<State & Actions>((set) => ({
  members: [],
  loading: false,
  lastError: null,
  loaded: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listMembers();
      set({ members: items, loaded: true });
    } catch (e: any) {
      set({ lastError: e?.message ?? "falha ao carregar membros" });
    } finally {
      set({ loading: false });
    }
  },

  upsertLocal: (m) =>
    set((s) => {
      const idx = s.members.findIndex((x) => x.id === m.id);
      if (idx >= 0) {
        const next = [...s.members];
        next[idx] = m;
        return { members: next };
      }
      return { members: [...s.members, m] };
    }),
}));
