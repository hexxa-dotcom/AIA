"use client";
import { useEffect, useRef } from "react";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useSoundStore } from "@/store/useSoundStore";
import { fireNotification } from "@/lib/reminders/notifier";

const CHECK_INTERVAL_MS = 30_000; // verifica a cada 30s

function activeOn(
  block: { recurrence: string; weekdays?: number[] },
  dow: number,
): boolean {
  switch (block.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "weekly":
    case "custom":
      return block.weekdays?.includes(dow) ?? false;
    default:
      return false;
  }
}

export function useRoutineTicker() {
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    function check() {
      const { enabled } = useSoundStore.getState();
      const now = new Date();
      const dow = now.getDay();
      const curMin = now.getHours() * 60 + now.getMinutes();

      const blocks = useRoutineStore
        .getState()
        .blocks.filter((b) => activeOn(b, dow));
      const dateKey = now.toDateString();

      for (const b of blocks) {
        // ── INÍCIO: avisa 1 min antes ou exatamente na hora ──────────────
        const startKey = `${b.id}-start-${dateKey}`;
        if (!firedRef.current.has(startKey)) {
          const diff = b.startMinute - curMin; // minutos até o início
          if (diff === 1 || diff === 0) {
            firedRef.current.add(startKey);
            const label = diff === 1 ? "começa em 1 minuto" : "começando agora";
            if (enabled) {
              import("@/lib/sounds").then(({ sounds }) =>
                sounds.routineStart(),
              );
            }
            fireNotification(`${b.emoji ?? ""} ${b.title}`, {
              body: `Sua rotina ${label}.`,
              tag: startKey,
            });
          }
        }

        // ── FIM: avisa quando termina ─────────────────────────────────────
        const endKey = `${b.id}-end-${dateKey}`;
        if (!firedRef.current.has(endKey) && b.endMinute === curMin) {
          firedRef.current.add(endKey);
          if (enabled) {
            import("@/lib/sounds").then(({ sounds }) => sounds.routineEnd());
          }
          fireNotification(`${b.emoji ?? ""} ${b.title} concluída`, {
            body: "Bloco de rotina finalizado.",
            tag: endKey,
          });
        }
      }

      // Limpa chaves de dias anteriores para não acumular memória
      if (firedRef.current.size > 500) firedRef.current.clear();
    }

    check(); // verifica imediatamente ao montar
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
