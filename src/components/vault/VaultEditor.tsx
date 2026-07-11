"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Wand2, Copy, Check, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useVaultStore, type VaultEntry } from "@/store/useVaultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { generatePassword } from "@/lib/vault/crypto";

const CATEGORIES = ["pessoal", "trabalho", "banco", "social", "dev", "outros"];

export function VaultEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: VaultEntry | null;
}) {
  const user = useAuthStore((s) => s.user);
  const upsert = useVaultStore((s) => s.upsertEntry);
  const remove = useVaultStore((s) => s.deleteEntry);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("pessoal");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setCategory(editing.category ?? "pessoal");
      setUsername(editing.username ?? "");
      setPassword(editing.password ?? "");
      setUrl(editing.url ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setTitle("");
      setCategory("pessoal");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
    }
    setShow(false);
    setError(null);
  }, [open, editing]);

  async function save() {
    if (!title.trim() || !user) return;
    setBusy(true);
    setError(null);
    const r = await upsert(user.id, {
      id: editing?.id,
      title: title.trim(),
      category,
      username: username.trim(),
      password,
      url: url.trim(),
      notes,
    });
    setBusy(false);
    if (r.ok) onClose();
    else setError(r.error ?? "erro ao salvar");
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirm(`Remover "${editing.title}" do cofre?`)) return;
    await remove(editing.id);
    onClose();
  }

  function copyPw() {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="md">
        <div className="p-6 overflow-y-auto">
          <DialogTitle>{editing ? "Editar credencial" : "Nova credencial"}</DialogTitle>

          <div className="space-y-3 mt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Título
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: GitHub, Banco do Brasil..."
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Categoria
              </label>
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-xs px-3 py-1.5 rounded-full transition ${
                      category === c
                        ? "bg-ink text-lime"
                        : "bg-surface-2 hover:bg-black/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Login / Usuário
              </label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="email@exemplo.com" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Senha
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="senha"
                    className="pr-16 font-mono"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="p-1 hover:bg-black/5 rounded"
                    >
                      {show ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={copyPw}
                      className="p-1 hover:bg-black/5 rounded"
                      title="Copiar"
                    >
                      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword({ length: 20 }))}
                  className="px-3 rounded-xl bg-lime text-ink hover:bg-lime-soft flex items-center gap-1 text-xs font-semibold"
                  title="Gerar senha forte"
                >
                  <Wand2 size={13} />
                  Gerar
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Notas
              </label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">{error}</div>
            )}

            <div className="flex gap-2 pt-2">
              {editing && (
                <button
                  onClick={handleDelete}
                  className="px-3 rounded-full text-xs text-danger hover:bg-danger/10 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
              )}
              <div className="flex-1" />
              <DialogClose asChild>
                <Button variant="light">Cancelar</Button>
              </DialogClose>
              <Button variant="primary" onClick={save} disabled={busy || !title.trim()}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
