"use client";
import { motion } from "framer-motion";
import { Flame, Star } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { levelProgress } from "@/lib/xp";
import { useEffect, useState } from "react";

export function XPBar() {
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streakDays);
  const todayXp = useGameStore((s) => s.todayXp);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    useGameStore.getState().resetTodayIfNewDay();
  }, []);

  useEffect(() => {
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [xp]);

  const { level, current, needed, pct } = levelProgress(xp);

  return (
    <div className="flex items-center gap-4 px-4 py-2 glass rounded-full">
      <div className={`flex items-center gap-2 ${bump ? "xp-bump" : ""}`}>
        <div className="w-9 h-9 rounded-full bg-ink text-lime grid place-items-center text-sm font-bold">
          {level}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted">Nível</span>
          <span className="text-xs font-semibold leading-none">{xp} XP</span>
        </div>
      </div>
      <div className="flex-1 min-w-[150px]">
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
          <motion.div
            className="h-full xp-shimmer"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <div className="text-[10px] text-muted mt-1 flex justify-between">
          <span>{Math.round(current)} / {Math.round(needed)}</span>
          <span>próximo nível</span>
        </div>
      </div>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-2">
        <Flame size={14} className="text-warning" />
        <span className="text-xs font-bold">{streak}</span>
        <span className="text-[10px] text-muted">streak</span>
      </div>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-2">
        <Star size={14} className="text-lime" fill="currentColor" />
        <span className="text-xs font-bold">+{todayXp}</span>
        <span className="text-[10px] text-muted">hoje</span>
      </div>
    </div>
  );
}
