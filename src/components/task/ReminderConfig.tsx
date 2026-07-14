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
    <div className="flex flex-col gap-1.5 border-b border-ink/5 pb-3 last:border-0 mt-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-muted">
        <span className="flex items-center gap-1.5">
          <Bell size={13} />
          Lembretes
        </span>
        {permission !== "granted" && (
          <button
            onClick={requestPerm}
            className="text-[9px] bg-warning/15 text-warning px-1.5 py-0.5 rounded"
          >
            ativar
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-1.5">
        {(["browser", "email", "both"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`text-[9px] px-2 py-0.5 rounded ${
              channel === c ? "bg-ink text-lime" : "bg-surface-2/50 border border-ink/5"
            }`}
          >
            {c === "browser" ? "navegador" : c === "email" ? "email" : "ambos"}
          </button>
        ))}
      </div>

      {dueDate && (
        <div className="flex gap-1 flex-wrap mb-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              onClick={() => addAtMinutesBefore(p.minutes)}
              className="text-[9px] font-semibold bg-surface-2/50 border border-ink/5 hover:bg-surface-2 px-1.5 py-0.5 rounded transition"
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
          className="flex-1 text-[10px] bg-surface-2/50 rounded-lg px-2 py-1 border border-ink/5 outline-none focus:border-ink/20"
        />
        <button
          onClick={addCustom}
          disabled={!customWhen}
          className="px-2 rounded-lg bg-ink text-lime text-xs disabled:opacity-50"
        >
          <Plus size={10} />
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[10px] text-muted italic">Nenhum lembrete configurado</p>
      ) : (
        <ul className="space-y-1">
          {items.map((r) => {
            const date = new Date(r.remindAt);
            const sent = !!r.sentAt;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-1.5 text-[10px] bg-surface-2/50 border border-ink/5 rounded-lg px-2 py-1 ${sent ? "opacity-50" : ""}`}
              >
                <BellRing size={10} className={sent ? "text-muted" : "text-warning"} />
                <span className="flex-1 font-semibold">
                  {date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  <span className="text-[8px] text-muted ml-1 uppercase">
                    ({r.channel === "browser" ? "nav" : r.channel === "email" ? "email" : "ambos"})
                  </span>
                </span>
                {sent && <span className="text-[9px] text-success font-bold uppercase tracking-widest">env</span>}
                <button
                  onClick={() => remove(r.id)}
                  className="p-1 hover:bg-danger/10 hover:text-danger rounded transition"
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
