"use client";

import { AppShell } from "@/components/layout/AppShell";
import dynamic from "next/dynamic";
import "tldraw/tldraw.css";

// Dynamic import para evitar erro de hidratação no Next.js (Tldraw acessa 'window' na renderização)
const Tldraw = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-muted text-sm font-semibold">
      Carregando quadro...
    </div>
  ),
});

export default function QuadroPage() {
  return (
    <AppShell>
      <div
        className="flex-1 w-full relative min-h-0 rounded-[24px] overflow-hidden border border-flat"
        style={{
          zIndex: 10,
          background: "var(--color-surface)",
        }}
      >
        <Tldraw persistenceKey="aia-quadro-v1" />
      </div>
    </AppShell>
  );
}
