"use client";
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useVaultStore, type VaultEntry } from "@/store/useVaultStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VaultEditor } from "./VaultEditor";
import { cn } from "@/lib/utils";

const CATEGORY_COLOR: Record<string, string> = {
  pessoal: "#8c8c88",
  trabalho: "#4a4a48",
  banco: "#1a1a1a",
  social: "#6e6e6a",
  dev: "#1a1a1a",
  outros: "#5b5a55",
};

export function VaultList() {
  const entries = useVaultStore((s) => s.entries);
  const lock = useVaultStore((s) => s.lock);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<VaultEntry | null>(null);

  const filtered = useMemo(() => {
    let list = entries;
    if (filter) list = list.filter((e) => e.category === filter);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(t) ||
          e.username?.toLowerCase().includes(t) ||
          e.url?.toLowerCase().includes(t),
      );
    }
    return list;
  }, [entries, filter, q]);

  const categories = useMemo(() => {
    const set = new Set(entries.map((e) => e.category ?? "outros"));
    return Array.from(set);
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar credencial..."
            className="pl-9"
          />
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setEditorOpen(true); }}>
          <Plus size={14} />
          Nova credencial
        </Button>
        <Button variant="light" onClick={lock}>
          <Lock size={14} />
          Bloquear
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full",
              !filter ? "bg-ink text-lime" : "bg-surface-2 hover:bg-black/10",
            )}
          >
            todas ({entries.length})
          </button>
          {categories.map((c) => {
            const count = entries.filter((e) => (e.category ?? "outros") === c).length;
            return (
              <button
                key={c}
                onClick={() => setFilter(c === filter ? null : c)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full transition",
                  filter === c ? "text-white" : "bg-surface-2 hover:bg-black/10",
                )}
                style={filter === c ? { background: CATEGORY_COLOR[c] ?? "#1a1a1a" } : undefined}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-10 text-center text-muted text-sm">
          {entries.length === 0 ? (
            <>
              <KeyRound size={32} className="mx-auto mb-2 opacity-40" />
              Nenhuma credencial salva.
              <br />
              Clique em <strong>Nova credencial</strong> para começar.
            </>
          ) : (
            "Nenhum resultado para essa busca"
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((e) => (
            <VaultCard
              key={e.id}
              entry={e}
              onEdit={() => {
                setEditing(e);
                setEditorOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <VaultEditor open={editorOpen} onClose={() => setEditorOpen(false)} editing={editing} />
    </div>
  );
}

function VaultCard({ entry, onEdit }: { entry: VaultEntry; onEdit: () => void }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<"user" | "pw" | null>(null);

  function copy(text: string, what: "user" | "pw") {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  }

  const color = CATEGORY_COLOR[entry.category ?? "outros"] ?? "#1a1a1a";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="glass rounded-2xl p-4 cursor-pointer hover:shadow-lg transition"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{entry.title}</h3>
            {entry.url && (
              <a
                href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted hover:text-ink"
              >
                <ExternalLink size={11} />
              </a>
            )}
          </div>
          {entry.category && (
            <span
              className="inline-block text-[9px] px-2 py-0.5 rounded-full mt-1 font-semibold uppercase tracking-wider"
              style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}
            >
              {entry.category}
            </span>
          )}
        </div>
      </div>

      {entry.username && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            copy(entry.username!, "user");
          }}
          className="flex items-center justify-between text-xs bg-surface-2 px-2 py-1.5 rounded-lg mb-1.5 hover:bg-black/5"
        >
          <span className="text-muted text-[10px] uppercase mr-2">login</span>
          <span className="font-mono truncate flex-1">{entry.username}</span>
          {copied === "user" ? <Check size={11} className="text-success" /> : <Copy size={11} />}
        </div>
      )}

      {entry.password && (
        <div className="flex items-center justify-between text-xs bg-surface-2 px-2 py-1.5 rounded-lg gap-2">
          <span className="text-muted text-[10px] uppercase">senha</span>
          <span className="font-mono truncate flex-1">
            {show ? entry.password : "•".repeat(Math.min(entry.password.length, 12))}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShow((v) => !v);
            }}
            className="p-0.5 hover:bg-black/5 rounded"
          >
            {show ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copy(entry.password!, "pw");
            }}
            className="p-0.5 hover:bg-black/5 rounded"
          >
            {copied === "pw" ? <Check size={11} className="text-success" /> : <Copy size={11} />}
          </button>
        </div>
      )}
    </motion.div>
  );
}
