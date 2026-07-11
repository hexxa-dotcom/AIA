"use client";
import { useEffect } from "react";
import { useCollapseStore } from "@/store/useCollapseStore";

export function useCollapse(key: string, defaultCollapsed = false) {
  const collapsed = useCollapseStore((s) => s.map[key] ?? defaultCollapsed);
  const register = useCollapseStore((s) => s.register);
  const toggleKey = useCollapseStore((s) => s.toggle);

  // migra o estado antigo salvo por widget e registra a chave no store
  useEffect(() => {
    const legacy = localStorage.getItem(`hexxa-col-${key}`);
    if (legacy !== null) {
      register(key, legacy === "1");
      localStorage.removeItem(`hexxa-col-${key}`);
    } else {
      register(key, defaultCollapsed);
    }
  }, [key, defaultCollapsed, register]);

  return { collapsed, toggle: () => toggleKey(key) };
}
