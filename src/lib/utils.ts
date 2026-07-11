import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatStopwatch(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDue(due: number | undefined): { label: string; tone: "ok" | "soon" | "late" | "none" } {
  if (!due) return { label: "", tone: "none" };
  const now = Date.now();
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  if (diffMs < 0) {
    const past = Math.abs(diffDays);
    if (past < 1) return { label: "Atrasado hoje", tone: "late" };
    return { label: `Atrasado ${Math.round(past)}d`, tone: "late" };
  }
  if (diffHours < 24) return { label: "Vence hoje", tone: "soon" };
  if (diffDays < 2) return { label: "Vence amanhã", tone: "soon" };
  if (diffDays < 7) return { label: `Em ${Math.round(diffDays)}d`, tone: "ok" };
  const d = new Date(due);
  return { label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), tone: "ok" };
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--prio-low)",
  medium: "var(--prio-medium)",
  high: "var(--prio-high)",
  urgent: "var(--prio-urgent)",
};
export function priorityColor(p: string) {
  return PRIORITY_COLORS[p] ?? "var(--prio-medium)";
}
