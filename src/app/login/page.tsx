"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, Mail, Loader2, Check, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const init = useAuthStore((s) => s.init);
  const signIn = useAuthStore((s) => s.signInWithEmail);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn(email.trim());
    if (res.ok) setSent(true);
    else setError(res.error ?? "Erro ao enviar link");
  }

  if (!isSupabaseEnabled()) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-warning" />
          <h1 className="text-xl font-bold mb-2">Supabase não configurado</h1>
          <p className="text-sm text-muted">
            Configure <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
            <code>NEXT_PUBLIC_PERSISTENCE=supabase</code> em <code>.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink grid place-items-center">
            <Hexagon size={26} className="text-lime" />
          </div>
          <div>
            <h1 className="font-bold">AIA OS</h1>
            <p className="text-xs text-muted">Faça login para sincronizar na nuvem</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-success/15 grid place-items-center mx-auto mb-3">
              <Check size={20} className="text-success" />
            </div>
            <h2 className="font-bold mb-1">Confira seu email</h2>
            <p className="text-sm text-muted">
              Mandamos um link mágico para <strong>{email}</strong>. Clique nele para entrar.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-muted mt-4 hover:underline"
            >
              Mandar de novo
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">
                {error}
              </div>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={loading || !email}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Enviar link mágico
            </Button>
            <p className="text-[10px] text-muted text-center">
              Sem senha. Você recebe um link no email e entra com um clique.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
