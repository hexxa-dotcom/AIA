"use client";
import { create } from "zustand";
import {
  createReminder,
  deleteReminder,
  listReminders,
  markReminderSent,
  type Reminder,
  type ReminderChannel,
} from "@/lib/reminders/notifier";

interface State {
  items: Reminder[];
  loading: boolean;
}

interface Actions {
  loadFor: (userId: string) => Promise<void>;
  add: (
    userId: string,
    input: { taskId: string; remindAt: number; channel: ReminderChannel; message?: string },
  ) => Promise<string>;
  remove: (id: string) => Promise<void>;
  markSent: (id: string) => Promise<void>;
}

export const useReminderStore = create<State & Actions>((set, get) => ({
  items: [],
  loading: false,

  loadFor: async (userId) => {
    set({ loading: true });
    try {
      const items = await listReminders(userId);
      set({ items });
    } catch (e) {
      console.error("[reminders] load falhou", e);
    } finally {
      set({ loading: false });
    }
  },

  add: async (userId, input) => {
    const id = await createReminder(userId, input);
    set((s) => ({ items: [...s.items, { id, sentAt: undefined, ...input }] }));
    return id;
  },

  remove: async (id) => {
    await deleteReminder(id);
    set((s) => ({ items: s.items.filter((r) => r.id !== id) }));
  },

  markSent: async (id) => {
    await markReminderSent(id);
    set((s) => ({
      items: s.items.map((r) => (r.id === id ? { ...r, sentAt: Date.now() } : r)),
    }));
  },
}));
