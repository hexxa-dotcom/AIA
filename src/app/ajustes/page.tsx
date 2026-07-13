"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import {
  Cloud, Mail, CalendarDays, Users, Trash2,
  Plug, Copy, Check, Plus, X, RefreshCw,
  Database, Download, Settings2, ChevronLeft,
  Wifi, ExternalLink, Shield, KeyRound, Eye, EyeOff, 
  Palette, Sun, Moon, Contrast, Bot, LayoutGrid, Newspaper
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAiStore } from "@/store/useAiStore";
import { OPENROUTER_MODELS, GROQ_MODELS } from "@/lib/ai/models";
import { useThemeStore } from "@/store/useThemeStore";
import { useSoundStore } from "@/store/useSoundStore";
import { sounds } from "@/lib/sounds";
import { useTaskStore } from "@/store/useTaskStore";
import { useGameStore } from "@/store/useGameStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useMcpServersStore } from "@/store/useMcpServersStore";
import { useMcpTools } from "@/hooks/useMcpTools";
import { useAuthStore } from "@/store/useAuthStore";
import { useVaultStore } from "@/store/useVaultStore";
import { useTimerStore } from "@/store/useTimerStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useFinanceStore } from "@/store/useFinanceStore";
import { useFeedConfigStore } from "@/store/useFeedConfigStore";
import { useNewsStore } from "@/store/useNewsStore";
import { isSupabaseEnabled } from "@/lib/supabase";
import { isAppwriteEnabled, getAppwrite } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useAdminStore, checkIsAdmin } from "@/store/useAdminStore";
import { cn } from "@/lib/utils";

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
    <div className={cn("flex items-center justify-between py-4 gap-4", border && "border-b border-ink/6")}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-ink">{label}</p>
        {description && <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={cn("relative w-10 h-5.5 rounded-full transition-colors", on ? "bg-ink" : "bg-ink/15")}>
      <span className={cn("absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm", on ? "left-5" : "left-0.5")} />
    </button>
  );
}

function StatusBadge({ label, color }: { label: string; color: "success" | "warning" | "muted" }) {
  const cls = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    muted:   "bg-ink/5 text-muted border-ink/5",
  }[color];
  return (
    <span className={cn("text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold border", cls)}>
      {label}
    </span>
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
  const pomodoroMinutes = useTimerStore((s) => s.pomodoroMinutes ?? 25);
  const shortBreakMinutes = useTimerStore((s) => s.shortBreakMinutes ?? 5);
  const longBreakMinutes = useTimerStore((s) => s.longBreakMinutes ?? 15);
  const longBreakThreshold = useTimerStore((s) => s.longBreakThreshold ?? 4);

  const setPomodoroMinutes = useTimerStore((s) => s.setPomodoroMinutes);
  const setShortBreakMinutes = useTimerStore((s) => s.setShortBreakMinutes);
  const setLongBreakMinutes = useTimerStore((s) => s.setLongBreakMinutes);
  const setLongBreakThreshold = useTimerStore((s) => s.setLongBreakThreshold);

  const defaultPerfil = usePerfilStore((s) => s.defaultPerfil ?? "last_active");
  const setDefaultPerfil = usePerfilStore((s) => s.setDefaultPerfil);

  const motivationalStyle = usePerfilStore((s) => s.motivationalStyle ?? "famous");
  const setMotivationalStyle = usePerfilStore((s) => s.setMotivationalStyle);
  const motivationalFrequency = usePerfilStore((s) => s.motivationalFrequency ?? "daily");
  const setMotivationalFrequency = usePerfilStore((s) => s.setMotivationalFrequency);

  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
          <Settings2 size={16} />
        </div>
        <div>
          <p className="font-bold text-sm text-ink">Preferências do Sistema</p>
          <p className="text-xs text-muted mt-0.5 font-medium">Sons, temporizador Pomodoro e comportamento</p>
        </div>
      </div>
      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />
      
      {/* Bloco de Som */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Sons & Feedback</p>
        <Row label="Sons do sistema" description="Feedback sonoro ao concluir tarefas, timer, lembretes e conquistas">
          <Toggle on={soundEnabled} onToggle={toggleSound} />
        </Row>
        <Row label="Prévia dos sons" description="Clique para testar cada som" border={false} />
        <div className="flex flex-wrap gap-2 mt-1">
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
              className="px-3 py-1.5 rounded-xl bg-surface-2 border border-ink/5 text-xs text-ink hover:bg-ink/5 disabled:opacity-40 transition font-medium">
              ▶ {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      {/* Bloco Pomodoro */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Temporizador Pomodoro</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Tempo de Foco</label>
            <select
              value={pomodoroMinutes}
              onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              {[15, 20, 25, 30, 45, 50, 60, 90].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Pausa Curta</label>
            <select
              value={shortBreakMinutes}
              onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              {[3, 5, 8, 10, 12, 15].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Pausa Longa</label>
            <select
              value={longBreakMinutes}
              onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              {[10, 15, 20, 25, 30, 40].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Frequência Pausa Longa</label>
            <select
              value={longBreakThreshold}
              onChange={(e) => setLongBreakThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              {[2, 3, 4, 5, 6].map((c) => (
                <option key={c} value={c}>Após {c} pomodoros</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      {/* Bloco de Mensagens Motivacionais */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Mensagens Motivacionais (Aia)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Estilo de Frases</label>
            <select
              value={motivationalStyle}
              onChange={(e) => setMotivationalStyle(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              <option value="famous">Citações Famosas & Filosofia</option>
              <option value="biblia">Provérbios da Bíblia Sagrada</option>
              <option value="stoic">Estilo Estoicismo & Resiliência</option>
              <option value="startup">Mentalidade Startup & Execução</option>
            </select>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Frequência de Envio</label>
            <select
              value={motivationalFrequency}
              onChange={(e) => setMotivationalFrequency(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
            >
              <option value="daily">Uma vez ao dia (Matinal)</option>
              <option value="twice_daily">Duas vezes ao dia (Manhã e Noite)</option>
              <option value="after_focus">Ao finalizar sessões de foco</option>
              <option value="off">Desativar mensagens</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      {/* Inicialização */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Ambiente de Inicialização</p>
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">
            Perfil Padrão de Acesso
          </label>
          <select
            value={defaultPerfil}
            onChange={(e) => setDefaultPerfil(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
          >
            <option value="last_active">Lembrar último ambiente ativo</option>
            <option value="profissional">Workspace (Profissional)</option>
            <option value="pessoal">Lifespace (Pessoal)</option>
          </select>
          <p className="text-[9px] text-muted mt-1 leading-relaxed">
            Define qual perfil o AIA OS carrega automaticamente ao recarregar a página.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppearancePanel() {
  const { theme, setTheme, zenMode, setZenMode } = useThemeStore();
  
  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
          <Palette size={16} />
        </div>
        <div>
          <p className="font-bold text-sm text-ink">Aparência do Sistema</p>
          <p className="text-xs text-muted mt-0.5">Personalize os temas e a exibição de elementos</p>
        </div>
      </div>
      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />
      
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Tema visual</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setTheme("light")} className={cn("p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]", theme === "light" ? "border-ink bg-ink text-surface" : "border-ink/10 hover:border-ink/30 bg-surface-2 text-ink")}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Claro</span>
              <Sun size={14} className={theme === "light" ? "text-lime" : "text-muted"} />
            </div>
            <p className={cn("text-[10px] leading-relaxed", theme === "light" ? "text-surface/85" : "text-muted")}>Fundo limpo e cores vivas.</p>
          </button>

          <button onClick={() => setTheme("dark")} className={cn("p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]", theme === "dark" ? "border-ink bg-ink text-surface" : "border-ink/10 hover:border-ink/30 bg-surface-2 text-ink")}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Escuro</span>
              <Moon size={14} className={theme === "dark" ? "text-lime" : "text-muted"} />
            </div>
            <p className={cn("text-[10px] leading-relaxed", theme === "dark" ? "text-surface/85" : "text-muted")}>Fundo escuro, alto contraste.</p>
          </button>

          <button onClick={() => setTheme("foco")} className={cn("p-4 rounded-2xl border text-left transition-all hover:scale-[1.01]", theme === "foco" ? "border-ink bg-ink text-surface" : "border-ink/10 hover:border-ink/30 bg-surface-2 text-ink")}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs">Foco</span>
              <Contrast size={14} className={theme === "foco" ? "text-lime" : "text-muted"} />
            </div>
            <p className={cn("text-[10px] leading-relaxed", theme === "foco" ? "text-surface/85" : "text-muted")}>Apenas preto e branco.</p>
          </button>
        </div>
      </div>

      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      {/* Modo Zen */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Modo Foco / Gamificação</p>
        <Row label="Modo Zen (Sem Gamificação)" description="Oculta os níveis de XP, medalhas de conquistas e streaks para uma experiência de foco total e minimalista">
          <Toggle on={zenMode} onToggle={() => setZenMode(!zenMode)} />
        </Row>
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
    <div className="mt-3 space-y-2">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Resend API Key</p>
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
      <p className="text-[9px] text-muted">
        Configure <code className="bg-surface-2 px-1 rounded">RESEND_API_KEY</code> no servidor para lembretes automáticos por email.
      </p>
    </div>
  );
}

function IntegrationsPanel() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = checkIsAdmin(user?.email);
  const { settings } = useAdminStore();

  const supabaseActive = isSupabaseEnabled();

  if (!isAdmin && !settings.allowGuestsConfigureIntegrations) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-muted border border-flat flex flex-col items-center">
        <Shield size={24} className="mb-2 opacity-50" />
        <p className="font-bold text-xs text-ink uppercase tracking-wider">Acesso Restrito</p>
        <p className="text-[10px] text-muted mt-1 max-w-[280px]">Configurações de banco de dados e sincronização em nuvem são exclusivas do administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Supabase */}
      <div className="glass rounded-3xl p-5 border border-ink/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <Cloud size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink">Supabase PostgreSQL</p>
              {supabaseActive ? (
                <StatusBadge label="ativo" color="success" />
              ) : (
                <StatusBadge label="desativado" color="muted" />
              )}
            </div>
            <p className="text-xs text-muted">Sincronização opcional com banco SQL</p>
          </div>
        </div>
      </div>

      {/* Email / Resend */}
      <div className="glass rounded-3xl p-5 border border-ink/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <Mail size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink">Email de Lembretes</p>
              <StatusBadge label="Resend" color="warning" />
            </div>
            <p className="text-xs text-muted">Configurações para envio de alertas por email</p>
          </div>
        </div>
        <ResendKeyField />
      </div>

      {/* Google Calendar */}
      <div className="glass rounded-3xl p-5 border border-ink/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <CalendarDays size={16} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink">Google Calendar</p>
              <StatusBadge label="via MCP" color="success" />
            </div>
            <p className="text-xs text-muted">Sincronização de eventos da agenda</p>
          </div>
        </div>
        <div className="space-y-3">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-ink text-lime hover:opacity-90 transition"
          >
            <ExternalLink size={12} /> Abrir Google Agenda
          </a>
        </div>
      </div>
    </div>
  );
}

function McpPanel() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = checkIsAdmin(user?.email);
  const { settings } = useAdminStore();

  const mcpUrl = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "http://localhost:3000/api/mcp";
  const claudeConfig = JSON.stringify({ mcpServers: { aia: { url: mcpUrl } } }, null, 2);
  const cursorConfig = JSON.stringify({ aia: { url: mcpUrl } }, null, 2);
  const { servers, add, remove, toggle, update } = useMcpServersStore();
  const { tools, loading, refresh } = useMcpTools();
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  if (!isAdmin && !settings.allowGuestsManageMcp) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-muted border border-flat flex flex-col items-center">
        <Shield size={24} className="mb-2 opacity-50" />
        <p className="font-bold text-xs text-ink uppercase tracking-wider">Acesso Restrito</p>
        <p className="text-[10px] text-muted mt-1 max-w-[280px]">Configurações de servidores e ferramentas MCP são exclusivas do administrador.</p>
      </div>
    );
  }

  function addServer() {
    if (!newName.trim() || !newUrl.trim()) return;
    add({ name: newName.trim(), url: newUrl.trim(), enabled: true });
    setNewName(""); setNewUrl("");
  }

  return (
    <div className="space-y-4">
      {/* Servidores MCP externos */}
      <div className="glass rounded-3xl p-5 border border-ink/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <Wifi size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink">Servidores MCP Externos</p>
              <StatusBadge label={tools.length > 0 ? `${tools.length} ferramentas` : "nenhum"} color={tools.length > 0 ? "success" : "muted"} />
            </div>
            <p className="text-xs text-muted mt-0.5 font-medium">Conecte Drive, GitHub, Filesystem do computador</p>
          </div>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3 text-[10px] text-muted leading-relaxed">
          Rode um servidor MCP localmente em sua máquina e insira a URL HTTP abaixo para conectar novas habilidades ao Copilot.
        </div>

        {servers.length > 0 && (
          <div className="space-y-2">
            {servers.map((s) => {
              const serverTools = tools.filter((t) => t.serverUrl === s.url);
              return (
                <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-surface-2 border border-ink/5">
                  <button onClick={() => toggle(s.id)}
                    className={cn("relative w-8.5 h-5 rounded-full transition-colors shrink-0", s.enabled ? "bg-ink" : "bg-ink/15")}>
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm", s.enabled ? "left-4" : "left-0.5")} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })}
                      className="font-bold text-xs bg-transparent outline-none w-full text-ink" />
                    <p className="text-[9px] text-muted/65 font-mono truncate">{s.url}</p>
                    {s.enabled && serverTools.length > 0 && (
                      <p className="text-[9px] text-success font-medium mt-0.5">{serverTools.map((t) => t.name).join(", ")}</p>
                    )}
                    {s.enabled && serverTools.length === 0 && !loading && (
                      <p className="text-[9px] text-warning font-medium mt-0.5">Offline ou sem ferramentas</p>
                    )}
                  </div>
                  <button onClick={() => remove(s.id)} className="p-1 text-muted hover:text-danger transition shrink-0">
                    <X size={13} />
                  </button>
                </div>
              );
            })}
            <button onClick={refresh} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition font-medium">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              {loading ? "Reconectando…" : "Reconectar servidores"}
            </button>
          </div>
        )}

        <div className="space-y-2 bg-surface-2/45 p-4 rounded-2xl border border-dashed border-ink/10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Adicionar novo servidor</p>
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do Servidor"
              className="flex-1 px-3 py-1.5 rounded-xl bg-surface-2 text-xs outline-none focus:ring-2 focus:ring-ink/10" />
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="http://localhost:3010/mcp"
              className="flex-[2] px-3 py-1.5 rounded-xl bg-surface-2 text-xs font-mono outline-none focus:ring-2 focus:ring-ink/10" />
            <button onClick={addServer} disabled={!newName.trim() || !newUrl.trim()}
              className="px-3 py-1.5 rounded-xl bg-ink text-lime text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition shrink-0">
              <Plus size={13} />
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Servidores Rápidos</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_SERVERS.map((p) => (
              <button key={p.name} onClick={() => { setNewName(p.name); setNewUrl(p.url); }}
                className="text-left px-3 py-2 rounded-xl bg-surface-2 hover:bg-ink/5 border border-ink/5 transition">
                <p className="text-xs font-bold text-ink">{p.name}</p>
                <p className="text-[9px] text-muted font-mono mt-0.5 truncate">{p.hint}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Porta MCP */}
      <div className="glass rounded-3xl p-5 border border-ink/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <Plug size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-ink">Porta MCP Interna</p>
              <StatusBadge label="ativa" color="success" />
            </div>
            <p className="text-xs text-muted mt-0.5">Exponha seus dados locais para IAs locais (Cursor, Claude, etc)</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted mb-1">MCP Endpoint</p>
            <div className="flex items-center gap-2 bg-surface-2 border border-ink/5 rounded-xl px-3 py-1.5">
              <code className="text-xs flex-1 font-mono text-ink overflow-x-auto">{mcpUrl}</code>
              <CopyButton text={mcpUrl} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted">Configuração Claude Desktop</p>
              <CopyButton text={claudeConfig} />
            </div>
            <pre className="text-[9px] font-mono bg-ink text-lime rounded-xl p-3 overflow-x-auto leading-relaxed">{claudeConfig}</pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] uppercase tracking-widest font-bold text-muted">Configuração Cursor / Windsurf</p>
              <CopyButton text={cursorConfig} />
            </div>
            <pre className="text-[9px] font-mono bg-ink text-lime rounded-xl p-3 overflow-x-auto leading-relaxed">{cursorConfig}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPanel() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = checkIsAdmin(user?.email);
  const { settings } = useAdminStore();

  const [confirming, setConfirming] = useState<string | null>(null);

  if (!isAdmin && !settings.allowGuestsResetData) {
    return (
      <div className="glass rounded-3xl p-8 text-center text-muted border border-flat flex flex-col items-center">
        <Shield size={24} className="mb-2 opacity-50" />
        <p className="font-bold text-xs text-ink uppercase tracking-wider">Acesso Restrito</p>
        <p className="text-[10px] text-muted mt-1 max-w-[280px]">Ações de exclusão de dados e reset do sistema são exclusivas do administrador.</p>
      </div>
    );
  }

  function handleReset(type: "all" | "tasks" | "game" | "routine" | "finance") {
    if (type === "all") {
      localStorage.removeItem("aia-tasks-store");
      localStorage.removeItem("aia-game-store");
      localStorage.removeItem("aia-timer-store");
      localStorage.removeItem("aia-routine-store");
      localStorage.removeItem("aia-finance");
    } else if (type === "tasks") {
      localStorage.removeItem("aia-tasks-store");
      localStorage.removeItem("aia-timer-store");
    } else if (type === "game") {
      localStorage.removeItem("aia-game-store");
    } else if (type === "routine") {
      localStorage.removeItem("aia-routine-store");
    } else if (type === "finance") {
      localStorage.removeItem("aia-finance");
    }
    window.location.reload();
  }

  function exportJson() {
    const data = {
      tasks: useTaskStore.getState(),
      game: useGameStore.getState(),
      routine: useRoutineStore.getState(),
      finance: useFinanceStore.getState(),
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
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
          <Database size={16} />
        </div>
        <div>
          <p className="font-bold text-sm text-ink">Gerenciamento de Dados</p>
          <p className="text-xs text-muted mt-0.5">Exportar backups locais ou zerar dados de forma seletiva</p>
        </div>
      </div>
      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      <div className="flex items-center justify-between py-4 border-b border-ink/5 gap-4">
        <div>
          <p className="text-xs font-bold text-ink">Exportar Backup Completo</p>
          <p className="text-[10px] text-muted mt-0.5">Baixe um arquivo JSON contendo tarefas, finanças, rotinas e progresso</p>
        </div>
        <Button variant="light" size="sm" onClick={exportJson}>
          <Download size={12} /> Exportar JSON
        </Button>
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-danger">Zerar Dados Seletivos</p>
        
        {/* Reset grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { key: "tasks", label: "Quadro & Tarefas", desc: "Zera quadros, tarefas e histórico de timer" },
            { key: "game", label: "Gamificação & XP", desc: "Reseta nível, XP total e streaks acumulados" },
            { key: "routine", label: "Hábitos & Rotinas", desc: "Apaga seus hábitos configurados e histórico" },
            { key: "finance", label: "Finanças & Gastos", desc: "Zera contas cadastradas e logs financeiros" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="p-3 bg-surface-2 border border-ink/5 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-xs text-ink">{label}</p>
                <p className="text-[9px] text-muted truncate">{desc}</p>
              </div>
              {confirming !== key ? (
                <button onClick={() => setConfirming(key)} className="text-[10px] font-bold text-danger hover:underline">
                  Zerar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleReset(key as any)} className="text-[10px] font-bold text-success hover:underline">
                    Sim
                  </button>
                  <button onClick={() => setConfirming(null)} className="text-[10px] font-bold text-muted hover:underline">
                    Não
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zerar Tudo */}
        <div className="flex items-center justify-between py-2 border-t border-ink/5 mt-4">
          <div>
            <p className="text-xs font-bold text-danger">Zerar Todos os Dados Locais</p>
            <p className="text-[10px] text-muted">Remove todas as informações locais. Ação irreversível.</p>
          </div>
          {confirming !== "all" ? (
            <Button variant="danger" size="sm" onClick={() => setConfirming("all")}>
              Zerar Tudo
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted font-semibold text-[10px]">Tem certeza?</span>
              <Button size="sm" variant="danger" onClick={() => handleReset("all")}>Sim</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Não</Button>
            </div>
          )}
        </div>
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
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
          <KeyRound size={16} />
        </div>
        <div>
          <p className="font-bold text-sm text-ink">Segurança do Cofre</p>
          <p className="text-xs text-muted mt-0.5">
            Redefina sua senha mestra de criptografia
          </p>
        </div>
      </div>
      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      <div className="space-y-3">
        {/* Senha atual */}
        <div>
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">
            Senha mestra atual
          </label>
          <div className="flex gap-2">
            <input
              type={showCur ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Digite a senha atual"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-xs outline-none focus:ring-2 focus:ring-ink/10"
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
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">
            Nova senha (mín. 8 caracteres)
          </label>
          <div className="flex gap-2">
            <input
              type={showNew ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="Nova senha mestra"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-2 text-xs outline-none focus:ring-2 focus:ring-ink/10"
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
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">
            Confirmar nova senha
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Repita a nova senha mestra"
            className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>

        {/* Status */}
        {status !== "idle" && (
          <div className={cn("text-xs px-3 py-2 rounded-xl font-semibold", status === "ok" ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
            {msg}
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || !current || !next || !confirm}
          className="w-full"
        >
          {loading ? "Redefinindo…" : "Redefinir Senha"}
        </Button>
      </div>

      <p className="text-[9px] text-muted leading-relaxed">
        Sua senha mestra é salva exclusivamente em seu dispositivo local. Se perdida, não é possível recuperar os dados criptografados do cofre.
      </p>
    </div>
  );
}



function FeedConfigPanel() {
  const { config, toggleWidget, setAllWidgets } = useFeedConfigStore();

  const widgetsList = [
    { key: "briefing", label: "Briefing Matinal da Aia", description: "Resumo diário gerado pela inteligência artificial" },
    { key: "progress", label: "Progresso & Produtividade", description: "Gráfico de tarefas completas e XP ganho" },
    { key: "routine", label: "Rotinas & Hábitos", description: "Sua agenda de hábitos recorrentes e tarefas fixas" },
    { key: "challenges", label: "Desafios & Propósitos", description: "Desafios pessoais de 30/7/15 dias (álcool, redes sociais, etc.)" },
    { key: "agenda", label: "Agenda & Compromissos", description: "Sincronização do calendário e compromissos do dia" },
    { key: "time", label: "Temporizador Foco", description: "Widget rápido para acompanhar o timer Pomodoro ativo" },
    { key: "projects", label: "Projetos Ativos", description: "Seus projetos e tarefas corporativas / profissionais" },
    { key: "estudos", label: "Estudos & Leituras", description: "Gerenciamento de livros, cursos e progresso de aprendizado" },
    { key: "finance", label: "Finanças & Gastos", description: "Visão rápida de despesas, saldos e contas a vencer" },
    { key: "vault", label: "Cofre de Senhas", description: "Widget informativo do status de trancado/destrancado do cofre" },
    { key: "news", label: "Notícias & RSS", description: "Leitor de notícias e feeds RSS integrados" },
    { key: "quickNotes", label: "Anotações Rápidas", description: "Bloco de notas rápido no final da página inicial" },
  ] as const;

  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-5">
      <div className="flex items-center justify-between border-b border-ink/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
            <LayoutGrid size={16} />
          </div>
          <div>
            <p className="font-bold text-sm text-ink">Personalizar Tela Inicial (Feed)</p>
            <p className="text-xs text-muted mt-0.5 font-medium">Ligue ou desligue cada módulo do seu Feed</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setAllWidgets(true)}
          className="px-3 py-1.5 rounded-xl bg-surface-2 border border-ink/5 text-xs text-ink hover:bg-ink/5 transition font-semibold"
        >
          ✓ Ativar Todos
        </button>
        <button
          onClick={() => setAllWidgets(false)}
          className="px-3 py-1.5 rounded-xl bg-surface-2 border border-ink/5 text-xs text-ink hover:bg-ink/5 transition font-semibold"
        >
          ✗ Desativar Todos
        </button>
      </div>

      <div style={{ height: "0.5px", background: "var(--flat-border)" }} />

      <div className="space-y-1">
        {widgetsList.map(({ key, label, description }) => (
          <Row 
            key={key} 
            label={label} 
            description={description}
          >
            <Toggle 
              on={config[key]} 
              onToggle={() => toggleWidget(key)} 
            />
          </Row>
        ))}
      </div>
    </div>
  );
}

function NewsPanel() {
  const { sources, addSource, updateSource, removeSource, refreshInterval, setRefreshInterval } = useNewsStore();

  const handleAddSource = () => {
    if (sources.length >= 3) return;
    addSource({
      id: Math.random().toString(36).substring(7),
      type: "google",
      topic: "Tecnologia",
      subtopic: ""
    });
  };

  return (
    <div className="glass rounded-3xl p-5 border border-ink/5 space-y-5">
      <div className="flex items-center gap-3 border-b border-ink/5 pb-3">
        <div className="w-9 h-9 rounded-xl bg-ink/5 text-ink grid place-items-center shrink-0">
          <Newspaper size={16} />
        </div>
        <div>
          <p className="font-bold text-sm text-ink">Meu Jornal (Notícias)</p>
          <p className="text-xs text-muted mt-0.5 font-medium">Configure até 3 fontes simultâneas para seu jornal</p>
        </div>
      </div>

      <div className="space-y-4">
        {sources.map((source, index) => (
          <div key={source.id} className="p-4 bg-surface-2 rounded-2xl border border-ink/5 relative group">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Fonte {index + 1}</span>
              {sources.length > 1 && (
                <button 
                  onClick={() => removeSource(source.id)}
                  className="text-muted hover:text-danger transition opacity-0 group-hover:opacity-100"
                  title="Remover fonte"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <select
                  value={source.type}
                  onChange={(e) => updateSource(source.id, { type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-surface text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
                >
                  <option value="google">Google News Brasil (Busca Livre)</option>
                  <option value="tabnews">TabNews (Tech / Programação)</option>
                  <option value="custom_rss">Feed RSS Customizado</option>
                </select>
              </div>

              {source.type === "google" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={source.topic || ""}
                    onChange={(e) => updateSource(source.id, { topic: e.target.value })}
                    placeholder="Assunto (Ex: Tecnologia)"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface text-xs outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                  <input
                    type="text"
                    value={source.subtopic || ""}
                    onChange={(e) => updateSource(source.id, { subtopic: e.target.value })}
                    placeholder="Nicho (Ex: IA)"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface text-xs outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
              )}

              {source.type === "custom_rss" && (
                <div>
                  <input
                    type="url"
                    value={source.url || ""}
                    onChange={(e) => updateSource(source.id, { url: e.target.value })}
                    placeholder="https://meusite.com/rss.xml"
                    className="w-full px-3 py-2 rounded-xl bg-surface text-xs font-mono outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {sources.length < 3 && (
          <button 
            onClick={handleAddSource}
            className="w-full py-3 rounded-2xl border border-dashed border-ink/20 text-muted hover:text-ink hover:border-ink/40 transition flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider bg-surface-2/30"
          >
            <Plus size={14} /> Adicionar Fonte
          </button>
        )}

        <div className="pt-2 border-t border-ink/5 mt-4">
          <label className="text-[10px] uppercase tracking-widest font-bold text-muted block mb-1">Frequência de Atualização (Cache)</label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 text-xs font-semibold outline-none border border-ink/5 focus:ring-2 focus:ring-ink/10 text-ink"
          >
            <option value={1}>A cada 1 hora</option>
            <option value={6}>A cada 6 horas</option>
            <option value={12}>A cada 12 horas</option>
            <option value={24}>Uma vez ao dia</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── category definitions ──────────────────────────────────────────────────────

type CategoryKey = "appearance" | "preferences" | "integrations" | "mcp" | "data" | "seguranca" | "feed" | "news";

const CATEGORIES: {
  key: CategoryKey;
  icon: React.ReactNode;
  label: string;
  description: string;
}[] = [
  {
    key: "appearance",
    icon: <Palette size={24} />,
    label: "Aparência",
    description: "Personalize os temas, cores e o Modo Zen do sistema",
  },
  {
    key: "preferences",
    icon: <Settings2 size={24} />,
    label: "Preferências",
    description: "Sons de feedback, temporizador Pomodoro e inicialização",
  },
  {
    key: "feed",
    icon: <LayoutGrid size={24} />,
    label: "Configuração do Feed",
    description: "Escolha quais widgets e recursos serão exibidos no seu feed inicial",
  },
  {
    key: "integrations",
    icon: <Cloud size={24} />,
    label: "Integrações",
    description: "Sincronizações na nuvem e emails de lembrete",
  },
  {
    key: "mcp",
    icon: <Plug size={24} />,
    label: "MCP",
    description: "Conecte servidores externos e configure portas locais",
  },
  {
    key: "data",
    icon: <Database size={24} />,
    label: "Dados",
    description: "Exportar backups locais ou zerar dados de forma seletiva",
  },
  {
    key: "news",
    icon: <Newspaper size={24} />,
    label: "Meu Jornal",
    description: "Fontes de notícias, RSS customizado e filtros",
  },
  {
    key: "seguranca",
    icon: <Shield size={24} />,
    label: "Segurança",
    description: "Redefina a senha de criptografia do cofre",
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
            className="pb-12 max-w-4xl w-full"
          >
            <Topbar title="Ajustes" subtitle="Gerencie as preferências globais do seu AIA OS" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActive(c.key)}
                  className="group flex flex-col items-start gap-4 p-5 rounded-3xl glass border border-ink/5 hover:border-ink/15 hover:shadow-md transition-all text-left active:scale-[0.98]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-ink/5 text-ink grid place-items-center transition-transform group-hover:scale-105 shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink">{c.label}</p>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed">{c.description}</p>
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
            className="pb-12 max-w-3xl w-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setActive(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition uppercase tracking-wider"
              >
                <ChevronLeft size={14} /> Ajustes
              </button>
              <span className="text-muted/20">/</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-ink/5 text-ink grid place-items-center">
                  <span style={{ transform: "scale(0.55)" }}>{cat!.icon}</span>
                </div>
                <span className="font-bold text-xs uppercase tracking-wider text-ink">{cat!.label}</span>
              </div>
            </div>

            <div className="max-w-2xl w-full">
              {active === "appearance"    && <AppearancePanel />}
              {active === "preferences"   && <PreferencesPanel />}
              {active === "feed"          && <FeedConfigPanel />}
              {active === "integrations"  && <IntegrationsPanel />}
              {active === "mcp"           && <McpPanel />}
              {active === "data"          && <DataPanel />}
              {active === "news"          && <NewsPanel />}
              {active === "seguranca"     && <VaultPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
