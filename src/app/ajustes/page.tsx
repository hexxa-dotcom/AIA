"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import {
  Cloud, Mail, CalendarDays, Users, Trash2,
  Plug, Copy, Check, Plus, X, RefreshCw,
  Database, Download, Settings2, ChevronLeft,
  Wifi, ExternalLink, User, LogOut,
  Zap, Star, Flame, CheckSquare, Trophy, Pencil,
  Shield, KeyRound, Eye, EyeOff, Palette, Sun, Moon, Contrast, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAiStore } from "@/store/useAiStore";
import { OPENROUTER_MODELS } from "@/lib/ai/models";
import { useThemeStore } from "@/store/useThemeStore";
import { useSoundStore } from "@/store/useSoundStore";
import { sounds } from "@/lib/sounds";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useMcpServersStore } from "@/store/useMcpServersStore";
import { useMcpTools } from "@/hooks/useMcpTools";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore, type PerfilData } from "@/store/useProfileStore";
import { useVaultStore } from "@/store/useVaultStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled } from "@/lib/appwrite";

// ── helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-ink/10 transition text-muted hover:text-ink shrink-0">
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

function Row({
  label, description, children, border = true,
}: {
  label: string; description?: string; children?: React.ReactNode; border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-4 gap-4 ${border ? "border-b border-ink/6" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-ink" : "bg-ink/20"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function StatusBadge({ label, color }: { label: string; color: "success" | "warning" | "muted" }) {
  const cls = {
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    muted:   "bg-ink/8 text-muted",
  }[color];
  return (
    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${cls}`}>
      {label}
    </span>
  );
}

// ── profile panel ─────────────────────────────────────────────────────────────

function ProfileEditor() {
  const data = useProfileStore((s) => s.profile);
  const setProfileData = useProfileStore((s) => s.setProfileData);

  function handleChange(field: keyof PerfilData, value: string) {
    setProfileData({ [field]: value });
  }

  return (
    <div className="glass rounded-3xl p-6 mt-4 border border-ink/5" style={{ borderColor: "var(--flat-border)" }}>
      <h2 className="text-sm font-bold text-ink mb-4 pb-3 border-b border-ink/5">
        Configurações do Perfil
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Nome Completo / Apelido</label>
          <input 
            value={data.name || ""} 
            onChange={(e) => handleChange("name", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Como você prefere ser chamado?" 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Profissão / Papel Principal</label>
          <input 
            value={data.role || ""} 
            onChange={(e) => handleChange("role", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Ex: Engenheiro de Software" 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Empresa / Projeto Atual</label>
          <input 
            value={data.company || ""} 
            onChange={(e) => handleChange("company", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Ex: Minha Startup" 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Biografia Curta</label>
          <textarea 
            value={data.bio || ""} 
            onChange={(e) => handleChange("bio", e.target.value)} 
            rows={3} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 resize-none transition-colors" 
            placeholder="Descreva quem você é em poucas palavras..." 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Objetivos</label>
          <input 
            value={data.goals || ""} 
            onChange={(e) => handleChange("goals", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Ex: Lançar um app, Ser mais saudável..." 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Habilidades</label>
          <input 
            value={data.skills || ""} 
            onChange={(e) => handleChange("skills", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Ex: React, Design, Finanças..." 
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Interesses</label>
          <input 
            value={data.interests || ""} 
            onChange={(e) => handleChange("interests", e.target.value)} 
            className="w-full bg-surface-2 p-3 rounded-xl border border-ink/10 text-sm focus:outline-none focus:border-ink/30 transition-colors" 
            placeholder="Ex: Literatura, Jogos, Esportes..." 
          />
        </div>
      </div>
    </div>
  );
}

function ProfilePanel() {
  const user           = useAuthStore((s) => s.user);
  const xp             = useGameStore((s) => s.xp);
  const level          = useGameStore((s) => s.level);
  const streakDays     = useGameStore((s) => s.streakDays);
  const achievements   = useGameStore((s) => s.achievements);
  const tasks          = useTaskStore((s) => s.tasks);
  const profile        = useProfileStore((s) => s.profile);

  const email = user?.email ?? "";
  const displayTitle = profile.name || email.split("@")[0] || "Usuário";

  const completedCount = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  const recentAchievements = useMemo(() =>
    achievements
      .filter((a) => a.unlockedAt)
      .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
      .slice(0, 3),
    [achievements]
  );

  const stats = [
    { label: "XP Total",          value: xp,            Icon: Zap },
    { label: "Nível",             value: level,          Icon: Star },
    { label: "Streak",            value: `${streakDays}d`, Icon: Flame },
    { label: "Tarefas concluídas", value: completedCount, Icon: CheckSquare },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {/* Avatar + nome + email */}
      <div className="glass rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full grid place-items-center text-3xl font-bold shrink-0 bg-lime">
          {displayTitle[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-xl font-bold text-ink">{displayTitle}</span>
          <p className="text-sm text-muted">{email}</p>
        </div>

        <Button variant="danger" size="sm" onClick={() => useAuthStore.getState().signOut()}>
          <LogOut size={13} /> Sair da conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <Icon size={18} className="mx-auto mb-1.5 text-muted" />
            <p className="text-2xl font-bold text-ink">{value}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Conquistas recentes */}
      <div className="glass rounded-3xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-muted" />
          <p className="font-bold text-sm text-ink">Conquistas recentes</p>
        </div>
        {recentAchievements.length === 0 ? (
          <p className="text-xs text-muted">Nenhuma conquista desbloqueada ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.40)" }}>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{a.title}</p>
                  <p className="text-[10px] text-muted truncate">{a.description}</p>
                </div>
                {a.unlockedAt && (
                  <span className="text-[10px] text-muted shrink-0">
                    {new Date(a.unlockedAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileEditor />
    </div>
  );
}

// ── category panels ───────────────────────────────────────────────────────────

const PRESET_SERVERS = [
  { name: "Google Drive",    url: "http://localhost:3010/mcp", hint: "npx @modelcontextprotocol/server-gdrive" },
  { name: "Google Calendar", url: "http://localhost:3011/mcp", hint: "npx @modelcontextprotocol/server-gcal" },
  { name: "Filesystem",      url: "http://localhost:3012/mcp", hint: "npx @modelcontextprotocol/server-filesystem" },
  { name: "GitHub",          url: "http://localhost:3013/mcp", hint: "npx @modelcontextprotocol/server-github" },
];

function PreferencesPanel() {
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundStore();
  return (
    <div className="bg-white rounded-3xl px-5 py-2">
      <Row label="Sons do sistema" description="Feedback sonoro ao concluir tarefas, timer, lembretes e conquistas">
        <Toggle on={soundEnabled} onToggle={toggleSound} />
      </Row>
      <Row label="Prévia dos sons" description="Clique para testar cada som" border={false} />
      <div className="flex flex-wrap gap-2 pb-4 mt-1">
        {[
          { label: "Tarefa concluída", fn: () => sounds.taskComplete()  },
          { label: "Iniciar timer",    fn: () => sounds.taskStart()     },
          { label: "Mensagem",         fn: () => sounds.message()       },
          { label: "Lembrete",         fn: () => sounds.reminder()      },
          { label: "Conquista",        fn: () => sounds.achievement()   },
          { label: "Rotina inicia",    fn: () => sounds.routineStart()  },
          { label: "Rotina finaliza",  fn: () => sounds.routineEnd()    },
          { label: "Aviso de pausa",   fn: () => sounds.breakAlert()    },
        ].map(({ label, fn }) => (
          <button key={label} onClick={fn} disabled={!soundEnabled}
            className="px-3 py-1.5 rounded-xl bg-ink/6 text-xs hover:bg-ink/12 disabled:opacity-40 transition">
            ▶ {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AppearancePanel() {
  const { theme, setTheme } = useThemeStore();
  
  return (
    <div className="bg-white rounded-3xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
          <Palette size={16} className="text-muted" />
        </div>
        <div>
          <p className="font-semibold text-sm">Tema do Sistema</p>
          <p className="text-xs text-muted mt-0.5">Escolha como a interface é exibida</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <button onClick={() => setTheme("light")} className={`p-4 rounded-2xl border text-left transition ${theme === "light" ? "border-ink shadow-sm bg-surface-2" : "border-ink/10 hover:border-ink/30 bg-white"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Claro</span>
            <Sun size={16} className="text-muted" />
          </div>
          <p className="text-[10px] text-muted">Fundo branco com tom creme e cores vivas.</p>
        </button>

        <button onClick={() => setTheme("dark")} className={`p-4 rounded-2xl border text-left transition ${theme === "dark" ? "border-ink shadow-sm bg-surface-2" : "border-ink/10 hover:border-ink/30 bg-white"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Escuro</span>
            <Moon size={16} className="text-muted" />
          </div>
          <p className="text-[10px] text-muted">Inverte: fundo escuro, alto contraste.</p>
        </button>

        <button onClick={() => setTheme("foco")} className={`p-4 rounded-2xl border text-left transition ${theme === "foco" ? "border-ink shadow-sm bg-surface-2" : "border-ink/10 hover:border-ink/30 bg-white"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Foco</span>
            <Contrast size={16} className="text-muted" />
          </div>
          <p className="text-[10px] text-muted">Sem cores — apenas tons de preto e branco.</p>
        </button>
      </div>
    </div>
  );
}

function ResendKeyField() {
  const [key, setKey] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("aia-resend-key") ?? "" : "",
  );
  const [saved, setSaved] = useState(false);

  function saveKey() {
    localStorage.setItem("aia-resend-key", key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Resend API Key</p>
      <p className="text-xs text-muted">Para envio de emails de lembrete. Obtenha em resend.com</p>
      <div className="flex gap-2">
        <input
          type="password"
          placeholder="re_..."
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ink/15"
        />
        <button
          onClick={saveKey}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-ink text-lime hover:opacity-90 transition flex items-center gap-1.5"
        >
          {saved ? <Check size={12} /> : null}
          {saved ? "Salvo" : "Salvar"}
        </button>
      </div>
      <p className="text-[10px] text-muted">
        A chave fica salva localmente. Configure <code className="bg-surface-2 px-1 rounded">RESEND_API_KEY</code> no servidor para envios em produção.
      </p>
    </div>
  );
}

function IntegrationsPanel() {
  const supabaseActive = isSupabaseEnabled();
  const appwriteActive = isAppwriteEnabled();

  return (
    <div className="space-y-3">
      {/* Appwrite */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Cloud size={16} className="text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Appwrite</p>
              {appwriteActive ? (
                <StatusBadge label="ativo" color="success" />
              ) : (
                <StatusBadge label="desativado" color="muted" />
              )}
            </div>
            <p className="text-xs text-muted">Salve dados na nuvem e sincronize via NoSQL</p>
          </div>
        </div>
        <ol className="text-xs text-muted space-y-1.5 ml-4 list-decimal leading-relaxed">
          <li>Crie um projeto em <strong className="text-ink">cloud.appwrite.io</strong></li>
          <li>Gere uma API Key com escopos de escrita em databases, coleções e atributos</li>
          <li>Configure as chaves em seu <code className="bg-surface-2 px-1 rounded">.env.local</code> e defina <code className="bg-surface-2 px-1 rounded">NEXT_PUBLIC_PERSISTENCE=appwrite</code></li>
          <li>Rode o script de setup automático: <code className="bg-surface-2 px-1 rounded">node scripts/setup-appwrite.js</code></li>
          <li>Reinicie o servidor de desenvolvimento</li>
        </ol>
      </div>

      {/* Supabase */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Cloud size={16} className="text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Supabase</p>
              {supabaseActive ? (
                <StatusBadge label="ativo" color="success" />
              ) : (
                <StatusBadge label="desativado" color="muted" />
              )}
            </div>
            <p className="text-xs text-muted">Salve dados na nuvem e sincronize via PostgreSQL</p>
          </div>
        </div>
        <ol className="text-xs text-muted space-y-1.5 ml-4 list-decimal leading-relaxed">
          <li>Crie conta gratuita em <strong className="text-ink">supabase.com</strong></li>
          <li>Crie um novo projeto</li>
          <li>No SQL Editor, cole o conteúdo de <code className="bg-surface-2 px-1 rounded">supabase/schema.sql</code></li>
          <li>Copie URL + anon key em Settings → API</li>
          <li>Adicione em <code className="bg-surface-2 px-1 rounded">.env.local</code> e mude <code className="bg-surface-2 px-1 rounded">NEXT_PUBLIC_PERSISTENCE=supabase</code></li>
          <li>Reinicie o servidor</li>
        </ol>
      </div>

      {/* Email / Resend */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Mail size={16} className="text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Email de lembretes</p>
              <StatusBadge label="Resend" color="warning" />
            </div>
            <p className="text-xs text-muted">Receba emails de lembrete quando tarefas vencem</p>
          </div>
        </div>
        <ResendKeyField />
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <CalendarDays size={16} className="text-muted" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Google Calendar</p>
              <StatusBadge label="via MCP" color="success" />
            </div>
            <p className="text-xs text-muted">Sincronize eventos com seu Google Calendar</p>
          </div>
        </div>
        <div className="space-y-3">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-ink text-lime hover:opacity-90 transition"
          >
            <ExternalLink size={12} /> Abrir Google Calendar
          </a>
          <p className="text-[10px] text-muted">
            Integração OAuth completa disponível em breve. Por ora, use o Google Calendar separadamente
            ou conecte via servidor MCP abaixo:
          </p>
          <div className="bg-surface-2 rounded-2xl p-3 text-xs space-y-2">
            <p className="text-muted">Rode o servidor e cole a URL na seção MCP:</p>
            <code className="block bg-ink text-lime rounded-xl px-3 py-2 font-mono text-[10px]">
              npx @modelcontextprotocol/server-gcal
            </code>
          </div>
        </div>
      </div>

      {/* Colaboração */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Users size={16} className="text-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Colaboração</p>
              <StatusBadge label="requer Supabase" color="warning" />
            </div>
            <p className="text-xs text-muted mt-0.5">Use o modal de tarefa para convidar colaboradores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function McpPanel() {
  const mcpUrl = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "http://localhost:3000/api/mcp";
  const claudeConfig = JSON.stringify({ mcpServers: { aia: { url: mcpUrl } } }, null, 2);
  const cursorConfig = JSON.stringify({ aia: { url: mcpUrl } }, null, 2);
  const { servers, add, remove, toggle, update } = useMcpServersStore();
  const { tools, loading, refresh } = useMcpTools();
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function addServer() {
    if (!newName.trim() || !newUrl.trim()) return;
    add({ name: newName.trim(), url: newUrl.trim(), enabled: true });
    setNewName(""); setNewUrl("");
  }

  return (
    <div className="space-y-3">
      {/* Servidores MCP externos */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Wifi size={16} className="text-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Servidores MCP externos</p>
              <StatusBadge label={tools.length > 0 ? `${tools.length} tools` : "nenhum"} color={tools.length > 0 ? "success" : "muted"} />
            </div>
            <p className="text-xs text-muted">Conecte Google Drive, GitHub, Filesystem e outros</p>
          </div>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3 text-xs text-muted mb-4 leading-relaxed">
          Rode um servidor MCP localmente e cole a URL aqui. O AIA OS descobre as ferramentas automaticamente.
        </div>

        {servers.length > 0 && (
          <div className="space-y-2 mb-4">
            {servers.map((s) => {
              const serverTools = tools.filter((t) => t.serverUrl === s.url);
              return (
                <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-2">
                  <button onClick={() => toggle(s.id)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${s.enabled ? "bg-ink" : "bg-ink/20"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${s.enabled ? "left-4" : "left-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })}
                      className="font-semibold text-xs bg-transparent outline-none w-full" />
                    <p className="text-[10px] text-muted font-mono truncate">{s.url}</p>
                    {s.enabled && serverTools.length > 0 && (
                      <p className="text-[10px] text-success mt-0.5">{serverTools.map((t) => t.name).join(", ")}</p>
                    )}
                    {s.enabled && serverTools.length === 0 && !loading && (
                      <p className="text-[10px] text-warning mt-0.5">sem resposta — servidor offline?</p>
                    )}
                  </div>
                  <button onClick={() => remove(s.id)} className="p-1 text-muted hover:text-danger transition shrink-0">
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            <button onClick={refresh} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              {loading ? "Conectando…" : "Reconectar todos"}
            </button>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Adicionar servidor</p>
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-xs outline-none focus:ring-2 focus:ring-ink/15" />
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="URL"
              className="flex-[2] px-3 py-2 rounded-xl bg-surface-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ink/15" />
            <button onClick={addServer} disabled={!newName.trim() || !newUrl.trim()}
              className="px-3 py-2 rounded-xl bg-ink text-lime text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition">
              <Plus size={13} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-2">Início rápido</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_SERVERS.map((p) => (
              <button key={p.name} onClick={() => { setNewName(p.name); setNewUrl(p.url); }}
                className="text-left px-3 py-2.5 rounded-2xl bg-surface-2 hover:bg-ink/8 transition">
                <p className="text-xs font-semibold">{p.name}</p>
                <p className="text-[10px] text-muted font-mono mt-0.5 truncate">{p.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Porta MCP */}
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Plug size={16} className="text-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">Porta MCP do AIA OS</p>
              <StatusBadge label="ativo" color="success" />
            </div>
            <p className="text-xs text-muted">Exponha os dados para Claude Desktop, Cursor e outros</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Endpoint</p>
            <div className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
              <code className="text-xs flex-1 font-mono text-ink">{mcpUrl}</code>
              <CopyButton text={mcpUrl} />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-1.5">Ferramentas</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "get_tasks",          desc: "Lista tarefas" },
                { name: "get_expenses",        desc: "Lista despesas" },
                { name: "get_summary",         desc: "Resumo geral" },
                { name: "get_overdue_tasks",   desc: "Tarefas vencidas" },
                { name: "get_unpaid_expenses", desc: "Contas a pagar" },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                  <div>
                    <p className="text-[11px] font-mono font-semibold">{t.name}</p>
                    <p className="text-[10px] text-muted">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Claude Desktop</p>
              <CopyButton text={claudeConfig} />
            </div>
            <pre className="text-[10px] font-mono bg-ink text-lime rounded-xl p-3 overflow-x-auto leading-relaxed">{claudeConfig}</pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Cursor / Windsurf</p>
              <CopyButton text={cursorConfig} />
            </div>
            <pre className="text-[10px] font-mono bg-ink text-lime rounded-xl p-3 overflow-x-auto leading-relaxed">{cursorConfig}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPanel() {
  const [confirming, setConfirming] = useState(false);

  function resetAll() {
    localStorage.removeItem("aia-tasks-store");
    localStorage.removeItem("aia-game-store");
    localStorage.removeItem("aia-timer-store");
    localStorage.removeItem("aia-routine-store");
    window.location.reload();
  }

  function exportJson() {
    const data = {
      tasks: useTaskStore.getState(),
      game: useGameStore.getState(),
      routine: useRoutineStore.getState(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aia-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-3xl px-5 py-2">
      <div className="flex items-center justify-between py-4 border-b border-ink/6 gap-4">
        <div>
          <p className="text-sm font-medium">Exportar dados</p>
          <p className="text-xs text-muted mt-0.5">Baixe um JSON com tarefas, rotinas e progresso</p>
        </div>
        <Button variant="light" onClick={exportJson}>
          <Download size={13} /> Exportar JSON
        </Button>
      </div>
      <div className="flex items-center justify-between py-4 gap-4">
        <div>
          <p className="text-sm font-medium">Apagar tudo</p>
          <p className="text-xs text-muted mt-0.5">Remove todos os dados locais. Não pode ser desfeito.</p>
        </div>
        {!confirming ? (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <Trash2 size={13} /> Apagar
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted">Tem certeza?</span>
            <Button size="sm" variant="danger" onClick={resetAll}>Sim</Button>
            <Button size="sm" variant="light" onClick={() => setConfirming(false)}>Cancelar</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function VaultPanel() {
  const user          = useAuthStore((s) => s.user);
  const resetMaster   = useVaultStore((s) => s.resetMaster);
  const loading       = useVaultStore((s) => s.loading);

  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [status,   setStatus]   = useState<"idle" | "ok" | "error">("idle");
  const [msg,      setMsg]      = useState("");

  async function handleSubmit() {
    if (!user) { setMsg("Você precisa estar logado."); setStatus("error"); return; }
    if (!current.trim()) { setMsg("Informe a senha atual."); setStatus("error"); return; }
    if (next.length < 8)  { setMsg("Nova senha precisa ter ao menos 8 caracteres."); setStatus("error"); return; }
    if (next !== confirm)  { setMsg("As senhas não coincidem."); setStatus("error"); return; }

    const result = await resetMaster(user.id, current, next);
    if (result.ok) {
      setStatus("ok");
      setMsg("Senha redefinida com sucesso!");
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setStatus("error");
      setMsg(result.error ?? "Falhou ao redefinir.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <KeyRound size={16} className="text-muted" />
          </div>
          <div>
            <p className="font-semibold text-sm">Redefinir senha do cofre</p>
            <p className="text-xs text-muted mt-0.5">
              Todos os itens são re-criptografados com a nova senha
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Senha atual */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-muted block mb-1">
              Senha atual
            </label>
            <div className="flex gap-2">
              <input
                type={showCur ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Digite a senha atual"
                className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
              />
              <button
                onClick={() => setShowCur((v) => !v)}
                className="px-3 rounded-xl bg-surface-2 text-muted hover:text-ink transition"
              >
                {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-muted block mb-1">
              Nova senha (mín. 8 caracteres)
            </label>
            <div className="flex gap-2">
              <input
                type={showNew ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Nova senha"
                className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
              />
              <button
                onClick={() => setShowNew((v) => !v)}
                className="px-3 rounded-xl bg-surface-2 text-muted hover:text-ink transition"
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirmar nova senha */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-muted block mb-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Repita a nova senha"
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-sm outline-none focus:ring-2 focus:ring-ink/15"
            />
          </div>

          {/* Status */}
          {status !== "idle" && (
            <div className={`text-xs px-3 py-2 rounded-xl ${status === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
              {msg}
            </div>
          )}

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !current || !next || !confirm}
            className="w-full"
          >
            {loading ? "Redefinindo…" : "Redefinir senha"}
          </Button>
        </div>

        <p className="text-[10px] text-muted mt-4 leading-relaxed">
          A senha mestra nunca sai do seu dispositivo. Em caso de perda, não é possível recuperar os dados do cofre.
        </p>
      </div>
    </div>
  );
}

// ── Aia panel ─────────────────────────────────────────────────────────────────

function ModelField({ label, hint, value, onChange }: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-semibold text-muted block mb-1">
        {label}
      </label>
      <input
        list="openrouter-models"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="vendor/modelo"
        className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ink/15"
      />
      <p className="text-[10px] text-muted mt-1">{hint}</p>
    </div>
  );
}

function AiaPanel() {
  const apiKey = useAiStore((s) => s.apiKey);
  const setApiKey = useAiStore((s) => s.setApiKey);
  const models = useAiStore((s) => s.models);
  const setModel = useAiStore((s) => s.setModel);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  function markSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-surface-2 grid place-items-center shrink-0">
            <Bot size={16} className="text-muted" />
          </div>
          <div>
            <p className="font-semibold text-sm">Inteligência Artificial (Aia)</p>
            <p className="text-xs text-muted mt-0.5">
              Um gateway (OpenRouter): uma chave, qualquer modelo.
            </p>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest font-semibold text-muted block mb-1">
            Chave OpenRouter (BYOK)
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={markSaved}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ink/15"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="px-3 rounded-xl bg-surface-2 text-muted hover:text-ink transition"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[10px] text-muted mt-2">
            Guardada só no seu navegador. Deixe em branco para usar a chave do
            servidor (OPENROUTER_API_KEY no .env.local).{" "}
            {saved && <span className="text-success font-semibold">Salvo ✓</span>}
          </p>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-ink underline underline-offset-2 mt-1 inline-block"
          >
            Pegar uma chave →
          </a>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted">Modelos</p>
        <datalist id="openrouter-models">
          {OPENROUTER_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}{m.note ? ` — ${m.note}` : ""}
            </option>
          ))}
        </datalist>

        <ModelField
          label="Modelo do Sistema"
          hint="Gerencia tarefas, ações e insights. Prefira um barato/rápido."
          value={models.system}
          onChange={(v) => setModel("system", v)}
        />
        <ModelField
          label="Modelo do Chat"
          hint="Conversa no copilot. Vale um modelo melhor."
          value={models.chat}
          onChange={(v) => setModel("chat", v)}
        />
      </div>
    </div>
  );
}

// ── category definitions ──────────────────────────────────────────────────────

type CategoryKey = "profile" | "appearance" | "preferences" | "integrations" | "mcp" | "data" | "seguranca" | "aia";

const CATEGORIES: {
  key: CategoryKey;
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string;
  bg: string;
}[] = [
  {
    key: "profile",
    icon: <User size={28} />,
    label: "Perfil",
    description: "Conta, nome e estatísticas",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "appearance",
    icon: <Palette size={28} />,
    label: "Aparência",
    description: "Personalize os temas do sistema",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "preferences",
    icon: <Settings2 size={28} />,
    label: "Preferências",
    description: "Sons e comportamento geral",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "integrations",
    icon: <Cloud size={28} />,
    label: "Integrações",
    description: "Supabase, email, Google Calendar",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "mcp",
    icon: <Plug size={28} />,
    label: "MCP",
    description: "Servidores externos e API",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "data",
    icon: <Database size={28} />,
    label: "Dados",
    description: "Exportar e apagar conteúdo",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "seguranca",
    icon: <Shield size={28} />,
    label: "Segurança",
    description: "Redefinir senha do cofre",
    accent: "#1a1a1a",
    bg: "#f4f4f2",
  },
  {
    key: "aia",
    icon: <Bot size={28} />,
    label: "Aia (IA)",
    description: "Configurar motores de Inteligência Artificial",
    accent: "#1a1a1a",
    bg: "#e4e4e1",
  }
];

// ── main ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<CategoryKey | null>(null);

  const cat = CATEGORIES.find((c) => c.key === active);

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {!active ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Topbar title="Ajustes" subtitle="Escolha uma categoria" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActive(c.key)}
                  className="group flex flex-col items-start gap-4 p-6 rounded-3xl bg-white hover:shadow-md transition-all text-left active:scale-[0.98]"
                >
                  <div
                    className="w-14 h-14 rounded-2xl grid place-items-center transition-transform group-hover:scale-110"
                    style={{ background: c.bg, color: c.accent }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-bold text-base">{c.label}</p>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{c.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition"
              >
                <ChevronLeft size={16} /> Ajustes
              </button>
              <span className="text-muted/40">/</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg grid place-items-center"
                  style={{ background: cat!.bg, color: cat!.accent }}>
                  <span style={{ transform: "scale(0.55)" }}>{cat!.icon}</span>
                </div>
                <span className="font-bold text-sm">{cat!.label}</span>
              </div>
            </div>

            <div className="max-w-2xl">
              {active === "profile"       && <ProfilePanel />}
              {active === "appearance"    && <AppearancePanel />}
              {active === "preferences"   && <PreferencesPanel />}
              {active === "integrations"  && <IntegrationsPanel />}
              {active === "mcp"           && <McpPanel />}
              {active === "data"          && <DataPanel />}
              {active === "seguranca"     && <VaultPanel />}
              {active === "aia"           && <AiaPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
