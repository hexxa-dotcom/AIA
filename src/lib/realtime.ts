"use client";
import { useEffect } from "react";
import { getSupabase } from "./supabase";

type Payload = {
  schema: string;
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: any;
  old: any;
};

export function useRealtime(
  table: string,
  handler: (payload: Payload) => void,
  filter?: { event?: "INSERT" | "UPDATE" | "DELETE" | "*"; filter?: string },
) {
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`realtime:${table}:${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: filter?.event ?? "INSERT",
          schema: "public",
          table,
          ...(filter?.filter ? { filter: filter.filter } : {}),
        },
        (payload: any) => handler(payload),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}
