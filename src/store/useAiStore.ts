"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genId as nanoid } from "@/lib/id";

export type AiProvider = "openai" | "anthropic" | "gemini" | "deepseek";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  taskRef?: { id: string; title: string };
  error?: boolean;
}

interface State {
  provider: AiProvider;
  keys: {
    openai: string;
    anthropic: string;
    gemini: string;
    deepseek: string;
  };
  messages: AiMessage[];
  assistantName: string;
  hydrated: boolean;
}

interface Actions {
  setHydrated: () => void;
  setProvider: (provider: AiProvider) => void;
  setKey: (provider: AiProvider, key: string) => void;
  getActiveKey: () => string;
  setAssistantName: (name: string) => void;
  appendMessage: (m: Omit<AiMessage, "id" | "at">) => string;
  updateMessage: (id: string, patch: Partial<AiMessage>) => void;
  clearMessages: () => void;
}

export const useAiStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      provider: "openai",
      keys: {
        openai: "",
        anthropic: "",
        gemini: "",
        deepseek: "",
      },
      messages: [],
      assistantName: "Aia",
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),
      setProvider: (provider) => set({ provider }),
      setKey: (provider, key) =>
        set((state) => ({
          keys: {
            ...state.keys,
            [provider]: key,
          },
        })),
      getActiveKey: () => get().keys[get().provider],
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
      name: "hexxa-ai-store",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
