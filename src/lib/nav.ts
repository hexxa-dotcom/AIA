import {
  LayoutGrid, CalendarDays, Clock, Trophy,
  Target, Wallet, FolderClosed, StickyNote, PenLine, BookOpen, KeyRound
} from "lucide-react";
import type { Perfil } from "@/store/usePerfilStore";

export type NavItem = { href: string; label: string; Icon: React.ElementType };

/** Itens de navegação por perfil — Feed e Ajustes são comuns e ficam fora. */
export const NAV_BY_PERFIL: Record<Perfil, NavItem[]> = {
  profissional: [
    { href: "/rotina",      label: "Rotina",       Icon: Clock },
    { href: "/projetos",    label: "Projetos",     Icon: LayoutGrid },
    { href: "/foco",        label: "Em execução",  Icon: Target },
    { href: "/calendario",  label: "Agenda",       Icon: CalendarDays },
    { href: "/ferramentas", label: "Docs",         Icon: FolderClosed },
    { href: "/quadro",      label: "Quadro",       Icon: PenLine },
  ],
  pessoal: [
    { href: "/financas",   label: "Finanças",   Icon: Wallet },
    { href: "/estudos",    label: "Estudos",    Icon: BookOpen },
    { href: "/notas",      label: "Notas",      Icon: StickyNote },
    { href: "/ferramentas",label: "Docs",       Icon: FolderClosed },
    { href: "/cofre",      label: "Cofre",      Icon: KeyRound },
    { href: "/conquistas", label: "Conquistas", Icon: Trophy },
  ],
};

export function perfilOfPath(path: string): Perfil | null {
  const inProfissional = NAV_BY_PERFIL.profissional.some((l) => path === l.href || path.startsWith(l.href + "/"));
  const inPessoal = NAV_BY_PERFIL.pessoal.some((l) => path === l.href || path.startsWith(l.href + "/"));
  
  // Se a rota existir em ambos os perfis (ou for comum como /cofre), não força a troca
  if (inProfissional && inPessoal) return null;
  if (path.startsWith("/cofre")) return null;
  
  if (inProfissional) return "profissional";
  if (inPessoal) return "pessoal";
  
  return null;
}
