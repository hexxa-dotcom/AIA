"use client";
import { AppShell } from "@/components/layout/AppShell";
import { FeedDailyProgress } from "@/components/feed/FeedDailyProgress";
import { FeedAgendaToday } from "@/components/feed/FeedAgendaToday";
import { FeedFinanceWidget } from "@/components/feed/FeedFinanceWidget";
import { FeedQuickNotes } from "@/components/feed/FeedQuickNotes";
import { FeedDailyBriefing } from "@/components/feed/FeedDailyBriefing";

import { FeedEstudosWidget } from "@/components/feed/FeedEstudosWidget";
import { FeedTimeWidget } from "@/components/feed/FeedTimeWidget";
import { FeedProjectsWidget } from "@/components/feed/FeedProjectsWidget";
import { FeedNewsWidget } from "@/components/feed/FeedNewsWidget";
import { FeedRoutineWidget } from "@/components/feed/FeedRoutineWidget";
import { FeedVaultWidget } from "@/components/feed/FeedVaultWidget";
import { FeedChallengesWidget } from "@/components/feed/FeedChallengesWidget";
import { Topbar } from "@/components/layout/Topbar";
import { useFeedConfigStore } from "@/store/useFeedConfigStore";

export default function FeedPage() {
  const config = useFeedConfigStore((s) => s.config);

  return (
    <AppShell>
      <Topbar variant="full" title="Feed" />
      
      {config.briefing && (
        <div className="flex flex-col gap-4">
          <FeedDailyBriefing />
        </div>
      )}

      {/* Grid principal: 2 colunas flex para garantir alinhamento no topo */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
        {/* Coluna Esquerda */}
        <div className="flex flex-col gap-4 lg:gap-6">
          {config.progress && <FeedDailyProgress />}
          {config.agenda && <FeedAgendaToday />}
          {config.routine && <FeedRoutineWidget />}
          {config.projects && <FeedProjectsWidget />}
          {config.vault && <FeedVaultWidget />}
        </div>
        
        {/* Coluna Direita */}
        <div className="flex flex-col gap-4 lg:gap-6">
          {config.finance && <FeedFinanceWidget />}
          {config.challenges && <FeedChallengesWidget />}
          {config.time && <FeedTimeWidget />}
          {config.estudos && <FeedEstudosWidget />}
          {config.news && <FeedNewsWidget />}
        </div>
      </div>

      {/* Base full-width */}
      {config.quickNotes && (
        <div className="mt-4">
          <FeedQuickNotes />
        </div>
      )}
    </AppShell>
  );
}
