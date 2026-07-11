"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  CheckSquare,
  StickyNote,
  Sparkles,
  LayoutGrid,
  Clock,
  CalendarDays,
  Wallet,
  BarChart2,
  Trophy,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { useCommandStore } from "@/store/useCommandStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useNotesStore } from "@/store/useNotesStore";

const PAGES = [
  { label: "Feed",       href: "/feed",       icon: Sparkles    },
  { label: "Kanban",     href: "/projetos",      icon: LayoutGrid  },
  { label: "Rotina",     href: "/rotina",      icon: Clock       },
  { label: "Agenda",     href: "/calendario",  icon: CalendarDays },
  { label: "Finanças",   href: "/financas",    icon: Wallet      },
  { label: "Notas",      href: "/notas",       icon: StickyNote  },
  { label: "Relatórios", href: "/relatorios",  icon: BarChart2   },
  { label: "Conquistas", href: "/conquistas",  icon: Trophy      },
  { label: "Ajustes",    href: "/ajustes",     icon: Settings    },
  { label: "Perfil",     href: "/perfil",      icon: User        },
];

interface ResultItem {
  id: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  action: () => void;
}

interface Group {
  name: string;
  items: ResultItem[];
}

function GroupLabel({ name }: { name: string }) {
  return (
    <p
      className="text-[9px] font-bold uppercase tracking-[0.12em] px-4 pt-3 pb-1"
      style={{ color: "rgba(255,255,255,0.25)" }}
    >
      {name}
    </p>
  );
}

function ResultRow({ item }: { item: ResultItem }) {
  return (
    <button
      onClick={item.action}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/[0.07] transition text-left"
    >
      <div
        className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <item.icon size={13} style={{ color: "rgba(255,255,255,0.60)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
          {item.label}
        </p>
        <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
          {item.subtitle}
        </p>
      </div>
    </button>
  );
}

export function CommandPalette() {
  const open = useCommandStore((s) => s.open);
  const setOpen = useCommandStore((s) => s.setOpen);
  const tasks = useTaskStore((s) => s.tasks);
  const notes = useNotesStore((s) => s.notes);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened, reset query when closed
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  function close() {
    setOpen(false);
  }

  const groups: Group[] = [];

  if (!query.trim()) {
    // Show pages and recent tasks
    groups.push({
      name: "Páginas",
      items: PAGES.map((p) => ({
        id: `page-${p.href}`,
        label: p.label,
        subtitle: "Página",
        icon: p.icon,
        action: () => { router.push(p.href); close(); },
      })),
    });

    const recentTasks = [...tasks]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    if (recentTasks.length > 0) {
      groups.push({
        name: "Tarefas recentes",
        items: recentTasks.map((t) => ({
          id: `task-${t.id}`,
          label: t.title,
          subtitle: "Tarefa",
          icon: CheckSquare,
          action: () => { router.push("/projetos"); close(); },
        })),
      });
    }
  } else {
    const q = query.toLowerCase();

    const matchedTasks = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      )
      .slice(0, 5);

    if (matchedTasks.length > 0) {
      groups.push({
        name: "Tarefas",
        items: matchedTasks.map((t) => ({
          id: `task-${t.id}`,
          label: t.title,
          subtitle: "Tarefa",
          icon: CheckSquare,
          action: () => { router.push("/projetos"); close(); },
        })),
      });
    }

    const matchedNotes = notes
      .filter((n) => n.text.toLowerCase().includes(q))
      .slice(0, 5);

    if (matchedNotes.length > 0) {
      groups.push({
        name: "Notas",
        items: matchedNotes.map((n) => ({
          id: `note-${n.id}`,
          label: n.text.slice(0, 60) + (n.text.length > 60 ? "…" : ""),
          subtitle: "Nota",
          icon: StickyNote,
          action: () => { router.push("/notas"); close(); },
        })),
      });
    }

    const matchedPages = PAGES.filter((p) =>
      p.label.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matchedPages.length > 0) {
      groups.push({
        name: "Páginas",
        items: matchedPages.map((p) => ({
          id: `page-${p.href}`,
          label: p.label,
          subtitle: "Página",
          icon: p.icon,
          action: () => { router.push(p.href); close(); },
        })),
      });
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      style={{
        background: "rgba(14,11,12,0.50)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="glass-dark w-full max-w-[620px] rounded-3xl overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          <Search size={16} style={{ color: "rgba(255,255,255,0.40)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefas, notas, páginas…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[10px] px-2 py-0.5 rounded-md"
              style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
            >
              limpar
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto px-2 py-1">
          {groups.length === 0 && (
            <p
              className="text-sm px-4 py-6 text-center"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              Nenhum resultado para &quot;{query}&quot;
            </p>
          )}
          {groups.map((g) => (
            <div key={g.name}>
              <GroupLabel name={g.name} />
              {g.items.map((item) => (
                <ResultRow key={item.id} item={item} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2.5 flex items-center gap-3 text-[10px]"
          style={{
            borderTop: "0.5px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          <span>⌘K abrir</span>
          <span>↵ confirmar</span>
          <span>Esc fechar</span>
        </div>
      </motion.div>
    </div>
  );
}
