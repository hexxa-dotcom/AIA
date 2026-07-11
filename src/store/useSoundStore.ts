import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  enabled: boolean;
  volume: number; // 0-1
  toggle: () => void;
  setVolume: (v: number) => void;
}

export const useSoundStore = create<State>()(
  persist(
    (set) => ({
      enabled: true,
      volume: 0.7,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
      setVolume: (volume) => set({ volume }),
    }),
    { name: "hexxa-sounds" },
  ),
);

// Helper chamado em qualquer lugar sem hooks
export function playSound(name: keyof typeof import("../lib/sounds").sounds) {
  const { enabled } = useSoundStore.getState();
  if (!enabled) return;
  import("../lib/sounds").then(({ sounds }) => sounds[name]?.());
}
