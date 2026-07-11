import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface McpServer {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

interface State {
  servers: McpServer[];
  add: (s: Omit<McpServer, "id">) => void;
  update: (id: string, patch: Partial<McpServer>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
}

export const useMcpServersStore = create<State>()(
  persist(
    (set) => ({
      servers: [],
      add: (s) =>
        set((st) => ({
          servers: [...st.servers, { ...s, id: crypto.randomUUID() }],
        })),
      update: (id, patch) =>
        set((st) => ({
          servers: st.servers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      remove: (id) => set((st) => ({ servers: st.servers.filter((s) => s.id !== id) })),
      toggle: (id) =>
        set((st) => ({
          servers: st.servers.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        })),
    }),
    { name: "hexxa-mcp-servers" },
  ),
);
