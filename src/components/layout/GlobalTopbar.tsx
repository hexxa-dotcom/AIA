"use client";
import { Search, Sun, Moon, Sparkles, Focus, User } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useCommandStore } from "@/store/useCommandStore";
import { useSwitchPerfil } from "@/components/layout/PerfilSwitcher";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function PerfilSlider({ isProf, onChange }: { isProf: boolean, onChange: (isProf: boolean) => void }) {
  return (
    <div 
      className="relative flex items-center bg-surface-2 p-1 rounded-full border shadow-sm cursor-pointer select-none group" 
      onClick={() => onChange(!isProf)} 
      style={{ borderColor: "var(--flat-border)", width: "210px" }}
    >
      <motion.div 
        className="absolute top-1 bottom-1 w-[101px] bg-white rounded-full shadow-sm"
        style={{ borderColor: "var(--flat-border)", borderWidth: "1px" }}
        animate={{ left: isProf ? "4px" : "105px" }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
      />
      
      <div className="relative z-10 flex-1 text-center text-[10px] font-bold tracking-[0.1em] uppercase py-1 transition-all duration-300">
        <span className={cn("transition-colors duration-300", isProf ? "text-ink" : "text-muted/30 group-hover:text-muted/50")}>
          Workspace
        </span>
      </div>
      <div className="relative z-10 flex-1 text-center text-[10px] font-bold tracking-[0.1em] uppercase py-1 transition-all duration-300">
        <span className={cn("transition-colors duration-300", !isProf ? "text-ink" : "text-muted/30 group-hover:text-muted/50")}>
          Lifespace
        </span>
      </div>
    </div>
  );
}

export function GlobalTopbar() {
  const activePerfil = usePerfilStore((s) => s.perfil);
  
  const switchPerfil = useSwitchPerfil();
  const isProf = activePerfil === "profissional";
  
  const { theme, toggle: cycleTheme } = useThemeStore();
  const openCommand = useCommandStore((s) => s.setOpen);
  
  const ThemeIcon = theme === "light" ? Sun : theme === "creme" ? Sparkles : theme === "dark" ? Moon : Focus;

  return (
    <div className="flex items-center justify-between gap-4 py-2 px-1">
      {/* Espaço vazio se precisar depois */}
      <div className="flex items-center gap-2" />

      {/* Direita: Ferramentas globais e Perfil Slider */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => openCommand(true)}
          title="Buscar (⌘K)"
          className="w-9 h-9 rounded-full grid place-items-center transition bg-surface-2 border hover:bg-ink hover:text-surface text-muted"
          style={{ borderColor: "var(--flat-border)" }}
        >
          <Search size={14} />
        </button>

        <button
          onClick={cycleTheme}
          title="Alternar Tema"
          className="w-9 h-9 rounded-full grid place-items-center transition bg-surface-2 border hover:bg-ink hover:text-surface text-muted"
          style={{ borderColor: "var(--flat-border)" }}
        >
          <ThemeIcon size={14} />
        </button>

        <PerfilSlider 
          isProf={isProf} 
          onChange={(newIsProf) => switchPerfil(newIsProf ? "profissional" : "pessoal")} 
        />
      </div>
    </div>
  );
}
