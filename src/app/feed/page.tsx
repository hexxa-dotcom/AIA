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
import { Topbar } from "@/components/layout/Topbar";

export default function FeedPage() {
  return (
    <AppShell>
      <Topbar variant="full" title="Feed" />
      <div className="flex flex-col gap-4">
        <FeedDailyBriefing />
      </div>

      {/* Grid principal: masonry (CSS columns) — equilibra a altura das colunas
          sozinho, sem vãos, independente da altura de cada widget.
          Ordem por prioridade: dia primeiro, depois áreas da vida. */}
      <div className="mt-4 gap-4 lg:gap-6 columns-1 lg:columns-2 [&>*]:mb-4 lg:[&>*]:mb-6 [&>*]:break-inside-avoid">
        <FeedDailyProgress />
        <FeedRoutineWidget />
        <FeedAgendaToday />
        <FeedTimeWidget />
        <FeedProjectsWidget />
        <FeedEstudosWidget />
        <FeedFinanceWidget />
        <FeedVaultWidget />
        <FeedNewsWidget />
      </div>

      {/* Base full-width */}
      <div className="mt-4">
        <FeedQuickNotes />
      </div>
    </AppShell>
  );
}
