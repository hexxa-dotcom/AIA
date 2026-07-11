import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const STATE_FILE = join(process.cwd(), ".hexxa-mcp-state.json");

export interface McpState {
  tasks: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: number;
    completedAt?: number;
    tags?: string[];
  }[];
  expenses: {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    category: string;
    group: string;
    tipo: string;
    isCartao: boolean;
    cartaoNome?: string;
    paidThisMonth: boolean;
  }[];
  game: {
    level: number;
    xp: number;
    streakDays: number;
    todayXp: number;
  };
  syncedAt: string;
}

export function saveState(state: McpState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadState(): McpState | null {
  try {
    if (!existsSync(STATE_FILE)) return null;
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}
