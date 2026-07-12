import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface InvestmentAsset {
  id: string;
  name: string;      // ex: PETR4, Tesouro Selic, BTC
  category: "Ações" | "Renda Fixa" | "FIIs" | "Cripto" | "Outros";
  value: number;     // Preço médio ou preço atual por cota/fração
  quantity: number;  // Quantidade de cotas ou frações
  yieldPct: number;  // Lucro/Rendimento em percentual (ex: 5.4 para +5.4%, -2.1 para -2.1%)
  createdAt: number;
}

interface InvestmentStore {
  assets: InvestmentAsset[];
  addAsset: (asset: Omit<InvestmentAsset, "id" | "createdAt">) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Omit<InvestmentAsset, "id" | "createdAt">>) => void;
}

export const useInvestmentStore = create<InvestmentStore>()(
  persist(
    (set) => ({
      assets: [
        {
          id: "i-1",
          name: "Tesouro Selic 2029",
          category: "Renda Fixa",
          value: 1000,
          quantity: 5,
          yieldPct: 10.75,
          createdAt: Date.now()
        },
        {
          id: "i-2",
          name: "MXRF11",
          category: "FIIs",
          value: 9.80,
          quantity: 250,
          yieldPct: 8.4,
          createdAt: Date.now()
        },
        {
          id: "i-3",
          name: "Bitcoin",
          category: "Cripto",
          value: 320000,
          quantity: 0.015,
          yieldPct: 24.5,
          createdAt: Date.now()
        }
      ],
      addAsset: (asset) => set((s) => ({
        assets: [
          ...s.assets,
          {
            ...asset,
            id: `i-${Date.now()}`,
            createdAt: Date.now()
          }
        ]
      })),
      removeAsset: (id) => set((s) => ({
        assets: s.assets.filter((a) => a.id !== id)
      })),
      updateAsset: (id, updates) => set((s) => ({
        assets: s.assets.map((a) => a.id === id ? { ...a, ...updates } : a)
      }))
    }),
    { name: "aia-investment-store" }
  )
);
