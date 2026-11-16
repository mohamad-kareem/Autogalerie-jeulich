"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RotateCcw, Save } from "lucide-react";
import { PORTAL_LABEL } from "@/lib/marktanalyse/knowledge/defaults.js";

const COMPARE_PORTALS = ["MOBILE_DE", "AUTOSCOUT24", "KLEINANZEIGEN"];

const whole = (value) => String(value ?? "").replace(/[^\d]/g, "").slice(0, 6);

function Km({ id, label, hint, value, onChange }) {
  return (
    <label htmlFor={id} className="ma-settings-money">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="ma-settings-amount">
        <input id={id} type="text" inputMode="numeric" className="field" value={value}
          onChange={(event) => onChange(whole(event.target.value))} />
        <span aria-hidden="true">km</span>
      </span>
    </label>
  );
}

function Money({ id, label, hint, value, onChange }) {
  return (
    <label htmlFor={id} className="ma-settings-money">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span className="ma-settings-amount">
        <input id={id} type="text" inputMode="numeric" className="field" value={value}
          onChange={(event) => onChange(whole(event.target.value))} />
        <span aria-hidden="true">€</span>
      </span>
    </label>
  );
}

export default function MarktanalyseSettings() {
  const [priceList, setPriceList] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });

  const fill = (settings) => ({
    profitMin: String(settings.profitMin), profitGoal: String(settings.profitGoal),
    aiSummaryEnabled: settings.aiSummaryEnabled === true,
    kmWarn: String(settings.kmWarn ?? 150000),
    portals: COMPARE_PORTALS.filter((name) => !Array.isArray(settings.portals) || settings.portals.includes(name)),
    prices: Object.fromEntries(Object.entries(settings.prices).map(([key, value]) => [key, String(value)])),
  });

  useEffect(() => {
    let active = true;
    fetch("/api/marktanalyse/einstellungen", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!active) return;
        if (!response.ok) return setFeedback({ message: data.error || "Einstellungen konnten nicht geladen werden.", error: true });
        setPriceList(data.priceList);
        setForm(fill(data.settings));
        setSaved(fill(data.settings));
      })
      .catch(() => active && setFeedback({ message: "Einstellungen konnten nicht geladen werden.", error: true }));
    return () => { active = false; };
  }, []);

  if (!form || !priceList) {
    return (
      <div className="ma-panel-message text-muted">
        {feedback.message ? <span role="alert" className="ma-danger-text">{feedback.message}</span> : <span role="status" className="inline-flex items-center gap-2"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> Wird geladen …</span>}
      </div>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const goalTooLow = Number(form.profitGoal || 0) < Number(form.profitMin || 0);

  async function save(event) {
    event.preventDefault();
    if (goalTooLow) return setFeedback({ message: "Das Gewinnziel darf nicht unter dem Mindestgewinn liegen.", error: true });
    setBusy(true);
    setFeedback({ message: "", error: false });
    try {
      const response = await fetch("/api/marktanalyse/einstellungen", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profitMin: Number(form.profitMin || 0), profitGoal: Number(form.profitGoal || 0),
          aiSummaryEnabled: form.aiSummaryEnabled,
          portals: form.portals,
          kmWarn: Number(form.kmWarn || 0),
          prices: Object.fromEntries(Object.entries(form.prices).map(([key, value]) => [key, Number(value || 0)])),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setForm(fill(data.settings));
      setSaved(fill(data.settings));
      setFeedback({ message: "Marktanalyse-Einstellungen gespeichert.", error: false });
    } catch (problem) {
      setFeedback({ message: problem?.message || "Speichern fehlgeschlagen.", error: true });
    } finally {
      setBusy(false);
    }
  }

  const reset = () => setForm((current) => ({ ...current, prices: Object.fromEntries(priceList.map((item) => [item.key, String(item.value)])) }));

  return (
    <form onSubmit={save}>
      <label className="ma-settings-ai">
        <strong>KI-Kurzfazit</strong>
        <input type="checkbox" role="switch" className="sr-only" checked={form.aiSummaryEnabled} disabled={busy}
          onChange={(event) => setForm({ ...form, aiSummaryEnabled: event.target.checked })} />
        <span className="ma-settings-switch" aria-hidden="true" />
      </label>

      <section aria-labelledby="ma-settings-portals-title">
        <h3 id="ma-settings-portals-title" className="ma-fixed-heading">Vergleichsfahrzeuge suchen auf</h3>
        {COMPARE_PORTALS.map((name) => {
          const on = form.portals.includes(name);
          const last = on && form.portals.length === 1;
          return (
            <label key={name} className="ma-settings-ai" title={last ? "Mindestens ein Portal muss eingeschaltet bleiben." : undefined}>
              <strong>{PORTAL_LABEL[name]}</strong>
              <input type="checkbox" role="switch" className="sr-only" checked={on} disabled={busy || last}
                onChange={(event) => setForm({ ...form, portals: COMPARE_PORTALS.filter((portal) => portal === name ? event.target.checked : form.portals.includes(portal)) })} />
              <span className="ma-settings-switch" aria-hidden="true" />
            </label>
          );
        })}
      </section>

      <section aria-labelledby="ma-settings-km-title">
        <h3 id="ma-settings-km-title" className="ma-fixed-heading">Kilometerstand</h3>
        <div className="ma-settings-prices-grid">
          <Km id="ma-km-warn" label="Hoher Kilometerstand ab" hint="ab hier Warnung im Bericht" value={form.kmWarn}
            onChange={(value) => setForm({ ...form, kmWarn: value })} />
        </div>
      </section>

      <section aria-labelledby="ma-settings-prices-title">
        <h3 id="ma-settings-prices-title" className="ma-fixed-heading">Preisliste für nötige Arbeiten</h3>
        <div className="ma-settings-prices-grid">
          <Money id="ma-profit-min" label="Mindestgewinn" hint="pro Fahrzeug" value={form.profitMin}
            onChange={(value) => setForm({ ...form, profitMin: value })} />
          <Money id="ma-profit-goal" label="Gewinnziel" hint="pro Fahrzeug" value={form.profitGoal}
            onChange={(value) => setForm({ ...form, profitGoal: value })} />
          {priceList.map((item) => (
            <Money key={item.key} id={`ma-price-${item.key}`} label={item.label} hint={item.unit}
              value={form.prices[item.key] ?? ""}
              onChange={(value) => setForm({ ...form, prices: { ...form.prices, [item.key]: value } })} />
          ))}
        </div>
      </section>

      {goalTooLow && <p role="alert" className="ma-settings-status ma-danger-text">Das Gewinnziel darf nicht unter dem Mindestgewinn liegen.</p>}
      {feedback.message && (
        <p role={feedback.error ? "alert" : "status"} className={`ma-settings-status ${feedback.error ? "ma-danger-text" : "text-emerald-700"}`}>{feedback.message}</p>
      )}
      <div className="ma-settings-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={reset} disabled={busy}>
          <RotateCcw aria-hidden="true" /> Preisliste auf Startwerte
        </button>
        <button type="submit" className="btn btn-primary btn-sm ma-settings-save" disabled={busy || !dirty || goalTooLow}>
          {busy ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Speichern
        </button>
      </div>
    </form>
  );
}
