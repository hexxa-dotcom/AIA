"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useTaskStore } from "@/store/useTaskStore";

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === step ? "20px" : "6px",
            height: "6px",
            background: i === step ? "#f5f5f3" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

export function OnboardingModal() {
  const step = useOnboardingStore((s) => s.step);
  const setStep = useOnboardingStore((s) => s.setStep);
  const complete = useOnboardingStore((s) => s.complete);
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState("");

  function handleCreateTask() {
    if (!taskTitle.trim()) return;
    useTaskStore.getState().createTask({
      title: taskTitle.trim(),
      column: "today",
      priority: "medium",
    });
    setStep(2);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(14,11,12,0.60)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="glass-dark w-full max-w-[520px] rounded-3xl p-8 mx-4 flex flex-col"
      >
        <ProgressDots step={step} total={3} />

        {step === 0 && (
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl grid place-items-center mb-2"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Sparkles size={28} style={{ color: "#f5f5f3" }} />
            </div>
            <h2 className="text-2xl font-bold text-white">Bem-vindo ao AIA OS</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              Seu assistente de produtividade pessoal.
            </p>
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-2xl font-semibold text-sm transition hover:opacity-90"
                style={{ background: "#f5f5f3", color: "#1a1a1a" }}
              >
                Começar →
              </button>
              <button
                onClick={complete}
                className="w-full py-2.5 rounded-2xl text-sm transition hover:bg-white/[0.05]"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Já sei usar, pular
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white">Crie sua primeira tarefa</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                O que você precisa fazer hoje?
              </p>
            </div>
            <input
              autoFocus
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
              placeholder="ex: Revisar apresentação…"
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "0.5px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
              }}
            />
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleCreateTask}
                disabled={!taskTitle.trim()}
                className="w-full py-3 rounded-2xl font-semibold text-sm transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "#f5f5f3", color: "#1a1a1a" }}
              >
                Criar tarefa →
              </button>
              <button
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-2xl text-sm transition hover:bg-white/[0.05]"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Pular
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl grid place-items-center mb-2"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Sparkles size={28} style={{ color: "#f5f5f3" }} />
            </div>
            <h2 className="text-xl font-bold text-white">Configure sua IA pessoal</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
              O AIA OS usa IA para resumir seu dia, quebrar tarefas e dar insights.
            </p>
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => { router.push("/ajustes"); complete(); }}
                className="w-full py-3 rounded-2xl font-semibold text-sm transition hover:opacity-90"
                style={{ background: "#f5f5f3", color: "#1a1a1a" }}
              >
                Ir para Ajustes →
              </button>
              <button
                onClick={complete}
                className="w-full py-2.5 rounded-2xl text-sm transition hover:bg-white/[0.05]"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Configurar depois
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
