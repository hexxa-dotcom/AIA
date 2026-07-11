"use client";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";
import * as supabaseAdapter from "./supabase";
import * as appwriteAdapter from "./appwrite";

export async function pullAll(userId: string) {
  if (isAppwriteEnabled()) {
    return appwriteAdapter.pullAll(userId);
  }
  if (isSupabaseEnabled()) {
    return supabaseAdapter.pullAll(userId);
  }
  throw new Error("Nenhum adaptador configurado para persistência remota.");
}

export async function pushAll(userId: string, snapshot: any) {
  if (isAppwriteEnabled()) {
    return appwriteAdapter.pushAll(userId, snapshot);
  }
  if (isSupabaseEnabled()) {
    return supabaseAdapter.pushAll(userId, snapshot);
  }
  throw new Error("Nenhum adaptador configurado para persistência remota.");
}

export async function deleteTaskRemote(taskId: string) {
  if (isAppwriteEnabled()) {
    return appwriteAdapter.deleteTaskRemote(taskId);
  }
  if (isSupabaseEnabled()) {
    return supabaseAdapter.deleteTaskRemote(taskId);
  }
}

export async function deleteRoutineRemote(id: string) {
  if (isAppwriteEnabled()) {
    return appwriteAdapter.deleteRoutineRemote(id);
  }
  if (isSupabaseEnabled()) {
    return supabaseAdapter.deleteRoutineRemote(id);
  }
}
