"use client";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useTeamStore } from "@/store/useTeamStore";
import { InviteForm } from "@/components/team/InviteForm";
import { MemberList } from "@/components/team/MemberList";

export default function EquipePage() {
  const load = useTeamStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <Topbar
        title="Equipe"
        subtitle="Convide pessoas pra colaborar nas tarefas e conversar no chat."
      />
      <div className="space-y-4 max-w-3xl">
        <InviteForm />
        <MemberList />
      </div>
    </AppShell>
  );
}
