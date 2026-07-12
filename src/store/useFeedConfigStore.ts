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

interface FeedConfigStore {
  config: FeedConfig;
  toggleWidget: (widget: keyof FeedConfig) => void;
  setAllWidgets: (value: boolean) => void;
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
      toggleWidget: (widget) => set((s) => ({
        config: {
          ...s.config,
          [widget]: !s.config[widget]
        }
      })),
      setAllWidgets: (value) => set((s) => ({
        config: {
          briefing: value,
          progress: value,
          routine: value,
          challenges: value,
          agenda: value,
          time: value,
          projects: value,
          estudos: value,
          finance: value,
          vault: value,
          news: value,
          quickNotes: value,
        }
      }))
    }),
    { name: "aia-feed-config-store" }
  )
);
