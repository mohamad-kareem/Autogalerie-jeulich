"use client";

/**
 * Neue Angebote — the newest cars on AutoScout24, Kleinanzeigen and mobile.de,
 * as they are uploaded.
 *
 * While this page is open it asks the server every 30–120 seconds for the
 * newest ads matching the filter (sorted newest first on each portal). The
 * first answer is the baseline: what was already online. Everything that
 * turns up after that is new and lands at the top, with a sound and a desktop
 * notification if wanted.
 *
 * What counts as new is decided here, per portal:
 *   Kleinanzeigen  ad numbers only ever grow, so "higher than any number seen
 *                  at the baseline" is new — pushed-up old ads are not.
 *   AutoScout24 /  unseen ads above the first already-seen one in the newest-
 *   mobile.de      first list; ones below it are older ads filling the page.
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
  normalizeFilters,
} from "@/lib/feed/filters";
import { detectNew } from "@/lib/feed/detect";

const FILTER_STORE = "neueAngebote.filters.v1";
const SETTINGS_STORE = "neueAngebote.settings.v1";
const FEED_STORE = (key) => `neueAngebote.feed.v1.${key}`;
const MAX_FEED = 150;
// 15 s is the floor: faster gets the server blocked by the portals, and a
// blocked server would also break the Marktanalyse.
const INTERVALS = [15, 30, 60, 120];

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
function Field({ label, children, dark, group = false }) {
  const caption = (
    <span className={`mb-1 block text-[11px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
      {label}
    </span>
  );
  if (group) {
    return (
      <div role="group" aria-label={label} className="block min-w-0">
        {caption}
        {children}
      </div>
    );
  }
  return (
    <label className="block min-w-0">
      {caption}
      {children}
    </label>
  );
}

function RangeInputs({ from, to, onFrom, onTo, placeholders, dark, suffix, label = "" }) {
  const input = `h-9 w-full min-w-0 rounded border px-2 text-sm outline-none focus:ring-2 ${
    dark ? "border-slate-700 bg-slate-900 focus:ring-sky-500/30" : "border-slate-300 bg-white focus:ring-sky-200"
  }`;
  return (
    <div className="flex items-center gap-1.5">
      <input inputMode="numeric" aria-label={`${label} von`} value={from} onChange={(e) => onFrom(e.target.value)} placeholder={placeholders[0]} className={input} />
      <span className="text-xs text-slate-400">–</span>
      <input inputMode="numeric" aria-label={`${label} bis`} value={to} onChange={(e) => onTo(e.target.value)} placeholder={placeholders[1]} className={input} />
      {suffix ? <span className="w-6 shrink-0 text-[11px] text-slate-400">{suffix}</span> : null}
    </div>
  );
}

function Toggle({ active, onClick, children, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? dark
            ? "border-sky-500 bg-sky-500/15 text-sky-300"
            : "border-sky-500 bg-sky-50 text-sky-700"
          : dark
            ? "border-slate-700 text-slate-300 hover:border-slate-500"
            : "border-slate-300 text-slate-600 hover:border-slate-400"
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
  const select = `h-9 w-full rounded border px-2 text-sm outline-none ${
    dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"
  }`;
  const text = `h-9 w-full rounded border px-2 text-sm outline-none focus:ring-2 ${
    dark ? "border-slate-700 bg-slate-900 focus:ring-sky-500/30" : "border-slate-300 bg-white focus:ring-sky-200"
  }`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
      className="grid gap-4"
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Preis" dark={dark} group>
          <RangeInputs dark={dark} label="Preis" from={draft.priceMin} to={draft.priceMax} onFrom={set("priceMin")} onTo={set("priceMax")} placeholders={["von", "bis"]} suffix="€" />
        </Field>
        <Field label="Kilometerstand" dark={dark} group>
          <RangeInputs dark={dark} label="Kilometerstand" from={draft.kmMin} to={draft.kmMax} onFrom={set("kmMin")} onTo={set("kmMax")} placeholders={["von", "bis"]} suffix="km" />
        </Field>
        <Field label="Erstzulassung (Jahr)" dark={dark} group>
          <RangeInputs dark={dark} label="Erstzulassung" from={draft.yearMin} to={draft.yearMax} onFrom={set("yearMin")} onTo={set("yearMax")} placeholders={["von", "bis"]} />
        </Field>
        <Field label="Leistung" dark={dark} group>
          <RangeInputs dark={dark} label="Leistung" from={draft.powerMin} to={draft.powerMax} onFrom={set("powerMin")} onTo={set("powerMax")} placeholders={["von", "bis"]} suffix="PS" />
        </Field>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Marke (optional)" dark={dark}>
          <input value={draft.make} onChange={(e) => set("make")(e.target.value)} placeholder="alle Marken" className={text} />
        </Field>
        <Field label="Getriebe" dark={dark}>
          <select value={draft.gearbox} onChange={(e) => set("gearbox")(e.target.value)} className={select}>
            {GEARBOXES.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Anbieter" dark={dark}>
          <select value={draft.seller} onChange={(e) => set("seller")(e.target.value)} className={select}>
            {SELLERS.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Standort" dark={dark} group>
          <div className="flex gap-1.5">
            <select
              aria-label="Suchgebiet"
              value={Number(draft.radius) || 0}
              onChange={(e) => set("radius")(Number(e.target.value))}
              className={`h-9 shrink-0 rounded border px-2 text-sm outline-none ${
                Number(draft.radius) ? "w-32" : "w-full"
              } ${dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}
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
                placeholder="PLZ, z. B. 52428"
                aria-label="Postleitzahl"
                className={`${text} min-w-0 flex-1 ${
                  draft.zip.length > 0 && draft.zip.length < 5 ? "border-amber-400" : ""
                }`}
              />
            ) : null}
          </div>
          {Number(draft.radius) && draft.zip.length < 5 ? (
            <p className="mt-1 text-[10px] text-amber-600">Ohne vollständige PLZ wird ganz Deutschland durchsucht.</p>
          ) : null}
        </Field>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Kraftstoff (leer = alle)" dark={dark} group>
          <div className="flex flex-wrap gap-1.5">
            {FUELS.map((fuel) => (
              <Toggle key={fuel.id} dark={dark} active={draft.fuels.includes(fuel.id)} onClick={() => toggleIn("fuels", fuel.id)}>
                {fuel.label}
              </Toggle>
            ))}
          </div>
        </Field>
        <Field label="Fahrzeugtyp (leer = alle)" dark={dark} group>
          <div className="flex flex-wrap gap-1.5">
            {BODIES.map((body) => (
              <Toggle key={body.id} dark={dark} active={draft.bodies.includes(body.id)} onClick={() => toggleIn("bodies", body.id)}>
                {body.label}
              </Toggle>
            ))}
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Field label="Portale" dark={dark} group>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map((source) => (
                <Toggle key={source.id} dark={dark} active={draft.sources.includes(source.id)} onClick={() => toggleIn("sources", source.id)}>
                  {source.label}
                </Toggle>
              ))}
            </div>
          </Field>
          <label className={`mt-5 flex items-center gap-2 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
            <input type="checkbox" checked={draft.hideDamaged} onChange={(e) => set("hideDamaged")(e.target.checked)} />
            Unfall- und defekte Autos ausblenden
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULT_FILTERS })}
            className={`h-9 rounded px-3 text-xs font-semibold ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`}
          >
            Zurücksetzen
          </button>
          <button type="submit" className="inline-flex h-9 items-center gap-2 rounded bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700">
            <FiPlay /> {running ? "Filter übernehmen" : "Live-Suche starten"}
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
      : "beim Start online";

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
  const [checking, setChecking] = useState(false);
  const [intervalSec, setIntervalSec] = useState(60);
  const [sound, setSound] = useState(true);
  const [notify, setNotify] = useState(false);

  const [feed, setFeed] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);
  const [nextCheckAt, setNextCheckAt] = useState(null);
  const [failures, setFailures] = useState(0);
  const [unread, setUnread] = useState(0);
  const [showOld, setShowOld] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const storeRef = useRef(emptyStore());
  // Read inside the polling loop without restarting it when they change.
  const soundRef = useRef(sound);
  const notifyRef = useRef(notify);
  const failuresRef = useRef(0);
  const nextCheckRef = useRef(null);
  const routerRef = useRef(router);
  routerRef.current = router;
  soundRef.current = sound;
  notifyRef.current = notify;
  failuresRef.current = failures;
  nextCheckRef.current = nextCheckAt;
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  /* restore settings */
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setDark(theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches));
    const savedFilters = readJson(FILTER_STORE, null);
    if (savedFilters) {
      setDraft({ ...DEFAULT_FILTERS, ...savedFilters });
    }
    const settings = readJson(SETTINGS_STORE, {});
    if (INTERVALS.includes(settings.intervalSec)) setIntervalSec(settings.intervalSec);
    if (typeof settings.sound === "boolean") setSound(settings.sound);
    if (settings.notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotify(true);
    }
  }, []);

  useEffect(() => {
    writeJson(SETTINGS_STORE, { intervalSec, sound, notify });
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
      writeJson(FEED_STORE(key), store);
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
      detailActiveRef.current += 1;
      updateItem(next.key, { detailsState: "loading" });
      fetch("/api/neue-angebote/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: next.url }),
      })
        .then((response) => response.json())
        .then((data) =>
          updateItem(
            next.key,
            data?.ok
              ? { details: data.details, detailsState: "done" }
              : { detailsState: "error", detailsError: data?.error || null },
          ),
        )
        .catch(() => updateItem(next.key, { detailsState: "error" }))
        .finally(() => {
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

  /* one check */
  const check = useCallback(async () => {
    if (!applied || inFlightRef.current) return;
    inFlightRef.current = true;
    setChecking(true);
    try {
      const response = await fetch("/api/neue-angebote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: applied }),
      });
      if (response.status === 401) {
        routerRef.current.push("/login");
        return;
      }
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || `Fehler ${response.status}`);

      const at = Date.now();
      const store = storeRef.current;
      const items = Array.isArray(data.items) ? data.items : [];
      const { fresh, seen, kaMaxId } = detectNew(store, items, at);

      let nextFeed = store.feed;
      if (!store.baselineDone) {
        // First answer: what is online now, shown below as "schon online".
        nextFeed = items
          .filter((item) => !item.promoted)
          .map((item) => ({ ...item, isNew: false, firstSeenAt: new Date(at).toISOString() }));
      } else if (fresh.length) {
        const known = new Set(store.feed.map((item) => item.key));
        const arrivals = fresh
          .filter((item) => !known.has(item.key))
          .map((item) => ({ ...item, isNew: true, firstSeenAt: new Date(at).toISOString() }));
        nextFeed = [...arrivals, ...store.feed].slice(0, MAX_FEED);

        if (arrivals.length) {
          setUnread((count) => count + arrivals.length);
          if (soundRef.current) chime();
          const first = arrivals[0];
          toast.success(
            arrivals.length === 1
              ? `Neu: ${first.title} · ${euro(first.price)}`
              : `${arrivals.length} neue Angebote`,
            { duration: 6_000 },
          );
          if (notifyRef.current && typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
            try {
              const note = new Notification(
                arrivals.length === 1 ? "Neues Angebot" : `${arrivals.length} neue Angebote`,
                {
                  body: arrivals.slice(0, 3).map((item) => `${item.title} · ${euro(item.price)}`).join("\n"),
                  icon: first.image || undefined,
                  tag: "neue-angebote",
                },
              );
              note.onclick = () => {
                window.focus();
                if (arrivals.length === 1) window.open(first.url, "_blank", "noopener");
                note.close();
              };
            } catch {
              // Some browsers only allow notifications from a service worker.
            }
          }
        }
      }

      const nextStore = { baselineDone: true, seen, kaMaxId, feed: nextFeed };
      storeRef.current = nextStore;
      persist(nextStore);
      setFeed(nextFeed);

      // Read the ad pages of the new arrivals right away — at most ten per
      // check, so a flood of new ads cannot hammer the portals.
      const arrivedNow = nextFeed.filter((entry) => entry.isNew && entry.firstSeenAt === new Date(at).toISOString());
      if (arrivedNow.length) loadDetails(arrivedNow.slice(0, 10), { first: true });
      setSources(data.sources || []);
      setLastCheck(data.checkedAt || new Date(at).toISOString());
      setFailures((data.sources || []).every((source) => !source.ok && !source.skipped) ? (count) => count + 1 : 0);
    } catch (error) {
      setFailures((count) => count + 1);
      toast.error(`Prüfung fehlgeschlagen: ${error.message}`, { id: "feed-error" });
    } finally {
      inFlightRef.current = false;
      setChecking(false);
    }
  }, [applied, persist, loadDetails]);

  /* the loop: check, wait, check — slower after repeated failures */
  useEffect(() => {
    if (!running || !applied) return undefined;
    let cancelled = false;
    const ticker = createTicker();
    timerRef.current = ticker;

    const schedule = (delayMs) => {
      setNextCheckAt(Date.now() + delayMs);
      ticker.set(delayMs, async () => {
        if (cancelled) return;
        await check();
        if (!cancelled) schedule(failuresRef.current >= 3 ? 5 * 60_000 : intervalSec * 1_000);
      });
    };

    schedule(0);

    // Coming back to a tab the browser slowed down: check right away if due.
    const onVisible = () => {
      const due = nextCheckRef.current;
      if (document.visibilityState === "visible" && due && Date.now() > due + 5_000) {
        schedule(0);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      ticker.stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running, applied, intervalSec, check]);

  /* start with a filter: load that filter's memory, or begin a new baseline */
  const apply = () => {
    const normalized = normalizeFilters(draft);
    writeJson(FILTER_STORE, draft);
    const saved = readJson(FEED_STORE(filterKey(normalized)), null) || emptyStore();
    // A lookup still "loading" when the page was closed never finished.
    const store = {
      ...saved,
      feed: (saved.feed || []).map((entry) =>
        entry.detailsState === "loading" ? { ...entry, detailsState: undefined } : entry,
      ),
    };
    detailQueueRef.current = [];
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

  const visible = useMemo(() => feed.filter((item) => !hidden.includes(item.key)), [feed, hidden]);
  const fresh = visible.filter((item) => item.isNew);
  const old = visible.filter((item) => !item.isNew);
  // The newest of the new: everything the most recent productive check found.
  const latestAt = fresh.reduce((max, item) => (item.firstSeenAt > max ? item.firstSeenAt : max), "");
  const latest = fresh.filter((item) => item.firstSeenAt === latestAt);
  const earlier = fresh.filter((item) => item.firstSeenAt !== latestAt);
  const hide = (itemKey) => setHidden((list) => [...list, itemKey]);
  const secondsLeft = nextCheckAt ? Math.max(0, Math.ceil((nextCheckAt - now) / 1_000)) : null;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );
  }

  const muted = dark ? "text-slate-400" : "text-slate-500";
  const panel = dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const toolButton = `inline-flex h-9 items-center justify-center px-2.5 text-[13px] transition disabled:opacity-50 ${
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
              Frisch hochgeladene Fahrzeuge von AutoScout24, Kleinanzeigen und mobile.de
            </p>
          </div>

          {applied ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right text-[12px] leading-tight">
                <div className="flex items-center justify-end gap-1.5 font-semibold">
                  <span className={`size-2 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
                  {running ? "Live" : "Pausiert"}
                </div>
                <div className={`mt-0.5 tabular-nums ${muted}`}>
                  {checking ? "prüft gerade …" : running && secondsLeft !== null ? `nächste Prüfung in ${secondsLeft} s` : "keine Prüfung geplant"}
                </div>
              </div>

              <div className={`flex items-center divide-x overflow-hidden rounded-md border ${dark ? "divide-slate-700 border-slate-700 bg-slate-900" : "divide-slate-200 border-slate-300 bg-white"}`}>
                <select
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  title="Wie oft geprüft wird"
                  aria-label="Prüfintervall"
                  className={`h-9 bg-transparent px-2 text-[13px] outline-none ${dark ? "text-slate-100" : ""}`}
                >
                  {INTERVALS.map((seconds) => (
                    <option key={seconds} value={seconds}>alle {seconds} s</option>
                  ))}
                </select>
                <button type="button" onClick={() => check()} disabled={checking} title="Jetzt prüfen" aria-label="Jetzt prüfen" className={toolButton}>
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
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-semibold ${
                  running
                    ? dark ? "border border-slate-700 bg-slate-900 hover:bg-slate-800" : "border border-slate-300 bg-white hover:bg-slate-50"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                {running ? <><FiPause /> Pausieren</> : <><FiPlay /> Fortsetzen</>}
              </button>
            </div>
          ) : null}
        </header>

        {/* filters */}
        <section className={`mb-4 rounded-lg border ${panel}`}>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
            aria-expanded={showFilters}
          >
            <FiFilter className={muted} />
            <span className="text-[13px] font-semibold">Suchfilter</span>
            {!showFilters && applied ? (
              <span className={`min-w-0 flex-1 truncate text-[12px] ${muted}`}>{describeFilters(applied)}</span>
            ) : (
              <span className="flex-1" />
            )}
            <span className={`text-[12px] font-medium ${showFilters ? muted : "text-sky-600"}`}>
              {showFilters ? "Schließen" : "Bearbeiten"}
            </span>
            {showFilters ? <FiChevronUp className={muted} /> : <FiChevronDown className="text-sky-600" />}
          </button>
          {showFilters ? (
            <div className={`border-t px-4 pb-4 pt-4 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <FilterPanel draft={draft} setDraft={setDraft} dark={dark} onApply={apply} running={running} />
            </div>
          ) : null}
        </section>

        {/* status line: portals, last check */}
        {applied && sources.length ? (
          <div className={`mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] ${muted}`}>
            {sources.map((source) => (
              <span key={source.id} title={source.error || ""} className="inline-flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${sourceDot(source)}`} />
                <span className={dark ? "text-slate-300" : "text-slate-700"}>{source.label}</span>
                {source.ok ? (
                  <span>{source.count} Treffer</span>
                ) : (
                  <span className={source.skipped ? "" : "text-amber-600"}>
                    {source.paused ? "pausiert" : /freigeschaltet|nicht eingerichtet/.test(source.error || "") ? "kein Zugang" : "nicht erreichbar"}
                  </span>
                )}
              </span>
            ))}
            {lastCheck ? <span className="ml-auto">zuletzt geprüft {clock(lastCheck)}</span> : null}
            {failures >= 3 ? (
              <span className="w-full text-amber-600">Mehrere Prüfungen fehlgeschlagen – es wird jetzt nur alle 5 Minuten geprüft.</span>
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
              Solange diese Seite offen ist, werden die Portale laufend geprüft. Jedes neu hochgeladene
              Fahrzeug erscheint sofort oben – mit Ton und auf Wunsch als Desktop-Benachrichtigung.
            </p>
          </div>
        ) : (
          <>
            {fresh.length ? (
              <>
                <FeedSection
                  dark={dark}
                  live
                  title="Gerade reingekommen"
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
                  <><span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Warte auf neue Anzeigen – passende Fahrzeuge erscheinen hier, sobald sie hochgeladen werden.</>
                )}
              </div>
            )}

            {old.length ? (
              <section className={`mb-5 overflow-hidden rounded-lg border ${panel}`}>
                <button
                  type="button"
                  onClick={() => setShowOld((value) => !value)}
                  aria-expanded={showOld}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold ${
                    showOld ? (dark ? "border-b border-slate-800" : "border-b border-slate-100") : ""
                  }`}
                >
                  <span>Beim Start schon online · {old.length}</span>
                  <span className={`flex items-center gap-1 text-[12px] font-normal ${muted}`}>
                    {showOld ? "ausblenden" : "anzeigen"} {showOld ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                </button>
                {showOld ? (
                  <div className={`space-y-2.5 p-2.5 ${dark ? "bg-slate-950/40" : "bg-slate-50"}`}>
                    {renderRows(old, { first: false })}
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] ${muted}`}>
              <span>Die Suche läuft, solange diese Seite geöffnet ist – auch im Hintergrund.</span>
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
