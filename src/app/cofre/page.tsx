"use client";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/store/useAuthStore";
import { useVaultStore } from "@/store/useVaultStore";
import { MasterPasswordGate } from "@/components/vault/MasterPasswordGate";
import { VaultList } from "@/components/vault/VaultList";

export default function CofrePage() {
  const user = useAuthStore((s) => s.user);
  const status = useVaultStore((s) => s.status);
  const initFor = useVaultStore((s) => s.initFor);

  const userId = user?.id ?? "local";

  useEffect(() => {
    initFor(userId);
  }, [userId, initFor]);

  return (
    <AppShell>
      <Topbar
        title="Cofre"
        subtitle="Senhas cifradas no seu navegador. Zero-knowledge: nem eu nem o Supabase veem o conteúdo."
      />
      {status === "unlocked" ? <VaultList /> : <MasterPasswordGate />}
    </AppShell>
  );
}
