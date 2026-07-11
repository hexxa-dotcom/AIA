export type Priority = "low" | "medium" | "high" | "urgent";

export type RecurrenceType = "daily" | "weekly" | "monthly";

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek?: number[];  // 0=Dom..6=Sáb (para weekly)
  dayOfMonth?: number;    // 1-31 (para monthly)
  endDate?: number;       // timestamp, opcional
}

export type ColumnKey = "backlog" | "today" | "doing" | "done";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  doneAt?: number;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type CollaboratorRole   = "responsavel" | "acompanhante";
export type CollaboratorStatus = "pending" | "accepted" | "rejected";

export interface TaskCollaborator {
  email:     string;
  name?:     string;
  role:      CollaboratorRole;
  status:    CollaboratorStatus;
  invitedAt: number;
}

export type BoardRole = "admin" | "viewer";

export interface BoardCollaborator {
  email: string;
  name?: string;
  role: BoardRole;
  status: CollaboratorStatus;
  invitedAt: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startedAt: number;
  endedAt?: number;
  durationSec: number;
  note?: string;
}

export interface Task {
  id: string;
  boardId: string;
  column: ColumnKey;
  order: number;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: number;
  startDate?: number;
  tags: string[];
  subtasks: Subtask[];
  assignees: Assignee[];
  coverColor?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  totalTimeSec: number;
  hourlyRate?: number;
  scheduledStart?: number;
  scheduledEnd?: number;
  collaborators?: TaskCollaborator[];
  sharedFrom?: { email: string; name?: string };
  recurrence?: Recurrence;
}

export interface Board {
  id: string;
  name: string;
  emoji?: string;
  scope?: string;
  okrs?: string;
  kpis?: string;
  createdAt: number;
  collaborators?: BoardCollaborator[];
  sharedBy?: string;
}

export interface BoardInvite {
  id: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  board: Omit<Board, "id" | "createdAt" | "collaborators" | "sharedBy">;
  role: BoardRole;
  status: CollaboratorStatus;
  createdAt: number;
}

export type RoutineRecurrence =
  | "daily"
  | "weekdays"
  | "weekends"
  | "weekly"
  | "custom";

export type ActivityType = "custom" | "workout" | "study" | "reading" | "meeting" | "break";

export interface RoutineBlock {
  id: string;
  title: string;
  emoji?: string;
  startMinute: number;
  endMinute: number;
  recurrence: RoutineRecurrence;
  weekdays?: number[];
  color: string;
  isFlexible: boolean;
  activityType?: ActivityType;
  linkedId?: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: number;
}

export interface XPEvent {
  id: string;
  amount: number;
  reason: string;
  at: number;
}

export interface GameState {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDay?: string;
  todayXp: number;
  todayDate?: string;
  achievements: Achievement[];
  history: XPEvent[];
}

export interface ActiveTimer {
  taskId: string;
  startedAt: number;
  accumulatedSec: number;
  paused: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: number;
  end: number;
  taskId?: string;
  source: "task" | "routine" | "external";
  color?: string;
}
