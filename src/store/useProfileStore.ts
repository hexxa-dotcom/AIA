import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SkillItem {
  name: string;
  level: number; // 1 a 5
}

export interface GoalItem {
  id: string;
  name: string;
  completed: boolean;
}

export interface PerfilData {
  name: string;
  role: string;
  bio?: string;
  company?: string;
  goals?: string;
  skills?: string;
  interests?: string;
  avatarUrl?: string;
  avatarColor?: string; // sunset, ocean, emerald, neon, liquid
  mood?: string;        // 🚀, ☕, 😊, 😴, 🧠
  skillsList?: SkillItem[];
  goalsList?: GoalItem[];
}

interface ProfileStore {
  profile: PerfilData;
  setProfileData: (data: Partial<PerfilData>) => void;
  migrateLegacyData: () => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: { 
        name: "", 
        role: "", 
        avatarColor: "sunset",
        mood: "🚀",
        skillsList: [],
        goalsList: []
      },
      setProfileData: (data) => set((s) => ({
        profile: { ...s.profile, ...data }
      })),
      migrateLegacyData: () => {
        const { profile } = get();
        if (!profile) return;
        
        let updated = false;
        const patch: Partial<PerfilData> = {};

        // Migração de skills estáticas para lista interativa
        if (profile.skills && (!profile.skillsList || profile.skillsList.length === 0)) {
          patch.skillsList = profile.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ name, level: 3 }));
          updated = true;
        }

        // Migração de goals estáticos para lista interativa
        if (profile.goals && (!profile.goalsList || profile.goalsList.length === 0)) {
          patch.goalsList = profile.goals
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
            .map((name, i) => ({ id: `goal-${i}-${Date.now()}`, name, completed: false }));
          updated = true;
        }

        if (updated) {
          set((s) => ({ profile: { ...s.profile, ...patch } }));
        }
      }
    }),
    { 
      name: "aia-profile-v4",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.migrateLegacyData();
        }
      }
    }
  )
);
