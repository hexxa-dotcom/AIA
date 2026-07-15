import {
  LayoutGrid, CalendarDays, Clock, Trophy,
  Target, Wallet, FolderClosed, StickyNote, PenLine, BookOpen, Layers, ShoppingBag
} from "lucide-react";
import type { Perfil } from "@/store/usePerfilStore";

export type NavItem = { href: string; label: string; Icon: React.ElementType };

/** Itens de navegação por perfil — Feed e Ajustes são comuns e ficam fora. */
export const NAV_BY_PERFIL: Record<Perfil, NavItem[]> = {
  profissional: [
    { href: "/foco",        label: "Em execução",  Icon: Target },
    { href: "/projetos",    label: "Tarefas",      Icon: LayoutGrid },
    { href: "/calendario",  label: "Agenda",       Icon: CalendarDays },
    { href: "/ferramentas", label: "Docs",         Icon: FolderClosed },
    { href: "/quadro",      label: "Quadro",       Icon: PenLine },
    { href: "/space",       label: "My Space",     Icon: Layers },
  ],
  pessoal: [
    { href: "/rotina",     label: "Rotina",     Icon: Clock },
    { href: "/financas",   label: "Finanças",   Icon: Wallet },
    { href: "/estudos",    label: "Estudos",    Icon: BookOpen },
    { href: "/compras",    label: "Wish List",  Icon: ShoppingBag },
    { href: "/ferramentas",label: "Docs",       Icon: FolderClosed },
    { href: "/space",      label: "My Space",   Icon: Layers },
  ],
};

export function perfilOfPath(path: string): Perfil | null {
  const inProfissional = NAV_BY_PERFIL.profissional.some((l) => path === l.href || path.startsWith(l.href + "/"));
  const inPessoal = NAV_BY_PERFIL.pessoal.some((l) => path === l.href || path.startsWith(l.href + "/"));
  
  if (inProfissional && inPessoal) return null;
  
  if (inProfissional) return "profissional";
  if (inPessoal) return "pessoal";
  
  return null;
}
