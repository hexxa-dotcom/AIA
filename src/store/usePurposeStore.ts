import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Purpose {
  id: string;
  name: string;
  description: string;
  daysTotal: number;
  startedAt: number;
  completedDates: string[];
  showOnFeed: boolean;
}

interface PurposeStore {
  purposes: Purpose[];
  addPurpose: (name: string, description: string, daysTotal: number) => void;
  removePurpose: (id: string) => void;
  checkInToday: (id: string) => void;
  uncheckToday: (id: string) => void;
  toggleShowOnFeed: (id: string) => void;
}

export const usePurposeStore = create<PurposeStore>()(
  persist(
    (set) => ({
      purposes: [
        {
          id: "default-alcohol",
          name: "30 Dias sem Álcool",
          description: "Foco total na clareza mental e regeneração física.",
          daysTotal: 30,
          startedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
          completedDates: [
            new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          ],
          showOnFeed: true,
        },
        {
          id: "default-social",
          name: "30 Dias sem Redes Sociais",
          description: "Desintoxicação de dopamina e foco no trabalho profundo.",
          daysTotal: 30,
          startedAt: Date.now(),
          completedDates: [],
          showOnFeed: true,
        }
      ],
      
      addPurpose: (name, description, daysTotal) => set((s) => ({
        purposes: [
          ...s.purposes,
          {
            id: `purpose-${Date.now()}`,
            name,
            description,
            daysTotal,
            startedAt: Date.now(),
            completedDates: [],
            showOnFeed: true
          }
        ]
      })),

      removePurpose: (id) => set((s) => ({
        purposes: s.purposes.filter((p) => p.id !== id)
      })),

      checkInToday: (id) => set((s) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        return {
          purposes: s.purposes.map((p) => {
            if (p.id !== id) return p;
            if (p.completedDates.includes(todayStr)) return p;
            import("./useGameStore").then(({ useGameStore }) => {
              useGameStore.getState().addXp(5, `Dia concluído no propósito: ${p.name}`);
            });
            return {
              ...p,
              completedDates: [...p.completedDates, todayStr]
            };
          })
        };
      }),

      uncheckToday: (id) => set((s) => {
        const todayStr = new Date().toISOString().slice(0, 10);
        return {
          purposes: s.purposes.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              completedDates: p.completedDates.filter((d) => d !== todayStr)
            };
          })
        };
      }),

      toggleShowOnFeed: (id) => set((s) => ({
        purposes: s.purposes.map((p) => p.id === id ? { ...p, showOnFeed: !p.showOnFeed } : p)
      }))
    }),
    { name: "aia-purposes-store-v2" }
  )
);
