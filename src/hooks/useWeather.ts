"use client";
import { useEffect, useState } from "react";

interface WeatherState {
  temp: number | null;
  loading: boolean;
  error: boolean;
}

async function fetchTempForCoords(lat: number, lon: number): Promise<number> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=celsius`,
  );
  const data = await res.json();
  return Math.round(data.current.temperature_2m);
}

async function fetchTempByIp(): Promise<number> {
  const geo = await fetch("https://ipapi.co/json/");
  const { latitude, longitude } = await geo.json();
  return fetchTempForCoords(latitude, longitude);
}

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ temp: null, loading: true, error: false });

  useEffect(() => {
    let cancelled = false;

    function succeed(temp: number) {
      if (!cancelled) setState({ temp, loading: false, error: false });
    }
    function fail() {
      if (!cancelled) setState({ temp: null, loading: false, error: true });
    }

    async function tryIpFallback() {
      try {
        succeed(await fetchTempByIp());
      } catch {
        fail();
      }
    }

    if (!navigator.geolocation) {
      tryIpFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          succeed(await fetchTempForCoords(coords.latitude, coords.longitude));
        } catch {
          tryIpFallback();
        }
      },
      () => tryIpFallback(),
      { timeout: 5000 },
    );

    return () => { cancelled = true; };
  }, []);

  return state;
}
