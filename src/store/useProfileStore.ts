import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PerfilData {
  name: string;
  role: string;
  bio?: string;
  company?: string;
  goals?: string;
  skills?: string;
  interests?: string;
  avatarUrl?: string;
}

interface ProfileStore {
  profile: PerfilData;
  setProfileData: (data: Partial<PerfilData>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: { name: "", role: "" },
      setProfileData: (data) => set((s) => ({
        profile: { ...s.profile, ...data }
      }))
    }),
    { name: "aia-profile-v3" } // bumped version to avoid hydration errors from v2
  )
);
