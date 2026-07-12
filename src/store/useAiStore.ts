"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";
import { DEFAULT_MODELS } from "@/lib/ai/models";

export type ModelRole = "system" | "chat";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  taskRef?: { id: string; title: string };
  error?: boolean;
}

interface State {
  provider: "openrouter" | "groq";
  // Chave única do OpenRouter (BYOK). Opcional: o servidor usa
  // OPENROUTER_API_KEY do .env.local como fallback quando vazia.
  apiKey: string;
  // Chave do Groq. Opcional: fallback para GROQ_API_KEY no servidor.
  groqKey: string;
  // Um modelo por papel — mesma chave, modelos diferentes por requisição.
  models: { system: string; chat: string };
  messages: AiMessage[];
  assistantName: string;
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  setProvider: (provider: "openrouter" | "groq") => void;
  setApiKey: (key: string) => void;
  setGroqKey: (key: string) => void;
  setModel: (role: ModelRole, id: string) => void;
  setAssistantName: (name: string) => void;
  appendMessage: (m: Omit<AiMessage, "id" | "at">) => string;
  updateMessage: (id: string, patch: Partial<AiMessage>) => void;
  clearMessages: () => void;
}

export const useAiStore = create<State & Actions>()(
  persist(
    (set) => ({
      provider: "openrouter",
      apiKey: "",
      groqKey: "",
      models: { system: DEFAULT_MODELS.system, chat: DEFAULT_MODELS.chat },
      messages: [],
      assistantName: "Aia",
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setGroqKey: (groqKey) => set({ groqKey }),
      setModel: (role, id) =>
        set((state) => ({ models: { ...state.models, [role]: id } })),
      setAssistantName: (assistantName) => set({ assistantName }),

      appendMessage: (m) => {
        const id = nanoid();
        set((s) => ({ messages: [...s.messages, { id, at: Date.now(), ...m }] }));
        return id;
      },

      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)),
        })),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "aia-ai-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
