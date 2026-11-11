"use client";

import { useEffect, useState } from "react";
import { Loader2, Navigation } from "lucide-react";

/** 95 → "1 Std. 35 Min." */
export const durationDE = (m) => (m >= 60 ? `${Math.floor(m / 60)} Std.${m % 60 ? ` ${m % 60} Min.` : ""}` : `${m} Min.`);

const cache = new Map(); // address → result (per page visit)

/** driving time company → address: { minutes, km, from } | null (debounced, cached) */
export function useTravel(address) {
  const to = String(address || "").trim();
  const [state, setState] = useState({ key: "", data: null, loading: false });
  useEffect(() => {
    if (to.length < 4) return;
    if (cache.has(to)) {
      const t = setTimeout(() => setState({ key: to, data: cache.get(to), loading: false }), 0);
      return () => clearTimeout(t);
    }
    let alive = true;
    const t = setTimeout(async () => {
      setState({ key: to, data: null, loading: true });
      try {
        const res = await fetch(`/api/fahrzeit?to=${encodeURIComponent(to)}`);
        const data = res.ok ? await res.json() : null;
        cache.set(to, data);
        if (alive) setState({ key: to, data, loading: false });
      } catch {
        if (alive) setState({ key: to, data: null, loading: false });
      }
    }, 700);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [to]);
  return state.key === to && to.length >= 4 ? state : { key: "", data: null, loading: false };
}

/** "ca. 23 Min. Fahrt · 17,6 km ab Firma" – driving time from the company location (Einstellungen) */
export default function TravelTime({ address, className = "" }) {
  const state = useTravel(address);
  if (state.loading) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-muted ${className}`}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fahrzeit wird berechnet …
      </span>
    );
  }
  const d = state.data;
  if (!d?.minutes) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 font-medium text-ink ${className}`} title={d.from ? `ab ${d.from}` : undefined}>
      <Navigation className="h-3.5 w-3.5 text-muted" />
      ca. {durationDE(d.minutes)} Fahrt
      <span className="font-normal text-muted">· {String(d.km).replace(".", ",")} km ab Firma</span>
    </span>
  );
}
