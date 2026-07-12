import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SpaceLink {
  id: string;
  title: string;
  url: string;
  category: string;
  scope: "profissional" | "pessoal";
  notes?: string;
  createdAt: number;
}

export interface SpaceEmbed {
  id: string;
  title: string;
  embedUrl: string;
  type: "spotify" | "youtube" | "notion" | "figma" | "generic";
  scope: "profissional" | "pessoal";
  createdAt: number;
}

interface SpaceStore {
  links: SpaceLink[];
  embeds: SpaceEmbed[];
  addLink: (title: string, url: string, category: string, scope: "profissional" | "pessoal", notes?: string) => void;
  removeLink: (id: string) => void;
  addEmbed: (title: string, embedUrl: string, type: SpaceEmbed["type"], scope: "profissional" | "pessoal") => void;
  removeEmbed: (id: string) => void;
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set) => ({
      links: [
        {
          id: "link-1",
          title: "Notion Workspace",
          url: "https://notion.so",
          category: "Trabalho",
          scope: "profissional",
          notes: "Meu painel de notas corporativas.",
          createdAt: Date.now(),
        },
        {
          id: "link-2",
          title: "Aulas da Faculdade",
          url: "https://classroom.google.com",
          category: "Estudos",
          scope: "pessoal",
          notes: "Acesso às tarefas de graduação.",
          createdAt: Date.now(),
        }
      ],
      embeds: [
        {
          id: "embed-1",
          title: "Playlist de Foco Lofi",
          embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn",
          type: "spotify",
          scope: "profissional",
          createdAt: Date.now(),
        }
      ],

      addLink: (title, url, category, scope, notes) => set((s) => ({
        links: [
          ...s.links,
          {
            id: `link-${Date.now()}`,
            title,
            url,
            category,
            scope,
            notes,
            createdAt: Date.now(),
          }
        ]
      })),

      removeLink: (id) => set((s) => ({
        links: s.links.filter((l) => l.id !== id)
      })),

      addEmbed: (title, embedUrl, type, scope) => set((s) => ({
        embeds: [
          ...s.embeds,
          {
            id: `embed-${Date.now()}`,
            title,
            embedUrl,
            type,
            scope,
            createdAt: Date.now(),
          }
        ]
      })),

      removeEmbed: (id) => set((s) => ({
        embeds: s.embeds.filter((e) => e.id !== id)
      }))
    }),
    { name: "aia-space-store" }
  )
);
