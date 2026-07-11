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

      {/* Grid Principal: Alinhamento Arquitetural Limpo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-2">
        
        {/* COLUNA ESQUERDA: Ações do Dia (Foco, Tempo, Tarefas) */}
        <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
          <FeedDailyProgress />
          <FeedRoutineWidget />
          <FeedTimeWidget />
          <FeedAgendaToday />
        </div>

        {/* COLUNA DIREITA: Gestão, Conhecimento e Projetos */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
             <FeedFinanceWidget />
             <FeedVaultWidget />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
             <FeedEstudosWidget />
             <FeedProjectsWidget />
          </div>

          <FeedNewsWidget />
        </div>
      </div>

      {/* Base Full-Width */}
      <div className="mt-2">
        <FeedQuickNotes />
      </div>
    </AppShell>
  );
}
