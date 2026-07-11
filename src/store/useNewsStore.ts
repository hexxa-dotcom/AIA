import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NewsState {
  topic: string;
  subtopic: string;
  setTopic: (t: string) => void;
  setSubtopic: (st: string) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      topic: "Tecnologia",
      subtopic: "",
      setTopic: (topic) => set({ topic }),
      setSubtopic: (subtopic) => set({ subtopic }),
    }),
    {
      name: "hexxa-news-store",
    },
  ),
);
