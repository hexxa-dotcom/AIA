"use client";
import { useState } from "react";
import { Mail, Send, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useTeamStore } from "@/store/useTeamStore";
import { inviteByEmail } from "@/lib/team/adapter";

export function InviteForm() {
  const user = useAuthStore((s) => s.user);
  const load = useTeamStore((s) => s.load);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    const r = await inviteByEmail({ email, name, invitedBy: user.id });
    setBusy(false);
    if (r.ok) {
      setSent(email);
      setEmail("");
      setName("");
      load();
      setTimeout(() => setSent(null), 4000);
    } else {
      setError(r.error ?? "Erro ao convidar");
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-4 space-y-2">
      <div className="text-xs uppercase tracking-wider font-semibold text-muted mb-1">Convidar pessoa</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          required
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (opcional)"
        />
        <Button type="submit" variant="primary" disabled={busy || !email}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Convidar
        </Button>
      </div>
      {sent && (
        <div className="text-xs text-success bg-success/10 px-3 py-2 rounded-xl flex items-center gap-2">
          <Check size={14} />
          Magic link enviado pra <strong>{sent}</strong>. A pessoa entra com 1 clique.
        </div>
      )}
      {error && (
        <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">{error}</div>
      )}
    </form>
  );
}
