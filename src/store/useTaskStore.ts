"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import type { Board, ColumnKey, Subtask, Task, TimeEntry, Recurrence, BoardInvite } from "@/lib/types";
import { makeSeedData } from "@/lib/seed";
import { usePerfilStore } from "./usePerfilStore";

interface State {
  boards: Board[];
  activeBoardId: string;
  tasks: Task[];
  timeEntries: TimeEntry[];
  focusedTaskId?: string;
  hydrated: boolean;
  invites: BoardInvite[];
  sentInvites: BoardInvite[];
}

interface Actions {
  setHydrated: () => void;
  initIfEmpty: () => void;

  // boards
  createBoard: (name: string, emoji?: string) => string;
  updateBoard: (id: string, data: Partial<Board>) => void;
  switchBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;

  // tasks
  createTask: (input: { title: string; column?: ColumnKey; priority?: Task["priority"] }) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, column: ColumnKey, order?: number) => void;
  reorderInColumn: (column: ColumnKey, ids: string[]) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;

  // subtasks
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => Subtask | null;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // time entries
  addTimeEntry: (entry: TimeEntry) => void;

  // focus
  setFocused: (id?: string) => void;
  addManySubtasks: (taskId: string, titles: string[]) => void;
  importTask: (task: Task) => void;

  // invites
  sendInvite: (invite: Omit<BoardInvite, "id" | "status" | "createdAt">) => void;
  receiveInvite: (invite: BoardInvite) => void;
  acceptInvite: (id: string) => void;
  rejectInvite: (id: string) => void;
  pendingBoardCount: () => number;

  // derived
  tasksByColumn: (column: ColumnKey) => Task[];
  taskById: (id: string) => Task | undefined;
  countDone: () => number;
  countSubtasksDone: () => number;
  monthTotalSec: () => number;
}

function getNextDueDate(task: Task): number | undefined {
  if (!task.recurrence || !task.dueDate) return undefined;
  const d = new Date(task.dueDate);
  if (task.recurrence.type === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (task.recurrence.type === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (task.recurrence.type === "monthly") {
    d.setMonth(d.getMonth() + 1);
  }
  if (task.recurrence.endDate && d.getTime() > task.recurrence.endDate) return undefined;
  return d.getTime();
}

export const useTaskStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      boards: [],
      activeBoardId: "",
      tasks: [],
      timeEntries: [],
      hydrated: false,
      invites: [],
      sentInvites: [],

      setHydrated: () => set({ hydrated: true }),

      initIfEmpty: () => {
        if (get().boards.length > 0) return;
        const { board, tasks } = makeSeedData();
        set({ boards: [board], activeBoardId: board.id, tasks });
      },

      createBoard: (name, emoji) => {
        const id = nanoid();
        const scope = usePerfilStore.getState().perfil;
        const newBoard: Board = { id, name, emoji, scope, createdAt: Date.now() };
        set((s) => ({ boards: [...s.boards, newBoard], activeBoardId: id }));
        return id;
      },
      updateBoard: (id, data) => set((s) => ({
        boards: s.boards.map((b) => (b.id === id ? { ...b, ...data } : b))
      })),
      switchBoard: (id) => set({ activeBoardId: id }),
      renameBoard: (id, name) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, name } : b)) })),
      deleteBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          tasks: s.tasks.filter((t) => t.boardId !== id),
          activeBoardId: s.activeBoardId === id ? s.boards.find((b) => b.id !== id)?.id ?? "" : s.activeBoardId,
        })),

      createTask: ({ title, column = "backlog", priority = "medium" }) => {
        const boardId = get().activeBoardId || get().boards[0]?.id;
        if (!boardId) return "";
        const id = nanoid();
        const orderMax =
          get()
            .tasks.filter((t) => t.boardId === boardId && t.column === column)
            .reduce((m, t) => Math.max(m, t.order), -1) + 1;
        const task: Task = {
          id,
          boardId,
          column,
          order: orderMax,
          title,
          priority,
          tags: [],
          subtasks: [],
          assignees: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalTimeSec: 0,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t,
          ),
        })),

      moveTask: (id, column, order) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const colTasks = s.tasks
            .filter((t) => t.boardId === task.boardId && t.column === column && t.id !== id)
            .sort((a, b) => a.order - b.order);
          const insertAt = typeof order === "number" ? order : colTasks.length;
          colTasks.splice(insertAt, 0, { ...task, column });
          const reindexed = colTasks.map((t, i) => ({ ...t, order: i, updatedAt: Date.now() }));
          const others = s.tasks.filter(
            (t) => !(t.boardId === task.boardId && (t.column === column || t.id === id)),
          );
          let next = [...others, ...reindexed];
          if (column === "done") {
            next = next.map((t) => (t.id === id ? { ...t, completedAt: Date.now() } : t));
          }
          return { tasks: next };
        }),

      reorderInColumn: (column, ids) =>
        set((s) => {
          const idIndex: Record<string, number> = {};
          ids.forEach((id, i) => (idIndex[id] = i));
          return {
            tasks: s.tasks.map((t) =>
              t.column === column && idIndex[t.id] !== undefined
                ? { ...t, order: idIndex[t.id], updatedAt: Date.now() }
                : t,
            ),
          };
        }),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          timeEntries: s.timeEntries.filter((e) => e.taskId !== id),
        })),

      completeTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;

          const updatedTasks = s.tasks.map((t) =>
            t.id === id ? { ...t, column: "done" as ColumnKey, completedAt: Date.now(), updatedAt: Date.now() } : t,
          );

          if (task.recurrence) {
            const nextDue = getNextDueDate(task);
            if (nextDue !== undefined) {
              const newTask: Task = {
                id: nanoid(),
                boardId: task.boardId,
                column: "backlog",
                order:
                  s.tasks
                    .filter((t) => t.boardId === task.boardId && t.column === "backlog")
                    .reduce((m, t) => Math.max(m, t.order), -1) + 1,
                title: task.title,
                description: task.description,
                priority: task.priority,
                recurrence: task.recurrence,
                dueDate: nextDue,
                tags: task.tags,
                subtasks: [],
                assignees: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                totalTimeSec: 0,
              };
              return { tasks: [...updatedTasks, newTask] };
            }
          }

          return { tasks: updatedTasks };
        }),

      reopenTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, column: "today", completedAt: undefined, updatedAt: Date.now() } : t,
          ),
        })),

      addSubtask: (taskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    { id: nanoid(), title, done: false, createdAt: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : t,
          ),
        })),

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks.find((t) => t.id === taskId);
        const sub = task?.subtasks.find((s) => s.id === subtaskId);
        if (!task || !sub) return null;
        const newDone = !sub.done;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((su) =>
                    su.id === subtaskId
                      ? { ...su, done: newDone, doneAt: newDone ? Date.now() : undefined }
                      : su,
                  ),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        }));
        return { ...sub, done: newDone };
      },

      updateSubtask: (taskId, subtaskId, title) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((su) => (su.id === subtaskId ? { ...su, title } : su)),
                  updatedAt: Date.now(),
                }
              : t,
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((su) => su.id !== subtaskId), updatedAt: Date.now() }
              : t,
          ),
        })),

      addTimeEntry: (entry) =>
        set((s) => ({
          timeEntries: [...s.timeEntries, entry],
          tasks: s.tasks.map((t) =>
            t.id === entry.taskId ? { ...t, totalTimeSec: t.totalTimeSec + entry.durationSec } : t,
          ),
        })),

      setFocused: (id) => set({ focusedTaskId: id }),

      addManySubtasks: (taskId, titles) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    ...titles.map((title) => ({
                      id: nanoid(),
                      title,
                      done: false,
                      createdAt: Date.now(),
                    })),
                  ],
                  updatedAt: Date.now(),
                }
              : t,
          ),
        })),

      importTask: (task) =>
        set((s) => {
          if (s.tasks.some((t) => t.id === task.id)) return s;
          return { tasks: [...s.tasks, task] };
        }),

      tasksByColumn: (column) => {
        const boardId = get().activeBoardId;
        return get()
          .tasks.filter((t) => t.boardId === boardId && t.column === column)
          .sort((a, b) => a.order - b.order);
      },
      taskById: (id) => get().tasks.find((t) => t.id === id),
      countDone: () => get().tasks.filter((t) => t.column === "done").length,
      countSubtasksDone: () =>
        get().tasks.reduce((sum, t) => sum + t.subtasks.filter((s) => s.done).length, 0),

      monthTotalSec: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return get().timeEntries.reduce((total, entry) => {
          const d = new Date(entry.startedAt);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            return total + entry.durationSec;
          }
          return total;
        }, 0);
      },

      sendInvite: (invite) => {
        const newInvite: BoardInvite = { ...invite, id: nanoid(), status: "pending", createdAt: Date.now() };
        set((s) => ({ sentInvites: [...s.sentInvites, newInvite] }));
        try {
          const key = `aia-board-invites-${invite.toEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as BoardInvite[];
          localStorage.setItem(key, JSON.stringify([...existing, newInvite]));
        } catch { /* ignore */ }
      },

      receiveInvite: (invite) => {
        const current = get().invites;
        if (!current.find((i) => i.id === invite.id)) {
          set({ invites: [...current, invite] });
        }
      },

      acceptInvite: (id) => {
        const invite = get().invites.find((i) => i.id === id);
        if (!invite) return;
        set((s) => {
          const newBoard: Board = {
            ...invite.board,
            id: nanoid(),
            createdAt: Date.now(),
            sharedBy: invite.fromEmail,
            collaborators: [
              { email: invite.toEmail, role: invite.role, status: "accepted", invitedAt: invite.createdAt }
            ]
          };
          // Importa o board se não existir (evita duplicação)
          const boards = s.boards.find(b => b.id === newBoard.id) ? s.boards : [...s.boards, newBoard];
          return {
            invites: s.invites.filter((i) => i.id !== id),
            boards,
            activeBoardId: newBoard.id
          };
        });
      },

      rejectInvite: (id) => set((s) => ({ invites: s.invites.filter((i) => i.id !== id) })),
      pendingBoardCount: () => get().invites.filter((i) => i.status === "pending").length,

    }),
    {
      name: "aia-tasks-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
