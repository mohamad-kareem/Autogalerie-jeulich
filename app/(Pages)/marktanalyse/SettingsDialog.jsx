"use client";

/**
 * Einstellungen — the company's starting values for every analysis:
 * margin per price class, the yard's location and the pickup rates, the sale
 * discount and the default analysis depth. Each car can still be changed in
 * the Kalkulation.
 */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiLoader, FiPlus, FiX } from "react-icons/fi";

import { STANDARD_BAND_ROWS } from "@/lib/market/settings";

const toNumberOrEmpty = (value) => (value === null || value === undefined ? "" : String(value));

function Section({ title, hint, children, dark }) {
  return (
    <section className={`border-t px-5 py-4 first:border-t-0 ${dark ? "border-slate-800" : "border-slate-100"}`}>
      <h3 className="text-[13px] font-bold">{title}</h3>
      {hint ? <p className={`mt-0.5 text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, suffix, children, dark }) {
  return (
    <label className="block min-w-0">
      <span className={`mb-1 block text-[11px] font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
      <span className="flex items-center gap-1.5">
        {children}
        {suffix ? <span className={`shrink-0 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{suffix}</span> : null}
      </span>
    </label>
  );
}

export default function SettingsDialog({ open, onClose, onSaved, dark }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const response = await fetch("/api/market-analysis/settings");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error);
        const s = data.settings;
        if (!active) return;
        setForm({
          location: [s.origin?.postcode, s.origin?.label].filter(Boolean).join(" "),
          bandRows: (s.bandRows || []).map((row) => ({
            open: row.upTo === null,
            upTo: toNumberOrEmpty(row.upTo),
            value: toNumberOrEmpty(row.value),
            unit: row.unit,
          })),
          inboundMode: s.inboundMode,
          hourlyRate: toNumberOrEmpty(s.hourlyRate),
          onSiteMinutes: toNumberOrEmpty(s.onSiteMinutes),
          fuelLitresPer100Km: toNumberOrEmpty(s.fuelLitresPer100Km),
          fuelPricePerLitre: toNumberOrEmpty(s.fuelPricePerLitre),
          saleDiscountPercent: toNumberOrEmpty(s.saleDiscountPercent),
          defaultDepth: s.defaultDepth,
          updatedAt: s.updatedAt,
          updatedBy: s.updatedBy,
        });
      } catch (error) {
        toast.error(error?.message || "Einstellungen konnten nicht geladen werden.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const setRow = (index, patch) =>
    setForm((current) => ({
      ...current,
      bandRows: current.bandRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  const removeRow = (index) =>
    setForm((current) => ({ ...current, bandRows: current.bandRows.filter((_, i) => i !== index) }));
  const addRow = () =>
    setForm((current) => {
      const rows = [...current.bandRows];
      // New rows go before the open-ended "darüber" row.
      const openIndex = rows.findIndex((row) => row.open);
      const row = { open: false, upTo: "", value: "", unit: "EURO" };
      if (openIndex >= 0) rows.splice(openIndex, 0, row);
      else rows.push(row);
      return { ...current, bandRows: rows };
    });
  const useStandard = () =>
    setForm((current) => ({
      ...current,
      bandRows: STANDARD_BAND_ROWS.map((row) => ({ open: row.upTo === null, upTo: toNumberOrEmpty(row.upTo), value: String(row.value), unit: row.unit })),
    }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/market-analysis/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: form.location,
          bandRows: form.bandRows
            .filter((row) => row.open || row.upTo !== "")
            .map((row) => ({
            upTo: row.open ? null : Number(row.upTo),
            value: Number(String(row.value).replace(",", ".")),
            unit: row.unit,
          })),
          inboundMode: form.inboundMode,
          hourlyRate: Number(String(form.hourlyRate).replace(",", ".")),
          onSiteMinutes: Number(form.onSiteMinutes),
          fuelLitresPer100Km: Number(String(form.fuelLitresPer100Km).replace(",", ".")),
          fuelPricePerLitre: Number(String(form.fuelPricePerLitre).replace(",", ".")),
          saleDiscountPercent: Number(String(form.saleDiscountPercent).replace(",", ".")),
          defaultDepth: form.defaultDepth,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error);
      toast.success("Einstellungen gespeichert – gelten ab der nächsten Analyse.");
      onSaved?.(data.settings);
      onClose();
    } catch (error) {
      toast.error(error?.message || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  const input = `h-8 w-full min-w-0 rounded border px-2 text-[13px] tabular-nums outline-none focus:ring-2 ${
    dark
      ? "border-slate-700 bg-slate-950 placeholder:text-slate-600 focus:ring-sky-500/30"
      : "border-slate-300 bg-white placeholder:text-slate-400 focus:ring-sky-200"
  }`;
  const segment = (active) =>
    `h-8 flex-1 rounded px-2.5 text-xs font-semibold transition ${
      active
        ? dark
          ? "bg-slate-700 text-slate-100"
          : "bg-white text-slate-900 shadow-sm"
        : dark
          ? "text-slate-400 hover:text-slate-200"
          : "text-slate-500 hover:text-slate-800"
    }`;
  const segmentGroup = `flex rounded p-0.5 ${dark ? "bg-slate-800" : "bg-slate-100"}`;
  const muted = dark ? "text-slate-500" : "text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Einstellungen"
        onMouseDown={(event) => event.stopPropagation()}
        className={`w-full max-w-2xl overflow-hidden rounded-lg border shadow-xl ${
          dark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <header className={`flex items-center justify-between border-b px-5 py-3 ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <div>
            <h2 className="text-sm font-bold">Einstellungen</h2>
            <p className={`text-[11px] ${muted}`}>Startwerte für jede Analyse – im Einzelfall in der Kalkulation änderbar.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen" className={`rounded p-1.5 ${dark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}>
            <FiX />
          </button>
        </header>

        {loading || !form ? (
          <p className={`flex items-center gap-2 px-5 py-10 text-xs ${muted}`}>
            <FiLoader className="animate-spin" /> Einstellungen werden geladen …
          </p>
        ) : (
          <>
            <Section
              dark={dark}
              title="Marge je Preisklasse"
              hint="Gewinn, den ihr je nach Verkaufspreis mindestens braucht – in € oder in % vom Verkaufspreis. Leer lassen = Standard des Systems."
            >
              {form.bandRows.length ? (
                <div className="space-y-1.5">
                  <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-2 text-[10px] font-semibold uppercase tracking-wide ${muted}`}>
                    <span>Verkaufspreis bis</span>
                    <span>Marge</span>
                    <span className="w-[88px]" />
                    <span className="w-7" />
                  </div>
                  {form.bandRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-2">
                      {row.open ? (
                        <span className={`h-8 rounded border border-dashed px-2 text-[13px] leading-8 ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>
                          darüber
                        </span>
                      ) : (
                        <Field dark={dark} suffix="€">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={row.upTo}
                            onChange={(event) => setRow(index, { upTo: event.target.value })}
                            className={input}
                          />
                        </Field>
                      )}
                      <input
                        type="number"
                        min="0"
                        step={row.unit === "PERCENT" ? "0.5" : "50"}
                        value={row.value}
                        onChange={(event) => setRow(index, { value: event.target.value })}
                        className={input}
                      />
                      <div className={`${segmentGroup} w-[88px]`}>
                        <button type="button" onClick={() => setRow(index, { unit: "EURO" })} className={segment(row.unit === "EURO")}>
                          €
                        </button>
                        <button type="button" onClick={() => setRow(index, { unit: "PERCENT" })} className={segment(row.unit === "PERCENT")}>
                          %
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        aria-label="Preisklasse entfernen"
                        className={`flex h-7 w-7 items-center justify-center rounded ${muted} hover:text-red-600`}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`rounded border border-dashed px-3 py-2 text-xs ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>
                  Standard des Systems: bis 5.000 € 14 % · bis 10.000 € 12 % · bis 20.000 € 10 % · bis 35.000 € 8 % · darüber 7 % (jeweils mit Mindestbetrag).
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline">
                  <FiPlus /> Preisklasse
                </button>
                {!form.bandRows.some((row) => row.open) ? (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, bandRows: [...current.bandRows, { open: true, upTo: "", value: "", unit: "PERCENT" }] }))}
                    className="text-[11px] font-semibold text-sky-600 hover:underline"
                  >
                    + „darüber“
                  </button>
                ) : null}
                <button type="button" onClick={useStandard} className={`text-[11px] font-semibold hover:underline ${muted}`}>
                  Standard übernehmen
                </button>
                {form.bandRows.length ? (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, bandRows: [] }))}
                    className={`text-[11px] font-semibold hover:underline ${muted}`}
                  >
                    Zurück zum Standard
                  </button>
                ) : null}
              </div>
            </Section>

            <Section dark={dark} title="Standort & Abholung" hint="Von hier aus werden Entfernung, Fahrzeit und Abholkosten berechnet.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field dark={dark} label="Standort (PLZ und Ort)">
                  <input value={form.location} onChange={set("location")} placeholder="52428 Jülich" className={input} />
                </Field>
                <Field dark={dark} label="Anreise zum Verkäufer">
                  <div className={`${segmentGroup} w-full`}>
                    <button type="button" onClick={() => setForm((c) => ({ ...c, inboundMode: "TRAIN" }))} className={segment(form.inboundMode === "TRAIN")}>
                      Bahn
                    </button>
                    <button type="button" onClick={() => setForm((c) => ({ ...c, inboundMode: "CAR" }))} className={segment(form.inboundMode === "CAR")}>
                      Auto
                    </button>
                  </div>
                </Field>
                <Field dark={dark} label="Stundenlohn Abholer" suffix="€/Std.">
                  <input type="number" min="0" step="0.5" value={form.hourlyRate} onChange={set("hourlyRate")} className={input} />
                </Field>
                <Field dark={dark} label="Zeit beim Verkäufer" suffix="Min.">
                  <input type="number" min="0" step="15" value={form.onSiteMinutes} onChange={set("onSiteMinutes")} className={input} />
                </Field>
                <Field dark={dark} label="Verbrauch" suffix="l/100 km">
                  <input type="number" min="1" step="0.5" value={form.fuelLitresPer100Km} onChange={set("fuelLitresPer100Km")} className={input} />
                </Field>
                <Field dark={dark} label="Spritpreis" suffix="€/l">
                  <input type="number" min="0.5" step="0.05" value={form.fuelPricePerLitre} onChange={set("fuelPricePerLitre")} className={input} />
                </Field>
              </div>
            </Section>

            <Section dark={dark} title="Verkauf & Analyse">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field dark={dark} label="Verkaufsabschlag (Inserat → tatsächlicher Verkauf)" suffix="%">
                  <input type="number" min="0" max="30" step="0.5" value={form.saleDiscountPercent} onChange={set("saleDiscountPercent")} className={input} />
                </Field>
                <Field dark={dark} label="Analyse startet standardmäßig">
                  <div className={`${segmentGroup} w-full`}>
                    <button type="button" onClick={() => setForm((c) => ({ ...c, defaultDepth: "NORMAL" }))} className={segment(form.defaultDepth === "NORMAL")}>
                      Normal
                    </button>
                    <button type="button" onClick={() => setForm((c) => ({ ...c, defaultDepth: "DEEP" }))} className={segment(form.defaultDepth === "DEEP")}>
                      Tief
                    </button>
                  </div>
                </Field>
              </div>
            </Section>

            <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 ${dark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-slate-50"}`}>
              <span className={`text-[11px] ${muted}`}>
                {form.updatedAt
                  ? `Zuletzt geändert ${new Date(form.updatedAt).toLocaleDateString("de-DE")}${form.updatedBy ? ` · ${form.updatedBy}` : ""}`
                  : "Noch keine eigenen Einstellungen gespeichert"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`h-8 rounded border px-3 text-xs font-semibold ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-white"}`}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-8 items-center gap-1.5 rounded bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {saving ? <FiLoader className="animate-spin" /> : null} Speichern
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
