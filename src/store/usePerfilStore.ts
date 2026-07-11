"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Perfil = "profissional" | "pessoal";

interface PerfilStore {
  perfil: Perfil;
  setPerfil: (p: Perfil) => void;
}

/** Perfil ativo do sistema — controla quais itens a sidebar mostra.
 *  O Feed é comum aos dois; Ajustes também. */
export const usePerfilStore = create<PerfilStore>()(
  persist(
    (set) => ({
      perfil: "profissional",
      setPerfil: (p) => set({ perfil: p }),
    }),
    { name: "aia-perfil" },
  ),
);
