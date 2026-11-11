"use client";

/**
 * Fahrzeug-Radar (route /neue-angebote) — the newest cars on AutoScout24, Kleinanzeigen and mobile.de,
 * as they become discoverable in portal search results.
 *
 * While this page is open and online it asks the server every 3–120 seconds for the
 * newest ads matching the filter (sorted newest first on each portal). Each
 * portal is asked on its own, at a fixed pace, so a slow answer from one never
 * delays the cars from another. A portal's first answer is its baseline: what
 * was already online. Everything that turns up after that is new and lands at
 * the top, with a sound and a desktop notification if wanted.
 *
 * "New" means first discovered by this search, not a verified upload time.
 * Every returned match is kept; ordering and ad IDs must not hide vehicles.
 *
 * The open page drives all work, including in background tabs; no offline collector is installed.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  FiBell,
  FiBellOff,
  FiAlertTriangle,
  FiCheck,
  FiEdit2,
  FiExternalLink,
  FiEyeOff,
  FiLoader,
  FiMail,
  FiMapPin,
  FiPause,
  FiPhone,
  FiPlay,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiSliders,
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiZap,
} from "react-icons/fi";

import {
  BODIES,
  DEFAULT_FILTERS,
  FUELS,
  GEARBOXES,
  RADII,
  SELLERS,
  SOURCES,
  describeFilters,
  filterKey,
  kleinanzeigenSearchCount,
  normalizeFilters,
} from "@/lib/feed/filters";
import { detectNew, mergeFeed, startSession } from "@/lib/feed/detect";
import { requestCheck } from "@/lib/feed/live";
import { createChime, notifyArrivals } from "@/lib/feed/alerts";
import { nextCheckDelay } from "@/lib/feed/polling";
import { KA_CYCLE_MS, KA_DEFAULT_LANDING_MS, nextKaCheck, observeKa } from "@/lib/feed/kaCycle";
import PageLoader from "@/app/(components)/helpers/PageLoader";

// The name shown in the page title, the browser tab and the test message.
const PAGE_NAME = "Fahrzeug-Radar";

const FILTER_STORE = "neueAngebote.filters.v1";
const SETTINGS_STORE = "neueAngebote.settings.v1";
// v1 classified old, newly encountered inventory as fresh. Do not restore it.
const FEED_STORE = (key) => `neueAngebote.feed.v2.${key}`;
// Where in its two-minute cycle Kleinanzeigen's search last refreshed (learned, see kaCycle.js).
const KA_TIMING_STORE = "neueAngebote.kaTiming.v1";
const MAX_SAVED_FEED = 500;
// Fast polling still depends on portal publication and response time.
// Refusals retain the server cooldown and client failure backoff.
const INTERVALS = [3, 5, 15, 30, 60, 120];
// AutoScout24 refuses servers that ask too often. One look at its newest
// 20 ads every 10 s still catches every new car (a filter rarely gets more
// than a few per minute) and keeps the server off its block list.
const AUTOSCOUT_MIN_INTERVAL_MS = 10_000;
// Away longer than this (page closed, PC asleep, no connection): what went
// online meanwhile is not "just arrived" — the next answer is a new baseline.
const SESSION_GAP_MS = 3 * 60_000;
// Arrivals within this window are announced together: one sound, one message.
const ANNOUNCE_WINDOW_MS = 800;

/* ------------------------------------------------------------------ helpers */

const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : "–";
const km = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} km` : null;

function ago(iso, now) {
  if (!iso) return null;
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.floor(hours / 24)} Tg.`;
}

function clock(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function clockSeconds(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the feed still works for this visit.
  }
}

function emptyStore() {
  return { baselineDone: false, startedAt: Date.now(), seen: {}, kaMaxId: 0, feed: [] };
}

/**
 * A worker timer keeps scheduling separate from card rendering. The page
 * explicitly stops it when hidden/offline. Browser scheduling is best effort.
 */
function createTicker() {
  let worker = null;
  let callback = null;
  let fallback = null;
  try {
    const source =
      "let t=null;onmessage=(e)=>{clearTimeout(t);if(e.data>=0)t=setTimeout(()=>postMessage(1),e.data);};";
    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = () => callback?.();
  } catch {
    worker = null;
  }
  return {
    set(delayMs, fn) {
      callback = fn;
      if (worker) worker.postMessage(delayMs);
      else {
        clearTimeout(fallback);
        fallback = setTimeout(() => callback?.(), delayMs);
      }
    },
    clear() {
      callback = null;
      if (worker) worker.postMessage(-1);
      clearTimeout(fallback);
    },
    stop() {
      this.clear();
      worker?.terminate();
    },
  };
}

const chime = createChime(() => window.AudioContext || window.webkitAudioContext);
const playAlertSound = () => chime().then((played) => {
  if (!played) toast.error("Ton blockiert. Bitte Ton testen und die Website im Browser nicht stummschalten.", { id: "feed-audio" });
});

/* ------------------------------------------------------------------- UI bits */

/** Small caps heading with a hairline, one per filter column. */
function ColumnTitle({ children }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d6671]">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * A labelled field. `group` for several controls (chips, two inputs): a
 * <label> may only name one control, so those become a named group instead.
 */
function Field({ label, aside, children, group = false, className = "" }) {
  const caption = (
    <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px] font-medium text-ink">
      {label}
      {aside ? <span className="text-[11px] font-normal text-muted">{aside}</span> : null}
    </span>
  );
  if (group) {
    return (
      <div role="group" aria-label={label} className={`block min-w-0 ${className}`}>
        {caption}
        {children}
      </div>
    );
  }
  return (
    <label className={`block min-w-0 ${className}`}>
      {caption}
      {children}
    </label>
  );
}

/** One row of the "Eckdaten" column: name and unit on the left, von – bis on the right. */
function RangeRow({ label, unit, from, to, onFrom, onTo, placeholders = ["von", "bis"] }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
      <span className="text-[12px] font-medium leading-tight text-ink">
        {label}
        <span className="block text-[11px] font-normal text-muted">{unit}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <input
          inputMode="numeric"
          aria-label={`${label} von`}
          value={from}
          onChange={(e) => onFrom(e.target.value)}
          placeholder={placeholders[0]}
          className="field h-8 min-w-0 flex-1 tabular-nums"
        />
        <span className="shrink-0 text-[12px] text-muted">–</span>
        <input
          inputMode="numeric"
          aria-label={`${label} bis`}
          value={to}
          onChange={(e) => onTo(e.target.value)}
          placeholder={placeholders[1]}
          className="field h-8 min-w-0 flex-1 tabular-nums"
        />
      </div>
    </div>
  );
}

/** A choice chip: hairline when off, dark steel with a tick when on. */
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-7 items-center gap-1.5 rounded-[3px] border px-2.5 text-[12px] font-medium transition-colors ${
        active
          ? "border-[#2f353c] bg-[#3e454e] text-white"
          : "border-[#cfd4da] bg-white text-body hover:border-[#8d959f] hover:text-ink"
      }`}
    >
      {active ? <FiCheck className="size-3 shrink-0" /> : null}
      {children}
    </button>
  );
}

/** Exclusive options as one joined steel switch, full width. */
function Choice({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="ind-seg flex w-full overflow-hidden">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={`ind-seg-btn ind-seg-sm flex-1 justify-center ${value === option.id ? "ind-seg-on" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** How many filters narrow the search (portals and the damage switch not counted). */
function activeFilterCount(f) {
  const has = (value) => String(value ?? "").trim() !== "";
  return [
    has(f.priceMin) || has(f.priceMax),
    has(f.kmMin) || has(f.kmMax),
    has(f.yearMin) || has(f.yearMax),
    has(f.powerMin) || has(f.powerMax),
    has(f.make),
    f.gearbox && f.gearbox !== "ANY",
    (f.fuels || []).length > 0,
    (f.bodies || []).length > 0,
    f.seller && f.seller !== "ALL",
    Number(f.radius) > 0 && String(f.zip || "").length === 5,
  ].filter(Boolean).length;
}

function FilterPanel({ draft, setDraft, onApply, onCancel }) {
  const set = (field) => (value) => setDraft((current) => ({ ...current, [field]: value }));
  const toggleIn = (field, id) =>
    setDraft((current) => {
      const list = current[field] || [];
      return { ...current, [field]: list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id] };
    });
  const count = activeFilterCount(draft);
  const kaSearches = draft.sources.includes("KLEINANZEIGEN") ? kleinanzeigenSearchCount(draft) : 1;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="scroll-slim grid min-h-0 flex-1 divide-y divide-line overflow-y-auto lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* 1 – the car */}
        <div className="space-y-4 p-4">
          <ColumnTitle>Fahrzeug</ColumnTitle>
          <Field label="Marke">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                value={draft.make}
                onChange={(e) => set("make")(e.target.value)}
                placeholder="Alle Marken"
                className="field h-8 pl-8"
              />
            </div>
          </Field>
          <Field label="Getriebe" group>
            <Choice label="Getriebe" value={draft.gearbox} onChange={set("gearbox")} options={GEARBOXES} />
          </Field>
          <Field label="Kraftstoff" aside={draft.fuels.length ? null : "alle"} group>
            <div className="flex flex-wrap gap-1.5">
              {FUELS.map((fuel) => (
                <Chip key={fuel.id} active={draft.fuels.includes(fuel.id)} onClick={() => toggleIn("fuels", fuel.id)}>
                  {fuel.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Fahrzeugtyp" aside={draft.bodies.length ? null : "alle"} group>
            <div className="flex flex-wrap gap-1.5">
              {BODIES.map((body) => (
                <Chip key={body.id} active={draft.bodies.includes(body.id)} onClick={() => toggleIn("bodies", body.id)}>
                  {body.label}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        {/* 2 – the numbers */}
        <div className="p-4">
          <ColumnTitle>Eckdaten</ColumnTitle>
          <div className="space-y-2.5">
            <RangeRow label="Preis" unit="Euro" from={draft.priceMin} to={draft.priceMax} onFrom={set("priceMin")} onTo={set("priceMax")} />
            <RangeRow label="Kilometer" unit="km" from={draft.kmMin} to={draft.kmMax} onFrom={set("kmMin")} onTo={set("kmMax")} />
            <RangeRow label="Erstzulassung" unit="Jahr" from={draft.yearMin} to={draft.yearMax} onFrom={set("yearMin")} onTo={set("yearMax")} />
            <RangeRow label="Leistung" unit="PS" from={draft.powerMin} to={draft.powerMax} onFrom={set("powerMin")} onTo={set("powerMax")} />
          </div>
          <div className="mt-4 border-t border-line pt-3.5">
            <button
              type="button"
              role="switch"
              aria-checked={draft.hideDamaged}
              onClick={() => set("hideDamaged")(!draft.hideDamaged)}
              className={`ind-toggle ${draft.hideDamaged ? "ind-toggle-on" : ""}`}
            >
              <span className="ind-toggle-box" />
              Unfall- und Defektfahrzeuge ausblenden
            </button>
          </div>
        </div>

        {/* 3 – where to look */}
        <div className="space-y-4 p-4">
          <ColumnTitle>Suchgebiet & Quellen</ColumnTitle>
          <Field label="Standort" group>
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Suchgebiet"
                value={Number(draft.radius) || 0}
                onChange={(e) => set("radius")(Number(e.target.value))}
                className={`field h-8 ${Number(draft.radius) ? "w-[8.5rem] shrink-0" : ""}`}
              >
                <option value={0}>Ganz Deutschland</option>
                {RADII.map((radius) => (
                  <option key={radius} value={radius}>{radius} km um</option>
                ))}
              </select>
              {Number(draft.radius) ? (
                <input
                  inputMode="numeric"
                  maxLength={5}
                  value={draft.zip}
                  onChange={(e) => set("zip")(e.target.value.replace(/\D/g, ""))}
                  placeholder="PLZ"
                  aria-label="Postleitzahl"
                  className="field h-8 min-w-0 flex-1 tabular-nums"
                />
              ) : null}
            </div>
            {Number(draft.radius) && draft.zip.length < 5 ? (
              <p className="mt-1 text-[11px] text-amber-700">PLZ eingeben – sonst ganz Deutschland.</p>
            ) : null}
          </Field>
          <Field label="Anbieter" group>
            <Choice label="Anbieter" value={draft.seller} onChange={set("seller")} options={SELLERS} />
          </Field>
          <Field label="Portale" group>
            <div className="overflow-hidden rounded-[4px] border border-[#cfd4da]">
              {SOURCES.map((source) => {
                const on = draft.sources.includes(source.id);
                return (
                  <button
                    key={source.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleIn("sources", source.id)}
                    className={`flex h-8 w-full items-center gap-2.5 border-b border-line px-2.5 text-left text-[12.5px] last:border-b-0 ${
                      on ? "bg-white font-medium text-ink" : "bg-[#f6f7f9] text-muted"
                    } hover:bg-[#eef0f3]`}
                  >
                    <span className="ind-lamp" style={{ "--lamp": on ? "#22a35a" : "#b7bdc5" }} />
                    <span className="flex-1">{source.label}</span>
                    <span className="text-[11px] font-normal text-muted">{on ? "aktiv" : "aus"}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </div>

      {/* footer: what is set, and the two actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c9ced5] bg-[#f6f7f9] px-4 py-2.5">
        <div className="min-w-0 text-[12px] text-muted">
          {count ? (
            <span>
              <span className="font-semibold text-ink">{count}</span> Filter gesetzt
            </span>
          ) : (
            <span>Keine Einschränkung – alle Fahrzeuge</span>
          )}
          {kaSearches > 1 ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-amber-700">
              <FiAlertTriangle className="size-3.5 shrink-0" />
              Kleinanzeigen braucht {kaSearches} Suchen pro Prüfung – schneller mit einer Kraftstoffart und einem Fahrzeugtyp.
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setDraft({ ...DEFAULT_FILTERS })} className="btn btn-secondary">
            <FiRotateCcw /> Zurücksetzen
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary">
            <FiCheck /> Übernehmen
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * The filter as its own window over the page. Escape, the ✕, "Abbrechen" or a
 * click beside it close it without changing the running search.
 */
function FilterWindow({ open, onClose, ...panel }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 cursor-default bg-navy-950/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Suchfilter"
        className="animate-pop-in relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[6px] border border-[#a9b0b9] bg-white shadow-float sm:max-h-[86dvh] sm:rounded-[4px]"
      >
        <div className="ind-toolbar flex shrink-0 items-center gap-3 px-4 py-2.5">
          <FiSliders className="size-4 shrink-0 text-[#5d6671]" />
          <h2 className="flex-1 text-[14px] font-semibold text-ink">Suchfilter</h2>
          <button type="button" onClick={onClose} className="ind-icon-btn" aria-label="Schließen" title="Schließen (Esc)">
            <FiX className="size-4" />
          </button>
        </div>
        <FilterPanel {...panel} onCancel={onClose} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- listing row */

const CONDITION_SHORT = {
  Unfallfrei: "Unfallfrei",
  "Vorschaden (repariert)": "Vorschaden",
  "Unfall / Schaden": "Unfallschaden",
  "Unfall unbekannt": "Unfall ?",
};

/** Small, quiet fact boxes. Colour only where it means something. */
const FACT_TONE = {
  bad: "bg-rose-50 text-rose-700 ring-rose-600/15",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/15",
  unknown: "bg-white text-muted ring-black/[0.08]",
  neutral: "bg-slate-100 text-slate-700 ring-black/[0.08]",
};

const TONE_DOT = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", neutral: "bg-slate-400", unknown: "bg-slate-300" };

function FactBox({ tone = "neutral", children, dot = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[3px] px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${FACT_TONE[tone] || FACT_TONE.neutral}`}>
      {dot ? <span className={`size-1.5 rounded-full ${TONE_DOT[tone] || TONE_DOT.neutral}`} /> : null}
      {children}
    </span>
  );
}

/**
 * HU, accident status, owners and yearly mileage as four small boxes, then
 * whatever in the ad text should stop a buyer, and what speaks for the car.
 * Read from the ad page once the car has arrived, or on request.
 */
function CardFacts({ item, onLoad }) {
  const d = item.details;

  if (!d) {
    if (item.detailsState === "loading") {
      return (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Details werden geladen">
          {[64, 72, 56, 80].map((width) => (
            <span key={width} style={{ width }} className="h-[22px] animate-pulse rounded-[3px] bg-slate-100" />
          ))}
        </div>
      );
    }
    return (
      <button type="button" onClick={() => onLoad(item)} className="link mt-3 self-start text-[12px]">
        {item.detailsState === "error" ? "Details nicht lesbar – erneut versuchen" : "HU, Unfall und Halter laden"}
      </button>
    );
  }

  const huText = d.hu.label === "HU unbekannt" ? "HU ?" : d.hu.label + (d.hu.note ? ` · ${d.hu.note}` : "");
  const plus = d.goodSigns.filter((sign) => sign !== "Zahnriemen neu");

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <FactBox tone={d.hu.tone}>{huText}</FactBox>
        <FactBox tone={d.condition.tone}>{CONDITION_SHORT[d.condition.label] || d.condition.label}</FactBox>
        <FactBox tone={d.owners?.tone || "unknown"}>{d.owners ? d.owners.label : "Halter ?"}</FactBox>
        {d.usage ? (
          <FactBox tone={d.usage.level === "VERY_HIGH" ? "warn" : "neutral"} dot={false}>
            {d.usage.label.replace("/Jahr", " / Jahr")}
          </FactBox>
        ) : null}
        {d.redFlags.map((flag) => (
          <FactBox key={flag} tone="bad">{flag}</FactBox>
        ))}
      </div>
      {plus.length || d.equipment.length ? (
        <p className="text-[12px] leading-5 text-muted">
          {plus.length ? <span className="text-body">{plus.join(" · ")}</span> : null}
          {plus.length && d.equipment.length ? <span className="mx-2 opacity-50">|</span> : null}
          {d.equipment.length ? d.equipment.join(", ") : null}
        </p>
      ) : null}
    </div>
  );
}

/** The seller's phone and e-mail, when he published them in the ad. */
function SellerContact({ contact }) {
  if (!contact || (!contact.phones?.length && !contact.email)) return null;
  const link = "link inline-flex min-w-0 items-center gap-1.5 text-[12.5px]";
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
      {(contact.phones || []).map((phone) => (
        <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={`${link} tabular-nums`} title="Anrufen">
          <FiPhone className="size-3.5 shrink-0" />
          {phone}
        </a>
      ))}
      {contact.email ? (
        <a href={`mailto:${contact.email}`} className={link} title="E-Mail schreiben">
          <FiMail className="size-3.5 shrink-0" />
          <span className="truncate">{contact.email}</span>
        </a>
      ) : null}
    </div>
  );
}

const ListingCard = memo(function ListingCard({ item, now, onHide, onLoadDetails, latest = false }) {
  const source = SOURCES.find((entry) => entry.id === item.source);
  const sellerType =
    item.details?.sellerType && item.details.sellerType !== "UNKNOWN" ? item.details.sellerType : item.sellerType;

  // First registration and kilometres lead; the rest follows quieter.
  const lead = [
    item.firstRegistration ? { label: "EZ", value: item.firstRegistration } : null,
    Number.isFinite(item.mileageKm) ? { label: null, value: km(item.mileageKm) } : null,
    item.powerPs ? { label: null, value: `${item.powerPs} PS` } : null,
  ].filter(Boolean);
  const rest = [item.fuel, item.gearbox].filter(Boolean);

  const seller =
    sellerType === "PRIVATE"
      ? "Privat"
      : sellerType === "DEALER"
        ? `Händler${item.details?.sellerName ? ` · ${item.details.sellerName.slice(0, 28)}` : ""}`
        : null;

  const when = item.postedAt
    ? `Portal-Zeit ${new Date(item.postedAt).toLocaleDateString("de-DE")} ${clock(item.postedAt)}${item.isNew && item.firstSeenAt ? ` · gefunden ${clockSeconds(item.firstSeenAt)}` : ""}`
    : item.isNew
      ? `gefunden ${clockSeconds(item.firstSeenAt)} · ${ago(item.firstSeenAt, now)}`
      : "passendes Angebot";

  const ratingColor = item.rating
    ? item.rating.tone === "good"
      ? "text-emerald-700"
      : item.rating.tone === "bad"
        ? "text-rose-700"
        : "text-muted"
    : "";

  return (
    <article
      className={`group relative grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-[4px] border bg-white p-3.5 transition-colors sm:grid-cols-[168px_minmax(0,1fr)_150px] sm:gap-x-5 sm:gap-y-0 sm:p-4 ${
        latest
          ? "border-[#7d8690] shadow-[0_1px_3px_rgba(20,26,33,0.14)]"
          : "border-[#b4bbc4] shadow-[0_1px_2px_rgba(20,26,33,0.06)] hover:border-[#8d959f]"
      }`}
    >
      {/* photo */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[4/3] self-start overflow-hidden rounded-[3px] bg-canvas sm:row-span-2"
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-[11px] text-muted">kein Bild</div>
        )}
      </a>

      {/* the car */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-6 text-[11px] text-muted">
          {item.isNew ? (
            <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-50 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
              <span className={`size-1 rounded-full bg-emerald-500 ${latest ? "animate-pulse" : ""}`} />
              {"Neu gefunden"}
            </span>
          ) : null}
          <span>{source?.label || item.source}</span>
          <span aria-hidden>·</span>
          <span title="Portal-Zeit: Zeitangabe im Suchergebnis, ursprüngliche Veröffentlichung nicht verifiziert. Gefunden: erstmals von dieser Suche erkannt.">{when}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink sm:line-clamp-1">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {item.title}
          </a>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {lead.map((entry, index) => (
            <span key={index} className="text-[14px] font-semibold tabular-nums text-ink">
              {entry.label ? <span className="mr-1 text-[11px] font-medium text-muted">{entry.label}</span> : null}
              {entry.value}
            </span>
          ))}
          {rest.length ? <span className="text-[13px] text-muted">{rest.join(" · ")}</span> : null}
        </div>

        <p className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-muted">
          {item.location ? (
            <>
              <FiMapPin className="shrink-0" />
              <span className="truncate">
                {item.location}
                {Number.isFinite(item.distanceKm) ? ` (${item.distanceKm} km)` : ""}
              </span>
            </>
          ) : null}
          {item.location && seller ? <span aria-hidden className="mx-1">·</span> : null}
          {seller ? <span className="shrink-0">{seller}</span> : null}
        </p>

        <SellerContact contact={item.details?.contact} />
      </div>

      {/* facts: full width on a phone, under the car on a wider screen */}
      <div className="col-span-2 -mt-1 flex min-w-0 flex-col sm:col-span-1 sm:col-start-2 sm:mt-0">
        <CardFacts item={item} onLoad={onLoadDetails} />
      </div>

      {/* price and actions */}
      <div className="col-span-2 flex items-end justify-between gap-3 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col sm:items-end sm:justify-between">
        <div className="shrink-0 sm:text-right">
          <div className="whitespace-nowrap text-[19px] font-bold tabular-nums leading-tight text-ink">{euro(item.price)}</div>
          <div className="mt-0.5 text-[11px]">
            {item.priceNote ? <span className="text-muted">{item.priceNote}</span> : null}
            {item.priceNote && item.rating ? <span className="mx-1 text-muted">·</span> : null}
            {item.rating ? <span className={`font-medium ${ratingColor}`}>{item.rating.label}</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`/marktanalyse?url=${encodeURIComponent(item.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ankaufs-Check in neuem Tab"
            className="btn btn-sm btn-secondary"
          >
            <FiZap /> Check
          </a>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
            Öffnen <FiExternalLink />
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onHide(item.key)}
        title="Ausblenden"
        aria-label="Ausblenden"
        className="absolute right-2 top-2 rounded-[3px] p-1 text-muted transition hover:bg-canvas hover:text-ink focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <FiEyeOff className="size-3.5" />
      </button>
    </article>
  );
});

/** A section heading with its cars below, spaced as separate cards. */
function FeedSection({ title, count, meta, live = false, children }) {
  return (
    <section className="mb-6">
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-0.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          {live ? <span className="size-1.5 translate-y-[-1px] animate-pulse rounded-full bg-emerald-500" /> : null}
          {title}
          {Number.isFinite(count) ? <span className="ind-count tabular-nums">{count}</span> : null}
        </h2>
        {meta ? <span className="text-[11px] text-muted">{meta}</span> : null}
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------------- page */

export default function NeueAngebotePage() {
  const { status } = useSession();
  const router = useRouter();

  const [draft, setDraft] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [applied, setApplied] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [running, setRunning] = useState(false);
  const [pageOnline, setPageOnline] = useState(true);
  // When the last check of any portal finished — to notice a gap (page closed, PC asleep).
  const lastAliveRef = useRef(0);
  // How many portal checks are under way right now.
  const [pending, setPending] = useState(0);
  const checking = pending > 0;
  const [intervalSec, setIntervalSec] = useState(3);
  const [sound, setSound] = useState(true);
  const [notify, setNotify] = useState(false);

  const [feed, setFeed] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);
  // Failed checks in a row, per portal.
  const [failures, setFailures] = useState({});
  const [nextChecks, setNextChecks] = useState({});
  const [unread, setUnread] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const storeRef = useRef(emptyStore());
  // Read inside the polling loop without restarting it when they change.
  const soundRef = useRef(sound);
  const notifyRef = useRef(notify);
  const failuresRef = useRef({});
  const routerRef = useRef(router);
  routerRef.current = router;
  soundRef.current = sound;
  notifyRef.current = notify;
  // Per portal: a check under way, and when the last one started.
  const inFlightRef = useRef({});
  const lastStartRef = useRef({});
  // Server clock minus this PC's clock: a PC can be seconds off, and the
  // Kleinanzeigen timing is measured on the server's clock.
  const clockOffsetRef = useRef(0);
  const clockSamplesRef = useRef([]);
  // Kleinanzeigen timing: where its refresh lands, the newest ad number seen,
  // and until when to ask at the normal pace while the timing is relearned.
  const kaRef = useRef({ landing: KA_DEFAULT_LANDING_MS, lastMax: 0, lastAt: null, relearnUntil: 0 });
  const generationRef = useRef(0);
  const detailControllersRef = useRef(new Set());

  const cancelSearch = useCallback(() => {
    generationRef.current += 1;
    for (const controller of Object.values(inFlightRef.current)) controller.abort();
    inFlightRef.current = {};
    for (const controller of detailControllersRef.current) controller.abort();
    detailControllersRef.current.clear();
    detailQueueRef.current = [];
  }, []);

  useEffect(() => () => cancelSearch(), [cancelSearch]);

  useEffect(() => {
    if (!running || !pageOnline) { cancelSearch(); setPending(0); }
  }, [running, pageOnline, cancelSearch]);

  useEffect(() => {
    const update = () => setPageOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  /* restore settings */
  useEffect(() => {
    const savedFilters = readJson(FILTER_STORE, null);
    if (savedFilters) {
      setDraft({ ...DEFAULT_FILTERS, ...savedFilters });
    }
    const settings = readJson(SETTINGS_STORE, {});
    // Upgrade the previous default to fast mode; retain other chosen intervals.
    if (!(settings.v < 4 && settings.intervalSec === 5) && INTERVALS.includes(settings.intervalSec) &&
        (settings.v >= 3 || (settings.intervalSec !== 15 && (settings.v >= 2 || settings.intervalSec !== 60)))) {
      setIntervalSec(settings.intervalSec);
    }
    if (typeof settings.sound === "boolean") setSound(settings.sound);
    if (settings.notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotify(true);
    }
  }, []);

  useEffect(() => {
    const timing = readJson(KA_TIMING_STORE, null);
    if (timing && Number.isFinite(timing.landing) && timing.landing >= 0 && timing.landing < KA_CYCLE_MS) {
      kaRef.current = { ...kaRef.current, landing: timing.landing };
    }
  }, []);

  useEffect(() => {
    writeJson(SETTINGS_STORE, { v: 4, intervalSec, sound, notify });
  }, [intervalSec, sound, notify]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  /* a clock for "vor 2 Min." and the countdown */
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, []);

  /* unread count in the tab title, cleared when the tab is looked at */
  useEffect(() => {
    const base = PAGE_NAME;
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
    const clear = () => {
      if (document.visibilityState === "visible") setUnread(0);
    };
    window.addEventListener("focus", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("focus", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, [unread]);

  const key = applied ? filterKey(applied) : null;

  const pendingSavesRef = useRef(new Map());
  const saveTimerRef = useRef(null);
  const flushSaves = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    for (const [savedKey, store] of pendingSavesRef.current) {
      writeJson(FEED_STORE(savedKey), { ...store, feed: store.feed.slice(0, MAX_SAVED_FEED) });
    }
    pendingSavesRef.current.clear();
  }, []);
  useEffect(() => {
    window.addEventListener("pagehide", flushSaves);
    return () => { window.removeEventListener("pagehide", flushSaves); flushSaves(); };
  }, [flushSaves]);

  const persist = useCallback(
    (store) => {
      if (!key) return;
      pendingSavesRef.current.set(key, store);
      if (!saveTimerRef.current) saveTimerRef.current = setTimeout(flushSaves, 250);
    },
    [key, flushSaves],
  );

  /* details: read each new car's ad page, two at a time, newest first */
  const detailQueueRef = useRef([]);
  const detailActiveRef = useRef(0);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const updateItem = (itemKey, patch) => {
    const store = storeRef.current;
    const nextFeed = store.feed.map((entry) => (entry.key === itemKey ? { ...entry, ...patch } : entry));
    const nextStore = { ...store, feed: nextFeed };
    storeRef.current = nextStore;
    persistRef.current(nextStore);
    setFeed(nextFeed);
  };

  const pumpRef = useRef(null);
  pumpRef.current = () => {
    while (detailActiveRef.current < 2 && detailQueueRef.current.length) {
      const next = detailQueueRef.current.shift();
      const generation = generationRef.current;
      const controller = new AbortController();
      detailControllersRef.current.add(controller);
      detailActiveRef.current += 1;
      updateItem(next.key, { detailsState: "loading" });
      fetch("/api/neue-angebote/details", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next.url }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (generation !== generationRef.current) return;
          updateItem(
            next.key,
            data?.ok
              ? { details: data.details, detailsState: "done" }
              : { detailsState: "error", detailsError: data?.error || null },
          );
        })
        .catch(() => {
          if (generation === generationRef.current) updateItem(next.key, { detailsState: "error" });
        })
        .finally(() => {
          detailControllersRef.current.delete(controller);
          detailActiveRef.current -= 1;
          pumpRef.current();
        });
    }
  };

  /** Queue cars for details. New arrivals go to the front of the line. */
  const loadDetails = useCallback((items, { first = false } = {}) => {
    const queued = new Set(detailQueueRef.current.map((entry) => entry.key));
    const wanted = items.filter(
      (entry) => !entry.details && entry.source !== "MOBILE_DE" && !queued.has(entry.key),
    );
    detailQueueRef.current = first
      ? [...wanted, ...detailQueueRef.current]
      : [...detailQueueRef.current, ...wanted];
    pumpRef.current();
  }, []);

  const loadCardDetails = useCallback((entry) => loadDetails([entry], { first: true }), [loadDetails]);

  /* sound, toast and desktop notification for new cars */
  const announceRef = useRef(null);
  const pendingArrivalsRef = useRef([]);
  const announceTimerRef = useRef(null);
  announceRef.current = (arrivals) => {
    // Kleinanzeigen streams its cards one by one; collect them briefly so a
    // round of arrivals makes one sound and one message, not twenty.
    pendingArrivalsRef.current.push(...arrivals);
    if (announceTimerRef.current) return;
    announceTimerRef.current = setTimeout(() => {
      announceTimerRef.current = null;
      const batch = pendingArrivalsRef.current;
      pendingArrivalsRef.current = [];
      if (batch.length) flushAnnouncement(batch);
    }, ANNOUNCE_WINDOW_MS);
  };
  const flushAnnouncement = (arrivals) => {
    setUnread((count) => count + arrivals.length);
    if (soundRef.current) void playAlertSound();
    const first = arrivals[0];
    toast.success(
      arrivals.length === 1 ? `Neu: ${first.title} · ${euro(first.price)}` : `${arrivals.length} neue Angebote`,
      { duration: 6_000, id: "feed-arrivals" },
    );
    if (notifyRef.current) {
      try {
        const NotificationClass = typeof Notification === "undefined" ? null : Notification;
        let sent;
        if (arrivals.length <= 3) {
          sent = notifyArrivals(arrivals, {
            NotificationClass,
            formatPrice: euro,
            onClick: (item) => {
              window.focus();
              window.open(item.url, "_blank", "noopener");
            },
          });
        } else if (NotificationClass?.permission === "granted") {
          const note = new NotificationClass(`${arrivals.length} neue Fahrzeuge gefunden`, {
            body: arrivals.slice(0, 3).map((item) => `${item.title} · ${euro(item.price)}`).join("\n"),
            tag: "neue-angebote",
            silent: true,
          });
          note.onclick = () => { window.focus(); note.close(); };
          sent = true;
        }
        if (!sent) throw new Error("Permission unavailable");
      } catch {
        toast.error("Desktop-Meldung blockiert. Bitte Browser- und Windows-Benachrichtigungen prüfen.", { id: "feed-notification" });
      }
    }
  };

  const noteFailure = (source, failed) => {
    failuresRef.current = { ...failuresRef.current, [source]: failed ? (failuresRef.current[source] || 0) + 1 : 0 };
    setFailures(failuresRef.current);
  };

  /* one check of one portal */
  const checkSource = useCallback(async (source, { page = 1, baseline = false } = {}) => {
    const requestKey = page === 1 ? source : `${source}:coverage`;
    // Live, manual and catch-up checks share one slot per portal. A slow older
    // page must not cause concurrent requests to a rate-limited portal.
    if (!applied || !navigator.onLine ||
        inFlightRef.current[source] || inFlightRef.current[`${source}:coverage`]) return null;
    const generation = generationRef.current;
    const controller = new AbortController();
    inFlightRef.current[requestKey] = controller;
    const serverStarted = Date.now() + clockOffsetRef.current;
    const current = () => generation === generationRef.current && !controller.signal.aborted;
    setPending((count) => count + 1);
    try {
      let finalStatus = null;
      let newestId = 0;
      let discovered = 0;
      const scopeOverlap = new Map();
      const knownAtStart = new Set(Object.keys(storeRef.current.seen || {}));
      await requestCheck(applied, source, { page, signal: controller.signal, onEvent: (data) => {
        if (!current()) return;
        if (data.type === "complete") {
          const status = (data.sources || []).find((entry) => entry.id === source) || { id: source, ok: false };
          const overlap = scopeOverlap.size > 0 && [...scopeOverlap.values()].every(Boolean);
          finalStatus = { ...status, newestId, overlap, ...(page > 1 && status.error ? { ok: false } : {}) };
          if (page > 1) {
            if (finalStatus.ok) {
              const store = { ...storeRef.current, coverageReady: { ...storeRef.current.coverageReady, [source]: true } };
              storeRef.current = store;
              persist(store);
            }
            return;
          }
          const serverAt = Date.parse(data.checkedAt);
          if (Number.isFinite(serverAt)) {
            // Median of the last few samples: one slow answer must not skew it.
            const samples = [...clockSamplesRef.current, serverAt - Date.now()].slice(-7);
            clockSamplesRef.current = samples;
            clockOffsetRef.current = samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)];
          }
          const order = applied.sources;
          setSources((list) =>
            [...list.filter((entry) => entry.id !== source), { ...status, discovered, checkedAt: data.checkedAt }]
              .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)),
          );
          setLastCheck(data.checkedAt);
          noteFailure(source, !status.ok && !status.skipped);
          return;
        }
        if (data.type !== "batch" || data.source !== source || !data.ok) return;
        const at = Date.now();
        const atIso = new Date(at).toISOString();
        // Read the memory only now: another portal may have answered meanwhile.
        const store = storeRef.current;
        const items = (Array.isArray(data.items) ? data.items : []).filter((item) => item.source === source);
        const scopeKey = data.scope || source;
        scopeOverlap.set(scopeKey, Boolean(scopeOverlap.get(scopeKey)) ||
          (!data.partial && items.length === 0) || items.some((item) => !item.promoted && knownAtStart.has(item.key)));
        for (const item of items) {
          if (!item.promoted && Number.isFinite(item.numericId) && item.numericId > newestId) newestId = item.numericId;
        }
        const { fresh, seen, kaMaxId, baselines, watermarks, freshness } = detectNew(store, items, at, {
          answered: [source],
          scope: data.scope || null,
          backfill: baseline,
          partial: Boolean(data.partial),
        });
        const { feed: matchedFeed, arrivals } = mergeFeed(store.feed, items, fresh, atIso);
        discovered += arrivals.length;
        // Baseline IDs stay in `seen`; old listing cards need no state/storage.
        const nextFeed = matchedFeed.filter((item) => item.isNew);

        const nextStore = { ...store, baselineDone: true, baselines, watermarks, freshness, seen, kaMaxId, feed: nextFeed };
        storeRef.current = nextStore;
        persist(nextStore);
        setFeed(nextFeed);

        if (arrivals.length) {
          announceRef.current(arrivals);
          // Kleinanzeigen tolerates reading a new car's ad page: HU, accident
          // and owners arrive by themselves (a few per round). AutoScout24 ad
          // pages load only when the dealer asks — it blocks readily.
          const readable = arrivals.filter((item) => item.source === "KLEINANZEIGEN").slice(0, 4);
          if (readable.length) loadDetails(readable, { first: true });
        }

        setLastCheck(data.checkedAt || atIso);
      } });
      if (page === 1 && source === "KLEINANZEIGEN" && finalStatus?.ok && current()) noteKaCheck(serverStarted, newestId);
      return finalStatus;
    } catch (error) {
      if (!current() || error.name === "AbortError") return null;
      if (page > 1) return { id: source, ok: false, error: error.message };
      if (error.status === 401) {
        routerRef.current.push("/login");
        return { id: source, ok: false, skipped: true };
      }
      noteFailure(source, true);
      setSources((list) => [...list.filter((entry) => entry.id !== source), {
        id: source, label: SOURCES.find((entry) => entry.id === source)?.label || source,
        ok: false, error: error.message, checkedAt: new Date().toISOString(),
      }]);
      toast.error(`Prüfung fehlgeschlagen: ${error.message}`, { id: "feed-error" });
      return { id: source, ok: false };
    } finally {
      if (inFlightRef.current[requestKey] === controller) delete inFlightRef.current[requestKey];
      if (generation === generationRef.current) {
        setPending((count) => Math.max(0, count - 1));
      }
    }
  }, [applied, persist, loadDetails]);

  const checkAll = () => applied?.sources.forEach((source) => checkSource(source));

  /**
   * After each Kleinanzeigen check: did its newest ad number go up? Then its
   * search refreshed since the last check — confirm or correct when that
   * happens in its two-minute cycle.
   */
  const noteKaCheck = (serverAt, newestId) => {
    const before = kaRef.current;
    const after = observeKa(before, serverAt, newestId);
    if (after.landing !== before.landing) writeJson(KA_TIMING_STORE, { landing: after.landing, at: Date.now() });
    kaRef.current = after;
  };


  /* the loops: one per portal, each at a fixed pace — slower after repeated failures */
  useEffect(() => {
    if (!running || !pageOnline || !applied) return undefined;
    let cancelled = false;

    const loops = applied.sources.map((source, index) => {
      const loop = { source, ticker: createTicker(), stopped: false, nextAt: 0 };
      loop.run = async () => {
        if (cancelled) return;
        const started = Date.now();
        // Back after a gap (page closed, PC asleep, offline): start a new
        // session, so the cars that went online meanwhile are not announced
        // as if they had just arrived.
        if (lastAliveRef.current && started - lastAliveRef.current > SESSION_GAP_MS) {
          storeRef.current = startSession(storeRef.current, started);
          persist(storeRef.current);
        }
        lastStartRef.current[source] = started;
        const status = await checkSource(source);
        if (status?.ok) lastAliveRef.current = Date.now();
        if (cancelled) return;
        // No access (mobile.de without the API): nothing to ask until that changes.
        if (status?.skipped) {
          loop.stopped = true;
          return;
        }

        const serverNow = Date.now() + clockOffsetRef.current;
        const delay = nextCheckDelay({
          intervalMs: source === "AUTOSCOUT24" ? Math.max(AUTOSCOUT_MIN_INTERVAL_MS, intervalSec * 1_000) : intervalSec * 1_000,
          elapsedMs: Date.now() - started,
          failures: failuresRef.current[source] || 0,
          retryAfterMs: status?.retryAfterMs || 0,
          recoveryIntervalMs: status?.recoveryIntervalMs || 0,
          preferredDelayMs: source === "KLEINANZEIGEN" && serverNow >= kaRef.current.relearnUntil
            ? nextKaCheck(serverNow, kaRef.current.landing) - serverNow : undefined,
        });
        loop.nextAt = Date.now() + delay;
        setNextChecks((current) => ({ ...current, [source]: loop.nextAt }));
        loop.ticker.set(delay, loop.run);
      };
      // A few hundred milliseconds apart, so the portals are not hit in the same instant.
      loop.ticker.set(index * 300, loop.run);
      return loop;
    });

    // Coming back to a tab the browser slowed down: check right away where due.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      for (const loop of loops) {
        if (!loop.stopped && !inFlightRef.current[loop.source] && Date.now() >= loop.nextAt) {
          loop.ticker.set(0, loop.run);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      cancelled = true;
      for (const loop of loops) {
        loop.ticker.stop();
        inFlightRef.current[loop.source]?.abort();
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [running, pageOnline, applied, intervalSec, checkSource, persist]);

  /* start with a filter: load that filter's memory, or begin a new baseline */
  const apply = ({ start = running } = {}) => {
    flushSaves();
    cancelSearch();
    lastStartRef.current = {};
    lastAliveRef.current = 0;
    setPending(0);
    setLastCheck(null);
    setNextChecks({});
    const normalized = normalizeFilters(draft);
    writeJson(FILTER_STORE, draft);
    const saved = readJson(FEED_STORE(filterKey(normalized)), null) || emptyStore();
    // Memory from before portals were checked one by one: a portal counts as
    // started where ads of it were already seen.
    if (!saved.baselines) {
      const started = new Set(Object.keys(saved.seen || {}).map((itemKey) => itemKey.split(":")[0]));
      saved.baselines = saved.baselineDone ? Object.fromEntries([...started].map((source) => [source, true])) : {};
    }
    // Starting (or reopening the page) is a new session: what is online now is
    // the baseline, whatever went online while the page was closed is not
    // announced. Cards found earlier stay in the list.
    // A lookup still "loading" when the page was closed never finished.
    const store = {
      ...startSession(saved),
      feed: (saved.feed || []).filter((entry) => entry.isNew).map((entry) =>
        entry.detailsState === "loading" ? { ...entry, detailsState: undefined } : entry,
      ),
    };
    detailQueueRef.current = [];
    failuresRef.current = {};
    setFailures({});
    storeRef.current = store;
    setFeed(store.feed || []);
    setHidden([]);
    setSources([]);
    setApplied(normalized);
    startedRef.current = start;
    setRunning(start);
    draftAtOpenRef.current = null;
    setShowFilters(false);
    setUnread(0);
    if (start && sound) void playAlertSound();
  };

  /** The one start/pause button on the page. Without a filter it starts with the current fields. */
  const toggleSearch = () => {
    if (!applied) {
      apply({ start: true });
      return;
    }
    if (!running && sound) void playAlertSound();
    if (!running) startedRef.current = true;
    setRunning(!running);
  };

  // The filter window edits a copy: closing it without "Übernehmen" puts the
  // fields back the way they were.
  const draftAtOpenRef = useRef(null);
  // Started at least once with this filter: "pausiert" instead of "nicht gestartet".
  const startedRef = useRef(false);
  const openFilters = () => {
    draftAtOpenRef.current = draft;
    setShowFilters(true);
  };
  const closeFilters = useCallback(() => {
    if (draftAtOpenRef.current) setDraft(draftAtOpenRef.current);
    draftAtOpenRef.current = null;
    setShowFilters(false);
  }, []);

  const resetFeed = () => {
    if (!key) return;
    cancelSearch();
    setPending(0);
    const store = emptyStore();
    storeRef.current = store;
    persist(store);
    setFeed([]);
    toast("Liste geleert – die nächste Prüfung setzt einen neuen Startpunkt.");
  };

  const askNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Dieser Browser unterstützt keine Benachrichtigungen.");
      return;
    }
    if (notify) {
      setNotify(false);
      return;
    }
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Benachrichtigungen nicht erlaubt. Bitte in den Website-Einstellungen des Browsers freigeben.");
        return;
      }
      setNotify(true);
      new Notification("Benachrichtigungen aktiviert", {
        body: "Neue Fahrzeuge erscheinen hier, während die Live-Suche läuft.",
        tag: "neue-angebote-test", silent: true,
      });
    } catch {
      setNotify(false);
      toast.error("Desktop-Meldungen sind in diesem Browser nicht verfügbar. Bitte Chrome oder Edge verwenden.");
    }
  };

  const visible = useMemo(() => feed.filter((item) =>
    !hidden.includes(item.key) && (!applied || applied.sources.includes(item.source))), [feed, hidden, applied]);
  // Use the portal date where available; late discovery must not move an
  // earlier upload above a later one. Undated sources remain explicitly found.
  const listingTime = (item) => item.postedAt || item.firstSeenAt;
  const fresh = visible.filter((item) => item.isNew)
    .sort((a, b) => Date.parse(listingTime(b)) - Date.parse(listingTime(a)));
  const latestAt = fresh.length ? listingTime(fresh[0]) : "";
  const roundStart = latestAt ? new Date(latestAt).getTime() - 10_000 : 0;
  const inLatest = (item) => new Date(listingTime(item)).getTime() >= roundStart;
  const latest = fresh.filter(inLatest);
  const earlier = fresh.filter((item) => !inLatest(item));
  const hide = useCallback((itemKey) => setHidden((list) => [...list, itemKey]), []);

  if (status === "loading") {
    return <PageLoader />;
  }

  const sourceDot = (source) =>
    source.paused ? "bg-amber-500" : source.ok ? "bg-emerald-500" : source.skipped ? "bg-slate-400" : "bg-amber-500";
  const renderRows = (list, { isLatest = false } = {}) =>
    list.map((item) => (
      <ListingCard
        key={item.key}
        item={item}
        now={Math.floor(now / 60_000) * 60_000}
        latest={isLatest}
        onHide={hide}
        onLoadDetails={loadCardDetails}
      />
    ));

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        {/* filter summary (the filter itself opens as a window), with the live controls */}
        <section className="ind-panel mb-4">
          <div
            className="ind-toolbar flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:flex-nowrap"
          >
            <FiSliders className="size-4 shrink-0 text-[#5d6671]" />
            <span className="shrink-0 text-[13px] font-semibold text-ink">Suchfilter</span>
            {applied ? (
              <button
                type="button"
                onClick={openFilters}
                title="Filter bearbeiten"
                className="order-last flex h-[22px] w-full min-w-0 flex-wrap gap-1 overflow-hidden text-left sm:order-none sm:w-auto sm:flex-1"
              >
                {describeFilters(applied).split(" · ").map((part) => (
                  <span key={part} className="inline-flex h-[22px] items-center whitespace-nowrap rounded-[3px] border border-[#c9ced5] bg-white px-1.5 text-[11px] font-medium text-body">
                    {part}
                  </span>
                ))}
              </button>
            ) : (
              <span className="min-w-0 flex-1 truncate text-[12px] text-muted">Noch kein Filter gesetzt</span>
            )}
            <button type="button" onClick={openFilters} className="btn btn-sm btn-secondary ml-auto shrink-0">
              <FiEdit2 /> {applied ? "Filter bearbeiten" : "Filter festlegen"}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-body">
                    <span className={`size-1.5 rounded-full ${running ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {running ? (pageOnline ? "Live-Suche läuft" : "Suche wartet – offline") : startedRef.current ? "Live-Suche pausiert" : "Live-Suche nicht gestartet"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={intervalSec}
                      onChange={(e) => setIntervalSec(Number(e.target.value))}
                      title="Prüfintervall für alle Portale. Bei Verbindungsfehlern oder Portal-Sperren wird automatisch gewartet."
                      aria-label="Prüfintervall"
                      className="field h-7 w-auto text-[12px]"
                    >
                      {INTERVALS.map((seconds) => (
                        <option key={seconds} value={seconds}>{seconds === 3 ? "Live · alle 3 s" : `alle ${seconds} s`}</option>
                      ))}
                    </select>
                    <div className="ind-actions">
                      <button type="button" onClick={checkAll} disabled={checking || !applied} title="Jetzt prüfen" aria-label="Jetzt prüfen" className="ind-act disabled:opacity-50">
                        <FiRefreshCw className={checking ? "animate-spin" : ""} />
                      </button>
                      <button type="button" onClick={() => { if (!sound) void playAlertSound(); setSound(!sound); }} title={sound ? "Ton aus" : "Ton an"} aria-label={sound ? "Ton aus" : "Ton an"} className="ind-act">
                        {sound ? <FiVolume2 /> : <FiVolumeX className="opacity-50" />}
                      </button>
                      <button type="button" className="ind-act" style={{ width: "auto", padding: "0 8px", fontSize: 12, fontWeight: 600 }} title="Ton und aktivierte Desktop-Meldung testen" onClick={() => {
                        void playAlertSound();
                        if (notify) {
                          try {
                            if (typeof Notification === "undefined" || Notification.permission !== "granted") throw new Error("Permission unavailable");
                            new Notification(`${PAGE_NAME} · Test`, { body: "Desktop-Benachrichtigungen sind aktiviert.", tag: "neue-angebote-test", silent: true });
                          } catch { toast.error("Desktop-Meldung blockiert. Bitte Browser- und Windows-Einstellungen prüfen."); }
                        }
                      }}>Test</button>
                      <button type="button" onClick={askNotifications} title="Desktop-Benachrichtigung" aria-label="Desktop-Benachrichtigung" aria-pressed={notify} className={`ind-act ${notify ? "ind-act-on" : ""}`}>
                        {notify ? <FiBell /> : <FiBellOff className="opacity-50" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={toggleSearch}
                      className={`btn btn-sm ${running ? "btn-secondary" : "btn-primary"}`}
                    >
                      {running ? <><FiPause /> Pausieren</> : <><FiPlay /> Live-Suche starten</>}
                    </button>
                  </div>
          </div>
        </section>

        <FilterWindow
          open={showFilters}
          onClose={closeFilters}
          draft={draft}
          setDraft={setDraft}
          onApply={() => apply()}
        />

        {/* status line: portals, last check */}
        {applied && sources.length ? (
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
            {sources.map((source) => (
              <span
                key={source.id}
                title={source.error || (Number.isFinite(source.durationMs) ? `Antwort in ${(source.durationMs / 1000).toFixed(1).replace(".", ",")} s` : "")}
                className="inline-flex items-center gap-1.5"
              >
                <span className={`size-1.5 rounded-full ${sourceDot(source)}`} />
                {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{source.label}</a> : <span>{source.label}</span>}
                {source.ok && !source.paused ? (
                  <span>{source.count} geprüft · {source.discovered || 0} neu{Number.isFinite(source.total) ? ` · ${source.total.toLocaleString("de-DE")} insgesamt` : ""} · {Number.isFinite(source.durationMs) ? `${(source.durationMs / 1000).toFixed(1)} s` : ""}</span>
                ) : (
                  <span className={source.skipped ? "" : "text-amber-700"}>
                    {source.paused ? "pausiert" : /freigeschaltet|nicht eingerichtet/.test(source.error || "") ? "kein Zugang" : "nicht erreichbar"}
                  </span>
                )}
              </span>
            ))}
            {lastCheck ? <span>Letzte Antwort: {clock(lastCheck)} · {Math.max(0, Math.floor((now - new Date(lastCheck).getTime()) / 1000))} s her</span> : null}
            {running ? <span>{sources.filter((source) => !source.skipped).map((source) =>
              `${source.label}: ${nextChecks[source.id] > now ? `in ${Math.ceil((nextChecks[source.id] - now) / 1000)} s` : "prüft …"}`).join(" · ")}</span> : null}
            {Object.entries(failures).some(([, count]) => count >= 3) ? (
              <span className="w-full text-amber-700">
                {Object.entries(failures)
                  .filter(([, count]) => count >= 3)
                  .map(([id]) => SOURCES.find((entry) => entry.id === id)?.label || id)
                  .join(", ")}
                : Verbindung gestört – automatische Wiederholung; Wartezeit siehe oben.
              </span>
            ) : null}
          </div>
        ) : null}

        {/* the feed */}
        {!applied ? (
          <div className="card px-6 py-12 text-center">
            <FiZap className="mx-auto size-8 text-line-strong" />
            <p className="mt-3 text-sm font-medium text-ink">Filter festlegen, dann Live-Suche starten</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">
              Solange diese Seite offen ist, werden die Portale im Live-Modus alle 3 Sekunden geprüft.
              Entdeckte Fahrzeuge erscheinen direkt nach der Portalantwort – mit Ton und auf Wunsch als Desktop-Benachrichtigung.
            </p>
            <button type="button" onClick={openFilters} className="btn btn-secondary mt-4">
              <FiSliders /> Filter festlegen
            </button>
          </div>
        ) : (
          <>
            {fresh.length ? (
              <>
                <FeedSection
                  live
                  title="Neu entdeckt"
                  count={latest.length}
                  meta={`${fresh[0]?.postedAt ? "Portal-Zeit" : "Gefunden"} ${clock(latestAt)} · ${ago(latestAt, now)}`}
                >
                  {renderRows(latest, { isLatest: true })}
                </FeedSection>

                {earlier.length ? (
                  <FeedSection title="Davor reingekommen" count={earlier.length} meta="seit dem Start">
                    {renderRows(earlier)}
                  </FeedSection>
                ) : null}
              </>
            ) : (
              <div className="mb-5 flex items-center justify-center gap-2.5 rounded-[4px] border border-dashed border-line-strong px-6 py-8 text-[13px] text-muted">
                {checking && !lastCheck ? (
                  <><FiLoader className="animate-spin" /> Erste Prüfung läuft …</>
                ) : (
                  <><span className={`size-2 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} /> {running ? "Warte auf neue Anzeigen – Treffer erscheinen direkt nach der Portalantwort." : startedRef.current ? "Live-Suche pausiert." : "Filter übernommen – zum Starten oben „Live-Suche starten“ drücken."}</>
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
              <span>
                Live-Prüfung alle {intervalSec} s · Neue Treffer erscheinen direkt nach der Portalantwort.
              </span>
              {feed.length ? (
                <button type="button" onClick={resetFeed} className="inline-flex items-center gap-1 hover:text-rose-700">
                  <FiTrash2 /> Liste leeren
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
