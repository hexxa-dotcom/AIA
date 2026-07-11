"use client";
import { useMemo } from "react";
import { Zap, Star, Flame, CheckSquare, Trophy, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useGameStore } from "@/store/useGameStore";
import { useTaskStore } from "@/store/useTaskStore";
import { usePerfilStore } from "@/store/usePerfilStore";
import { useProfileStore } from "@/store/useProfileStore";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";

export default function PerfilPage() {
  const user = useAuthStore((s) => s.user);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const streakDays = useGameStore((s) => s.streakDays);
  const achievements = useGameStore((s) => s.achievements);
  const tasks = useTaskStore((s) => s.tasks);
  
  const profile = useProfileStore((s) => s.profile);

  const email = user?.email ?? "";
  const userName = useMemo(() => email.split("@")[0] || "Usuário", [email]);
  const finalName = profile.name || userName;

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completedAt).length,
    [tasks]
  );

  const recentAchievements = useMemo(
    () =>
      achievements
        .filter((a) => a.unlockedAt)
        .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
        .slice(0, 3),
    [achievements]
  );

  const handleSignOut = () => {
    useAuthStore.getState().signOut();
  };

  const stats = [
    { label: "XP Total", value: xp, Icon: Zap },
    { label: "Nível atual", value: level, Icon: Star },
    { label: "Streak de dias", value: streakDays, Icon: Flame },
    { label: "Tarefas concluídas", value: completedCount, Icon: CheckSquare },
  ];

  return (
    <AppShell>
      <Topbar title="Meu Perfil" />

      <div className="max-w-lg mx-auto w-full flex flex-col gap-6">
        {/* Avatar + info */}
        <div className="glass rounded-3xl p-6 flex flex-col items-center gap-3 text-center">
          <div
            className="w-20 h-20 rounded-full grid place-items-center mx-auto text-3xl font-bold bg-lime"
          >
            {finalName ? finalName[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-xl font-bold text-ink">{finalName}</p>
            {profile.role && (
            <p className="text-sm font-semibold text-muted mt-1">
              {profile.role} {profile.company && `na ${profile.company}`}
            </p>
          )}
          <p className="text-[10px] text-muted/60 mt-1">{email}</p>
        </div>

        {profile.bio && (
          <p className="text-sm text-ink/80 max-w-sm mt-1 italic leading-relaxed">"{profile.bio}"</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {profile.goals && profile.goals.split(",").map(g => g.trim()).filter(Boolean).map(g => (
             <span key={g} className="px-2 py-1 bg-surface-2 border border-ink/5 rounded-md text-[10px] font-bold uppercase text-ink/70">🎯 {g}</span>
          ))}
          {profile.skills && profile.skills.split(",").map(g => g.trim()).filter(Boolean).map(g => (
             <span key={g} className="px-2 py-1 bg-surface-2 border border-ink/5 rounded-md text-[10px] font-bold uppercase text-ink/70">⚡ {g}</span>
          ))}
          {profile.interests && profile.interests.split(",").map(g => g.trim()).filter(Boolean).map(g => (
             <span key={g} className="px-2 py-1 bg-surface-2 border border-ink/5 rounded-md text-[10px] font-bold uppercase text-ink/70">❤️ {g}</span>
          ))}
        </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            className="mt-1"
          >
            <LogOut size={14} />
            Sair
          </Button>
        </div>

        {/* Separador */}
        <div style={{ height: "0.5px", background: "rgba(14,11,12,0.08)" }} />

        {/* Stat cards */}
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
            <Trophy size={15} className="text-muted" />
            <h2 className="font-bold text-sm text-ink">Conquistas recentes</h2>
          </div>
          {recentAchievements.length === 0 ? (
            <p className="text-muted text-xs">Nenhuma conquista desbloqueada ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentAchievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.40)" }}
                >
                  
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
      </div>
    </AppShell>
  );
}
