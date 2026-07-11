"use client";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { ChatPanel } from "@/components/copilot/ChatPanel";
import { useAiStore } from "@/store/useAiStore";

export default function CopilotPage() {
  const assistantName = useAiStore((s) => s.assistantName);

  return (
    <AppShell>
      <Topbar
        title={assistantName}
        subtitle="Seu assistente de IA pessoal"
      />
      <ChatPanel />
    </AppShell>
  );
}
