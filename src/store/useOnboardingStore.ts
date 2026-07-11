import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStore {
  completed: boolean;
  step: number;
  complete: () => void;
  setStep: (n: number) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      step: 0,
      complete: () => set({ completed: true }),
      setStep: (n) => set({ step: n }),
    }),
    { name: "aia-onboarding" }
  )
);
