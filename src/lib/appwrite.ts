"use client";
import { Client, Account, Databases } from "appwrite";

let cachedClient: Client | null = null;
let cachedAccount: Account | null = null;
let cachedDatabases: Databases | null = null;

function getAppwriteConfigFromStorage() {
  if (typeof window === "undefined") return { endpoint: null, project: null };
  try {
    const stored = localStorage.getItem("aia-admin-settings-v2");
    if (stored) {
      const parsed = JSON.parse(stored);
      const systemTools = parsed?.state?.systemTools;
      if (systemTools?.appwriteProjectId) {
        return {
          endpoint: systemTools.appwriteEndpoint || "https://cloud.appwrite.io/v1",
          project: systemTools.appwriteProjectId,
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { endpoint: null, project: null };
}

export function getAppwrite() {
  if (cachedClient) {
    return {
      client: cachedClient,
      account: cachedAccount!,
      databases: cachedDatabases!,
    };
  }

  if (typeof window === "undefined") {
    return { client: null, account: null, databases: null };
  }

  let endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  let project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!project) {
    const storedConfig = getAppwriteConfigFromStorage();
    if (storedConfig.project) {
      endpoint = storedConfig.endpoint;
      project = storedConfig.project;
    }
  }

  if (!endpoint) endpoint = "https://cloud.appwrite.io/v1";
  if (!project) {
    return { client: null, account: null, databases: null };
  }

  cachedClient = new Client().setEndpoint(endpoint).setProject(project);
  cachedAccount = new Account(cachedClient);
  cachedDatabases = new Databases(cachedClient);

  return {
    client: cachedClient,
    account: cachedAccount,
    databases: cachedDatabases,
  };
}

export function isAppwriteEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const envEnabled =
    process.env.NEXT_PUBLIC_PERSISTENCE === "appwrite" &&
    !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (envEnabled) return true;

  const storedConfig = getAppwriteConfigFromStorage();
  return !!storedConfig.project;
}
