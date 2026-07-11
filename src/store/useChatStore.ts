"use client";
import { create } from "zustand";
import {
  listDmsWith,
  sendDm,
  markRead,
  listInboxSummary,
  type DmMessage,
} from "@/lib/chat/adapter";

interface State {
  active: string | null; // userId do outro
  threadCache: Record<string, DmMessage[]>;
  inbox: { otherId: string; lastMsg: DmMessage; unread: number }[];
}

interface Actions {
  open: (otherId: string, meId: string) => Promise<void>;
  close: () => void;
  refreshInbox: (meId: string) => Promise<void>;
  send: (meId: string, body: string, taskRef?: string) => Promise<void>;
  appendIncoming: (meId: string, msg: DmMessage) => void;
}

export const useChatStore = create<State & Actions>((set, get) => ({
  active: null,
  threadCache: {},
  inbox: [],

  open: async (otherId, meId) => {
    set({ active: otherId });
    const msgs = await listDmsWith(meId, otherId);
    set((s) => ({ threadCache: { ...s.threadCache, [otherId]: msgs } }));
    await markRead(meId, otherId);
    await get().refreshInbox(meId);
  },

  close: () => set({ active: null }),

  refreshInbox: async (meId) => {
    try {
      const list = await listInboxSummary(meId);
      set({ inbox: list });
    } catch (e) {
      console.error("inbox load failed", e);
    }
  },

  send: async (meId, body, taskRef) => {
    const otherId = get().active;
    if (!otherId) return;
    const msg = await sendDm({ fromUser: meId, toUser: otherId, body, taskRef });
    set((s) => ({
      threadCache: {
        ...s.threadCache,
        [otherId]: [...(s.threadCache[otherId] ?? []), msg],
      },
    }));
    await get().refreshInbox(meId);
  },

  appendIncoming: (meId, msg) => {
    const otherId = msg.fromUser === meId ? msg.toUser : msg.fromUser;
    set((s) => {
      const existing = s.threadCache[otherId] ?? [];
      // dedupe
      if (existing.some((m) => m.id === msg.id)) return s;
      return {
        threadCache: { ...s.threadCache, [otherId]: [...existing, msg] },
      };
    });
    get().refreshInbox(meId);
  },
}));
