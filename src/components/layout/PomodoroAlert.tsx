"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X, Timer } from "lucide-react";
import { usePomodoroAlert } from "@/hooks/usePomodoroAlert";

export function PomodoroAlert() {
  const { alert, dismiss } = usePomodoroAlert();

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[340px] max-w-[calc(100vw-32px)]"
        >
          <div
            className={`rounded-3xl shadow-2xl p-4 flex items-start gap-3 ${
              alert.level === "long_break"
                ? "bg-warning text-white"
                : "bg-ink text-white"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 grid place-items-center shrink-0 mt-0.5">
              {alert.level === "long_break" ? (
                <Coffee size={16} />
              ) : (
                <Timer size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">
                {alert.level === "long_break"
                  ? "Você merece uma pausa longa!"
                  : "Hora de uma pausa rápida!"}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                {alert.level === "long_break"
                  ? `${alert.pomodoroCount} pomodoros concluídos (${alert.sessionMinutes} min). Descanse 15–30 minutos.`
                  : `${alert.sessionMinutes} minutos de foco contínuo. Pause 5 min, você volta mais produtivo.`}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={dismiss}
                  className="px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold transition"
                >
                  {alert.level === "long_break" ? "Vou pausar" : "Ok, pausando"}
                </button>
                <button
                  onClick={dismiss}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
                >
                  Continuar
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded-lg hover:bg-white/20 transition shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
