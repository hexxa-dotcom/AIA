"use client";
import { motion } from "framer-motion";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useProfileStore } from "@/store/useProfileStore";

export function OnboardingModal() {
  const complete = useOnboardingStore((s) => s.complete);
  const profile = useProfileStore((s) => s.profile);
  const name = profile?.name ? profile.name.split(" ")[0] : "";

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
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-[400px] rounded-3xl p-8 mx-4 flex flex-col items-center text-center shadow-2xl"
        style={{
          background: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        <h2 className="text-2xl font-bold mb-2">
          Olá{name ? `, ${name}` : ""}!
        </h2>
        <p className="text-base font-medium text-gray-600 mb-8">
          Como você está hoje?
        </p>

        <button
          onClick={complete}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition hover:opacity-90 active:scale-95"
          style={{ background: "#1a1a1a", color: "#ffffff" }}
        >
          Tudo ótimo, vamos lá!
        </button>
      </motion.div>
    </div>
  );
}
