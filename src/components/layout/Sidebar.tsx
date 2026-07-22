"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Settings, Zap, Leaf, Shield, Bird } from "lucide-react";
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
        "flex items-center h-10 rounded-xl transition-all overflow-hidden w-full",
        active
          ? "bg-ink text-surface font-semibold"
          : "text-muted hover:text-ink hover:bg-ink/5 font-medium",
      )}
    >
      <div className="w-[44px] h-full flex shrink-0 items-center justify-center">
        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      </div>
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
let chirpCtx: AudioContext | null = null;
function playChirpSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!chirpCtx) chirpCtx = new AudioCtx();
    if (chirpCtx.state === "suspended") chirpCtx.resume();
    const now = chirpCtx.currentTime;
    const ctx = chirpCtx;

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
        "hidden xl:flex shrink-0 flex-col relative z-40",
        "flat-surface rounded-2xl py-4 gap-1 px-3 items-stretch",
        expanded ? "w-[200px]" : "w-[68px]",
        "xl:sticky xl:top-4 xl:h-[calc(100vh-32px)]",
        "transition-all duration-300 ease-[cubic-bezier(0.2,1,0.2,1)]",
      )}
    >
      {/* Header: Logo */}
      <div className="flex mb-0 shrink-0 pt-3 items-end w-full">
        <Link 
          href="/copilot" 
          onClick={triggerChirp}
          onMouseEnter={() => {
            setLogoHovered(true);
            triggerChirp();
          }}
          onMouseLeave={() => setLogoHovered(false)}
          className="relative select-none flex items-end w-full hover:opacity-95 transition group"
        >
          {/* O Passarinho (sempre visível) */}
          <div className="relative flex items-end justify-center w-[44px] h-[38px] shrink-0 text-ink translate-y-[4px]">
            <motion.div
              animate={!expanded ? { y: [0, -6, 0] } : { y: 0 }}
              transition={!expanded ? { duration: 0.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 5 } : { duration: 0.2 }}
            >
              <Bird size={38} strokeWidth={2} />
            </motion.div>
          </div>

          {/* O texto "AIA Space" */}
          {expanded && (
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none pb-0.5">
              <span className="font-extrabold text-[22px] tracking-[0.15em] text-ink whitespace-nowrap">
                AIA
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-lime mt-1.5 ml-1">
                SPACE
              </span>
            </div>
          )}
        </Link>
      </div>

      <div
        className={cn("h-px mb-2 shrink-0", expanded ? "mx-1" : "w-8 mx-auto")}
        style={{ background: "var(--flat-border)" }}
      />

      <SideLink
        href="/feed" label="Feed" Icon={Zap}
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
          className="flex flex-col gap-1 items-stretch w-full"
        >
          <div className="h-[30px] px-3 pt-2 pb-1.5 flex items-center overflow-hidden shrink-0">
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-bold tracking-[0.15em] uppercase text-ink/40 whitespace-nowrap"
              >
                {perfil === "profissional" ? "Workspace" : "Lifespace"}
              </motion.p>
            )}
          </div>
          <SideLink
            href="/copilot" label="AIA Chat" Icon={Sparkles}
            active={path === "/copilot"} expanded={expanded}
          />
          {links.map((l) => (
            <SideLink key={l.href} {...l} active={path.startsWith(l.href)} expanded={expanded} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex-1" />

      {/* Perfil do Usuário */}
      <Link
        href="/perfil"
        title={expanded ? undefined : "Personal space"}
        className={cn(
          "flex items-center h-10 rounded-xl transition-all overflow-hidden mb-1 w-full",
          path === "/perfil"
            ? "bg-ink text-surface font-semibold"
            : "text-muted hover:text-ink hover:bg-ink/5 font-medium",
        )}
      >
        <div className="w-[44px] h-full flex shrink-0 items-center justify-center">
          <div className={cn(
            "rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 overflow-hidden",
            path === "/perfil" && !profile?.avatarUrl ? "bg-surface text-ink" : "bg-ink text-surface",
            expanded ? "w-6 h-6 text-[10px]" : "w-5.5 h-5.5 text-[9px]"
          )}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>
        {expanded && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="text-sm tracking-tight whitespace-nowrap truncate"
          >
            Personal space
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
