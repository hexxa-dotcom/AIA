"use client";
import { useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useSoundStore } from "@/store/useSoundStore";
import { sounds } from "@/lib/sounds";

export function useSoundEvents() {
  const enabled = useSoundStore((s) => s.enabled);
  const tasks = useTaskStore((s) => s.tasks);
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const prevCountRef = useRef<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    // Pula a primeira renderização para não tocar sons ao carregar
    if (!initialized.current) {
      prevCompletedRef.current = new Set(tasks.filter((t) => !!t.completedAt).map((t) => t.id));
      prevCountRef.current = tasks.length;
      initialized.current = true;
      return;
    }

    if (!enabled) return;

    const nowCompleted = new Set(tasks.filter((t) => !!t.completedAt).map((t) => t.id));

    // Detecta tarefas recém-concluídas
    for (const id of nowCompleted) {
      if (!prevCompletedRef.current.has(id)) {
        sounds.taskComplete();
        break;
      }
    }

    // Detecta tarefas reativadas (desmarcadas)
    for (const id of prevCompletedRef.current) {
      if (!nowCompleted.has(id)) {
        sounds.error();
        break;
      }
    }

    prevCompletedRef.current = nowCompleted;
    prevCountRef.current = tasks.length;
  }, [tasks, enabled]);
}
