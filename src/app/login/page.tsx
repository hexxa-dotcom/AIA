"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hexagon, LogIn, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const init = useAuthStore((s) => s.init);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    const res = await signInWithPassword(email.trim(), password);
    if (!res.ok) {
      setError(res.error ?? "Erro ao fazer login");
    }
  }

  const isRemoteEnabled = isSupabaseEnabled() || isAppwriteEnabled();

  if (!isRemoteEnabled) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-warning" />
          <h1 className="text-xl font-bold mb-2">Banco de dados não configurado</h1>
          <p className="text-sm text-muted">
            Configure <code>NEXT_PUBLIC_PERSISTENCE=appwrite</code> ou <code>supabase</code> em <code>.env.local</code> junto com suas respectivas credenciais para prosseguir.
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
            <p className="text-xs text-muted">Faça login com seu e-mail e senha</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
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

          <div>
            <label className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading || !email || !password}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
            Entrar
          </Button>
          <p className="text-[10px] text-muted text-center">
            Insira o e-mail e a senha criados para você no console do Appwrite.
          </p>
        </form>
      </div>
    </div>
  );
}
