"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Perfil = "profissional" | "pessoal";
export type MotivationalStyle = "biblia" | "famous" | "stoic" | "startup";
export type MotivationalFrequency = "daily" | "twice_daily" | "after_focus" | "off";

interface PerfilStore {
  perfil: Perfil;
  defaultPerfil: Perfil | "last_active";
  motivationalStyle: MotivationalStyle;
  motivationalFrequency: MotivationalFrequency;
  setPerfil: (p: Perfil) => void;
  setDefaultPerfil: (p: Perfil | "last_active") => void;
  setMotivationalStyle: (s: MotivationalStyle) => void;
  setMotivationalFrequency: (f: MotivationalFrequency) => void;
}

/** Perfil ativo do sistema — controla quais itens a sidebar mostra.
 *  O Feed é comum aos dois; Ajustes também. */
export const usePerfilStore = create<PerfilStore>()(
  persist(
    (set) => ({
      perfil: "profissional",
      defaultPerfil: "last_active",
      motivationalStyle: "famous",
      motivationalFrequency: "daily",
      setPerfil: (p) => set({ perfil: p }),
      setDefaultPerfil: (p) => set({ defaultPerfil: p }),
      setMotivationalStyle: (s) => set({ motivationalStyle: s }),
      setMotivationalFrequency: (f) => set({ motivationalFrequency: f }),
    }),
    { 
      name: "aia-perfil-v2",
      onRehydrateStorage: () => (state) => {
        if (state && state.defaultPerfil && state.defaultPerfil !== "last_active") {
          state.setPerfil(state.defaultPerfil);
        }
      }
    },
  ),
);
