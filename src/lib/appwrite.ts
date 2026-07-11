"use client";
import { Client, Account, Databases } from "appwrite";

let cachedClient: Client | null = null;
let cachedAccount: Account | null = null;
let cachedDatabases: Databases | null = null;

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

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

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
  return (
    process.env.NEXT_PUBLIC_PERSISTENCE === "appwrite" &&
    !!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
  );
}
