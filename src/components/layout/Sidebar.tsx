"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Settings, Zap, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { NAV_BY_PERFIL, perfilOfPath, type NavItem } from "@/lib/nav";

function SideLink({
  href, label, Icon, active, expanded,
}: NavItem & { active: boolean; expanded: boolean }) {
  return (
    <Link
      href={href}
      title={expanded ? undefined : label}
      className={cn(
        "flex items-center h-10 rounded-xl transition-all overflow-hidden",
        expanded ? "w-full gap-2.5 px-3" : "w-10 justify-center mx-auto",
        active
          ? "bg-ink text-lime font-semibold"
          : "text-muted hover:text-ink hover:bg-ink/5 font-medium",
      )}
    >
      <Icon size={18} className="shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      {expanded && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="text-sm tracking-tight whitespace-nowrap truncate"
        >
          {label}
        </motion.span>
      )}
    </Link>
  );
}

/** Sidebar fixa do perfil ativo — ícones que expandem ao aproximar o mouse.
 *  Feed e Ajustes são comuns; os demais itens vêm do perfil selecionado. */
export function Sidebar() {
  const path = usePathname();
  const perfil = usePerfilStore((s) => s.perfil);
  const setPerfil = usePerfilStore((s) => s.setPerfil);
  const [expanded, setExpanded] = useState(false);

  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const userName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initial = userName.charAt(0).toUpperCase();

  // navegar direto para uma página do outro perfil sincroniza o seletor
  useEffect(() => {
    const p = perfilOfPath(path);
    if (p && p !== perfil) setPerfil(p);
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  const links = NAV_BY_PERFIL[perfil];

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "hidden md:flex shrink-0 flex-col relative z-40",
        "flat-surface rounded-2xl py-4 gap-1",
        expanded ? "w-[200px] px-3 items-stretch" : "w-[68px] px-0 items-center",
        "md:sticky md:top-4 md:max-h-[calc(100vh-32px)]",
        "transition-all duration-300 ease-[cubic-bezier(0.2,1,0.2,1)]",
      )}
    >
      {/* Header: Logo + Toggle */}
      <div className={cn("flex mb-3 relative", expanded ? "flex-row items-center justify-between px-3" : "flex-col items-center gap-3 px-0")}>
        {/* Marca Aia -> Abre Copilot */}
        <Link href="/copilot" className={cn("select-none mt-1 group flex flex-col items-center hover:opacity-80 transition", expanded ? "" : "")}>
          <span className="font-bold text-[15px] tracking-[0.08em] text-ink whitespace-nowrap">
            AIA
          </span>
          <span className="text-[8px] uppercase tracking-widest font-semibold text-lime opacity-0 group-hover:opacity-100 transition-opacity">Chat</span>
        </Link>
        
        {/* Profile Avatar (Only when expanded) */}
        {expanded && (
          <Link 
            href="/perfil" 
            title="Ver Perfil"
            className="flex flex-col items-center gap-1 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-ink text-surface grid place-items-center font-bold text-xs shadow-sm">
              {initial}
            </div>
            <span className="text-[9px] font-semibold text-ink/70 max-w-[40px] truncate">
              {userName.split(" ")[0]}
            </span>
          </Link>
        )}
      </div>

      <div
        className={cn("h-px mb-2 shrink-0", expanded ? "mx-1" : "w-8 mx-auto")}
        style={{ background: "var(--flat-border)" }}
      />

      {/* Feed — comum aos dois perfis */}
      <SideLink
        href="/feed" label="Feed" Icon={Sparkles}
        active={path === "/feed"} expanded={expanded}
      />

      <div
        className={cn("h-px my-2 shrink-0", expanded ? "mx-1" : "w-8 mx-auto")}
        style={{ background: "var(--flat-border)" }}
      />

      {/* Itens do perfil ativo */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={perfil}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className={cn("flex flex-col gap-1", expanded ? "items-stretch" : "items-center")}
        >
          {expanded && (
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-ink/40">
              {perfil === "profissional" ? "Workspace" : "Lifespace"}
            </p>
          )}
          {links.map((l) => (
            <SideLink key={l.href} {...l} active={path.startsWith(l.href)} expanded={expanded} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex-1" />

      <div
        className={cn("h-px mb-2 shrink-0", expanded ? "mx-1" : "w-8 mx-auto")}
        style={{ background: "var(--flat-border)" }}
      />

      {/* Ajustes — comum */}
      <SideLink
        href="/ajustes" label="Ajustes" Icon={Settings}
        active={path === "/ajustes"} expanded={expanded}
      />
    </aside>
  );
}
