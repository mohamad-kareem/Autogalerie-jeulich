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

function Chip({ children, tone = "slate", dark }) {
  const tones = {
    slate: dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600",
    green: dark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    amber: dark ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-800",
    red: dark ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-700",
    sky: dark ? "bg-sky-900/40 text-sky-300" : "bg-sky-100 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

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
          ? "border-sky-600 bg-sky-600 text-white"
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

const FACT_TONES = { good: "green", warn: "amber", bad: "red", neutral: "slate", unknown: "slate" };

/**
 * HU, accident status, owners, red flags … — read from the ad page once the
 * car has arrived (or on request for cars that were already online).
 */
function CardFacts({ item, dark, onLoad }) {
  const d = item.details;
  const muted = dark ? "text-slate-400" : "text-slate-500";

  if (!d) {
    if (item.detailsState === "loading") {
      return (
        <div className={`flex items-center gap-2 text-[11px] ${muted}`}>
          <FiLoader className="animate-spin" /> HU, Unfall & Halter werden geladen …
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onLoad(item)}
        className={`self-start text-[11px] font-semibold text-sky-600 hover:underline`}
      >
        {item.detailsState === "error" ? "Details nicht lesbar – erneut versuchen" : "HU, Unfall & mehr laden"}
      </button>
    );
  }

  const chip = (fact, key, prefix = "") =>
    fact ? (
      <Chip key={key} dark={dark} tone={FACT_TONES[fact.tone] || "slate"}>
        {prefix}
        {fact.label}
        {fact.note ? ` · ${fact.note}` : ""}
      </Chip>
    ) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {chip(d.hu, "hu")}
        {chip(d.condition, "condition")}
        {chip(d.owners, "owners")}
        {chip(d.belt, "belt")}
        {d.redFlags.map((flag) => (
          <Chip key={flag} dark={dark} tone="red">⚠ {flag}</Chip>
        ))}
        {d.goodSigns.map((sign) => (
          <Chip key={sign} dark={dark} tone="green">✓ {sign}</Chip>
        ))}
      </div>
      {d.equipment.length || d.usage ? (
        <p className={`text-[11px] leading-4 ${muted}`}>
          {[d.usage?.label, d.equipment.length ? d.equipment.join(" · ") : null].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function ListingCard({ item, dark, now, onHide, onLoadDetails, latest = false }) {
  const source = SOURCES.find((entry) => entry.id === item.source);
  const sellerType =
    item.details?.sellerType && item.details.sellerType !== "UNKNOWN" ? item.details.sellerType : item.sellerType;
  const facts = [
    km(item.mileageKm),
    item.firstRegistration ? `EZ ${item.firstRegistration}` : null,
    item.powerPs ? `${item.powerPs} PS` : null,
    item.fuel,
    item.gearbox,
  ].filter(Boolean);

  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-lg border transition ${
        latest
          ? dark
            ? "border-emerald-500 bg-slate-900 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]"
            : "border-emerald-500 bg-white shadow-md ring-2 ring-emerald-400/40"
          : item.isNew
          ? dark
            ? "border-emerald-700/70 bg-slate-900 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
            : "border-emerald-300 bg-white shadow-sm"
          : dark
            ? "border-slate-800 bg-slate-900/60 opacity-80"
            : "border-slate-200 bg-white/70 opacity-90"
      }`}
    >
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] overflow-hidden bg-slate-200">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-slate-400">kein Bild</div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {item.isNew ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" /> {latest ? "NEUESTE" : "NEU"}
            </span>
          ) : null}
          <span className="rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {source?.label || item.source}
          </span>
        </div>
      </a>

      <button
        type="button"
        onClick={() => onHide(item.key)}
        title="Ausblenden"
        className="absolute right-2 top-2 rounded bg-black/55 p-1 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
      >
        <FiEyeOff className="size-3.5" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 text-sm font-semibold leading-5">{item.title}</h3>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold tabular-nums">{euro(item.price)}</span>
          {item.priceNote ? <span className="text-xs text-slate-500">{item.priceNote}</span> : null}
          {item.rating ? (
            <Chip dark={dark} tone={item.rating.tone === "good" ? "green" : item.rating.tone === "bad" ? "red" : "slate"}>
              {item.rating.label}
            </Chip>
          ) : null}
        </div>

        <p className={`text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>{facts.join(" · ") || "–"}</p>

        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {item.location ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <FiMapPin className="shrink-0" />
              <span className="truncate">{item.location}</span>
              {Number.isFinite(item.distanceKm) ? <span>({item.distanceKm} km)</span> : null}
            </span>
          ) : null}
          {sellerType === "PRIVATE" ? <Chip dark={dark} tone="sky">Privat</Chip> : null}
          {sellerType === "DEALER" ? <Chip dark={dark}>Händler{item.details?.sellerName ? ` · ${item.details.sellerName.slice(0, 24)}` : ""}</Chip> : null}
        </div>

        <CardFacts item={item} dark={dark} onLoad={onLoadDetails} />

        <p className={`text-[11px] ${item.isNew ? "font-semibold text-emerald-600" : dark ? "text-slate-500" : "text-slate-400"}`}>
          {item.postedAt
            ? `online seit ${clock(item.postedAt)} · ${ago(item.postedAt, now)}`
            : item.isNew
              ? `entdeckt ${ago(item.firstSeenAt, now)}`
              : "war beim Start schon online"}
        </p>

        <div className="mt-auto flex gap-2 pt-1.5">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded bg-sky-600 text-xs font-bold text-white hover:bg-sky-700"
          >
            Anzeige öffnen <FiExternalLink />
          </a>
          <a
            href={`/marktanalyse?url=${encodeURIComponent(item.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ankaufs-Check in neuem Tab"
            className={`inline-flex h-8 items-center justify-center gap-1 rounded border px-2.5 text-xs font-semibold ${
              dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <FiZap /> Prüfen
          </a>
        </div>
      </div>
    </article>
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

  return (
    <main className={`min-h-screen ${dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5">
        {/* header */}
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className={`rounded p-2 md:hidden ${dark ? "bg-slate-900" : "bg-white shadow-sm"}`}
            aria-label="Menü öffnen"
          >
            <FiMenu />
          </button>
          <div className="mr-auto min-w-0">
            <h1 className="flex items-center gap-2 text-base font-bold leading-tight">
              Neue Angebote
              {running ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                </span>
              ) : null}
            </h1>
            <p className={`truncate text-[11px] ${muted}`}>
              {applied ? describeFilters(applied) : "Frisch hochgeladene Autos von AutoScout24, Kleinanzeigen und mobile.de"}
            </p>
          </div>

          {applied ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] tabular-nums ${muted}`}>
                {checking
                  ? "prüfe …"
                  : running && secondsLeft !== null
                    ? `nächste Prüfung in ${secondsLeft} s`
                    : "pausiert"}
              </span>
              <select
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                title="Wie oft geprüft wird"
                className={`h-8 rounded border px-1.5 text-xs ${dark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-white"}`}
              >
                {INTERVALS.map((seconds) => (
                  <option key={seconds} value={seconds}>alle {seconds} s</option>
                ))}
              </select>
              <button type="button" onClick={() => check()} disabled={checking} title="Jetzt prüfen" className={`inline-flex h-8 items-center rounded border px-2 ${dark ? "border-slate-700" : "border-slate-300 bg-white"}`}>
                <FiRefreshCw className={checking ? "animate-spin" : ""} />
              </button>
              <button type="button" onClick={() => setSound((value) => !value)} title={sound ? "Ton aus" : "Ton an"} className={`inline-flex h-8 items-center rounded border px-2 ${dark ? "border-slate-700" : "border-slate-300 bg-white"}`}>
                {sound ? <FiVolume2 /> : <FiVolumeX />}
              </button>
              <button type="button" onClick={askNotifications} title="Desktop-Benachrichtigung" className={`inline-flex h-8 items-center rounded border px-2 ${notify ? "border-emerald-600 text-emerald-600" : dark ? "border-slate-700" : "border-slate-300 bg-white"}`}>
                {notify ? <FiBell /> : <FiBellOff />}
              </button>
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-bold text-white ${running ? "bg-slate-600 hover:bg-slate-700" : "bg-sky-600 hover:bg-sky-700"}`}
              >
                {running ? <><FiPause /> Pause</> : <><FiPlay /> Weiter</>}
              </button>
            </div>
          ) : null}
        </header>

        {/* filters */}
        <section className={`mb-4 rounded-lg border ${panel}`}>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <FiFilter /> Filter
            </span>
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {showFilters ? (
            <div className={`border-t px-4 pb-4 pt-3 ${dark ? "border-slate-800" : "border-slate-200"}`}>
              <FilterPanel draft={draft} setDraft={setDraft} dark={dark} onApply={apply} running={running} />
            </div>
          ) : null}
        </section>

        {/* portal status */}
        {sources.length ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            {sources.map((source) => (
              <span
                key={source.id}
                title={source.error || ""}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  source.ok
                    ? dark ? "border-emerald-800 text-emerald-300" : "border-emerald-200 text-emerald-700"
                    : source.skipped
                      ? dark ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"
                      : dark ? "border-amber-800 text-amber-300" : "border-amber-300 text-amber-700"
                }`}
              >
                <span className={`size-1.5 rounded-full ${source.ok ? "bg-emerald-500" : source.skipped ? "bg-slate-400" : "bg-amber-500"}`} />
                {source.label}
                {source.ok ? ` · ${source.count}` : source.error ? ` – ${source.error}` : ""}
              </span>
            ))}
            {lastCheck ? <span className={muted}>zuletzt geprüft {clock(lastCheck)}</span> : null}
            {failures >= 3 ? (
              <span className="text-amber-600">Mehrere Prüfungen fehlgeschlagen – es wird jetzt nur alle 5 Minuten geprüft.</span>
            ) : null}
          </div>
        ) : null}

        {/* the feed */}
        {!applied ? (
          <div className={`rounded-lg border p-8 text-center ${panel}`}>
            <FiZap className="mx-auto mb-2 text-2xl text-sky-600" />
            <p className="text-sm font-semibold">Filter setzen und Live-Suche starten</p>
            <p className={`mx-auto mt-1 max-w-md text-xs leading-5 ${muted}`}>
              Solange diese Seite offen ist, werden die Portale regelmäßig geprüft. Jedes neu hochgeladene
              Auto erscheint sofort oben – mit Ton und auf Wunsch als Desktop-Benachrichtigung.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Neu seit dem Start{" "}
                <span className={`font-normal ${muted}`}>({fresh.length})</span>
              </h2>
              {feed.length ? (
                <button type="button" onClick={resetFeed} className={`inline-flex items-center gap-1 text-[11px] ${muted} hover:underline`}>
                  <FiTrash2 /> Liste leeren
                </button>
              ) : null}
            </div>

            {fresh.length ? (
              <>
                <section
                  className={`mb-5 rounded-lg border p-3 ${
                    dark ? "border-emerald-800/70 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50/60"
                  }`}
                >
                  <h3 className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-emerald-700">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Gerade reingekommen
                    </span>
                    <span className={`text-[11px] font-normal ${muted}`}>
                      {latest.length} {latest.length === 1 ? "Auto" : "Autos"} aus der Prüfung um {clock(latestAt)} · {ago(latestAt, now)}
                    </span>
                  </h3>
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {latest.map((item) => (
                      <ListingCard key={item.key} item={item} dark={dark} now={now} latest onHide={hide} onLoadDetails={(entry) => loadDetails([entry], { first: true })} />
                    ))}
                  </div>
                </section>

                {earlier.length ? (
                  <section className="mb-6">
                    <h3 className={`mb-2 text-xs font-semibold ${muted}`}>
                      Davor reingekommen ({earlier.length})
                    </h3>
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {earlier.map((item) => (
                        <ListingCard key={item.key} item={item} dark={dark} now={now} onHide={hide} onLoadDetails={(entry) => loadDetails([entry], { first: true })} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className={`mb-6 rounded-lg border border-dashed p-6 text-center text-xs ${dark ? "border-slate-700" : "border-slate-300"} ${muted}`}>
                {checking && !lastCheck ? (
                  <span className="inline-flex items-center gap-2"><FiLoader className="animate-spin" /> Erste Prüfung läuft …</span>
                ) : (
                  <>Warte auf neue Anzeigen. Sobald ein passendes Auto hochgeladen wird, erscheint es hier.</>
                )}
              </div>
            )}

            {old.length ? (
              <section>
                <button type="button" onClick={() => setShowOld((value) => !value)} className={`mb-2 inline-flex items-center gap-1 text-xs font-semibold ${muted}`}>
                  {showOld ? <FiChevronUp /> : <FiChevronDown />} Beim Start schon online ({old.length})
                </button>
                {showOld ? (
                  <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {old.map((item) => (
                      <ListingCard key={item.key} item={item} dark={dark} now={now} onHide={hide} onLoadDetails={(entry) => loadDetails([entry])} />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <p className={`mt-6 text-center text-[11px] ${muted}`}>
              Die Suche läuft, solange diese Seite geöffnet ist – auch wenn der Tab im Hintergrund liegt.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
