"use client";
import { useEffect, useRef, useState } from "react";
import { useTimerStore } from "@/store/useTimerStore";
import { useSoundStore } from "@/store/useSoundStore";
import { fireNotification } from "@/lib/reminders/notifier";
import { usePerfilStore } from "@/store/usePerfilStore";
import { getTodaysMessage } from "@/lib/motivational";

export type AlertLevel = "break" | "long_break";

export interface PomodoroAlert {
  level: AlertLevel;
  sessionMinutes: number;
  pomodoroCount: number;
}

export function usePomodoroAlert() {
  const active = useTimerStore((s) => s.active);
  const pomodoroMinutes = useTimerStore((s) => s.pomodoroMinutes ?? 25);
  const longBreakThreshold = useTimerStore((s) => s.longBreakThreshold ?? 4);

  const motivationalStyle = usePerfilStore((s) => s.motivationalStyle ?? "famous");
  const motivationalFrequency = usePerfilStore((s) => s.motivationalFrequency ?? "daily");

  const POMODORO_MS = pomodoroMinutes * 60 * 1000;
  const LONG_BREAK_THRESHOLD = longBreakThreshold;

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
        
        let body =
          level === "long_break"
            ? `${pomodoros} pomodoros (${sessionMinutes} min). Descanse 15–30 minutos.`
            : `${sessionMinutes} minutos de foco. Pause 5 min — você volta mais produtivo.`;

        if (motivationalFrequency === "after_focus") {
          const quote = getTodaysMessage(motivationalStyle);
          body += `\n\n"${quote.text}" — ${quote.author}`;
        }
        
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
