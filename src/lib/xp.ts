export const XP_REWARDS = {
  subtaskDone: 5,
  taskCreated: 2,
  taskDone: 20,
  taskOnTime: 10,
  routineFollowed: 8,
  streakBonusPerDay: 3,
};

export function levelFromXp(xp: number): number {
  return Math.floor(0.1 * Math.sqrt(xp)) + 1;
}

export function xpForLevel(level: number): number {
  const lvlMinusOne = Math.max(0, level - 1);
  return Math.pow(lvlMinusOne / 0.1, 2);
}

export function levelProgress(xp: number): {
  level: number;
  current: number;
  needed: number;
  pct: number;
} {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = xp - base;
  const needed = next - base;
  return {
    level,
    current,
    needed,
    pct: Math.min(100, (current / needed) * 100),
  };
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  emoji: string;
  test: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  totalTasksDone: number;
  totalSubtasksDone: number;
  streakDays: number;
  level: number;
  timeTrackedSec: number;
  routinesCompleted: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_task",
    title: "Primeira tarefa",
    description: "Concluiu sua primeira tarefa",
    emoji: "",
    test: (c) => c.totalTasksDone >= 1,
  },
  {
    key: "ten_tasks",
    title: "Maratonista",
    description: "Concluiu 10 tarefas",
    emoji: "",
    test: (c) => c.totalTasksDone >= 10,
  },
  {
    key: "fifty_tasks",
    title: "Imparável",
    description: "Concluiu 50 tarefas",
    emoji: "",
    test: (c) => c.totalTasksDone >= 50,
  },
  {
    key: "streak_3",
    title: "Pegou ritmo",
    description: "3 dias seguidos ativo",
    emoji: "",
    test: (c) => c.streakDays >= 3,
  },
  {
    key: "streak_7",
    title: "Semana cheia",
    description: "7 dias seguidos ativo",
    emoji: "",
    test: (c) => c.streakDays >= 7,
  },
  {
    key: "streak_30",
    title: "Hábito formado",
    description: "30 dias seguidos ativo",
    emoji: "",
    test: (c) => c.streakDays >= 30,
  },
  {
    key: "level_5",
    title: "Avançando",
    description: "Atingiu o nível 5",
    emoji: "",
    test: (c) => c.level >= 5,
  },
  {
    key: "level_10",
    title: "Veterano",
    description: "Atingiu o nível 10",
    emoji: "",
    test: (c) => c.level >= 10,
  },
  {
    key: "deep_work",
    title: "Foco profundo",
    description: "1 hora rastreada em uma tarefa",
    emoji: "",
    test: (c) => c.timeTrackedSec >= 3600,
  },
  {
    key: "subtask_master",
    title: "Quebrador de tarefas",
    description: "100 subtarefas concluídas",
    emoji: "",
    test: (c) => c.totalSubtasksDone >= 100,
  },
];
