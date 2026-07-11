"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useReminderStore } from "@/store/useReminderStore";
import { fireNotification } from "./notifier";
import { playSound } from "@/store/useSoundStore";
import { sendEmail } from "@/lib/email";

const CHECK_INTERVAL_MS = 30_000;

export function useReminderTicker() {
  const user = useAuthStore((s) => s.user);
  const loadFor = useReminderStore((s) => s.loadFor);
  const markSent = useReminderStore((s) => s.markSent);

  useEffect(() => {
    if (!user) return;
    loadFor(user.id);
  }, [user, loadFor]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const now = Date.now();
      const items = useReminderStore.getState().items;
      const tasks = useTaskStore.getState().tasks;
      const userEmail = useAuthStore.getState().user?.email;
      for (const r of items) {
        if (r.sentAt) continue;
        if (r.remindAt > now) continue;
        const task = tasks.find((t) => t.id === r.taskId);
        const title = task ? `${task.title}` : "Lembrete AIA OS";
        const body =
          r.message ?? task?.description ?? "Sua tarefa precisa de atenção";

        // Browser notification
        if (r.channel === "browser" || r.channel === "both") {
          fireNotification(title, { body, tag: r.id });
          playSound("reminder");
        }

        // Email notification
        if ((r.channel === "email" || r.channel === "both") && userEmail) {
          const taskTitle = task?.title ?? "Tarefa";
          sendEmail({
            to: userEmail,
            subject: `Lembrete: ${taskTitle}`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:540px;margin:0 auto;padding:24px;">
              <div style="background:#f0f0ec;border-radius:28px;padding:32px;text-align:center;">
                <div style="font-size:48px;"></div>
                <h1 style="margin:12px 0;font-size:22px;">Lembrete de tarefa</h1>
                <p style="color:#5b5a55;margin:0 0 24px;">"<strong>${taskTitle}</strong>"precisa da sua atenção.</p>
                ${body && body !== taskTitle ? `<p style="color:#5b5a55;">${body}</p>` : ""}
              </div>
              <p style="font-size:11px;color:#999;text-align:center;margin-top:16px;">
                AIA OS — notificação de lembrete.
              </p>
            </div>`,
          }).catch((err) => console.warn("[reminders] email falhou", err));
        }

        // If browser-only channel, ensure sound plays
        if (r.channel !== "browser" && r.channel !== "both") {
          playSound("reminder");
        }

        markSent(r.id);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, markSent]);
}
