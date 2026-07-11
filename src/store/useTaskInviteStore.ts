"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import type { Task, CollaboratorRole, CollaboratorStatus } from "@/lib/types";

export interface TaskInvite {
  id:          string;
  fromEmail:   string;
  fromName?:   string;
  toEmail:     string;
  role:        CollaboratorRole;
  status:      CollaboratorStatus;
  taskId:      string;
  taskSnapshot: Pick<Task, "title" | "description" | "priority" | "dueDate" | "tags" | "subtasks">;
  createdAt:   number;
}

interface State {
  invites:    TaskInvite[];   // received by current user
  sent:       TaskInvite[];   // sent by current user
  hydrated:   boolean;
}

interface Actions {
  send:           (invite: Omit<TaskInvite, "id" | "createdAt" | "status">) => void;
  receive:        (invite: TaskInvite) => void;
  accept:         (inviteId: string) => TaskInvite | undefined;
  reject:         (inviteId: string) => void;
  pendingCount:   () => number;
  setHydrated:    (h: boolean) => void;
}

export const useTaskInviteStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      invites:  [],
      sent:     [],
      hydrated: false,

      send: (invite) => {
        const full: TaskInvite = { ...invite, id: nanoid(), status: "pending", createdAt: Date.now() };
        set((s) => ({ sent: [...s.sent, full] }));
        // Push to target user's localStorage inbox
        try {
          const key      = `aia-task-invites-${invite.toEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as TaskInvite[];
          localStorage.setItem(key, JSON.stringify([...existing, full]));
        } catch { /* ignore */ }
      },

      receive: (invite) =>
        set((s) => {
          if (s.invites.some((i) => i.id === invite.id)) return s;
          return { invites: [...s.invites, invite] };
        }),

      accept: (inviteId) => {
        const invite = get().invites.find((i) => i.id === inviteId);
        if (!invite) return undefined;
        set((s) => ({
          invites: s.invites.map((i) => i.id === inviteId ? { ...i, status: "accepted" } : i),
        }));
        // Signal back to sender (update localStorage on sender side)
        try {
          const sentKey = `aia-task-invites-sent-${invite.fromEmail}`;
          const raw     = JSON.parse(localStorage.getItem(sentKey) ?? "[]") as TaskInvite[];
          localStorage.setItem(sentKey, JSON.stringify(
            raw.map((i) => i.id === inviteId ? { ...i, status: "accepted" } : i),
          ));
        } catch { /* ignore */ }
        return invite;
      },

      reject: (inviteId) =>
        set((s) => ({
          invites: s.invites.map((i) => i.id === inviteId ? { ...i, status: "rejected" } : i),
        })),

      pendingCount: () => get().invites.filter((i) => i.status === "pending").length,

      setHydrated: (h) => set({ hydrated: h }),
    }),
    {
      name: "aia-task-invites",
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
