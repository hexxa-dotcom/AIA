"use client";
import { create } from "zustand";
import {
  checkVerifier,
  decryptString,
  deriveKey,
  encryptString,
  makeVerifier,
  randomSalt,
} from "@/lib/vault/crypto";
import {
  deleteVaultItem,
  fetchVaultMeta,
  listVaultItems,
  saveVaultMeta,
  upsertVaultItem,
} from "@/lib/vault/adapter";

export interface VaultEntry {
  id: string;
  title: string;
  category?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  updatedAt: number;
}

interface State {
  status: "locked" | "unlocked" | "no-master";
  key: CryptoKey | null;
  salt: string | null;
  entries: VaultEntry[];
  loading: boolean;
  lastError: string | null;
}

interface Actions {
  initFor: (userId: string) => Promise<void>;
  setupMaster: (userId: string, masterPassword: string) => Promise<{ ok: boolean; error?: string }>;
  unlock: (userId: string, masterPassword: string) => Promise<{ ok: boolean; error?: string }>;
  resetMaster: (userId: string, currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  lock: () => void;
  upsertEntry: (
    userId: string,
    entry: Omit<VaultEntry, "id" | "updatedAt"> & { id?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
}

export const useVaultStore = create<State & Actions>((set, get) => ({
  status: "no-master",
  key: null,
  salt: null,
  entries: [],
  loading: false,
  lastError: null,

  initFor: async (userId) => {
    set({ loading: true, lastError: null });
    try {
      const meta = await fetchVaultMeta(userId);
      if (!meta) {
        set({ status: "no-master", key: null, salt: null, entries: [] });
      } else {
        set({ status: "locked", salt: meta.salt, key: null, entries: [] });
      }
    } catch (e: any) {
      set({ lastError: e?.message ?? "erro ao carregar cofre" });
    } finally {
      set({ loading: false });
    }
  },

  setupMaster: async (userId, masterPassword) => {
    if (masterPassword.length < 8) {
      return { ok: false, error: "Master password precisa ter ao menos 8 caracteres" };
    }
    set({ loading: true });
    try {
      const salt = randomSalt();
      const key = await deriveKey(masterPassword, salt);
      const verifier = await makeVerifier(key);
      await saveVaultMeta(userId, { verifier, salt });
      set({ status: "unlocked", key, salt, entries: [] });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "falhou ao salvar master" };
    } finally {
      set({ loading: false });
    }
  },

  unlock: async (userId, masterPassword) => {
    set({ loading: true });
    try {
      const meta = await fetchVaultMeta(userId);
      if (!meta) return { ok: false, error: "cofre não inicializado" };
      const key = await deriveKey(masterPassword, meta.salt);
      const ok = await checkVerifier(key, meta.verifier);
      if (!ok) return { ok: false, error: "Senha mestra inválida" };
      set({ status: "unlocked", key, salt: meta.salt });
      await get().refresh(userId);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "erro ao desbloquear" };
    } finally {
      set({ loading: false });
    }
  },

  resetMaster: async (userId, currentPassword, newPassword) => {
    if (newPassword.length < 8) {
      return { ok: false, error: "Nova senha precisa ter ao menos 8 caracteres" };
    }
    set({ loading: true });
    try {
      const meta = await fetchVaultMeta(userId);
      if (!meta) return { ok: false, error: "Cofre não inicializado — configure a senha em /cofre" };
      const currentKey = await deriveKey(currentPassword, meta.salt);
      const valid = await checkVerifier(currentKey, meta.verifier);
      if (!valid) return { ok: false, error: "Senha atual incorreta" };

      const newSalt = randomSalt();
      const newKey = await deriveKey(newPassword, newSalt);
      const newVerifier = await makeVerifier(newKey);

      const rows = await listVaultItems(userId);
      const reencrypted: { id: string; title: string; category?: string; encrypted_payload: string; iv: string }[] = [];
      for (const row of rows) {
        try {
          const json = await decryptString(currentKey, row.encrypted_payload, row.iv);
          const { encrypted, iv } = await encryptString(newKey, json);
          reencrypted.push({ id: row.id, title: row.title, category: row.category, encrypted_payload: encrypted, iv });
        } catch {
          // item corrompido — ignora
        }
      }

      await saveVaultMeta(userId, { verifier: newVerifier, salt: newSalt });
      for (const item of reencrypted) {
        await upsertVaultItem(userId, item);
      }

      set({ key: newKey, salt: newSalt, status: "unlocked" });
      await get().refresh(userId);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Erro ao redefinir senha" };
    } finally {
      set({ loading: false });
    }
  },

  lock: () => set({ status: "locked", key: null, entries: [] }),

  refresh: async (userId) => {
    const { key } = get();
    if (!key) return;
    set({ loading: true });
    try {
      const rows = await listVaultItems(userId);
      const decrypted: VaultEntry[] = [];
      for (const r of rows) {
        try {
          const json = await decryptString(key, r.encrypted_payload, r.iv);
          const body = JSON.parse(json) as Omit<VaultEntry, "id" | "title" | "category" | "updatedAt">;
          decrypted.push({
            id: r.id,
            title: r.title,
            category: r.category,
            updatedAt: new Date(r.updated_at).getTime(),
            ...body,
          });
        } catch {
          // entrada corrompida ou senha mestra trocada — ignora
        }
      }
      set({ entries: decrypted });
    } finally {
      set({ loading: false });
    }
  },

  upsertEntry: async (userId, entry) => {
    const { key } = get();
    if (!key) return { ok: false, error: "cofre bloqueado" };
    try {
      const payload = {
        username: entry.username ?? "",
        password: entry.password ?? "",
        url: entry.url ?? "",
        notes: entry.notes ?? "",
      };
      const json = JSON.stringify(payload);
      const { encrypted, iv } = await encryptString(key, json);
      const id = await upsertVaultItem(userId, {
        id: entry.id,
        title: entry.title,
        category: entry.category,
        encrypted_payload: encrypted,
        iv,
      });
      await get().refresh(userId);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "erro ao salvar" };
    }
  },

  deleteEntry: async (id) => {
    try {
      await deleteVaultItem(id);
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    } catch (e) {
      console.error("delete vault item failed", e);
    }
  },
}));
