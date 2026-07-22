"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Star, Sun, Cloud, CloudRain, Sparkles } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/store/useGameStore";
import { levelProgress } from "@/lib/xp";
import { ActiveTimerWidget } from "@/components/task/ActiveTimerWidget";
import { useThemeStore } from "@/store/useThemeStore";

function TopbarFull({ title, subtitle, right }: TopbarProps) {
  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streakDays);
  const todayXp = useGameStore((s) => s.todayXp);
  const { level, needed, pct } = levelProgress(xp);
  const zenMode = useThemeStore((s) => s.zenMode);

  const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchWeather() {
      try {
        let lat = -23.55;
        let lon = -46.63;
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 3000);
          const ipRes = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: controller.signal });
          clearTimeout(id);
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            lat = Number(ipData.latitude);
            lon = Number(ipData.longitude);
          }
        } catch (e) {}
        
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();
        if (mounted && weatherData?.current_weather) {
          if (weatherData.current_weather.temperature != null) {
            setWeatherTemp(Math.round(weatherData.current_weather.temperature));
          }
          if (weatherData.current_weather.weathercode != null) {
            setWeatherCode(weatherData.current_weather.weathercode);
          }
        }
      } catch (e) {
        if (mounted) {
          setWeatherTemp(22);
          setWeatherCode(0);
        }
      }
    }
    fetchWeather();
    return () => { mounted = false; };
  }, []);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).replace(".", "");
  }, []);

  const WeatherIcon = useMemo(() => {
    if (weatherCode === null) return Sun;
    if (weatherCode === 0 || weatherCode === 1) return Sun; // Clear, Mainly clear
    if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) return Cloud; // Partly cloudy, overcast, fog
    return CloudRain; // Rain, Drizzle, Snow, Thunderstorm
  }, [weatherCode]);

  return (
    <header className="relative mb-4 sm:mb-6 glass border rounded-3xl px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-6" style={{ borderColor: "var(--flat-border)", boxShadow: "0 4px 24px -12px rgba(0,0,0,0.1)" }}>
      
      {/* Lado Esquerdo - Título e Clima */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight truncate">{title}</h1>
        </div>

        {/* Barra vertical discreta de separação */}
        <div className="w-px h-6 bg-ink/20 rounded-full" />

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs text-muted font-medium capitalize select-none">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 normal-case text-ink/80 font-bold">
              <WeatherIcon size={14} className="text-warning shrink-0" />
              {weatherTemp !== null ? `${weatherTemp}°C` : "..."}
            </span>
          </div>
        </div>
      </div>

      {/* Centro - Gamificação Solta */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden lg:flex justify-center pointer-events-none">
        {!zenMode && (
          <div className="flex items-center gap-6 pointer-events-auto">
            <div className="w-8 h-8 rounded-full bg-ink text-lime grid place-items-center text-sm font-bold shrink-0 shadow-sm">
              {level}
            </div>
            <div className="flex flex-col gap-1.5 w-32">
              <div className="flex justify-between text-[10px] sm:text-xs text-muted">
                <span className="font-bold text-ink">{xp} XP</span>
                <span className="font-medium">próx. {Math.round(needed)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full xp-shimmer rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="w-px h-6 bg-ink/10 mx-1" />
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Flame size={15} className="text-warning" />
              <span className="font-bold text-ink">{streak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Star size={15} className="text-lime" fill="currentColor" />
              <span className="font-bold text-ink">+{todayXp}</span>
            </div>
          </div>
        )}
      </div>

      {/* Lado Direito - Controles e Espaço */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-end gap-3 shrink-0">

        <ActiveTimerWidget />
        {right}
      </div>
    </header>
  );
}

function TopbarSimple({ title, subtitle, right }: TopbarProps) {
  return (
    <header className="relative mb-4 sm:mb-6 glass border rounded-3xl px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4" style={{ borderColor: "var(--flat-border)", boxShadow: "0 4px 24px -12px rgba(0,0,0,0.1)" }}>
      {/* Lado Esquerdo */}
      <div className="shrink-0 max-w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[11px] sm:text-xs text-muted truncate mt-0.5">{subtitle}</p>}
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">

        <ActiveTimerWidget />
        {right}
      </div>
    </header>
  );
}

interface TopbarProps {
  title: string | React.ReactNode;
  subtitle?: string;
  right?: React.ReactNode;
  variant?: "full" | "simple";
}

export function Topbar({ variant = "simple", ...props }: TopbarProps) {
  if (variant === "full") return <TopbarFull {...props} />;
  return <TopbarSimple {...props} />;
}
