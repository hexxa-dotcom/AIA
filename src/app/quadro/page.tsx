"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function QuadroPage() {
  return (
    <AppShell>
      <div
        style={{
          position: "relative",
          height: "calc(100vh - 7rem)",
          borderRadius: 24,
          overflow: "hidden",
          zIndex: 10,
          background: "var(--color-surface)",
          border: "1px solid var(--flat-border)",
        }}
      >
        <Tldraw persistenceKey="aia-quadro-v1" />
      </div>
    </AppShell>
  );
}
