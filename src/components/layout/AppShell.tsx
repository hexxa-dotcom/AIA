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
import { useSupabaseSync } from "@/lib/sync";
import { useReminderTicker } from "@/lib/reminders/ticker";
import { makeSeedData } from "@/lib/seed";
import { useMcpSync } from "@/hooks/useMcpSync";
import { useSoundEvents } from "@/hooks/useSoundEvents";
import { useRoutineTicker } from "@/hooks/useRoutineTicker";
import { GlobalTopbar } from "./GlobalTopbar";
import { PomodoroAlert } from "./PomodoroAlert";
import { BottomNav } from "./BottomNav";
import { TaskInviteInbox } from "@/components/task/TaskInviteInbox";
import { useTaskInviteStore } from "@/store/useTaskInviteStore";
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
  const [showTaskInbox, setShowTaskInbox] = useState(false);
  const pendingTaskInvites = useTaskInviteStore((s) => s.pendingCount());
  const commandOpen = useCommandStore((s) => s.open);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);

  useCommandShortcut();

  // Inicializa auth do Supabase quando disponível
  useEffect(() => {
    if (isSupabaseEnabled()) initAuth();
  }, [initAuth]);

  // Auth guard: só redireciona depois que checou a sessão
  useEffect(() => {
    if (isSupabaseEnabled() && authChecked && !user) {
      router.replace("/login");
    }
  }, [authChecked, user, router]);

  // Quando offline (localStorage), faz seed local
  useEffect(() => {
    if (isSupabaseEnabled()) return;
    if (!taskHydrated || !routineHydrated) return;
    useTaskStore.getState().initIfEmpty();
    useGameStore.getState().resetTodayIfNewDay();
    useGameStore.getState().registerActivity();
    if (useRoutineStore.getState().blocks.length === 0) {
      const { routines } = makeSeedData();
      useRoutineStore.getState().bulkSet(routines);
    }
  }, [taskHydrated, routineHydrated]);

  // Sync com Supabase quando logado
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
    if (isSupabaseEnabled() && user) {
      useGameStore.getState().resetTodayIfNewDay();
      useGameStore.getState().registerActivity();
    }
  }, [user]);

  if (isSupabaseEnabled() && (!authChecked || !user)) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex gap-2 sm:gap-3 p-2 sm:p-4 min-h-screen flex-col md:flex-row">
      {/* Sidebar — oculta no mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 flex flex-col gap-3 pb-20 md:pb-3 overflow-x-hidden pt-2 sm:pt-4 pr-2 sm:pr-4">
        <GlobalTopbar />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="flex-1 flex flex-col gap-3"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <PomodoroAlert />
      <BottomNav />

      {/* Task invite inbox floating button */}
      <button
        onClick={() => setShowTaskInbox(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-2xl bg-ink text-lime shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        title="Tarefas compartilhadas"
      >
        <Users size={18} />
        {pendingTaskInvites > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full text-[10px] font-bold grid place-items-center">
            {pendingTaskInvites > 9 ? "9+" : pendingTaskInvites}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showTaskInbox && <TaskInviteInbox onClose={() => setShowTaskInbox(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {commandOpen && <CommandPalette />}
      </AnimatePresence>

      <AnimatePresence>
        {!onboardingCompleted && <OnboardingModal />}
      </AnimatePresence>
    </div>
  );
}
