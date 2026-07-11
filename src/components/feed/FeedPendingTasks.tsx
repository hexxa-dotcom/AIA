"use client";
import { Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@/lib/types";
import { useTaskStore } from "@/store/useTaskStore";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

export function FeedPendingTasks({ tasks }: Props) {
  const completeTask = useTaskStore((s) => s.completeTask);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < todayTime);
  const dueToday = tasks.filter((t) => t.dueDate && t.dueDate === todayTime);
  const dueSoon = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate > todayTime &&
      t.dueDate < todayTime + 7 * 24 * 60 * 60 * 1000,
  );

  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-lime" />
        <span className="font-bold text-sm">Pendentes</span>
        <span className="text-xs text-muted">({tasks.length})</span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-6 text-muted text-xs">
          Sem tarefas pendentes!
        </div>
      ) : (
        <div className="space-y-3">
          {overdue.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-danger mb-2">VENCIDAS</p>
              {overdue.slice(0, 3).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-2 group"
                >
                  <button
                    onClick={() => completeTask(t.id)}
                    className="mt-0.5 p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <CheckCircle2 size={12} className="text-lime" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-danger">
                      {t.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {dueToday.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-lime mb-2">HOJE</p>
              {dueToday.slice(0, 3).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-2 group"
                >
                  <button
                    onClick={() => completeTask(t.id)}
                    className="mt-0.5 p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <CheckCircle2 size={12} className="text-lime" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {dueSoon.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-sage mb-2">
                PRÓXIMOS 7 DIAS
              </p>
              {dueSoon.slice(0, 3).map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-surface-2 group"
                >
                  <button
                    onClick={() => completeTask(t.id)}
                    className="mt-0.5 p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <CheckCircle2 size={12} className="text-lime" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
