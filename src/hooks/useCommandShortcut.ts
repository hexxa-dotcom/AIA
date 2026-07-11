"use client";
import { useEffect } from "react";
import { useCommandStore } from "@/store/useCommandStore";

export function useCommandShortcut() {
  const toggle = useCommandStore((s) => s.toggle);
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);
}
