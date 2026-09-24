"use client";

/**
 * Neue Angebote — the newest cars on AutoScout24, Kleinanzeigen and mobile.de,
 * as they are uploaded.
 *
 * While this page is open it asks the server every 5–120 seconds for the
 * newest ads matching the filter (sorted newest first on each portal). Each
 * portal is asked on its own, at a fixed pace, so a slow answer from one never
 * delays the cars from another. A portal's first answer is its baseline: what
 * was already online. Everything that turns up after that is new and lands at
 * the top, with a sound and a desktop notification if wanted.
 *
 * "New" means first discovered by this search, not a verified upload time.
 * Every returned match is kept; ordering and ad IDs must not hide vehicles.
 *
 * Runs without a paid Vercel plan: no background job, the open page drives it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  FiBell,
  FiBellOff,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiEyeOff,
  FiFilter,
  FiLoader,
  FiMapPin,
  FiMenu,
  FiPause,
  FiPlay,
  FiRefreshCw,
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiZap,
} from "react-icons/fi";

import { useSidebar } from "@/app/(components)/SidebarContext";
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
import { detectNew, mergeFeed } from "@/lib/feed/detect";
import { readCheckStream } from "@/lib/feed/live";

const FILTER_STORE = "neueAngebote.filters.v1";
const SETTINGS_STORE = "neueAngebote.settings.v1";
const FEED_STORE = (key) => `neueAngebote.feed.v1.${key}`;
const MAX_SAVED_FEED = 500;
// Fast polling still depends on portal publication and response time.
// Refusals retain the server cooldown and client failure backoff.
const INTERVALS = [5, 15, 30, 60, 120];

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
  return { baselineDone: false, seen: {}, kaMaxId: 0, feed: [] };
}

/**
 * A timer that keeps its pace in a background tab. Browsers slow page timers
 * in hidden tabs to about once a minute; timers inside a Web Worker are not
 * slowed that way. Falls back to a plain timer where workers are unavailable.
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

/** A short two-tone chime, made on the spot — no sound file to ship. */
function chime() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const context = chime.context || (chime.context = new Context());
    const now = context.currentTime;
    [880, 1320].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.3);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + index * 0.16);
      oscillator.stop(now + index * 0.16 + 0.32);
    });
  } catch {
    // No audio — the list and the title still show it.
  }
}

/* ------------------------------------------------------------------- UI bits */

/**
 * A labelled field. `group` for several controls (chips, two inputs): a
 * <label> may only name one control, so those become a named group instead.
 */
/**
 * A labelled field. `group` for several controls (chips, two inputs): a
 * <label> may only name one control, so those become a named group instead.
 */
function Field({ label, children, dark, group = false, className = "" }) {
  const caption = (
    <span className={`mb-1.5 block text-[10.5px] font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>
      {label}
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

const boxClass = (dark) =>
  `rounded-md border transition focus-within:ring-2 ${
    dark
      ? "border-slate-700 bg-slate-900 focus-within:border-slate-500 focus-within:ring-slate-500/20"
      : "border-slate-300 bg-white focus-within:border-slate-400 focus-within:ring-slate-900/5"
  }`;

/** From–to in one box: "von | bis  €". */
function RangeInputs({ from, to, onFrom, onTo, dark, suffix, label = "" }) {
  const input = `h-8 w-full min-w-0 bg-transparent px-2.5 text-[13px] tabular-nums outline-none ${
    dark ? "placeholder:text-slate-600" : "placeholder:text-slate-400"
  }`;
  return (
    <div className={`flex items-center ${boxClass(dark)}`}>
      <input inputMode="numeric" aria-label={`${label} von`} value={from} onChange={(e) => onFrom(e.target.value)} placeholder="von" className={input} />
      <span className={`h-4 w-px shrink-0 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <input inputMode="numeric" aria-label={`${label} bis`} value={to} onChange={(e) => onTo(e.target.value)} placeholder="bis" className={input} />
      {suffix ? <span className={`hidden shrink-0 pr-2.5 text-[11px] sm:inline ${dark ? "text-slate-500" : "text-slate-400"}`}>{suffix}</span> : null}
    </div>
  );
}

function Toggle({ active, onClick, children, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-7 rounded-md border px-2.5 text-[12px] font-medium transition ${
        active
          ? dark
            ? "border-slate-200 bg-slate-100 text-slate-900"
            : "border-slate-900 bg-slate-900 text-white"
          : dark
            ? "border-slate-700 text-slate-300 hover:border-slate-500"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function FilterPanel({ draft, setDraft, dark, onApply, running }) {
  const set = (field) => (value) => setDraft((current) => ({ ...current, [field]: value }));
  const toggleIn = (field, id) =>
    setDraft((current) => {
      const list = current[field] || [];
      return { ...current, [field]: list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id] };
    });
  const control = `h-8 w-full bg-transparent px-2.5 text-[13px] outline-none ${dark ? "text-slate-100" : "text-slate-800"}`;
  const muted = dark ? "text-slate-400" : "text-slate-500";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 px-4 pt-4 sm:gap-x-4 lg:grid-cols-4">
        <Field label="Preis" dark={dark} group>
          <RangeInputs dark={dark} label="Preis" from={draft.priceMin} to={draft.priceMax} onFrom={set("priceMin")} onTo={set("priceMax")} suffix="€" />
        </Field>
        <Field label="Kilometerstand" dark={dark} group>
          <RangeInputs dark={dark} label="Kilometerstand" from={draft.kmMin} to={draft.kmMax} onFrom={set("kmMin")} onTo={set("kmMax")} suffix="km" />
        </Field>
        <Field label="Erstzulassung" dark={dark} group>
          <RangeInputs dark={dark} label="Erstzulassung" from={draft.yearMin} to={draft.yearMax} onFrom={set("yearMin")} onTo={set("yearMax")} suffix="Jahr" />
        </Field>
        <Field label="Leistung" dark={dark} group>
          <RangeInputs dark={dark} label="Leistung" from={draft.powerMin} to={draft.powerMax} onFrom={set("powerMin")} onTo={set("powerMax")} suffix="PS" />
        </Field>

        <Field label="Marke" dark={dark}>
          <div className={boxClass(dark)}>
            <input value={draft.make} onChange={(e) => set("make")(e.target.value)} placeholder="Alle Marken" className={control} />
          </div>
        </Field>
        <Field label="Getriebe" dark={dark}>
          <div className={boxClass(dark)}>
            <select value={draft.gearbox} onChange={(e) => set("gearbox")(e.target.value)} className={control}>
              {GEARBOXES.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.id === "ANY" ? "Alle" : entry.label}</option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Anbieter" dark={dark}>
          <div className={boxClass(dark)}>
            <select value={draft.seller} onChange={(e) => set("seller")(e.target.value)} className={control}>
              {SELLERS.map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.id === "ALL" ? "Privat und Händler" : entry.label}</option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Standort" dark={dark} group className="col-span-2 sm:col-span-1">
          <div className={`flex items-center ${boxClass(dark)}`}>
            <select
              aria-label="Suchgebiet"
              value={Number(draft.radius) || 0}
              onChange={(e) => set("radius")(Number(e.target.value))}
              className={
                Number(draft.radius)
                  ? `h-8 w-[7.5rem] shrink-0 bg-transparent px-2.5 text-[13px] outline-none ${dark ? "text-slate-100" : "text-slate-800"}`
                  : control
              }
            >
              <option value={0}>Ganz Deutschland</option>
              {RADII.map((radius) => (
                <option key={radius} value={radius}>{radius} km um</option>
              ))}
            </select>
            {Number(draft.radius) ? (
              <>
                <span className={`h-4 w-px shrink-0 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
                <input
                  inputMode="numeric"
                  maxLength={5}
                  value={draft.zip}
                  onChange={(e) => set("zip")(e.target.value.replace(/\D/g, ""))}
                  placeholder="PLZ"
                  aria-label="Postleitzahl"
                  className={`${control} min-w-0 flex-1 tabular-nums`}
                />
              </>
            ) : null}
          </div>
          {Number(draft.radius) && draft.zip.length < 5 ? (
            <p className="mt-1 text-[11px] text-amber-600">PLZ eingeben – sonst ganz Deutschland.</p>
          ) : null}
        </Field>

        <Field label="Kraftstoff" dark={dark} group className="col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {FUELS.map((fuel) => (
              <Toggle key={fuel.id} dark={dark} active={draft.fuels.includes(fuel.id)} onClick={() => toggleIn("fuels", fuel.id)}>
                {fuel.label}
              </Toggle>
            ))}
          </div>
        </Field>
        <Field label="Fahrzeugtyp" dark={dark} group className="col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {BODIES.map((body) => (
              <Toggle key={body.id} dark={dark} active={draft.bodies.includes(body.id)} onClick={() => toggleIn("bodies", body.id)}>
                {body.label}
              </Toggle>
            ))}
          </div>
        </Field>
      </div>

      {draft.sources.includes("KLEINANZEIGEN") && kleinanzeigenSearchCount(draft) > 1 ? (
        <p className={`mx-4 mt-3 text-[11.5px] ${dark ? "text-amber-300" : "text-amber-700"}`}>
          Kleinanzeigen braucht für diese Auswahl {kleinanzeigenSearchCount(draft)} Suchen pro Prüfung. Am schnellsten und
          sichersten: eine Kraftstoffart und einen Fahrzeugtyp wählen – oder keinen.
        </p>
      ) : null}

      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 ${
          dark ? "border-slate-800" : "border-slate-100"
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="group" aria-label="Portale" className="flex flex-wrap items-center gap-1.5">
            <span className={`mr-1 text-[10.5px] font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>Portale</span>
            {SOURCES.map((source) => (
              <Toggle key={source.id} dark={dark} active={draft.sources.includes(source.id)} onClick={() => toggleIn("sources", source.id)}>
                {source.label}
              </Toggle>
            ))}
          </div>
          <label className={`flex items-center gap-2 text-[12px] ${muted}`}>
            <input type="checkbox" className="size-3.5 accent-slate-900" checked={draft.hideDamaged} onChange={(e) => set("hideDamaged")(e.target.checked)} />
            Unfall- und Defektfahrzeuge ausblenden
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_FILTERS })}
            className={`h-8 rounded-md px-3 text-[12px] font-medium ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
          >
            Zurücksetzen
          </button>
          <button
            type="submit"
            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-[12px] font-semibold ${
              dark ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {running ? "Übernehmen" : <><FiPlay className="size-3" /> Live-Suche starten</>}
          </button>
        </div>
      </div>
    </form>
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
function factClass(tone, dark) {
  if (tone === "bad") return dark ? "bg-red-500/10 text-red-300 ring-red-500/20" : "bg-red-50 text-red-700 ring-red-200";
  if (tone === "warn") return dark ? "bg-amber-500/10 text-amber-300 ring-amber-500/20" : "bg-amber-50 text-amber-800 ring-amber-200";
  if (tone === "unknown") return dark ? "bg-slate-800/60 text-slate-500 ring-slate-700" : "bg-slate-50 text-slate-400 ring-slate-200";
  return dark ? "bg-slate-800 text-slate-200 ring-slate-700" : "bg-white text-slate-700 ring-slate-200";
}

const TONE_DOT = { good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500", neutral: "bg-slate-400", unknown: "bg-slate-300" };

function FactBox({ tone = "neutral", dark, children, dot = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-[3px] text-[11.5px] font-medium ring-1 ring-inset ${factClass(tone, dark)}`}>
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
function CardFacts({ item, dark, onLoad }) {
  const d = item.details;
  const muted = dark ? "text-slate-400" : "text-slate-500";

  if (!d) {
    if (item.detailsState === "loading") {
      return (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Details werden geladen">
          {[64, 72, 56, 80].map((width) => (
            <span key={width} style={{ width }} className={`h-[22px] animate-pulse rounded ${dark ? "bg-slate-800" : "bg-slate-100"}`} />
          ))}
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onLoad(item)}
        className="mt-3 self-start text-[12px] font-medium text-sky-700 hover:underline"
      >
        {item.detailsState === "error" ? "Details nicht lesbar – erneut versuchen" : "HU, Unfall und Halter laden"}
      </button>
    );
  }

  const huText = d.hu.label === "HU unbekannt" ? "HU ?" : d.hu.label + (d.hu.note ? ` · ${d.hu.note}` : "");
  const plus = d.goodSigns.filter((sign) => sign !== "Zahnriemen neu");

  return (
    <div className="mt-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <FactBox dark={dark} tone={d.hu.tone}>{huText}</FactBox>
        <FactBox dark={dark} tone={d.condition.tone}>{CONDITION_SHORT[d.condition.label] || d.condition.label}</FactBox>
        <FactBox dark={dark} tone={d.owners?.tone || "unknown"}>{d.owners ? d.owners.label : "Halter ?"}</FactBox>
        {d.usage ? (
          <FactBox dark={dark} tone={d.usage.level === "VERY_HIGH" ? "warn" : "neutral"} dot={false}>
            {d.usage.label.replace("/Jahr", " / Jahr")}
          </FactBox>
        ) : null}
        {d.redFlags.map((flag) => (
          <FactBox key={flag} dark={dark} tone="bad">{flag}</FactBox>
        ))}
      </div>
      {plus.length || d.equipment.length ? (
        <p className={`text-[12px] leading-5 ${muted}`}>
          {plus.length ? <span className={dark ? "text-slate-300" : "text-slate-600"}>{plus.join(" · ")}</span> : null}
          {plus.length && d.equipment.length ? <span className="mx-2 opacity-50">|</span> : null}
          {d.equipment.length ? d.equipment.join(", ") : null}
        </p>
      ) : null}
    </div>
  );
}

function ListingCard({ item, dark, now, onHide, onLoadDetails, latest = false }) {
  const source = SOURCES.find((entry) => entry.id === item.source);
  const sellerType =
    item.details?.sellerType && item.details.sellerType !== "UNKNOWN" ? item.details.sellerType : item.sellerType;
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const strong = dark ? "text-slate-100" : "text-slate-900";

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
    ? `online seit ${clock(item.postedAt)}`
    : item.isNew
      ? `entdeckt ${ago(item.firstSeenAt, now)}`
      : "passendes Angebot";

  const ratingColor = item.rating
    ? item.rating.tone === "good"
      ? "text-emerald-700"
      : item.rating.tone === "bad"
        ? "text-red-600"
        : muted
    : "";

  return (
    <article
      className={`group relative grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-lg border p-3.5 transition sm:grid-cols-[168px_minmax(0,1fr)_150px] sm:gap-x-5 sm:gap-y-0 sm:p-4 ${
        dark ? "bg-slate-900" : "bg-white"
      } ${
        latest
          ? dark ? "border-slate-600 shadow-[0_1px_0_rgba(0,0,0,0.3)]" : "border-slate-300 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
          : dark ? "border-slate-800" : "border-slate-200"
      } ${dark ? "hover:border-slate-600" : "hover:border-slate-300"}`}
    >
      {/* photo */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block aspect-[4/3] self-start overflow-hidden rounded-md sm:row-span-2 ${dark ? "bg-slate-800" : "bg-slate-100"}`}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          <div className={`flex size-full items-center justify-center text-[11px] ${muted}`}>kein Bild</div>
        )}
      </a>

      {/* the car */}
      <div className="min-w-0">
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 pr-6 text-[11px] ${muted}`}>
          {item.isNew ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                dark ? "text-emerald-300 ring-emerald-500/30" : "text-emerald-700 ring-emerald-600/25"
              }`}
            >
              <span className={`size-1 rounded-full bg-emerald-500 ${latest ? "animate-pulse" : ""}`} />
              {latest ? "Neueste" : "Neu"}
            </span>
          ) : null}
          <span>{source?.label || item.source}</span>
          <span aria-hidden>·</span>
          <span>{when}</span>
        </div>

        <h3 className={`mt-1 line-clamp-2 text-[15px] font-semibold leading-snug sm:line-clamp-1 ${strong}`}>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {item.title}
          </a>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {lead.map((entry, index) => (
            <span key={index} className={`text-[14px] font-semibold tabular-nums ${strong}`}>
              {entry.label ? <span className={`mr-1 text-[11px] font-medium ${muted}`}>{entry.label}</span> : null}
              {entry.value}
            </span>
          ))}
          {rest.length ? <span className={`text-[13px] ${muted}`}>{rest.join(" · ")}</span> : null}
        </div>

        <p className={`mt-1 flex min-w-0 items-center gap-1 text-[12px] ${muted}`}>
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
      </div>

      {/* facts: full width on a phone, under the car on a wider screen */}
      <div className="col-span-2 -mt-1 flex min-w-0 flex-col sm:col-span-1 sm:col-start-2 sm:mt-0">
        <CardFacts item={item} dark={dark} onLoad={onLoadDetails} />
      </div>

      {/* price and actions */}
      <div className="col-span-2 flex items-end justify-between gap-3 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col sm:items-end sm:justify-between">
        <div className="shrink-0 sm:text-right">
          <div className={`whitespace-nowrap text-[19px] font-bold tabular-nums leading-tight ${strong}`}>{euro(item.price)}</div>
          <div className="mt-0.5 text-[11px]">
            {item.priceNote ? <span className={muted}>{item.priceNote}</span> : null}
            {item.priceNote && item.rating ? <span className={`mx-1 ${muted}`}>·</span> : null}
            {item.rating ? <span className={`font-medium ${ratingColor}`}>{item.rating.label}</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`/marktanalyse?url=${encodeURIComponent(item.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ankaufs-Check in neuem Tab"
            className={`inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md px-2 text-[12px] font-medium ${
              dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FiZap className="size-3" /> Check
          </a>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[12px] font-semibold ${
              dark ? "bg-slate-100 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            Öffnen <FiExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onHide(item.key)}
        title="Ausblenden"
        aria-label="Ausblenden"
        className={`absolute right-2 top-2 rounded p-1 transition sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 ${
          dark ? "text-slate-500 hover:bg-slate-800 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        }`}
      >
        <FiEyeOff className="size-3.5" />
      </button>
    </article>
  );
}

/** A section heading with its cars below, spaced as separate cards. */
function FeedSection({ title, count, meta, dark, live = false, children }) {
  return (
    <section className="mb-7">
      <header className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2 px-0.5">
        <h2 className={`flex items-center gap-2 text-[13px] font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
          {live ? <span className="size-1.5 translate-y-[-1px] animate-pulse rounded-full bg-emerald-500" /> : null}
          {title}
          {Number.isFinite(count) ? (
            <span className={`rounded-full px-1.5 text-[11px] font-medium ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-200/70 text-slate-600"}`}>
              {count}
            </span>
          ) : null}
        </h2>
        {meta ? <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>{meta}</span> : null}
      </header>
      <div className={live ? "space-y-3" : "space-y-2.5"}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------------- page */

export default function NeueAngebotePage() {
  const { status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const [dark, setDark] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...DEFAULT_FILTERS }));
  const [applied, setApplied] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const [running, setRunning] = useState(false);
  // How many portal checks are under way right now.
  const [pending, setPending] = useState(0);
  const checking = pending > 0;
  const [intervalSec, setIntervalSec] = useState(5);
  const [sound, setSound] = useState(true);
  const [notify, setNotify] = useState(false);

  const [feed, setFeed] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);
  // Failed checks in a row, per portal.
  const [failures, setFailures] = useState({});
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

  /* restore settings */
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setDark(theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches));
    const savedFilters = readJson(FILTER_STORE, null);
    if (savedFilters) {
      setDraft({ ...DEFAULT_FILTERS, ...savedFilters });
    }
    const settings = readJson(SETTINGS_STORE, {});
    // Upgrade the previous default to fast mode; retain other chosen intervals.
    if (INTERVALS.includes(settings.intervalSec) &&
        (settings.v >= 3 || (settings.intervalSec !== 15 && (settings.v >= 2 || settings.intervalSec !== 60)))) {
      setIntervalSec(settings.intervalSec);
    }
    if (typeof settings.sound === "boolean") setSound(settings.sound);
    if (settings.notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotify(true);
    }
  }, []);

  useEffect(() => {
    writeJson(SETTINGS_STORE, { v: 3, intervalSec, sound, notify });
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
    const base = "Neue Angebote";
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

  const persist = useCallback(
    (store) => {
      if (!key) return;
      // Limit disk usage only. Never truncate the results the user is viewing.
      writeJson(FEED_STORE(key), { ...store, feed: store.feed.slice(0, MAX_SAVED_FEED) });
    },
    [key],
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

  /* sound, toast and desktop notification for new cars */
  const announceRef = useRef(null);
  announceRef.current = (arrivals) => {
    setUnread((count) => count + arrivals.length);
    if (soundRef.current) chime();
    const first = arrivals[0];
    toast.success(
      arrivals.length === 1 ? `Neu: ${first.title} · ${euro(first.price)}` : `${arrivals.length} neue Angebote`,
      { duration: 6_000 },
    );
    if (notifyRef.current && typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
      try {
        const note = new Notification(arrivals.length === 1 ? "Neues Angebot" : `${arrivals.length} neue Angebote`, {
          body: arrivals.slice(0, 3).map((item) => `${item.title} · ${euro(item.price)}`).join("\n"),
          icon: first.image || undefined,
          tag: "neue-angebote",
        });
        note.onclick = () => {
          window.focus();
          if (arrivals.length === 1) window.open(first.url, "_blank", "noopener");
          note.close();
        };
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    }
  };

  const noteFailure = (source, failed) => {
    failuresRef.current = { ...failuresRef.current, [source]: failed ? (failuresRef.current[source] || 0) + 1 : 0 };
    setFailures(failuresRef.current);
  };

  /* one check of one portal */
  const checkSource = useCallback(async (source) => {
    const requestKey = source;
    if (!applied || inFlightRef.current[requestKey]) return null;
    const generation = generationRef.current;
    const controller = new AbortController();
    inFlightRef.current[requestKey] = controller;
    const current = () => generation === generationRef.current && !controller.signal.aborted;
    setPending((count) => count + 1);
    try {
      const response = await fetch("/api/neue-angebote", {
        signal: controller.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: applied, source, stream: true }),
      });
      if (!current()) return null;
      if (response.status === 401) {
        routerRef.current.push("/login");
        return null;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Fehler ${response.status}`);
      }
      let finalStatus = null;
      let detailBudget = 10;
      await readCheckStream(response, (data) => {
        if (!current()) return;
        if (data.type === "complete") {
          const status = (data.sources || []).find((entry) => entry.id === source) || { id: source, ok: false };
          finalStatus = status;
          const order = applied.sources;
          setSources((list) =>
            [...list.filter((entry) => entry.id !== source), { ...status, checkedAt: data.checkedAt }]
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
        const { fresh, seen, kaMaxId, baselines, watermarks } = detectNew(store, items, at, {
          answered: [source],
          scope: data.scope || null,
        });
        const { feed: matchedFeed, arrivals } = mergeFeed(store.feed, items, fresh, atIso);
        // Baseline IDs stay in `seen`; old listing cards need no state/storage.
        const nextFeed = matchedFeed.filter((item) => item.isNew);

        const nextStore = { ...store, baselineDone: true, baselines, watermarks, seen, kaMaxId, feed: nextFeed };
        storeRef.current = nextStore;
        persist(nextStore);
        setFeed(nextFeed);

        if (arrivals.length) {
          announceRef.current(arrivals);
          // Read the ad pages of the new arrivals right away — at most ten per
          // check, so a flood of new ads cannot hammer the portals.
          loadDetails(arrivals.slice(0, detailBudget), { first: true });
          detailBudget = Math.max(0, detailBudget - arrivals.length);
        }

        setLastCheck(data.checkedAt || atIso);
      });
      return finalStatus;
    } catch (error) {
      if (!current() || error.name === "AbortError") return null;
      noteFailure(source, true);
      toast.error(`Prüfung fehlgeschlagen: ${error.message}`, { id: "feed-error" });
      return { id: source, ok: false };
    } finally {
      if (inFlightRef.current[requestKey] === controller) delete inFlightRef.current[requestKey];
      if (current()) {
        setPending((count) => Math.max(0, count - 1));
      }
    }
  }, [applied, persist, loadDetails]);

  const checkAll = () => applied?.sources.forEach((source) => checkSource(source));

  /* the loops: one per portal, each at a fixed pace — slower after repeated failures */
  useEffect(() => {
    if (!running || !applied) return undefined;
    let cancelled = false;

    const loops = applied.sources.map((source, index) => {
      const loop = { source, ticker: createTicker(), stopped: false };
      loop.run = async () => {
        if (cancelled) return;
        const started = Date.now();
        lastStartRef.current[source] = started;
        const status = await checkSource(source);
        if (cancelled) return;
        // No access (mobile.de without the API): nothing to ask until that changes.
        if (status?.skipped) {
          loop.stopped = true;
          return;
        }
        const period = (failuresRef.current[source] || 0) >= 3 ? 5 * 60_000 : intervalSec * 1_000;
        // The next check is due one interval after this one started, not after it ended.
        loop.ticker.set(Math.max(1_000, period - (Date.now() - started)), loop.run);
      };
      // A few hundred milliseconds apart, so the portals are not hit in the same instant.
      loop.ticker.set(index * 300, loop.run);
      return loop;
    });

    // Coming back to a tab the browser slowed down: check right away where due.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      for (const loop of loops) {
        const last = lastStartRef.current[loop.source] || 0;
        const period = (failuresRef.current[loop.source] || 0) >= 3 ? 5 * 60_000 : intervalSec * 1_000;
        if (!loop.stopped && !inFlightRef.current[loop.source] && Date.now() - last > period + 1_000) {
          loop.ticker.set(0, loop.run);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      for (const loop of loops) loop.ticker.stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running, applied, intervalSec, checkSource]);

  /* start with a filter: load that filter's memory, or begin a new baseline */
  const apply = () => {
    cancelSearch();
    setPending(0);
    setLastCheck(null);
    const normalized = normalizeFilters(draft);
    writeJson(FILTER_STORE, draft);
    const saved = readJson(FEED_STORE(filterKey(normalized)), null) || emptyStore();
    // Memory from before portals were checked one by one: a portal counts as
    // started where ads of it were already seen.
    if (!saved.baselines) {
      const started = new Set(Object.keys(saved.seen || {}).map((itemKey) => itemKey.split(":")[0]));
      saved.baselines = saved.baselineDone ? Object.fromEntries([...started].map((source) => [source, true])) : {};
    }
    // A lookup still "loading" when the page was closed never finished.
    const store = {
      ...saved,
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
    setRunning(true);
    setShowFilters(false);
    setUnread(0);
    // A click is the one moment browsers allow sound to start.
    if (sound) {
      try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (Context && !chime.context) chime.context = new Context();
        chime.context?.resume?.();
      } catch {
        /* no audio */
      }
    }
  };

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
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotify(true);
      toast.success("Benachrichtigungen an – auch wenn der Tab im Hintergrund ist.");
    } else {
      toast.error("Benachrichtigungen wurden im Browser nicht erlaubt.");
    }
  };

  const visible = useMemo(() => feed.filter((item) =>
    !hidden.includes(item.key) && (!applied || applied.sources.includes(item.source))), [feed, hidden, applied]);
  const fresh = visible.filter((item) => item.isNew);
  // The newest of the new: what the most recent round of checks found. The
  // portals answer separately, so a round spans a few seconds.
  const latestAt = fresh.reduce((max, item) => (item.firstSeenAt > max ? item.firstSeenAt : max), "");
  const roundStart = latestAt ? new Date(latestAt).getTime() - 10_000 : 0;
  const inLatest = (item) => new Date(item.firstSeenAt).getTime() >= roundStart;
  const latest = fresh.filter(inLatest);
  const earlier = fresh.filter((item) => !inLatest(item));
  const hide = (itemKey) => setHidden((list) => [...list, itemKey]);


  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );
  }

  const muted = dark ? "text-slate-400" : "text-slate-500";
  const panel = dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const toolButton = `inline-flex h-7 items-center justify-center px-2 text-[12px] transition disabled:opacity-50 ${
    dark ? "hover:bg-slate-800" : "hover:bg-slate-50"
  }`;
  const sourceDot = (source) =>
    source.ok ? "bg-emerald-500" : source.skipped ? "bg-slate-400" : "bg-amber-500";
  const renderRows = (list, { isLatest = false, first = true } = {}) =>
    list.map((item) => (
      <ListingCard
        key={item.key}
        item={item}
        dark={dark}
        now={now}
        latest={isLatest}
        onHide={hide}
        onLoadDetails={(entry) => loadDetails([entry], { first })}
      />
    ));

  return (
    <main className={`min-h-screen ${dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="mx-auto max-w-[1200px] px-3 py-5 sm:px-6">
        {/* header */}
        <header className="mb-5 flex flex-wrap items-start gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className={`rounded-md p-2 md:hidden ${dark ? "bg-slate-900" : "bg-white shadow-sm"}`}
            aria-label="Menü öffnen"
          >
            <FiMenu />
          </button>
          <div className="mr-auto min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Neue Angebote</h1>
            <p className={`mt-0.5 text-[12px] ${muted}`}>
              Neue und passende Fahrzeuge in Deutschland · AutoScout24, Kleinanzeigen und mobile.de
            </p>
          </div>

        </header>

        {/* filters, with the live controls inside */}
        <section className={`mb-4 rounded-lg border ${panel}`}>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
            aria-expanded={showFilters}
          >
            <FiFilter className={muted} />
            <span className="text-[13px] font-semibold">Suchfilter</span>
            {!showFilters && applied ? (
              <span className={`min-w-0 flex-1 truncate text-[12px] ${muted}`}>{describeFilters(applied)}</span>
            ) : (
              <span className="flex-1" />
            )}
            <span className={`shrink-0 text-[12px] font-medium ${showFilters ? muted : "text-sky-700"}`}>
              {showFilters ? "Schließen" : "Bearbeiten"}
            </span>
            {showFilters ? <FiChevronUp className={muted} /> : <FiChevronDown className="text-sky-700" />}
          </button>
          {showFilters || applied ? (
            <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`}>
              {applied ? (
                <div
                  className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 ${
                    dark ? "border-slate-800 bg-slate-950/30" : "border-slate-100 bg-slate-50/70"
                  }`}
                >
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    <span className={`size-1.5 rounded-full ${running ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {running ? "Live-Suche läuft" : "Live-Suche pausiert"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className={`flex items-center divide-x overflow-hidden rounded-md border ${dark ? "divide-slate-700 border-slate-700 bg-slate-900" : "divide-slate-200 border-slate-300 bg-white"}`}>
                      <select
                        value={intervalSec}
                        onChange={(e) => setIntervalSec(Number(e.target.value))}
                        title="Wie oft geprüft wird"
                        aria-label="Prüfintervall"
                        className={`h-7 bg-transparent px-2 text-[12px] outline-none ${dark ? "text-slate-100" : ""}`}
                      >
                        {INTERVALS.map((seconds) => (
                          <option key={seconds} value={seconds}>{seconds === 5 ? "Schnell · alle 5 s" : `alle ${seconds} s`}</option>
                        ))}
                      </select>
                      <button type="button" onClick={checkAll} disabled={checking} title="Jetzt prüfen" aria-label="Jetzt prüfen" className={toolButton}>
                        <FiRefreshCw className={checking ? "animate-spin" : ""} />
                      </button>
                      <button type="button" onClick={() => setSound((value) => !value)} title={sound ? "Ton aus" : "Ton an"} aria-label={sound ? "Ton aus" : "Ton an"} className={toolButton}>
                        {sound ? <FiVolume2 /> : <FiVolumeX className={muted} />}
                      </button>
                      <button type="button" onClick={askNotifications} title="Desktop-Benachrichtigung" aria-label="Desktop-Benachrichtigung" className={`${toolButton} ${notify ? "text-emerald-600" : ""}`}>
                        {notify ? <FiBell /> : <FiBellOff className={muted} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRunning((value) => !value)}
                      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium ${
                        dark ? "border-slate-700 bg-slate-900 hover:bg-slate-800" : "border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      {running ? <><FiPause className="size-3" /> Pausieren</> : <><FiPlay className="size-3" /> Fortsetzen</>}
                    </button>
                  </div>
                </div>
              ) : null}
              {showFilters ? <FilterPanel draft={draft} setDraft={setDraft} dark={dark} onApply={apply} running={running} /> : null}
            </div>
          ) : null}
        </section>

        {/* status line: portals, last check */}
        {applied && sources.length ? (
          <div className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] ${muted}`}>
            {sources.map((source) => (
              <span
                key={source.id}
                title={source.error || (Number.isFinite(source.durationMs) ? `Antwort in ${(source.durationMs / 1000).toFixed(1).replace(".", ",")} s` : "")}
                className="inline-flex items-center gap-1.5"
              >
                <span className={`size-1.5 rounded-full ${sourceDot(source)}`} />
                {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{source.label}</a> : <span>{source.label}</span>}
                {source.ok ? (
                  <span>{source.count} geprüft{Number.isFinite(source.total) ? ` · ${source.total.toLocaleString("de-DE")} insgesamt` : ""} · {Number.isFinite(source.durationMs) ? `${(source.durationMs / 1000).toFixed(1)} s` : ""}</span>
                ) : (
                  <span className={source.skipped ? "" : "text-amber-600"}>
                    {source.paused ? "pausiert" : /freigeschaltet|nicht eingerichtet/.test(source.error || "") ? "kein Zugang" : "nicht erreichbar"}
                  </span>
                )}
              </span>
            ))}
            {lastCheck ? <span>Letzte Antwort: {clock(lastCheck)} · {Math.max(0, Math.floor((now - new Date(lastCheck).getTime()) / 1000))} s her</span> : null}
            {Object.entries(failures).some(([, count]) => count >= 3) ? (
              <span className="w-full text-amber-600">
                {Object.entries(failures)
                  .filter(([, count]) => count >= 3)
                  .map(([id]) => SOURCES.find((entry) => entry.id === id)?.label || id)
                  .join(", ")}
                : mehrere Prüfungen fehlgeschlagen – dort wird jetzt nur alle 5 Minuten geprüft.
              </span>
            ) : null}
          </div>
        ) : null}

        {/* the feed */}
        {!applied ? (
          <div className={`rounded-lg border px-6 py-12 text-center ${panel}`}>
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-sky-600/10">
              <FiZap className="text-lg text-sky-600" />
            </div>
            <p className="text-[15px] font-semibold">Filter setzen und Live-Suche starten</p>
            <p className={`mx-auto mt-1.5 max-w-md text-[13px] leading-6 ${muted}`}>
              Solange diese Seite offen ist, werden die Portale im Schnellmodus alle 5 Sekunden geprüft.
              Entdeckte Fahrzeuge erscheinen direkt nach der Portalantwort – mit Ton und auf Wunsch als Desktop-Benachrichtigung.
            </p>
          </div>
        ) : (
          <>
            {fresh.length ? (
              <>
                <FeedSection
                  dark={dark}
                  live
                  title="Neu entdeckt"
                  count={latest.length}
                  meta={`Prüfung um ${clock(latestAt)} · ${ago(latestAt, now)}`}
                >
                  {renderRows(latest, { isLatest: true })}
                </FeedSection>

                {earlier.length ? (
                  <FeedSection
                    dark={dark}
                    title="Davor reingekommen"
                    count={earlier.length}
                    meta="seit dem Start"
                  >
                    {renderRows(earlier)}
                  </FeedSection>
                ) : null}
              </>
            ) : (
              <div className={`mb-5 flex items-center justify-center gap-2.5 rounded-lg border border-dashed px-6 py-8 text-[13px] ${dark ? "border-slate-700" : "border-slate-300"} ${muted}`}>
                {checking && !lastCheck ? (
                  <><FiLoader className="animate-spin" /> Erste Prüfung läuft …</>
                ) : (
                  <><span className={`size-2 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} /> {running ? "Warte auf neue Anzeigen – Treffer erscheinen direkt nach der Portalantwort." : "Live-Suche pausiert."}</>
                )}
              </div>
            )}

            <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] ${muted}`}>
              <span>Prüfung alle {intervalSec} s · Veröffentlichung und Antwortzeit des Portals bestimmen die Verzögerung.</span>
              {feed.length ? (
                <button type="button" onClick={resetFeed} className="inline-flex items-center gap-1 hover:text-red-600">
                  <FiTrash2 /> Liste leeren
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
