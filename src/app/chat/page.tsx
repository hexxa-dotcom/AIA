"use client";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { ChatList } from "@/components/chat/ChatList";
import { ChatPane } from "@/components/chat/ChatPane";
import { useTeamStore } from "@/store/useTeamStore";

export default function ChatPage() {
  const load = useTeamStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <Topbar
        title="Chat"
        subtitle="Conversa direta com seu time. Anexe tarefas pra contextualizar."
      />
      <div className="grid grid-cols-[320px_1fr] gap-4 h-[calc(100vh-200px)] min-h-[400px]">
        <ChatList />
        <ChatPane />
      </div>
    </AppShell>
  );
}
