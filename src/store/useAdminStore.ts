"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isAppwriteEnabled } from "@/lib/appwrite";
import { isSupabaseEnabled } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "admin" | "convidado";
  joinedAt: string;
}

export interface SystemToolsConfig {
  vercelUrl: string;
  vercelToken: string;
  gitRepo: string;
  gitToken: string;
  appwriteEndpoint: string;
  appwriteProjectId: string;
  appwriteDatabaseId: string;
  appwriteApiKey: string;
}

export interface AdminSettings {
  allowGuestsChangeAiModel: boolean;
  allowGuestsResetData: boolean;
  allowGuestsManageMcp: boolean;
  allowGuestsConfigureIntegrations: boolean;
}

interface AdminState {
  settings: AdminSettings;
  users: UserProfile[];
  systemTools: SystemToolsConfig;
  updateSetting: (key: keyof AdminSettings, value: boolean) => void;
  addUser: (user: Omit<UserProfile, "joinedAt">) => void;
  updateUserRole: (id: string, role: "admin" | "convidado") => void;
  removeUser: (id: string) => void;
  updateSystemTools: (config: Partial<SystemToolsConfig>) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      settings: {
        allowGuestsChangeAiModel: false,
        allowGuestsResetData: false,
        allowGuestsManageMcp: false,
        allowGuestsConfigureIntegrations: false,
      },
      users: [
        {
          id: "admin-default-1",
          email: "filipeheck7@gmail.com",
          name: "Filipe Heck",
          role: "admin",
          joinedAt: new Date().toISOString().slice(0, 10),
        },
        {
          id: "admin-default-2",
          email: "flpheck@gmail.com",
          name: "Filipe Heck",
          role: "admin",
          joinedAt: new Date().toISOString().slice(0, 10),
        }
      ],
      systemTools: {
        vercelUrl: "",
        vercelToken: "",
        gitRepo: "",
        gitToken: "",
        appwriteEndpoint: "https://cloud.appwrite.io/v1",
        appwriteProjectId: "",
        appwriteDatabaseId: "aia",
        appwriteApiKey: "",
      },
      updateSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),
      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            { ...user, joinedAt: new Date().toISOString().slice(0, 10) },
          ],
        })),
      updateUserRole: (id, role) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
        })),
      removeUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),
      updateSystemTools: (config) =>
        set((state) => ({
          systemTools: {
            ...state.systemTools,
            ...config,
          },
        })),
    }),
    {
      name: "aia-admin-settings-v2",
    }
  )
);

export function checkIsAdmin(email?: string): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (!isAppwriteEnabled() && !isSupabaseEnabled()) return true;
  if (!email) return false;
  
  const state = useAdminStore.getState();
  const found = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (found) return found.role === "admin";
  
  const envAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (envAdmin && email === envAdmin) return true;
  
  const lower = email.toLowerCase();
  if (lower === "filipeheck7@gmail.com" || lower === "flpheck@gmail.com" || lower.startsWith("admin")) return true;
  
  return false;
}
