"use client";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, CircleUser } from "lucide-react";
import { usePerfilStore, type Perfil } from "@/store/usePerfilStore";
import { NAV_BY_PERFIL, perfilOfPath } from "@/lib/nav";
import { cn } from "@/lib/utils";

const OPTIONS: { key: Perfil; label: string; Icon: React.ElementType }[] = [
  { key: "profissional", label: "Profissional", Icon: Briefcase },
  { key: "pessoal",      label: "Pessoal",      Icon: CircleUser },
];

/** Troca o perfil E o contexto da tela: se a página atual pertence ao outro
 *  perfil, navega para a primeira função do perfil escolhido. Feed e Ajustes
 *  são comuns — neles, só o menu lateral troca. */
export function useSwitchPerfil() {
  const router = useRouter();
  const path = usePathname();
  const setPerfil = usePerfilStore((s) => s.setPerfil);

  return (p: Perfil) => {
    setPerfil(p);
    const atual = perfilOfPath(path);
    if (atual && atual !== p) router.push(NAV_BY_PERFIL[p][0].href);
  };
}

/** Alternador horizontal (pill deslizante). */
export function PerfilSwitcher({ size = "md" }: { size?: "sm" | "md" }) {
  const perfil = usePerfilStore((s) => s.perfil);
  const switchPerfil = useSwitchPerfil();

  return (
    <div
      className="inline-flex items-center rounded-xl p-1 gap-0.5 border bg-surface-2"
      style={{ borderColor: "var(--flat-border)" }}
      role="tablist"
      aria-label="Perfil ativo"
    >
      {OPTIONS.map(({ key, label }) => {
        const active = perfil === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => switchPerfil(key)}
            className={cn(
              "relative rounded-lg font-semibold transition-colors",
              size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs",
              !active && "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="perfil-pill"
                className="absolute inset-0 rounded-lg bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className="relative z-10"
              style={active ? { color: "var(--color-surface)" } : undefined}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Variante vertical compacta — vive na sidebar recolhida. */
export function PerfilSwitcherMini() {
  const perfil = usePerfilStore((s) => s.perfil);
  const switchPerfil = useSwitchPerfil();

  return (
    <div
      className="flex flex-col items-center rounded-xl p-1 gap-0.5 border bg-surface-2"
      style={{ borderColor: "var(--flat-border)" }}
      role="tablist"
      aria-label="Perfil ativo"
    >
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = perfil === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            title={label}
            onClick={() => switchPerfil(key)}
            className={cn(
              "relative w-8 h-8 rounded-lg grid place-items-center transition-colors",
              !active && "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="perfil-pill-mini"
                className="absolute inset-0 rounded-lg bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon
              size={14}
              className="relative z-10"
              style={active ? { color: "var(--color-surface)" } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}
