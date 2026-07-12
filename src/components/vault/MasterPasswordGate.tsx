"use client";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useVaultStore } from "@/store/useVaultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function MasterPasswordGate() {
  const status = useVaultStore((s) => s.status);
  const setupMaster = useVaultStore((s) => s.setupMaster);
  const unlock = useVaultStore((s) => s.unlock);
  const loading = useVaultStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "local";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) {
      setError("As senhas não conferem");
      return;
    }
    const r = await setupMaster(userId, pw);
    if (!r.ok) setError(r.error ?? "Erro");
  }

  async function submitUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await unlock(userId, pw);
    if (!r.ok) setError(r.error ?? "Senha incorreta");
  }

  if (status === "no-master") {
    return (
      <div className="glass rounded-3xl p-6 max-w-md mx-auto mt-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-warning/15 grid place-items-center">
            <ShieldAlert size={20} className="text-warning" />
          </div>
          <div>
            <h2 className="font-bold">Crie sua senha mestra</h2>
            <p className="text-xs text-muted">
              Usada para cifrar tudo. Não tem como recuperar.
            </p>
          </div>
        </div>
        <form onSubmit={submitSetup} className="space-y-3">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="Senha mestra (mín. 8 caracteres)"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirmar senha"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
          />
          {error && (
            <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">
              {error}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <KeyRound size={14} />
            )}
            Criar cofre
          </Button>
          <p className="text-[10px] text-muted text-center">
            Zero-knowledge: nem eu nem o servidor conseguem ver suas senhas.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 max-w-md mx-auto mt-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-ink grid place-items-center">
          <Lock size={20} className="text-lime" />
        </div>
        <div>
          <h2 className="font-bold">Cofre bloqueado</h2>
          <p className="text-xs text-muted">
            Digite sua senha mestra para abrir
          </p>
        </div>
      </div>
      <form onSubmit={submitUnlock} className="space-y-3">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            placeholder="Senha mestra"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 rounded"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {error && (
          <div className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-xl">
            {error}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <KeyRound size={14} />
          )}
          Desbloquear
        </Button>
      </form>
    </div>
  );
}
