"use client";
import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Trash2, BellRing } from "lucide-react";
import { useReminderStore } from "@/store/useReminderStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ensureNotificationPermission, type ReminderChannel } from "@/lib/reminders/notifier";

const PRESETS: { label: string; minutes: number }[] = [
  { label: "10 min antes", minutes: 10 },
  { label: "1 hora antes", minutes: 60 },
  { label: "1 dia antes", minutes: 60 * 24 },
];

export function ReminderConfig({ taskId, dueDate }: { taskId: string; dueDate?: number }) {
  const user = useAuthStore((s) => s.user);
  const allItems = useReminderStore((s) => s.items);
  const items = useMemo(
    () => allItems.filter((r) => r.taskId === taskId).sort((a, b) => a.remindAt - b.remindAt),
    [allItems, taskId],
  );
  const add = useReminderStore((s) => s.add);
  const remove = useReminderStore((s) => s.remove);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [channel, setChannel] = useState<ReminderChannel>("browser");
  const [customWhen, setCustomWhen] = useState("");

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  async function requestPerm() {
    const p = await ensureNotificationPermission();
    setPermission(p);
  }

  async function addAtMinutesBefore(minutes: number) {
    if (!user || !dueDate) return;
    const at = dueDate - minutes * 60 * 1000;
    if (at <= Date.now()) return;
    await add(user.id, { taskId, remindAt: at, channel });
  }

  async function addCustom() {
    if (!user || !customWhen) return;
    const ts = new Date(customWhen).getTime();
    if (!ts || ts <= Date.now()) return;
    await add(user.id, { taskId, remindAt: ts, channel });
    setCustomWhen("");
  }

  return (
    <div className="bg-surface-2 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted flex items-center gap-1">
          <Bell size={11} />
          Lembretes
        </span>
        {permission !== "granted" && (
          <button
            onClick={requestPerm}
            className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full"
          >
            ativar notificações
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-2">
        {(["browser", "email", "both"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              channel === c ? "bg-ink text-lime" : "bg-white"
            }`}
          >
            {c === "browser" ? "navegador" : c === "email" ? "email" : "ambos"}
          </button>
        ))}
      </div>

      {dueDate && (
        <div className="flex gap-1 flex-wrap mb-2">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              onClick={() => addAtMinutesBefore(p.minutes)}
              className="text-[11px] bg-white hover:bg-black/5 px-2 py-1 rounded-lg"
            >
              + {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-2">
        <input
          type="datetime-local"
          value={customWhen}
          onChange={(e) => setCustomWhen(e.target.value)}
          className="flex-1 text-xs bg-white rounded-lg px-2 py-1 border border-ink/10 outline-none focus:border-ink"
        />
        <button
          onClick={addCustom}
          disabled={!customWhen}
          className="px-2 rounded-lg bg-ink text-lime text-xs disabled:opacity-50"
        >
          <Plus size={12} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-muted italic">Nenhum lembrete configurado</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => {
            const date = new Date(r.remindAt);
            const sent = !!r.sentAt;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-2 text-xs bg-white rounded-lg px-2 py-1 ${sent ? "opacity-50" : ""}`}
              >
                <BellRing size={11} className={sent ? "text-muted" : "text-warning"} />
                <span className="flex-1">
                  {date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  <span className="text-[10px] text-muted ml-1">
                    ({r.channel === "browser" ? "navegador" : r.channel === "email" ? "email" : "ambos"})
                  </span>
                </span>
                {sent && <span className="text-[10px] text-success">enviado</span>}
                <button
                  onClick={() => remove(r.id)}
                  className="p-0.5 hover:bg-danger/10 hover:text-danger rounded"
                >
                  <Trash2 size={10} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
