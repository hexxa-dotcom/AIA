import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FeedConfig {
  briefing: boolean;
  progress: boolean;
  routine: boolean;
  challenges: boolean;
  agenda: boolean;
  time: boolean;
  projects: boolean;
  estudos: boolean;
  finance: boolean;
  vault: boolean;
  news: boolean;
  quickNotes: boolean;
}

export const DEFAULT_LEFT_COLUMN = ["progress", "agenda", "routine", "projects", "vault"];
export const DEFAULT_RIGHT_COLUMN = ["finance", "challenges", "time", "estudos", "news"];

export const DEFAULT_FEED_ORDER = [
  "progress",
  "agenda",
  "routine",
  "finance",
  "projects",
  "time",
  "estudos",
  "challenges",
  "vault",
];

interface FeedConfigStore {
  config: FeedConfig;
  leftColumn: string[]; // mantido para compatibilidade
  rightColumn: string[]; // mantido para compatibilidade
  feedOrder: string[];
  toggleWidget: (widget: keyof FeedConfig) => void;
  setAllWidgets: (value: boolean) => void;
  setColumns: (left: string[], right: string[]) => void;
  setFeedOrder: (order: string[]) => void;
}

export const useFeedConfigStore = create<FeedConfigStore>()(
  persist(
    (set) => ({
      config: {
        briefing: true,
        progress: true,
        routine: true,
        challenges: true,
        agenda: true,
        time: true,
        projects: true,
        estudos: true,
        finance: true,
        vault: true,
        news: true,
        quickNotes: true,
      },
      leftColumn: DEFAULT_LEFT_COLUMN,
      rightColumn: DEFAULT_RIGHT_COLUMN,
      feedOrder: DEFAULT_FEED_ORDER,
      toggleWidget: (widget) => set((s) => ({
        config: { ...s.config, [widget]: !s.config[widget] }
      })),
      setAllWidgets: (value) => set((s) => ({
        config: {
          briefing: value, progress: value, routine: value,
          challenges: value, agenda: value, time: value,
          projects: value, estudos: value, finance: value,
          vault: value, news: value, quickNotes: value,
        }
      })),
      setColumns: (left, right) => set({ leftColumn: left, rightColumn: right }),
      setFeedOrder: (order) => set({ feedOrder: order })
    }),
    { 
      name: "aia-feed-config-store",
      version: 2,
      migrate: (persisted) => {
        const s = persisted as any;
        // Se já tiver feedOrder, mantem. Senão, cria intercalando esquerda e direita para ficar natural
        let feedOrder = s.feedOrder;
        if (!feedOrder && s.leftColumn && s.rightColumn) {
          feedOrder = [];
          const max = Math.max(s.leftColumn.length, s.rightColumn.length);
          for (let i = 0; i < max; i++) {
            if (s.leftColumn[i]) feedOrder.push(s.leftColumn[i]);
            if (s.rightColumn[i]) feedOrder.push(s.rightColumn[i]);
          }
        } else if (!feedOrder) {
          feedOrder = DEFAULT_FEED_ORDER;
        }
        return {
          ...s,
          feedOrder
        };
      }
    }
  )
);
