"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Settings, Zap, Leaf, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { NAV_BY_PERFIL, perfilOfPath, type NavItem } from "@/lib/nav";
import { checkIsAdmin } from "@/store/useAdminStore";

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

let lastChirpTime = 0;
function playChirpSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Primeiro pio (agudo ascendente rápido)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1600, now);
    osc1.frequency.exponentialRampToValueAtTime(3200, now + 0.10);
    
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.10, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.10);

    // Segundo pio (leve delay, frequência um pouco mais alta)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    const delay = 0.12;
    osc2.frequency.setValueAtTime(2000, now + delay);
    osc2.frequency.exponentialRampToValueAtTime(3600, now + delay + 0.10);
    
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.10, now + delay + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.10);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + delay);
    osc2.stop(now + delay + 0.10);
  } catch (e) {
    console.error("Web Audio API bloqueada ou indisponível", e);
  }
}

function triggerChirp() {
  const now = Date.now();
  if (now - lastChirpTime < 1000) return; // 1s cooldown
  lastChirpTime = now;
  playChirpSound();
}

interface BirdIconProps {
  hovered: boolean;
}

function BirdIcon({ hovered }: BirdIconProps) {
  const [animationState, setAnimationState] = useState("idle");

  useEffect(() => {
    if (hovered) {
      setAnimationState("flap");
      return;
    }
    setAnimationState("idle");

    const interval = setInterval(() => {
      const states = ["peck", "hop", "flap"];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setAnimationState(randomState);
      
      setTimeout(() => {
        setAnimationState("idle");
      }, 1500);
    }, 6000); // Ação a cada 6s quando não hover

    return () => clearInterval(interval);
  }, [hovered]);

  const bodyVariants = {
    idle: { y: 0, rotate: 0, scaleY: 1 },
    peck: { rotate: [0, -10, 0, -10, 0], transition: { duration: 1, ease: "easeInOut" } },
    hop: { y: [0, -6, 0, -3, 0], scaleY: [1, 0.82, 1.06, 0.94, 1], transition: { duration: 0.8, ease: "easeInOut" } },
    flap: { y: [0, -4, 0], transition: { duration: 0.8 } }
  };

  const wingVariants = {
    idle: { rotate: 0 },
    peck: { rotate: 0 },
    hop: { rotate: [0, -12, 6, -12, 0] },
    flap: { 
      rotate: [0, -45, 20, -45, 20, -45, 20, 0], 
      transition: { duration: 1.2, ease: "easeInOut" } 
    }
  };

  return (
    <motion.div
      variants={bodyVariants}
      animate={animationState}
      className="text-ink shrink-0"
      style={{ transformOrigin: "center bottom" }}
    >
      <svg 
        viewBox="0 0 32 32" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="w-10 h-10"
      >
        {/* Beak (Sleek sharp beak) */}
        <path d="M8.5 13.5L4.5 15L8.5 16.5" fill="none" />
        
        {/* Body Outline (Sleek & balanced, not too fat) */}
        <path d="M8 16 C8 10, 14 7, 20 7 C23 7, 25 10, 25 14 C25 18, 21.5 21.5, 15 22 C11 22, 8 19.5, 8 16 Z" />
        
        {/* Eye (Sleek solid circle) */}
        <circle cx="12" cy="13" r="1.3" fill="currentColor" stroke="none" />
        
        {/* Legs (Two simple clean vertical lines) */}
        <line x1="14" y1="22" x2="14" y2="24.8" />
        <line x1="17.5" y1="22" x2="17.5" y2="24.8" />
        
        {/* Wing (Sleek flapping wing) */}
        <motion.g
          variants={wingVariants}
          animate={animationState}
          style={{ transformOrigin: "15px 15px" }}
        >
          <path d="M15 15 C15 15, 16.5 18, 19.5 18 C21 16.5, 21 14.5, 19 13.5 C17.5 12.5, 15 15, 15 15 Z" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

export function Sidebar() {
  const path = usePathname();
  const perfil = usePerfilStore((s) => s.perfil);
  const setPerfil = usePerfilStore((s) => s.setPerfil);
  const [expanded, setExpanded] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const userName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initial = userName.charAt(0).toUpperCase();
  const isAdmin = checkIsAdmin(user?.email);

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
        "md:sticky md:top-4 md:h-[calc(100vh-32px)]",
        "transition-all duration-300 ease-[cubic-bezier(0.2,1,0.2,1)]",
      )}
    >
      {/* Header: Logo */}
      <div className="flex mb-3 items-center justify-center shrink-0 w-full py-1">
        {/* Marca Aia -> Abre Copilot */}
        <Link 
          href="/copilot" 
          onClick={triggerChirp}
          onMouseEnter={() => {
            setLogoHovered(true);
            triggerChirp();
          }}
          onMouseLeave={() => setLogoHovered(false)}
          className="select-none mt-1 group flex flex-col items-center hover:opacity-95 transition"
        >
          <BirdIcon hovered={logoHovered} />
          <div className="flex flex-col items-center -mt-1.5 z-10">
            <span className="font-extrabold text-[16px] tracking-[0.14em] text-ink whitespace-nowrap leading-none">
              AIA
            </span>
            <span className="text-[7px] uppercase tracking-widest font-semibold text-lime opacity-0 group-hover:opacity-100 transition-opacity mt-1 leading-none">Chat</span>
          </div>
        </Link>
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

      {/* Perfil do Usuário */}
      <Link
        href="/perfil"
        title={expanded ? undefined : "Ver Perfil"}
        className={cn(
          "flex items-center h-10 rounded-xl transition-all overflow-hidden mb-1",
          expanded ? "w-full gap-2.5 px-3" : "w-10 justify-center mx-auto",
          path === "/perfil"
            ? "bg-ink text-lime font-semibold"
            : "text-muted hover:text-ink hover:bg-ink/5 font-medium",
        )}
      >
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold shadow-sm shrink-0",
          path === "/perfil" ? "bg-lime text-ink" : "bg-ink text-surface",
          expanded ? "w-6 h-6 text-[10px]" : "w-5.5 h-5.5 text-[9px]"
        )}>
          {initial}
        </div>
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm tracking-tight whitespace-nowrap truncate"
          >
            {userName}
          </motion.span>
        )}
      </Link>

      <div
        className={cn("h-px my-2 shrink-0", expanded ? "mx-1" : "w-8 mx-auto")}
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
