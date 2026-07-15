"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, MoreHorizontal, Settings, X, Bird } from "lucide-react";
import { usePerfilStore } from "@/store/usePerfilStore";
import { NAV_BY_PERFIL } from "@/lib/nav";
import { PerfilSwitcher } from "./PerfilSwitcher";

export function BottomNav() {
  const path = usePathname();
  const perfil = usePerfilStore((s) => s.perfil);
  const [open, setOpen] = useState(false);

  const links = NAV_BY_PERFIL[perfil];
  const primary = links.slice(0, 2);
  const more = [...links.slice(2), { href: "/ajustes", label: "Ajustes", Icon: Settings }];
  const isMoreActive = more.some((l) => l.href === path);

  return (
    <>
      {/* Overlay "Mais" */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-20 left-3 right-3 p-4 flat-surface rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Marca + perfil */}
            <div className="flex items-center gap-1.5 px-1 mb-3 pb-3 border-b"
              style={{ borderColor: "var(--flat-border)" }}>
              <Bird size={14} className="text-ink" />
              <span className="font-bold text-sm text-ink">AIA</span>
              <div className="ml-auto"><PerfilSwitcher size="sm" /></div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {more.map(({ href, label, Icon }) => {
                const active = path === href;
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                      active ? "bg-ink text-lime" : "bg-ink/4 text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden flex items-center px-2 flat-surface"
        style={{
          height: 64,
          paddingBottom: "env(safe-area-inset-bottom)",
          borderLeft: "none", borderRight: "none", borderBottom: "none",
        }}
      >
        <div className="flex items-center justify-around w-full">
          {primary[0] && <BarLink {...primary[0]} active={path === primary[0].href} />}

          {/* Feed — centro, comum aos dois perfis */}
          <Link href="/feed"
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl -mt-5 transition-all active:scale-95 bg-ink text-lime"
          >
            <Sparkles size={22} />
          </Link>

          {primary[1] && <BarLink {...primary[1]} active={path === primary[1].href} />}

          {/* Mais */}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 min-w-[56px] ${
              isMoreActive || open ? "text-ink font-semibold" : "text-muted"
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[9px] font-semibold">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function BarLink({
  href, label, Icon, active,
}: {
  href: string; label: string; Icon: React.ElementType; active: boolean;
}) {
  return (
    <Link href={href}
      className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all active:scale-95 min-w-[56px] ${
        active ? "text-ink font-semibold" : "text-muted"
      }`}
    >
      <Icon size={20} />
      <span className="text-[9px] font-semibold">{label}</span>
    </Link>
  );
}
