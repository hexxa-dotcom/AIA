"use client";
import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { useSoundStore } from "@/store/useSoundStore";
import { fireNotification } from "@/lib/reminders/notifier";

const POMODORO_MS = 25 * 60 * 1000; // 25 min
const LONG_BREAK_THRESHOLD = 4; // after 4 pomodoros

export type AlertLevel = "break" | "long_break";

export interface PomodoroAlert {
  level: AlertLevel;
  sessionMinutes: number;
  pomodoroCount: number;
}

export function usePomodoroAlert() {
  const active = useTimerStore((s) => s.active);
  const sessionStartRef = useRef<number | null>(null);
  const pomodoroCountRef = useRef(0);
  const alertedRef = useRef(false);
  const [alert, setAlert] = useState<PomodoroAlert | null>(null);

  useEffect(() => {
    if (active && !active.paused) {
      if (!sessionStartRef.current) sessionStartRef.current = Date.now();
    } else {
      sessionStartRef.current = null;
      alertedRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (!active || active.paused) return;

    const id = setInterval(() => {
      if (!sessionStartRef.current || alertedRef.current) return;
      const elapsed = Date.now() - sessionStartRef.current;
      const pomodoros = Math.floor(elapsed / POMODORO_MS);

      if (pomodoros > pomodoroCountRef.current) {
        pomodoroCountRef.current = pomodoros;
        alertedRef.current = true;
        const level: AlertLevel =
          pomodoros >= LONG_BREAK_THRESHOLD ? "long_break" : "break";
        const sessionMinutes = Math.floor(elapsed / 60000);
        setAlert({ level, sessionMinutes, pomodoroCount: pomodoros });

        // Som de pausa
        const { enabled } = useSoundStore.getState();
        if (enabled) {
          import("@/lib/sounds").then(({ sounds }) => sounds.breakAlert());
        }

        // Notificação push
        const title =
          level === "long_break"
            ? "Pausa longa merecida!"
            : "Hora de uma pausa rápida!";
        const body =
          level === "long_break"
            ? `${pomodoros} pomodoros (${sessionMinutes} min). Descanse 15–30 minutos.`
            : `${sessionMinutes} minutos de foco. Pause 5 min — você volta mais produtivo.`;
        fireNotification(title, { body, tag: `break-${Date.now()}` });

        setTimeout(
          () => {
            alertedRef.current = false;
          },
          10 * 60 * 1000,
        );
      }
    }, 30_000);

    return () => clearInterval(id);
  }, [active]);

  return { alert, dismiss: () => setAlert(null) };
}
