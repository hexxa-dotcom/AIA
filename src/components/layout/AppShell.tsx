"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Users } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ClientOnly } from "./ClientOnly";
import { useTaskStore } from "@/store/useTaskStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useGameStore } from "@/store/useGameStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";
import { useSupabaseSync } from "@/lib/sync";
import { useReminderTicker } from "@/lib/reminders/ticker";
import { makeSeedData } from "@/lib/seed";
import { useMcpSync } from "@/hooks/useMcpSync";
import { useSoundEvents } from "@/hooks/useSoundEvents";
import { useRoutineTicker } from "@/hooks/useRoutineTicker";
import { GlobalTopbar } from "./GlobalTopbar";
import { PomodoroAlert } from "./PomodoroAlert";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useCommandStore } from "@/store/useCommandStore";
import { useCommandShortcut } from "@/hooks/useCommandShortcut";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboardingStore } from "@/store/useOnboardingStore";

function ShellSkeleton() {
  return (
    <div className="flex gap-4 p-4 min-h-screen">
      <div className="w-[230px] shrink-0 bg-ink/5 rounded-3xl h-[calc(100vh-32px)] animate-pulse" />
      <div className="flex-1 bg-ink/5 rounded-3xl animate-pulse" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly fallback={<ShellSkeleton />}>
      <AppShellInner>{children}</AppShellInner>
    </ClientOnly>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const taskHydrated = useTaskStore((s) => s.hydrated);
  const routineHydrated = useRoutineStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);
  const authChecked = useAuthStore((s) => s.authChecked);
  const initAuth = useAuthStore((s) => s.init);
  const router = useRouter();
  const pathname = usePathname();
  const commandOpen = useCommandStore((s) => s.open);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);

  useCommandShortcut();

  const isRemoteSyncEnabled = () => isSupabaseEnabled() || isAppwriteEnabled();

  // Inicializa auth quando disponível
  useEffect(() => {
    if (isRemoteSyncEnabled()) initAuth();
  }, [initAuth]);

  // Redireciona para o login se não estiver autenticado e o banco de dados remoto estiver configurado
  useEffect(() => {
    if (isRemoteSyncEnabled() && authChecked && !user) {
      router.push("/login");
    }
  }, [authChecked, user, router, authChecked]);

  // Quando offline (localStorage), faz seed local
  useEffect(() => {
    if (isRemoteSyncEnabled()) return;
    if (!taskHydrated || !routineHydrated) return;
    useTaskStore.getState().initIfEmpty();
    useGameStore.getState().resetTodayIfNewDay();
    useGameStore.getState().registerActivity();
    if (useRoutineStore.getState().blocks.length === 0) {
      const { routines } = makeSeedData();
      useRoutineStore.getState().bulkSet(routines);
    }
  }, [taskHydrated, routineHydrated]);

  // Sync com banco remoto quando logado
  useSupabaseSync();

  // Lembretes (notificações)
  useReminderTicker();

  // Sincroniza dados com o servidor MCP
  useMcpSync();

  // Sons de evento
  useSoundEvents();

  // Avisos de rotina (início e fim de blocos)
  useRoutineTicker();

  // Garante registerActivity uma vez por sessão logada
  useEffect(() => {
    if (isRemoteSyncEnabled() && user) {
      useGameStore.getState().resetTodayIfNewDay();
      useGameStore.getState().registerActivity();
    }
  }, [user]);

  if (isRemoteSyncEnabled() && (!authChecked || !user)) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 min-h-screen flex-col xl:flex-row">
      {/* Sidebar — oculta no mobile e tablet */}
      <div className="hidden xl:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 flex flex-col gap-3 pb-20 xl:pb-3 pt-2 sm:pt-4 pr-2 sm:pr-4" style={{ overflowX: "clip" }}>
        <GlobalTopbar />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 flex flex-col gap-3"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <PomodoroAlert />
      <BottomNav />

      <AnimatePresence>
        {commandOpen && <CommandPalette />}
      </AnimatePresence>

      <AnimatePresence>
        {!onboardingCompleted && <OnboardingModal />}
      </AnimatePresence>
    </div>
  );
}
