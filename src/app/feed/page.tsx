"use client";
import React, { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { useFeedConfigStore, FeedConfig, DEFAULT_FEED_ORDER } from "@/store/useFeedConfigStore";

import { FeedDailyBriefing } from "@/components/feed/FeedDailyBriefing";
import { FeedDailyProgress } from "@/components/feed/FeedDailyProgress";
import { FeedAgendaToday } from "@/components/feed/FeedAgendaToday";
import { FeedFinanceWidget } from "@/components/feed/FeedFinanceWidget";
import { FeedQuickNotes } from "@/components/feed/FeedQuickNotes";
import { FeedEstudosWidget } from "@/components/feed/FeedEstudosWidget";
import { FeedTimeWidget } from "@/components/feed/FeedTimeWidget";
import { FeedProjectsWidget } from "@/components/feed/FeedProjectsWidget";
import { FeedNewsWidget } from "@/components/feed/FeedNewsWidget";
import { FeedRoutineWidget } from "@/components/feed/FeedRoutineWidget";
import { FeedVaultWidget } from "@/components/feed/FeedVaultWidget";
import { FeedChallengesWidget } from "@/components/feed/FeedChallengesWidget";

import { SortableWidget } from "@/components/feed/SortableWidget";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

const WIDGETS_MAP: Record<string, React.FC> = {
  progress: FeedDailyProgress,
  agenda: FeedAgendaToday,
  routine: FeedRoutineWidget,
  projects: FeedProjectsWidget,
  vault: FeedVaultWidget,
  finance: FeedFinanceWidget,
  challenges: FeedChallengesWidget,
  time: FeedTimeWidget,
  estudos: FeedEstudosWidget,
};

const getWidgetClassName = (id: string) => {
  switch(id) {
    // P (Pequeno) - Quadrados
    case "routine":
    case "vault":
    case "challenges":
    case "time":
      return "col-span-1 row-span-1";
    // M (Médio) - Retângulos horizontais
    case "progress":
    case "agenda":
    case "projects":
    case "finance":
    case "estudos":
      return "col-span-1 md:col-span-2 row-span-1";
    default:
      return "col-span-1";
  }
};

export default function FeedPage() {
  const config = useFeedConfigStore((s) => s.config);
  const feedOrder = useFeedConfigStore((s) => s.feedOrder || DEFAULT_FEED_ORDER);
  const setFeedOrder = useFeedConfigStore((s) => s.setFeedOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeWidgets = useMemo(() => feedOrder.filter((id) => config[id as keyof FeedConfig]), [feedOrder, config]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldAbsolute = feedOrder.indexOf(active.id as string);
    const overAbsolute = feedOrder.indexOf(over.id as string);

    if (oldAbsolute !== -1 && overAbsolute !== -1) {
      const newFeedOrder = arrayMove(feedOrder, oldAbsolute, overAbsolute);
      setFeedOrder(newFeedOrder);
    }
  };

  return (
    <AppShell>
      <Topbar variant="full" title="Feed" />
      
      {config.briefing && (
        <div className="mt-4">
          <FeedDailyBriefing />
        </div>
      )}

      <div className="mt-4 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={activeWidgets} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-min">
              {activeWidgets.map((id, index) => {
                const Component = WIDGETS_MAP[id];
                if (!Component) return null;
                return (
                  <SortableWidget key={id} id={id} index={index} className={getWidgetClassName(id)}>
                    <Component />
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {config.quickNotes && (
        <div className="mt-4 pb-4">
          <FeedQuickNotes />
        </div>
      )}

      {config.news && (
        <div className="mt-4 pb-12">
          <FeedNewsWidget />
        </div>
      )}
    </AppShell>
  );
}
