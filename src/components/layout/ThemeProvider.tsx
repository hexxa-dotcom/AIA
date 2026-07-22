"use client";
import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { useCollapseStore } from "@/store/useCollapseStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const focusMode = useCollapseStore((s) => s.focusMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (focusMode) {
      document.documentElement.classList.add("focus-mode");
    } else {
      document.documentElement.classList.remove("focus-mode");
    }
  }, [theme, focusMode]);
  return <>{children}</>;
}
