import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
}

interface State {
  accessToken: string | null;
  files: DriveFile[];
  loading: boolean;
  setAccessToken: (token: string | null) => void;
  fetchFiles: (query?: string) => Promise<void>;
  logout: () => void;
}

export const useDriveStore = create<State>()(
  persist(
    (set, get) => ({
      accessToken: null,
      files: [],
      loading: false,
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) get().fetchFiles();
      },
      logout: () => set({ accessToken: null, files: [] }),
      fetchFiles: async (query = "trashed=false") => {
        const token = get().accessToken;
        if (!token) return;
        set({ loading: true });
        try {
          const q = encodeURIComponent(query);
          const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,iconLink,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=50`;
          
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.status === 401) {
            // Token expired or invalid
            get().logout();
            return;
          }
          
          const data = await res.json();
          if (data.files) {
            set({ files: data.files });
          }
        } catch (e) {
          console.error("Erro ao buscar arquivos do Google Drive", e);
        } finally {
          set({ loading: false });
        }
      }
    }),
    { 
      name: "aia-drive-store",
      partialize: (state) => ({ accessToken: state.accessToken }) // Only persist token
    } 
  )
);
