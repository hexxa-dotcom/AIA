"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bird, Loader2, AlertCircle, Send, KeyRound, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resolveUsernameToEmail } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const init = useAuthStore((s) => s.init);
  const sendOtpToken = useAuthStore((s) => s.sendOtpToken);
  const verifyOtpToken = useAuthStore((s) => s.verifyOtpToken);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    init();
  }, [init]);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    let emailClean = email.trim();
    if (!emailClean) {
      setError("Por favor, digite um e-mail ou username válido.");
      return;
    }

    if (emailClean.startsWith("@")) {
      const resolved = await resolveUsernameToEmail(emailClean);
      if (!resolved.ok || !resolved.email) {
        setError(resolved.error ?? "Username não encontrado.");
        return;
      }
      emailClean = resolved.email;
    }

    const res = await sendOtpToken(emailClean);
    if (res.ok && res.userId) {
      setCurrentUserId(res.userId);
      setStep("code");
      setSuccessMsg(`Enviamos o código de 6 dígitos para ${emailClean}`);
    } else {
      setError(res.error ?? "Erro ao enviar o código de acesso. Verifique se o e-mail está cadastrado.");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const codeClean = code.trim();
    if (!codeClean || !currentUserId) {
      setError("Por favor, digite o código de acesso recebido.");
      return;
    }

    const res = await verifyOtpToken(currentUserId, codeClean);
    if (!res.ok) {
      setError(res.error ?? "Código inválido ou expirado.");
    }
  }

  // Evita Hydration Mismatch entre SSR (Server-Side) e CSR (Client-Side)
  if (!mounted) {
    return (
      <div className="min-h-screen grid place-items-center p-4 bg-surface-1">
        <div className="w-12 h-12 rounded-xl bg-ink grid place-items-center animate-pulse">
          <Bird size={26} className="text-lime" />
        </div>
      </div>
    );
  }

  const isRemoteEnabled = isSupabaseEnabled() || isAppwriteEnabled();

  if (!isRemoteEnabled) {
    return (
      <div className="min-h-screen grid place-items-center p-4 bg-surface-1">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center border border-flat shadow-sm">
          <AlertCircle size={32} className="mx-auto mb-3 text-warning" />
          <h1 className="text-xl font-bold mb-2 text-ink">Banco de dados não configurado</h1>
          <p className="text-sm text-muted">
            Configure <code>NEXT_PUBLIC_PERSISTENCE=appwrite</code> em <code>.env.local</code> junto com suas credenciais para prosseguir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-surface-1">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-flat shadow-md animate-fadeIn">
        
        {/* Header da marca */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink grid place-items-center shadow-sm">
            <Bird size={26} className="text-lime" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-ink">AIA</h1>
            <p className="text-xs text-muted">Acesso inteligente por código único</p>
          </div>
        </div>

        {step === "email" ? (
          /* Passo 1: Digitar E-mail */
          <form onSubmit={handleSendEmail} className="space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted block mb-1">
                Seu E-mail ou @Username
              </label>
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com ou @seu_usuario"
                required
                autoFocus
                className="w-full text-sm py-2 px-3 bg-surface-2 border border-flat rounded-xl outline-none focus:ring-2 focus:ring-ink/10"
              />
              <p className="text-[9px] text-muted leading-relaxed">
                Você receberá um token temporário de 6 dígitos na sua caixa de entrada para fazer login.
              </p>
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger/10 px-3.5 py-2.5 rounded-xl font-bold">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full font-bold text-xs py-2 bg-ink text-surface hover:opacity-95 rounded-xl flex items-center justify-center gap-2" 
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Enviando Código...
                </>
              ) : (
                <>
                  <Send size={13} /> Enviar Código de Acesso
                </>
              )}
            </Button>
            
            <p className="text-[9px] text-muted text-center leading-relaxed">
              Disponível apenas para contas convidadas criadas pelo Administrador no console ou perfil.
            </p>
          </form>
        ) : (
          /* Passo 2: Digitar Código OTP */
          <form onSubmit={handleVerifyCode} className="space-y-4 animate-fadeIn">
            {successMsg && (
              <div className="text-[10px] text-success bg-success/10 px-3.5 py-2.5 rounded-xl font-semibold leading-relaxed">
                {successMsg}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-muted block mb-1">
                  Código de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] text-ink font-bold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={11} /> Alterar e-mail
                </button>
              </div>

              <Input
                type="text"
                pattern="[0-9a-zA-Z]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite os 6 dígitos"
                required
                autoFocus
                className="w-full text-center text-lg font-mono tracking-widest py-2 px-3 bg-surface-2 border border-flat rounded-xl outline-none focus:ring-2 focus:ring-ink/10 text-ink"
              />
              
              <p className="text-[9px] text-muted leading-relaxed">
                O código expira em 15 minutos. Verifique sua pasta de spam se não encontrar o e-mail.
              </p>
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger/10 px-3.5 py-2.5 rounded-xl font-bold">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full font-bold text-xs py-2 bg-ink text-surface hover:opacity-95 rounded-xl flex items-center justify-center gap-2" 
                disabled={loading || code.length < 6}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <KeyRound size={13} /> Verificar e Entrar
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={loading}
                className="text-[10px] text-muted font-bold hover:text-ink transition hover:underline"
              >
                Não recebeu? Reenviar código para {email}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
