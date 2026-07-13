import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NewsSource {
  id: string;
  type: "google" | "tabnews" | "custom_rss";
  topic?: string;
  subtopic?: string;
  url?: string;
}

interface NewsState {
  sources: NewsSource[];
  refreshInterval: number; // in hours
  addSource: (source: NewsSource) => void;
  updateSource: (id: string, updates: Partial<NewsSource>) => void;
  removeSource: (id: string) => void;
  setRefreshInterval: (h: number) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      sources: [
        { id: "default-google", type: "google", topic: "Tecnologia", subtopic: "" }
      ],
      refreshInterval: 1, // default 1 hour
      addSource: (source) => set((state) => ({ 
        sources: state.sources.length < 3 ? [...state.sources, source] : state.sources 
      })),
      updateSource: (id, updates) => set((state) => ({
        sources: state.sources.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      removeSource: (id) => set((state) => ({
        sources: state.sources.filter(s => s.id !== id)
      })),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    }),
    {
      name: "aia-news-store",
    },
  ),
);
