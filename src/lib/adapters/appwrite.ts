"use client";
import { getAppwrite } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useAuthStore } from "@/store/useAuthStore";
import type { Appointment } from "@/store/useAgendaStore";
import type { RecurringExpense, ExpenseInvite } from "@/store/useFinanceStore";
import type { StudyItem } from "@/store/useStudiesStore";
import type {
  Achievement,
  Board,
  ColumnKey,
  GameState,
  Priority,
  RoutineBlock,
  RoutineRecurrence,
  Subtask,
  Task,
  TimeEntry,
  XPEvent,
} from "@/lib/types";

export interface AppwriteSnapshot {
  boards: Board[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  routines: RoutineBlock[];
  game: GameState | null;
  expenses?: RecurringExpense[];
  expenseInvites?: ExpenseInvite[];
  appointments?: Appointment[];
  studies?: StudyItem[];
}

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "aia";

// Helper para listar todos os documentos tratando paginação
async function listAllDocuments(collectionId: string, queries: any[] = []): Promise<any[]> {
  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado");

  let allDocs: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await databases.listDocuments(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset),
    ]);
    allDocs = allDocs.concat(res.documents);
    if (res.documents.length < limit) break;
    offset += limit;
  }
  return allDocs;
}

async function syncCollection(
  collectionId: string,
  userId: string,
  localItems: any[],
  mapToRow: (item: any) => any,
  queryField: string = "userId",
  queryValue: string = userId,
) {
  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado");

  // 1. Obter todos os documentos remotos do usuário
  const remoteDocs = await listAllDocuments(collectionId, [
    Query.equal(queryField, queryValue),
  ]);

  const remoteMap = new Map(remoteDocs.map((d) => [d.$id, d]));
  const localMap = new Map(localItems.map((item) => [item.id, item]));

  const permissions = [
    `read("user:${userId}")`,
    `update("user:${userId}")`,
    `delete("user:${userId}")`,
  ];

  // 2. Criar ou atualizar itens locais
  for (const localItem of localItems) {
    const docId = localItem.id;
    const mapped = mapToRow(localItem);

    if (remoteMap.has(docId)) {
      await databases.updateDocument(DATABASE_ID, collectionId, docId, mapped, permissions);
    } else {
      await databases.createDocument(DATABASE_ID, collectionId, docId, mapped, permissions);
    }
  }

  // 3. Deletar itens que não existem mais localmente
  for (const remoteDoc of remoteDocs) {
    const docId = remoteDoc.$id;
    if (!localMap.has(docId)) {
      await databases.deleteDocument(DATABASE_ID, collectionId, docId);
    }
  }
}

// Mapeamentos
function rowToTask(row: any, subtasks: any[]): Task {
  return {
    id: row.$id,
    boardId: row.boardId,
    column: row.column as ColumnKey,
    order: row.order ?? 0,
    title: row.title,
    description: row.description ?? undefined,
    priority: (row.priority ?? "medium") as Priority,
    dueDate: row.dueDate ?? undefined,
    startDate: row.startDate ?? undefined,
    scheduledStart: row.scheduledStart ?? undefined,
    scheduledEnd: row.scheduledEnd ?? undefined,
    tags: row.tags ?? [],
    coverColor: row.coverColor ?? undefined,
    totalTimeSec: row.totalTimeSec ?? 0,
    hourlyRate: row.hourlyRate ?? undefined,
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignees: [],
    subtasks: subtasks
      .filter((s) => s.taskId === row.$id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(
        (s): Subtask => ({
          id: s.$id,
          title: s.title,
          done: s.done,
          doneAt: s.doneAt ?? undefined,
          createdAt: s.createdAt,
        }),
      ),
  };
}

function taskToRow(t: Task, userId: string) {
  return {
    boardId: t.boardId,
    userId,
    column: t.column,
    order: t.order,
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    dueDate: t.dueDate ?? null,
    startDate: t.startDate ?? null,
    scheduledStart: t.scheduledStart ?? null,
    scheduledEnd: t.scheduledEnd ?? null,
    tags: t.tags,
    coverColor: t.coverColor ?? null,
    totalTimeSec: t.totalTimeSec,
    hourlyRate: t.hourlyRate ?? null,
    completedAt: t.completedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function subtaskToRow(s: Subtask, taskId: string, userId: string, position: number) {
  return {
    taskId,
    userId,
    title: s.title,
    done: s.done,
    doneAt: s.doneAt ?? null,
    position,
    createdAt: s.createdAt,
  };
}

function rowToRoutine(r: any): RoutineBlock {
  return {
    id: r.$id,
    title: r.title,
    emoji: r.emoji ?? undefined,
    startMinute: r.startMinute,
    endMinute: r.endMinute,
    recurrence: r.recurrence as RoutineRecurrence,
    weekdays: r.weekdays ?? undefined,
    color: r.color ?? "#d6d6d2",
    isFlexible: r.isFlexible ?? false,
  };
}

function routineToRow(b: RoutineBlock, userId: string) {
  return {
    userId,
    title: b.title,
    emoji: b.emoji ?? null,
    startMinute: b.startMinute,
    endMinute: b.endMinute,
    recurrence: b.recurrence,
    weekdays: b.weekdays ?? [],
    color: b.color,
    isFlexible: b.isFlexible,
  };
}

// Mapeamentos para Finanças
function expenseToRow(e: RecurringExpense, userId: string) {
  return {
    userId,
    name: e.name,
    amount: e.amount,
    dueDay: e.dueDay,
    category: e.category,
    group: e.group,
    notes: e.notes || null,
    isActive: e.isActive,
    createdAt: e.createdAt,
    tipo: e.tipo,
    totalParcelas: e.totalParcelas || null,
    parcelaInicio: e.parcelaInicio || null,
    isCartao: e.isCartao,
    cartaoNome: e.cartaoNome || null,
    payments: JSON.stringify(e.payments),
    imovel: e.imovel || null,
    familyMember: e.familyMember || null,
    sharedWith: e.sharedWith || [],
    sharedBy: e.sharedBy || null,
  };
}

function rowToExpense(r: any): RecurringExpense {
  return {
    id: r.$id,
    name: r.name,
    amount: r.amount,
    dueDay: r.dueDay,
    category: r.category,
    group: r.group,
    notes: r.notes || undefined,
    isActive: r.isActive,
    createdAt: r.createdAt,
    tipo: r.tipo,
    totalParcelas: r.totalParcelas || undefined,
    parcelaInicio: r.parcelaInicio || undefined,
    isCartao: r.isCartao,
    cartaoNome: r.cartaoNome || undefined,
    payments: r.payments ? JSON.parse(r.payments) : {},
    imovel: r.imovel || undefined,
    familyMember: r.familyMember || undefined,
    sharedWith: r.sharedWith || undefined,
    sharedBy: r.sharedBy || undefined,
  };
}

function inviteToRow(i: ExpenseInvite) {
  return {
    fromEmail: i.fromEmail,
    fromName: i.fromName || null,
    toEmail: i.toEmail,
    expense: JSON.stringify(i.expense),
    status: i.status,
    createdAt: i.createdAt,
  };
}

function rowToInvite(r: any): ExpenseInvite {
  return {
    id: r.$id,
    fromEmail: r.fromEmail,
    fromName: r.fromName || undefined,
    toEmail: r.toEmail,
    expense: JSON.parse(r.expense),
    status: r.status,
    createdAt: r.createdAt,
  };
}

// Mapeamentos para Agenda
function appointmentToRow(a: Appointment, userId: string) {
  return {
    userId,
    title: a.title,
    date: a.date,
    endDate: a.endDate || null,
    type: a.type,
    description: a.description || null,
    allDay: a.allDay || null,
  };
}

function rowToAppointment(r: any): Appointment {
  return {
    id: r.$id,
    title: r.title,
    date: r.date,
    endDate: r.endDate || undefined,
    type: r.type,
    description: r.description || undefined,
    allDay: r.allDay || undefined,
  };
}

// Mapeamentos para Estudos
function studyToRow(s: StudyItem, userId: string) {
  return {
    userId,
    type: s.type,
    title: s.title,
    authorOrProvider: s.authorOrProvider || null,
    status: s.status,
    currentProgress: s.currentProgress,
    totalProgress: s.totalProgress,
    coverUrl: s.coverUrl || null,
    emoji: s.emoji || null,
  };
}

function rowToStudy(r: any): StudyItem {
  return {
    id: r.$id,
    type: r.type,
    title: r.title,
    authorOrProvider: r.authorOrProvider || undefined,
    status: r.status,
    currentProgress: r.currentProgress,
    totalProgress: r.totalProgress,
    coverUrl: r.coverUrl || undefined,
    emoji: r.emoji || undefined,
  };
}

export async function pullAll(userId: string): Promise<AppwriteSnapshot> {
  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado");

  const email = useAuthStore.getState().user?.email || "";

  const [
    boardsRes,
    tasksRes,
    subsRes,
    timeRes,
    routineRes,
    gameRes,
    achRes,
    xpRes,
    expensesRes,
    invitesToMeRes,
    invitesFromMeRes,
    apptsRes,
    studiesRes,
  ] = await Promise.all([
    listAllDocuments("boards", [Query.equal("userId", userId)]),
    listAllDocuments("tasks", [Query.equal("userId", userId)]),
    listAllDocuments("subtasks", [Query.equal("userId", userId)]),
    listAllDocuments("time_entries", [Query.equal("userId", userId)]),
    listAllDocuments("routine_blocks", [Query.equal("userId", userId)]),
    databases.listDocuments(DATABASE_ID, "game_state", [
      Query.equal("userId", userId),
      Query.limit(1),
    ]),
    listAllDocuments("achievements", [Query.equal("userId", userId)]),
    listAllDocuments("xp_events", [
      Query.equal("userId", userId),
      Query.limit(100),
    ]),
    listAllDocuments("expenses", [Query.equal("userId", userId)]),
    email ? listAllDocuments("expense_invites", [Query.equal("toEmail", email)]) : Promise.resolve([]),
    email ? listAllDocuments("expense_invites", [Query.equal("fromEmail", email)]) : Promise.resolve([]),
    listAllDocuments("appointments", [Query.equal("userId", userId)]),
    listAllDocuments("studies", [Query.equal("userId", userId)]),
  ]);

  const boards = boardsRes.map((b) => ({
    id: b.$id,
    name: b.name,
    emoji: b.emoji ?? undefined,
    createdAt: b.createdAt,
    tasks: [],
  }));

  const subtasksMap = new Map<string, Subtask[]>();
  subsRes.forEach((s) => {
    const list = subtasksMap.get(s.taskId) || [];
    list.push({
      id: s.$id,
      title: s.title,
      done: s.done,
      doneAt: s.doneAt ?? undefined,
      createdAt: s.createdAt,
    });
    subtasksMap.set(s.taskId, list);
  });

  const tasks = tasksRes.map((t) => ({
    id: t.$id,
    boardId: t.boardId,
    column: t.column as ColumnKey,
    order: t.order,
    title: t.title,
    description: t.description ?? undefined,
    priority: t.priority as Priority,
    dueDate: t.dueDate ?? undefined,
    startDate: t.startDate ?? undefined,
    scheduledStart: t.scheduledStart ?? undefined,
    scheduledEnd: t.scheduledEnd ?? undefined,
    tags: t.tags ?? [],
    coverColor: t.coverColor ?? undefined,
    totalTimeSec: t.totalTimeSec ?? 0,
    hourlyRate: t.hourlyRate ?? undefined,
    completedAt: t.completedAt ?? undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    assignees: [],
    subtasks: subtasksMap.get(t.$id) || [],
  }));

  const timeEntries = timeRes.map(
    (e): TimeEntry => ({
      id: e.$id,
      taskId: e.taskId,
      startedAt: e.startedAt,
      endedAt: e.endedAt ?? undefined,
      durationSec: e.durationSec ?? 0,
      note: e.note ?? undefined,
    }),
  );

  const routines = routineRes.map(rowToRoutine);

  const achievements: Achievement[] = achRes.map((a) => ({
    id: a.$id,
    key: a.key,
    title: "",
    description: "",
    emoji: "",
    unlockedAt: a.unlockedAt,
  }));

  const history: XPEvent[] = xpRes.map((x) => ({
    id: x.$id,
    amount: x.amount,
    reason: x.reason ?? "",
    at: x.at,
  }));

  const gameRow = gameRes.documents[0];
  const game: GameState | null = gameRow
    ? {
        xp: gameRow.xp ?? 0,
        level: gameRow.level ?? 1,
        streakDays: gameRow.streakDays ?? 0,
        lastActiveDay: gameRow.lastActiveDay ?? undefined,
        todayXp: 0,
        achievements,
        history,
      }
    : null;

  const expenses = expensesRes.map(rowToExpense);
  const expenseInvites = [...invitesToMeRes, ...invitesFromMeRes].map(rowToInvite);
  const appointments = apptsRes.map(rowToAppointment);
  const studies = studiesRes.map(rowToStudy);

  return { boards, tasks, timeEntries, routines, game, expenses, expenseInvites, appointments, studies };
}

export async function pushAll(
  userId: string,
  snapshot: AppwriteSnapshot,
): Promise<void> {
  const { databases } = getAppwrite();
  if (!databases) throw new Error("Appwrite não inicializado");

  // Sync Boards
  await syncCollection("boards", userId, snapshot.boards, (b) => ({
    userId,
    name: b.name,
    emoji: b.emoji ?? null,
    createdAt: b.createdAt,
  }));

  // Sync Tasks
  await syncCollection("tasks", userId, snapshot.tasks, (t) => taskToRow(t, userId));

  // Sync Subtasks
  const subtasks = snapshot.tasks.flatMap((t) =>
    t.subtasks.map((s, i) => ({
      ...s,
      taskId: t.id,
      position: i,
    })),
  );
  await syncCollection("subtasks", userId, subtasks, (s) =>
    subtaskToRow(s, s.taskId, userId, s.position),
  );

  // Sync Time Entries
  await syncCollection("time_entries", userId, snapshot.timeEntries, (e) => ({
    userId,
    taskId: e.taskId,
    startedAt: e.startedAt,
    endedAt: e.endedAt ?? null,
    durationSec: e.durationSec,
    note: e.note ?? null,
  }));

  // Sync Routines
  await syncCollection("routine_blocks", userId, snapshot.routines, (r) =>
    routineToRow(r, userId),
  );

  // Sync Achievements
  if (snapshot.game?.achievements) {
    await syncCollection("achievements", userId, snapshot.game.achievements, (a) => ({
      userId,
      key: a.key,
      unlockedAt: a.unlockedAt,
    }));
  }

  // Sync XP Events
  if (snapshot.game?.history) {
    await syncCollection("xp_events", userId, snapshot.game.history, (x) => ({
      userId,
      amount: x.amount,
      reason: x.reason ?? null,
      at: x.at,
    }));
  }

  // Sync Game State (single document, document ID is userId)
  if (snapshot.game) {
    const gameData = {
      userId,
      xp: snapshot.game.xp,
      level: snapshot.game.level,
      streakDays: snapshot.game.streakDays,
      lastActiveDay: snapshot.game.lastActiveDay ?? null,
      updatedAt: Date.now(),
    };
    const permissions = [
      `read("user:${userId}")`,
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
    ];

    try {
      await databases.updateDocument(DATABASE_ID, "game_state", userId, gameData, permissions);
    } catch (e: any) {
      if (e.status === 404 || e.code === 404) {
        await databases.createDocument(DATABASE_ID, "game_state", userId, gameData, permissions);
      } else {
        throw e;
      }
    }
  }

  // Sync Expenses
  if (snapshot.expenses) {
    await syncCollection("expenses", userId, snapshot.expenses, (e) =>
      expenseToRow(e, userId),
    );
  }

  // Sync Expense Invites
  if (snapshot.expenseInvites) {
    const email = useAuthStore.getState().user?.email || "";
    const sentInvites = snapshot.expenseInvites.filter((i) => i.fromEmail === email);
    await syncCollection(
      "expense_invites",
      userId,
      sentInvites,
      (i) => inviteToRow(i),
      "fromEmail",
      email
    );
  }

  // Sync Appointments
  if (snapshot.appointments) {
    await syncCollection("appointments", userId, snapshot.appointments, (a) =>
      appointmentToRow(a, userId),
    );
  }

  // Sync Studies
  if (snapshot.studies) {
    await syncCollection("studies", userId, snapshot.studies, (s) =>
      studyToRow(s, userId),
    );
  }
}

export async function deleteTaskRemote(taskId: string) {
  const { databases } = getAppwrite();
  if (!databases) return;
  try {
    await databases.deleteDocument(DATABASE_ID, "tasks", taskId);
  } catch (e) {}
}

export async function deleteRoutineRemote(id: string) {
  const { databases } = getAppwrite();
  if (!databases) return;
  try {
    await databases.deleteDocument(DATABASE_ID, "routine_blocks", id);
  } catch (e) {}
}
