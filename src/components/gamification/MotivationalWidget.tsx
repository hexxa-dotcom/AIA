"use client";
import { useMemo } from "react";
import { Zap } from "lucide-react";
import { getTodaysMessage } from "@/lib/motivational";

export function MotivationalWidget() {
  const message = useMemo(() => getTodaysMessage(), []);

  return (
    <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-lime/15 border border-lime/30">
      <Zap size={18} className="text-lime shrink-0 mt-0.5" />
      <p className="text-sm text-ink font-medium leading-relaxed">{message.text}</p>
    </div>
  );
}
