"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClipboard,
  FiClock,
  FiCopy,
  FiDatabase,
  FiEdit3,
  FiExternalLink,
  FiHelpCircle,
  FiInfo,
  FiLink,
  FiLoader,
  FiMenu,
  FiPercent,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiTrendingDown,
  FiTrendingUp,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import {
  initialAdjust,
  recalculate,
  toNumber,
} from "@/lib/market/live";
// The bookmark button is no longer offered on the page, but a bookmark set up
// earlier still delivers its ad here, so the receiving end stays.
import { decodeImport, IMPORT_PREFIX } from "@/lib/market/bookmarklet";
import { useSidebar } from "@/app/(components)/SidebarContext";

/* ------------------------------------------------------------------ setup */

const RECENT_KEY = "marktanalyse.recent.v2";
const MAX_RECENT = 6;
const REQUEST_TIMEOUT_MS = 70_000;

const SUPPORTED = [
  { label: "AutoScout24", hosts: ["autoscout24.de"] },
  { label: "mobile.de", hosts: ["mobile.de"] },
  { label: "Kleinanzeigen", hosts: ["kleinanzeigen.de"] },
];

/**
 * mobile.de refuses our server every time, so a mobile.de link does not wait
 * for that refusal: it goes straight to the fast path (copy the ad, or the
 * one-click button). Set NEXT_PUBLIC_MOBILEDE_DIRECT=1 to try the server again,
 * for example once mobile.de grants API access.
 */
const MOBILE_DIRECT = process.env.NEXT_PUBLIC_MOBILEDE_DIRECT === "1";

/**
 * Enough of an ad to analyse: the data labels every portal prints, and a euro
 * amount. Anything shorter is a link, a phone number or a stray word.
 */
function looksLikeAdText(text) {
  const value = String(text || "");
  return (
    value.length >= 250 &&
    /(kilometerstand|laufleistung)/i.test(value) &&
    /(erstzulassung|\bEZ\b)/i.test(value) &&
    /€/.test(value)
  );
}

function detectPortal(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return { status: "empty" };

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { status: "invalid" };
  }

  if (!/^https?:$/.test(parsed.protocol)) return { status: "invalid" };

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const match = SUPPORTED.find((entry) =>
    entry.hosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`)),
  );

  if (!match) return { status: "unsupported", host };
  return { status: "supported", label: match.label };
}

/* ------------------------------------------------------------ formatting */

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("de-DE");

function euro(value) {
  return Number.isFinite(value) ? euroFormatter.format(value) : "–";
}

function signedEuro(value) {
  if (!Number.isFinite(value)) return "–";
  return `${value > 0 ? "+" : ""}${euroFormatter.format(value)}`;
}

function km(value) {
  return Number.isFinite(value) ? `${numberFormatter.format(value)} km` : "–";
}

function percent(value, digits = 1) {
  return Number.isFinite(value) ? `${value.toFixed(digits).replace(".", ",")} %` : "–";
}

function signedPercent(value, digits = 1) {
  if (!Number.isFinite(value)) return "–";
  return `${value > 0 ? "+" : ""}${percent(value, digits)}`;
}

function orDash(value) {
  return value === null || value === undefined || value === "" ? "–" : value;
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return "–";
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (!hours) return `${rest} Min.`;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

const FUEL_LABELS = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in-Hybrid",
  ELECTRIC: "Elektro",
  LPG: "Autogas",
  CNG: "Erdgas",
  HYDROGEN: "Wasserstoff",
  OTHER: "Sonstige",
  UNKNOWN: "–",
};

const GEARBOX_LABELS = {
  MANUAL: "Schaltgetriebe",
  AUTOMATIC: "Automatik",
  SEMI_AUTOMATIC: "Halbautomatik",
  UNKNOWN: "–",
};

const SELLER_LABELS = { DEALER: "Händler", PRIVATE: "Privat", UNKNOWN: "–" };

const CONDITION_LABELS = {
  ACCIDENT_FREE: "Unfallfrei",
  REPAIRED_DAMAGE: "Vorschaden repariert",
  DAMAGED: "Unfall / Defekt",
  UNKNOWN: "Unbekannt",
};

const SERVICE_LABELS = { YES: "Ja", NO: "Nein", UNKNOWN: "Unbekannt" };

const SOURCE_LABELS = {
  AUTOSCOUT24: "AutoScout24",
  MOBILE_DE: "mobile.de",
  KLEINANZEIGEN: "Kleinanzeigen",
};

const SOURCE_SHORT = {
  AUTOSCOUT24: "AS24",
  MOBILE_DE: "mobile",
  KLEINANZEIGEN: "Klein.",
};

const VERDICTS = {
  EXCELLENT: {
    label: "Ankaufen",
    icon: FiCheckCircle,
    dot: "bg-emerald-500",
    strip: "border-emerald-500",
    chip: "bg-emerald-600 text-white",
    text: "text-emerald-700",
  },
  GOOD: {
    label: "Lohnt sich",
    icon: FiTrendingUp,
    dot: "bg-emerald-500",
    strip: "border-emerald-500",
    chip: "bg-emerald-600 text-white",
    text: "text-emerald-700",
  },
  NEGOTIABLE: {
    label: "Nur mit Nachlass",
    icon: FiPercent,
    dot: "bg-amber-500",
    strip: "border-amber-500",
    chip: "bg-amber-500 text-white",
    text: "text-amber-700",
  },
  TOO_EXPENSIVE: {
    label: "Zu teuer",
    icon: FiXCircle,
    dot: "bg-red-500",
    strip: "border-red-500",
    chip: "bg-red-600 text-white",
    text: "text-red-700",
  },
  INSUFFICIENT_DATA: {
    label: "Zu wenig Daten",
    icon: FiHelpCircle,
    dot: "bg-slate-400",
    strip: "border-slate-400",
    chip: "bg-slate-600 text-white",
    text: "text-slate-600",
  },
};

function verdictMeta(verdict) {
  return VERDICTS[verdict] || VERDICTS.INSUFFICIENT_DATA;
}

/* --------------------------------------------------------------- shell bits
 *
 * One panel style, one label style, one figure style. Everything on the page is
 * built from these three so the result reads as a single document rather than a
 * pile of cards.
 */

function Panel({ children, dark, className = "", padded = true }) {
  return (
    <section
      className={`rounded-lg border ${padded ? "p-4" : ""} ${
        dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      } ${className}`}
    >
      {children}
    </section>
  );
}

/** Small uppercase caption that titles every block. */
function Caption({ children, dark, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2
        className={`text-[11px] font-bold uppercase tracking-wider ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Kept for the panels further down the page that still use a titled header. */
function SectionHead({ icon: Icon, title, subtitle, dark, action }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className={dark ? "text-slate-500" : "text-slate-400"}>
            <Icon />
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-bold leading-tight">{title}</h2>
          {subtitle ? (
            <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Metric({ label, value, hint, dark, accent = "none" }) {
  const accents = {
    none: "",
    positive: "text-emerald-600",
    negative: "text-red-600",
    primary: "text-sky-600",
  };

  return (
    <div>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wide ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className={`mt-0.5 text-base font-bold tabular-nums ${accents[accent]}`}>
        {value}
      </p>
      {hint ? (
        <p className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Chip({ children, tone = "slate", dark = false }) {
  const tones = dark
    ? {
        slate: "border-slate-700 bg-slate-800 text-slate-300",
        emerald: "border-emerald-900 bg-emerald-950/60 text-emerald-300",
        amber: "border-amber-900 bg-amber-950/60 text-amber-300",
        red: "border-red-900 bg-red-950/60 text-red-300",
        sky: "border-sky-900 bg-sky-950/60 text-sky-300",
      }
    : {
        slate: "border-slate-200 bg-slate-100 text-slate-600",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-800",
        red: "border-red-200 bg-red-50 text-red-700",
        sky: "border-sky-200 bg-sky-50 text-sky-700",
      };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Label/value line used by the vehicle and market blocks. */
function Line({ label, value, dark, tone = "neutral", warn = false }) {
  const tones = {
    neutral: "",
    positive: "text-emerald-600",
    negative: "text-red-600",
    accent: "text-sky-600",
  };

  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </span>
      <span
        className={`text-right text-xs font-semibold tabular-nums ${
          warn ? "text-amber-600" : tones[tone]
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================== decision strip
 *
 * The one row a buyer reads before anything else: which car, what it costs,
 * what it may cost, and the verdict. Sticky, so it stays in view while he
 * scrolls the evidence below.
 */

function DecisionStrip({ result, live, dark, onSave, saving, savedAt }) {
  // The badge follows the figures currently on screen, not the ones the first
  // run produced — otherwise a negotiated price leaves a stale verdict up top.
  const meta = verdictMeta(live?.verdict ?? result.verdict);
  const Icon = meta.icon;
  const target = result.target;
  const dealer = result.dealer;

  const title =
    target.title ||
    [target.make, target.model, target.variant].filter(Boolean).join(" ") ||
    "Fahrzeug";

  return (
    <div
      className={`sticky top-0 z-20 -mx-3 mb-4 border-b-2 px-3 py-3 backdrop-blur sm:-mx-5 sm:px-5 ${meta.strip} ${
        dark ? "bg-slate-950/90" : "bg-slate-50/90"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Thumb
            src={target.images?.[0]}
            alt=""
            className="hidden h-11 w-14 sm:block"
          />
          <span className={`shrink-0 text-xl ${meta.text}`}>
            <Icon />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}
              >
                {meta.label}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  dark ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Konfidenz {result.confidence} %
              </span>
            </div>
            <h1 className="mt-0.5 truncate text-[15px] font-bold leading-tight">
              {title}
            </h1>
            <p
              className={`truncate text-[11px] ${
                dark ? "text-slate-500" : "text-slate-500"
              }`}
            >
              {[
                orDash(target.firstRegistration),
                km(target.mileageKm),
                Number.isFinite(target.powerPs) ? `${target.powerPs} PS` : null,
                SELLER_LABELS[target.sellerType],
                target.location,
              ]
                .filter((entry) => entry && entry !== "–")
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <StripFigure
            label={live?.negotiated !== null && live?.negotiated !== undefined ? "Verhandelt" : "Angebot"}
            value={euro(live?.askingPrice ?? target.price)}
            hint={
              live?.negotiated
                ? `Anzeige ${euro(live.listPrice)} · ${euro(live.savings)} weniger`
                : null
            }
            dark={dark}
          />

          {dealer?.available && live ? (
            <>
              <StripFigure
                label="Einkaufslimit"
                value={euro(live.limit)}
                dark={dark}
                accent
              />
              <StripFigure
                label={live.discount > 0 ? "Nachlass nötig" : "Gewinn"}
                value={live.discount > 0 ? euro(live.discount) : euro(live.expected)}
                dark={dark}
                tone={live.discount > 0 ? "negative" : "positive"}
              />
            </>
          ) : null}

          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded px-3 text-xs font-semibold transition disabled:opacity-60 ${
                savedAt
                  ? dark
                    ? "bg-emerald-900/50 text-emerald-300"
                    : "bg-emerald-50 text-emerald-700"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              }`}
              title="Diese Bewertung in der Datenbank ablegen"
            >
              {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
              {saving ? "Speichert…" : savedAt ? "Gespeichert" : "Speichern"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StripFigure({ label, value, hint = null, dark, accent = false, tone = "neutral" }) {
  const tones = {
    neutral: dark ? "text-slate-100" : "text-slate-900",
    positive: "text-emerald-600",
    negative: "text-red-600",
  };
  return (
    <div className="text-right">
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          dark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-lg font-extrabold tabular-nums leading-tight ${
          accent ? "text-sky-600" : tones[tone]
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className={`text-[10px] tabular-nums ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ============================================================= calculation */

function Calculation({ result, live, adjust, onAdjust, dark, busy, onPostcode }) {
  const dealer = result.dealer;
  const pickup = dealer?.pickup;

  const [postcode, setPostcode] = useState("");
  const [showPickup, setShowPickup] = useState(false);

  const set = (field) => (event) => onAdjust(field, event.target.value);

  if (!dealer?.available || !live) {
    return (
      <Panel dark={dark}>
        <Caption dark={dark}>Kalkulation</Caption>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Ohne belastbaren Marktwert ist keine Kalkulation möglich.
        </p>
      </Panel>
    );
  }

  const input = `h-7 w-24 rounded border px-2 text-right text-xs tabular-nums outline-none focus:ring-2 ${
    dark
      ? "border-slate-700 bg-slate-800 focus:ring-sky-500/30"
      : "border-slate-300 bg-white focus:ring-sky-200"
  }`;

  return (
    <Panel dark={dark}>
      <Caption dark={dark}>Kalkulation</Caption>

      <table className="w-full text-sm">
        <tbody className={dark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
          <tr>
            <td className="py-1.5">
              Realistischer Verkaufspreis
              <span className={`ml-2 text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                Marktwert {euro(result.market.marketValue)}
              </span>
            </td>
            <td className="py-1.5 text-right font-semibold tabular-nums">
              {euro(dealer.sellingPrice)}
            </td>
          </tr>

          <tr>
            <td className="py-1.5">
              <button
                type="button"
                onClick={() => setShowPickup((value) => !value)}
                className="inline-flex items-center gap-1 hover:underline"
              >
                Gesamte Abholkosten
                <span className="text-[10px]">{showPickup ? <FiChevronUp /> : <FiChevronDown />}</span>
              </button>
              {pickup?.available ? (
                <span className={`ml-2 text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  {pickup.origin} – {pickup.destination} ·{" "}
                  {numberFormatter.format(pickup.oneWayKm)} km einfach
                </span>
              ) : null}
            </td>
            <td
              className={`py-1.5 text-right tabular-nums ${
                dark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {pickup?.available ? `− ${euro(live.pickupCost)}` : "–"}
            </td>
          </tr>

          {showPickup && pickup?.available ? (
            <tr>
              <td colSpan={2} className="pb-2">
                <div
                  className={`rounded px-3 py-2 text-[11px] ${
                    dark ? "bg-slate-800/60" : "bg-slate-50"
                  }`}
                >
                  <PickupLine
                    label="Entfernung einfach"
                    value={`${numberFormatter.format(pickup.oneWayKm)} km`}
                  />

                  <div className="my-1.5 flex items-center justify-between gap-2">
                    <span>
                      Anreise{" "}
                      {pickup.inboundMode === "CAR" ? "mit dem Auto" : "mit der Bahn"}
                      {pickup.inboundEstimated ? (
                        <span className={dark ? "text-slate-500" : "text-slate-400"}>
                          {" "}(geschätzt)
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={adjust.inbound}
                        onChange={set("inbound")}
                        className={`h-6 w-16 rounded border px-1.5 text-right text-[11px] tabular-nums ${
                          dark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                        }`}
                      />
                      <span className={dark ? "text-slate-500" : "text-slate-400"}>Min.</span>
                    </span>
                  </div>

                  <div className="my-1.5 flex items-center justify-between gap-2">
                    <span>Zeit beim Verkäufer</span>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="15"
                        value={adjust.onSite}
                        onChange={set("onSite")}
                        className={`h-6 w-16 rounded border px-1.5 text-right text-[11px] tabular-nums ${
                          dark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                        }`}
                      />
                      <span className={dark ? "text-slate-500" : "text-slate-400"}>Min.</span>
                    </span>
                  </div>

                  <PickupLine
                    label="Rückfahrt mit dem Fahrzeug"
                    value={formatMinutes(pickup.returnMinutes)}
                  />
                  <PickupLine
                    label="Arbeitszeit gesamt"
                    value={formatMinutes(live.totalMinutes)}
                  />
                  <PickupLine
                    label="Kosten für Abholer"
                    value={`${euro(live.labourCost)} · ${(live.totalMinutes / 60).toFixed(1)} Std. × ${euro(pickup.hourlyRate)}`}
                  />

                  <div className="my-1.5 flex items-center justify-between gap-2">
                    <span>Bahnticket</span>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={adjust.ticket}
                        onChange={set("ticket")}
                        className={`h-6 w-16 rounded border px-1.5 text-right text-[11px] tabular-nums ${
                          dark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                        }`}
                      />
                      <span className={dark ? "text-slate-500" : "text-slate-400"}>€</span>
                    </span>
                  </div>

                  <div className="my-1.5 flex items-center justify-between gap-2">
                    <span>
                      Benzinkosten
                      <span className={dark ? "text-slate-500" : "text-slate-400"}>
                        {" "}
                        {numberFormatter.format(pickup.fuelKm)} km ·{" "}
                        {pickup.fuelLitresPer100Km} l/100 km
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={adjust.fuel}
                        onChange={set("fuel")}
                        className={`h-6 w-16 rounded border px-1.5 text-right text-[11px] tabular-nums ${
                          dark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                        }`}
                      />
                      <span className={dark ? "text-slate-500" : "text-slate-400"}>€</span>
                    </span>
                  </div>
                  <PickupLine
                    label="Gesamte Abholkosten"
                    value={euro(live.pickupCost)}
                    bold
                  />

                  <p
                    className={`mt-1.5 border-t pt-1.5 text-[10px] ${
                      dark ? "border-slate-700 text-slate-500" : "border-slate-200 text-slate-400"
                    }`}
                  >
                    Anreise mit der Bahn wird aus der Fahrzeit geschätzt – die tatsächliche
                    Verbindung oben eintragen, dann rechnet alles damit.
                  </p>
                </div>
              </td>
            </tr>
          ) : null}

          {!pickup?.available ? (
            <tr>
              <td colSpan={2} className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-amber-600">
                    {pickup?.note || "Standort unbekannt."}
                  </span>
                  <input
                    value={postcode}
                    onChange={(event) => setPostcode(event.target.value)}
                    placeholder="PLZ"
                    className={`h-7 w-20 rounded border px-2 text-xs ${
                      dark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    disabled={busy || postcode.trim().length < 4}
                    onClick={() => onPostcode(postcode.trim())}
                    className="h-7 rounded bg-sky-600 px-2.5 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    berechnen
                  </button>
                </div>
              </td>
            </tr>
          ) : null}

          <tr>
            <td className="py-1.5">
              Renovierung
              <span className={`ml-2 text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                optional
              </span>
            </td>
            <td className="py-1.5 text-right">
              <input
                type="number"
                min="0"
                step="50"
                value={adjust.refurbishment}
                onChange={set("refurbishment")}
                className={input}
                placeholder="0"
              />
            </td>
          </tr>

          {/* The target profit has no row of its own — it is not something to
              fill in before every purchase. It is stated here, because a limit
              that quietly holds a margin back would be unreadable otherwise. */}
          <tr className={dark ? "bg-slate-800/40" : "bg-slate-50"}>
            <td className="py-2 text-[15px] font-bold">
              Einkaufslimit
              {live.targetProfit > 0 ? (
                <span
                  className={`ml-2 text-[11px] font-normal ${
                    dark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  inkl. {euro(live.targetProfit)} Marge
                </span>
              ) : null}
            </td>
            <td className="py-2 text-right text-lg font-extrabold tabular-nums text-sky-600">
              {euro(live.limit)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* What the seller actually wants, once you have spoken to him. Until a
          figure is entered, the advertised price is what everything runs on. */}
      <div
        className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded border px-3 py-2.5 ${
          live.negotiated !== null
            ? dark
              ? "border-emerald-800 bg-emerald-950/30"
              : "border-emerald-200 bg-emerald-50"
            : dark
              ? "border-slate-800 bg-slate-800/40"
              : "border-slate-200 bg-slate-50"
        }`}
      >
        <div>
          <p className="text-xs font-semibold">Verhandelter Preis</p>
          <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {live.negotiated !== null ? (
              <>
                Anzeigenpreis{" "}
                <span className="line-through tabular-nums">{euro(live.listPrice)}</span> ·{" "}
                <span className="font-semibold text-emerald-600 tabular-nums">
                  {euro(live.savings)} gespart
                </span>
              </>
            ) : (
              <>
                optional – was der Verkäufer jetzt aufruft. Leer lassen für{" "}
                {euro(live.listPrice)} aus der Anzeige.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="50"
            value={adjust.negotiated}
            onChange={set("negotiated")}
            placeholder={Number.isFinite(live.listPrice) ? String(live.listPrice) : "Preis"}
            className={`h-8 w-28 rounded border px-2 text-right text-sm font-semibold tabular-nums outline-none focus:ring-2 ${
              dark
                ? "border-slate-700 bg-slate-800 focus:ring-emerald-500/30"
                : "border-slate-300 bg-white focus:ring-emerald-200"
            }`}
          />
          <span className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>€</span>
          {live.negotiated !== null ? (
            <button
              type="button"
              onClick={() => onAdjust("negotiated", "")}
              title="Auf den Anzeigenpreis zurücksetzen"
              className={`inline-flex h-8 w-8 items-center justify-center rounded border ${
                dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-white"
              }`}
            >
              <FiX />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Metric
          label={live.negotiated !== null ? "Verhandelter Preis" : "Angebotspreis"}
          value={euro(live.askingPrice)}
          dark={dark}
        />
        <Metric
          label="Erwarteter Gewinn"
          value={euro(live.expected)}
          dark={dark}
          accent={live.expected >= 0 ? "positive" : "negative"}
        />
        <Metric
          label="Nötiger Nachlass"
          value={live.discount > 0 ? euro(live.discount) : "keiner"}
          dark={dark}
          accent={live.discount > 0 ? "negative" : "positive"}
        />
      </div>
    </Panel>
  );
}

function PickupLine({ label, value, bold = false }) {
  return (
    <div className={`flex justify-between py-0.5 ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/* ====================================================== comparables, dense
 *
 * A table, not cards. Twelve vehicles fit on one screen and the columns line
 * up, which is the only way to actually compare them.
 */

function ComparablesTable({ result, asking, dark }) {
  const rows = result.comparables;

  return (
    <Panel dark={dark} padded={false}>
      <div className="flex items-center justify-between px-4 pt-4">
        <Caption dark={dark}>Vergleichsfahrzeuge</Caption>
        <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {rows.length} Angebote · ab {result.meta.similarityThreshold} % Übereinstimmung
        </span>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr
                className={`text-left text-[10px] uppercase tracking-wider ${
                  dark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <th className="px-4 py-2 font-semibold">Quelle</th>
                <th className="py-2 font-semibold">Fahrzeug</th>
                <th className="py-2 text-right font-semibold">EZ</th>
                <th className="py-2 text-right font-semibold">km</th>
                <th className="py-2 text-right font-semibold">PS</th>
                <th className="py-2 text-right font-semibold">Preis</th>
                <th className="py-2 text-right font-semibold">Bereinigt</th>
                <th className="py-2 text-right font-semibold">vs. Angebot</th>
                <th className="px-4 py-2 text-right font-semibold">Match</th>
              </tr>
            </thead>
            <tbody className={dark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
              {rows.map((vehicle, index) => {
                const reference = Number.isFinite(vehicle.adjustedPrice)
                  ? vehicle.adjustedPrice
                  : vehicle.price;
                const delta =
                  Number.isFinite(asking) && Number.isFinite(reference)
                    ? reference - asking
                    : null;

                return (
                  <tr
                    key={vehicle.listingUrl || index}
                    className={dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
                  >
                    <td
                      className={`px-4 py-2 whitespace-nowrap ${
                        dark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {SOURCE_SHORT[vehicle.source] || vehicle.source}
                    </td>
                    <td className="max-w-[280px] py-2">
                      <div className="flex items-center gap-2">
                        <Thumb
                          src={vehicle.images?.[0]}
                          alt=""
                          className="h-9 w-12"
                        />
                        <div className="min-w-0">
                          <span className="block truncate font-medium">
                            {vehicle.title ||
                              [vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                          </span>
                          <span
                            className={`block truncate text-[10px] ${
                              dark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            {[SELLER_LABELS[vehicle.sellerType], vehicle.location]
                              .filter((entry) => entry && entry !== "–")
                              .join(" · ")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums whitespace-nowrap">
                      {orDash(vehicle.firstRegistration)}
                    </td>
                    <td className="py-2 text-right tabular-nums whitespace-nowrap">
                      {Number.isFinite(vehicle.mileageKm)
                        ? numberFormatter.format(vehicle.mileageKm)
                        : "–"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {orDash(vehicle.powerPs)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{euro(vehicle.price)}</td>
                    <td
                      className={`py-2 text-right tabular-nums ${
                        dark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {euro(vehicle.adjustedPrice)}
                    </td>
                    <td
                      className={`py-2 text-right font-semibold tabular-nums ${
                        delta === null
                          ? ""
                          : delta > 0
                            ? "text-emerald-600"
                            : "text-red-600"
                      }`}
                    >
                      {delta === null ? "–" : signedEuro(delta)}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <span
                        className={`tabular-nums font-semibold ${
                          vehicle.similarityScore >= 80
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {vehicle.similarityScore} %
                      </span>
                      {vehicle.listingUrl ? (
                        <a
                          href={vehicle.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-block align-middle text-sky-600 hover:text-sky-700"
                          title="Anzeige öffnen"
                        >
                          <FiExternalLink />
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`px-4 pb-4 text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Keine ausreichend ähnlichen Fahrzeuge gefunden.
        </p>
      )}

      <div className="px-4 pb-4">
        <PriceScale
          market={result.market}
          dealer={result.dealer}
          asking={asking}
          dark={dark}
        />
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------- price position */

function PriceScale({ market, dealer, asking, dark }) {
  const low = Number.isFinite(market.minimumPrice) ? market.minimumPrice : null;
  const high = Number.isFinite(market.maximumPrice) ? market.maximumPrice : null;
  if (low === null || high === null || high <= low) return null;

  const extras = [asking, dealer?.maximumPurchasePrice, market.marketValue].filter(
    Number.isFinite,
  );
  const min = Math.min(low, ...extras);
  const max = Math.max(high, ...extras);
  const span = max - min || 1;
  const at = (value) => `${(3 + ((value - min) / span) * 94).toFixed(2)}%`;

  const markers = [
    { value: dealer?.maximumPurchasePrice, label: "Limit", color: "bg-sky-600", text: "text-sky-600" },
    { value: market.marketValue, label: "Markt", color: "bg-emerald-600", text: "text-emerald-600" },
    { value: asking, label: "Angebot", color: "bg-slate-900", text: dark ? "text-slate-200" : "text-slate-900" },
  ].filter((marker) => Number.isFinite(marker.value));

  return (
    <div className="mt-4">
      <div className="relative" style={{ height: `${18 + markers.length * 14}px` }}>
        <div
          className={`absolute inset-x-0 top-2 h-1.5 rounded-full ${
            dark ? "bg-slate-800" : "bg-slate-200"
          }`}
        />
        {Number.isFinite(market.rangeFrom) && Number.isFinite(market.rangeTo) ? (
          <div
            className="absolute top-2 h-1.5 rounded-full bg-emerald-300"
            title="Marktspanne"
            style={{
              left: at(market.rangeFrom),
              width: `${(((market.rangeTo - market.rangeFrom) / span) * 94).toFixed(2)}%`,
            }}
          />
        ) : null}

        {/* ticks all sit on the rail */}
        {markers.map((marker) => (
          <span
            key={`tick-${marker.label}`}
            className={`absolute top-0 h-[14px] w-[2px] -translate-x-1/2 ${marker.color}`}
            style={{ left: at(marker.value) }}
          />
        ))}

        {/* labels get their own row each, so close values never overlap */}
        {markers.map((marker, index) => (
          <span
            key={`label-${marker.label}`}
            className={`absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums ${marker.text}`}
            style={{ left: at(marker.value), top: `${16 + index * 14}px` }}
          >
            {marker.label} {euro(marker.value)}
          </span>
        ))}
      </div>

      <div
        className={`flex justify-between text-[10px] ${
          dark ? "text-slate-600" : "text-slate-400"
        }`}
      >
        <span>{euro(min)}</span>
        <span>{euro(max)}</span>
      </div>
    </div>
  );
}

/* ================================================================ photos
 *
 * Portal photos are loaded straight from the portal's image servers. The
 * referrer is withheld, because some image hosts refuse requests that come
 * from another site, and a broken image hides itself instead of leaving a
 * grey box behind.
 */

function Gallery({ images, title, dark }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(() => new Set());

  const usable = (images || []).filter((src) => !failed.has(src));
  if (!usable.length) return null;

  const position = Math.min(index, usable.length - 1);
  const current = usable[position];
  const step = (delta) =>
    setIndex((value) => (value + delta + usable.length) % usable.length);

  const button = `absolute top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white transition ${
    dark ? "bg-slate-950/60 hover:bg-slate-950/80" : "bg-slate-900/50 hover:bg-slate-900/70"
  }`;

  return (
    <div
      className={`relative -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-lg ${
        dark ? "bg-slate-800" : "bg-slate-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={current}
        alt={title}
        referrerPolicy="no-referrer"
        className="aspect-[4/3] w-full object-cover"
        onError={() => setFailed((previous) => new Set(previous).add(current))}
      />

      {usable.length > 1 ? (
        <>
          <button type="button" onClick={() => step(-1)} className={`${button} left-2`} aria-label="Vorheriges Foto">
            <FiChevronLeft />
          </button>
          <button type="button" onClick={() => step(1)} className={`${button} right-2`} aria-label="Nächstes Foto">
            <FiChevronRight />
          </button>
          <span className="absolute bottom-2 right-2 rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
            {position + 1} / {usable.length}
          </span>
        </>
      ) : null}
    </div>
  );
}

function Thumb({ src, alt, className = "" }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`shrink-0 rounded object-cover ${className}`}
    />
  );
}

/* ============================================================ equipment */

const EQUIPMENT_TONES = {
  PREMIUM: "sky",
  HIGH: "emerald",
  GOOD: "slate",
  BASIC: "amber",
  UNKNOWN: "slate",
};

function EquipmentPanel({ result, dark }) {
  const [showAll, setShowAll] = useState(false);
  const equipment = result.insights?.equipment;
  if (!equipment) return null;

  const muted = dark ? "text-slate-500" : "text-slate-400";
  const fromText = new Set(
    equipment.items.filter((item) => item.from !== "Anzeige").map((item) => item.label),
  );
  const mark = (label) => (fromText.has(label) ? `${label}*` : label);

  // Safety kit is on every car; it goes last and only on request.
  const groups = showAll
    ? equipment.groups
    : equipment.groups.filter((group) => group.id !== "SAFETY");
  const hiddenCount = equipment.groups.length - groups.length;

  return (
    <Panel dark={dark}>
      <Caption
        dark={dark}
        action={
          <Chip dark={dark} tone={EQUIPMENT_TONES[equipment.level]}>
            {equipment.level === "UNKNOWN" ? "keine Angaben" : equipment.levelLabel}
          </Chip>
        }
      >
        Ausstattung
      </Caption>

      {equipment.level === "UNKNOWN" ? (
        <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Die Anzeige enthält keine Ausstattungsliste. Beim Verkäufer nach Navi, Sitzheizung,
          Einparkhilfe und Anhängerkupplung fragen.
        </p>
      ) : (
        <>
          <div className="mb-3">
            <div className="flex items-baseline justify-between text-[11px]">
              <span className={muted}>
                {equipment.count} Merkmale erkannt
                {equipment.listedCount ? ` · ${equipment.listedCount} in der Anzeige` : ""}
              </span>
              <span className="font-semibold tabular-nums">{equipment.score}/100</span>
            </div>
            <div
              className={`mt-1 h-1.5 overflow-hidden rounded-full ${
                dark ? "bg-slate-800" : "bg-slate-100"
              }`}
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={equipment.score}
              aria-label="Ausstattungsniveau"
            >
              <div
                className="h-full rounded-full bg-sky-600"
                style={{ width: `${Math.max(3, equipment.score)}%` }}
              />
            </div>
          </div>

          {equipment.highlights.length ? (
            <div className="mb-3">
              <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                Wertrelevant
              </p>
              <div className="flex flex-wrap gap-1">
                {equipment.highlights.map((label) => (
                  <Chip dark={dark} key={label} tone="sky">
                    {mark(label)}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="space-y-1.5">
            {groups.map((group) => (
              <div key={group.id}>
                <dt className={`text-[10px] font-bold uppercase tracking-wider ${muted}`}>
                  {group.label}
                </dt>
                <dd className={`text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  {group.items.map(mark).join(" · ")}
                </dd>
              </div>
            ))}
          </dl>

          {hiddenCount > 0 || showAll ? (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-1.5 text-[11px] font-semibold text-sky-600 hover:underline"
            >
              {showAll ? "Weniger anzeigen" : "Sicherheit & Standard anzeigen"}
            </button>
          ) : null}

          {equipment.notListed.length ? (
            <div
              className={`mt-3 rounded px-2.5 py-2 text-[11px] leading-5 ${
                dark ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-800"
              }`}
            >
              <span className="font-semibold">Nicht angegeben:</span>{" "}
              {equipment.notListed.join(", ")}
            </div>
          ) : null}

          {equipment.other.length ? (
            <p className={`mt-2 text-[11px] leading-5 ${muted}`}>
              <span className="font-semibold">Weitere laut Anzeige:</span>{" "}
              {equipment.other.join(", ")}
            </p>
          ) : null}

          {fromText.size ? (
            <p className={`mt-2 text-[10px] ${muted}`}>
              * aus Titel oder Beschreibung gelesen – vor Ort bestätigen.
            </p>
          ) : null}
        </>
      )}
    </Panel>
  );
}

/* =========================================================== negotiation */

const STANCE_TONES = { FIRM: "emerald", NORMAL: "slate", SOFT: "amber" };

function WeightDots({ weight, tone }) {
  return (
    <span className="mt-1.5 inline-flex shrink-0 gap-0.5" aria-label={`Gewicht ${weight} von 3`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`h-1.5 w-1.5 rounded-full ${
            step <= weight ? tone : "bg-slate-300/40"
          }`}
        />
      ))}
    </span>
  );
}

function NegotiationPanel({ result, live, dark }) {
  const negotiation = result.insights?.negotiation;
  const plan = live?.negotiation;
  if (!negotiation || !plan) return null;

  const muted = dark ? "text-slate-500" : "text-slate-400";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const agreed = live.negotiated !== null;

  const copyNotes = async () => {
    const title =
      result.target.title ||
      [result.target.make, result.target.model].filter(Boolean).join(" ");
    const questions = result.recommendation?.questionsForSeller || [];

    const lines = [
      `Gesprächsnotiz – ${title}`,
      result.target.listingUrl,
      "",
      `Angebot: ${euro(live.askingPrice)}`,
      plan.mode === "LIMIT_OFFER"
        ? `Limit-Angebot: ${euro(plan.opening)}, höchstens ${euro(plan.walkAway)} (Abstand ${percent(plan.gapPercent)})`
        : `Einstieg: ${euro(plan.opening)} · Ziel: ${euro(plan.target)} · Grenze: ${euro(plan.walkAway)}`,
      "",
      "Argumente:",
      ...negotiation.arguments.map((entry) => `+ ${entry.text}`),
      ...(negotiation.counterArguments.length
        ? ["", "Spricht dagegen:", ...negotiation.counterArguments.map((entry) => `− ${entry.text}`)]
        : []),
      ...(questions.length ? ["", "Fragen an den Verkäufer:", ...questions.map((entry) => `? ${entry}`)] : []),
    ].filter((line) => line !== undefined && line !== null);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Gesprächsnotiz kopiert.");
    } catch {
      toast.error("Kopieren nicht möglich.");
    }
  };

  return (
    <Panel dark={dark}>
      <Caption
        dark={dark}
        action={
          <div className="flex items-center gap-2">
            <Chip dark={dark} tone={plan.mode === "LIMIT_OFFER" ? "amber" : STANCE_TONES[plan.stance]}>
              {plan.stanceLabel}
            </Chip>
            <button
              type="button"
              onClick={copyNotes}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Preise, Argumente und Fragen als Notiz für das Telefonat kopieren"
            >
              <FiClipboard /> Notiz
            </button>
          </div>
        }
      >
        Verhandlung
      </Caption>

      {plan.mode === "LIMIT_OFFER" ? (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Angebot" value={euro(plan.opening)} hint="einmal anbieten" dark={dark} />
          <Metric
            label="Höchstens"
            value={euro(plan.walkAway)}
            hint="= Einkaufslimit"
            dark={dark}
            accent="primary"
          />
          <Metric
            label="Abstand"
            value={percent(plan.gapPercent)}
            hint={`${euro(live.askingPrice - plan.walkAway)} über dem Limit`}
            dark={dark}
            accent="negative"
          />
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label="Einstieg"
          value={euro(plan.opening)}
          hint="erstes Angebot"
          dark={dark}
        />
        <Metric
          label="Ziel"
          value={euro(plan.target)}
          hint={
            plan.discountToTarget > 0
              ? `−${euro(plan.discountToTarget)} (${percent(plan.discountToTargetPercent)})`
              : "entspricht dem Angebot"
          }
          dark={dark}
          accent="primary"
        />
        <Metric
          label="Schmerzgrenze"
          value={euro(plan.walkAway)}
          hint={plan.askingWithinLimit ? "= Angebotspreis" : "= Einkaufslimit"}
          dark={dark}
        />
      </div>
      )}

      {agreed ? (
        <p
          className={`mt-3 rounded px-2.5 py-2 text-[11px] leading-5 ${
            live.askingPrice <= live.limit
              ? dark
                ? "bg-emerald-950/40 text-emerald-300"
                : "bg-emerald-50 text-emerald-800"
              : dark
                ? "bg-red-950/40 text-red-300"
                : "bg-red-50 text-red-700"
          }`}
        >
          Verhandelter Preis {euro(live.askingPrice)} liegt{" "}
          {live.askingPrice <= live.limit
            ? `${euro(live.limit - live.askingPrice)} unter dem Einkaufslimit.`
            : `${euro(live.askingPrice - live.limit)} über dem Einkaufslimit.`}
        </p>
      ) : plan.mode === "LIMIT_OFFER" ? (
        <p
          className={`mt-3 rounded px-2.5 py-2 text-[11px] leading-5 ${
            dark ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-800"
          }`}
        >
          Der Verkäufer müsste {percent(plan.gapPercent)} nachlassen – in Stufen zu verhandeln
          lohnt nicht. Einmal {euro(plan.opening)} bis höchstens {euro(plan.walkAway)} anbieten
          und die Anzeige speichern: sinkt der Preis, zeigt die nächste Prüfung den Preisverlauf.
        </p>
      ) : plan.askingWithinLimit && plan.stance === "SOFT" ? (
        <p
          className={`mt-3 rounded px-2.5 py-2 text-[11px] leading-5 ${
            dark ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-800"
          }`}
        >
          Schon der Angebotspreis liegt im Limit und die Nachfrage ist hoch – nicht zu hart
          pokern, sonst kauft ein anderer.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
            Argumente für Nachlass
          </p>
          {negotiation.arguments.length ? (
            <ul className="space-y-1.5">
              {negotiation.arguments.map((entry) => (
                <li key={entry.text} className={`flex gap-2 text-xs leading-5 ${body}`}>
                  <WeightDots weight={entry.weight} tone="bg-emerald-600" />
                  <span>{entry.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-xs ${muted}`}>Die Daten liefern keine starken Argumente.</p>
          )}
        </div>

        <div>
          <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${muted}`}>
            Spricht für den Verkäufer
          </p>
          {negotiation.counterArguments.length ? (
            <ul className="space-y-1.5">
              {negotiation.counterArguments.map((entry) => (
                <li key={entry.text} className={`flex gap-2 text-xs leading-5 ${body}`}>
                  <WeightDots weight={entry.weight} tone="bg-amber-500" />
                  <span>{entry.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-xs ${muted}`}>Nichts Auffälliges.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ======================================================= market position
 *
 * Price over mileage: every comparable as a dot, this car highlighted, the
 * market's trend through them and the purchase limit as a reference line.
 * One look shows whether this car is dear for its kilometres or not.
 *
 * Colours are the first three slots of the validated categorical palette —
 * the only three that stay apart for every viewer when all pairs can sit
 * next to each other, as they do in a scatter.
 */

const CHART_COLORS = {
  light: {
    comparable: "#2a78d6",
    target: "#eb6834",
    trend: "#1baf7a",
    reference: "#64748b",
    grid: "#f1f5f9",
    axis: "#94a3b8",
    surface: "#ffffff",
  },
  dark: {
    comparable: "#3987e5",
    target: "#d95926",
    trend: "#199e70",
    reference: "#94a3b8",
    grid: "#1e293b",
    axis: "#64748b",
    surface: "#0f172a",
  },
};

function niceStep(span, targetTicks) {
  const raw = span / Math.max(1, targetTicks);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const nice = normalised < 1.5 ? 1 : normalised < 3 ? 2 : normalised < 7 ? 5 : 10;
  return nice * magnitude;
}

function ticksFor(min, max, count) {
  const step = niceStep(max - min, count);
  const ticks = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

const compactKm = (value) =>
  value >= 1_000 ? `${numberFormatter.format(Math.round(value / 1_000))} Tsd.` : String(value);

function PriceMileageChart({ points, trend, targetKm, targetPrice, limit, dark }) {
  const [hover, setHover] = useState(null);
  const colors = dark ? CHART_COLORS.dark : CHART_COLORS.light;

  const width = 640;
  const height = 240;
  const margin = { top: 14, right: 18, bottom: 28, left: 58 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const kms = [...points.map((point) => point.km), targetKm].filter(Number.isFinite);
  const prices = [
    ...points.map((point) => point.price),
    targetPrice,
    limit,
    trend?.from?.price,
    trend?.to?.price,
  ].filter(Number.isFinite);

  if (kms.length < 2 || prices.length < 2) return null;

  const kmPad = (Math.max(...kms) - Math.min(...kms)) * 0.06 || 5_000;
  const pricePad = (Math.max(...prices) - Math.min(...prices)) * 0.08 || 500;
  const xMin = Math.max(0, Math.min(...kms) - kmPad);
  const xMax = Math.max(...kms) + kmPad;
  const yMin = Math.max(0, Math.min(...prices) - pricePad);
  const yMax = Math.max(...prices) + pricePad;

  const x = (value) => margin.left + ((value - xMin) / (xMax - xMin)) * innerWidth;
  const y = (value) => margin.top + (1 - (value - yMin) / (yMax - yMin)) * innerHeight;

  const xTicks = ticksFor(xMin, xMax, 5);
  const yTicks = ticksFor(yMin, yMax, 4);

  const hovered = hover === null ? null : points[hover];
  const targetX = Number.isFinite(targetKm) ? x(targetKm) : null;
  const targetY = Number.isFinite(targetPrice) ? y(targetPrice) : null;
  // Keep the label inside the plot: flip it to the left near the right edge.
  const labelLeft = targetX !== null && targetX > width - 170;

  const legend = [
    { key: "dot", color: colors.comparable, label: "Vergleichsangebote" },
    { key: "target", color: colors.target, label: "Dieses Fahrzeug" },
    trend ? { key: "trend", color: colors.trend, label: "Markttrend", line: true } : null,
    Number.isFinite(limit)
      ? { key: "limit", color: colors.reference, label: "Einkaufslimit", line: true }
      : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {legend.map((entry) => (
          <span
            key={entry.key}
            className={`inline-flex items-center gap-1.5 text-[11px] ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {entry.line ? (
              <span className="h-0.5 w-3.5 rounded" style={{ background: entry.color }} />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            )}
            {entry.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Angebotspreise der Vergleichsfahrzeuge über dem Kilometerstand, mit diesem Fahrzeug, Markttrend und Einkaufslimit"
        >
          {/* recessive horizontal grid, solid hairlines */}
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={colors.grid}
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill={colors.axis}
              >
                {numberFormatter.format(tick)} €
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              x={x(tick)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill={colors.axis}
            >
              {compactKm(tick)} km
            </text>
          ))}

          {/* the purchase limit: a reference, not data */}
          {Number.isFinite(limit) ? (
            <g>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y(limit)}
                y2={y(limit)}
                stroke={colors.reference}
                strokeWidth="1"
              />
              <text
                x={margin.left + 4}
                y={y(limit) - 4}
                fontSize="10"
                fontWeight="600"
                fill={colors.reference}
              >
                Limit {euro(limit)}
              </text>
            </g>
          ) : null}

          {trend ? (
            <g>
              <line
                x1={x(trend.from.km)}
                y1={y(trend.from.price)}
                x2={x(trend.to.km)}
                y2={y(trend.to.price)}
                stroke={colors.trend}
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Labelled at the start, above the line: the right end is where
                  the high-mileage dots and the limit line crowd together. */}
              <text
                x={x(trend.from.km) + 14}
                y={y(trend.from.price) - 10}
                textAnchor="start"
                fontSize="10"
                fontWeight="600"
                fill={colors.trend}
              >
                Markttrend
              </text>
            </g>
          ) : null}

          {points.map((point, index) => (
            <circle
              key={`dot-${point.url || index}`}
              cx={x(point.km)}
              cy={y(point.price)}
              r={hover === index ? 5.5 : 4}
              fill={colors.comparable}
              stroke={colors.surface}
              strokeWidth="2"
            />
          ))}

          {targetX !== null && targetY !== null ? (
            <g>
              <circle
                cx={targetX}
                cy={targetY}
                r="6.5"
                fill={colors.target}
                stroke={colors.surface}
                strokeWidth="2"
              />
              <text
                x={labelLeft ? targetX - 11 : targetX + 11}
                y={targetY + 3.5}
                textAnchor={labelLeft ? "end" : "start"}
                fontSize="11"
                fontWeight="700"
                fill={dark ? "#f1f5f9" : "#0f172a"}
              >
                Dieses Fahrzeug · {euro(targetPrice)}
              </text>
            </g>
          ) : null}

          {/* hit targets: 24px, larger than the 8px dots, keyboard reachable */}
          {points.map((point, index) => (
            <circle
              key={`hit-${point.url || index}`}
              cx={x(point.km)}
              cy={y(point.price)}
              r="12"
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${point.title || "Angebot"}: ${euro(point.price)}, ${km(point.km)}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(index)}
              onBlur={() => setHover(null)}
              onClick={() => point.url && window.open(point.url, "_blank", "noopener,noreferrer")}
              onKeyDown={(event) => {
                if (event.key === "Enter" && point.url) {
                  window.open(point.url, "_blank", "noopener,noreferrer");
                }
              }}
            />
          ))}
        </svg>

        {hovered ? (
          <div
            className={`pointer-events-none absolute z-10 w-56 rounded-md border px-2.5 py-2 text-[11px] shadow-lg ${
              dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
            }`}
            style={{
              left: `${Math.min(72, Math.max(0, (x(hovered.km) / width) * 100 - 18))}%`,
              top: `${Math.max(0, (y(hovered.price) / height) * 100 - 42)}%`,
            }}
          >
            <p className="text-sm font-bold tabular-nums">{euro(hovered.price)}</p>
            {Number.isFinite(hovered.adjusted) && hovered.adjusted !== hovered.price ? (
              <p className={dark ? "text-slate-400" : "text-slate-500"}>
                bereinigt {euro(hovered.adjusted)}
              </p>
            ) : null}
            <p className="mt-1 truncate font-semibold">{hovered.title || "Angebot"}</p>
            <p className={dark ? "text-slate-400" : "text-slate-500"}>
              {[
                km(hovered.km),
                hovered.year ? `EZ ${hovered.year}` : null,
                SOURCE_SHORT[hovered.source] || hovered.source,
                Number.isFinite(hovered.similarity) ? `${hovered.similarity} % Match` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MarketPositionPanel({ result, live, dark }) {
  const insights = result.insights;
  const position = insights?.position;
  if (!position || position.points.length < 2) return null;

  const portal = insights.portal;
  const history = insights.history;
  const askingPrice = live?.askingPrice ?? result.target.price;

  // Counted against the price on screen, so a negotiated price moves it too.
  const cheaper = result.comparables.filter((entry) => {
    const reference = entry.adjustedPrice ?? entry.price;
    return Number.isFinite(reference) && reference < askingPrice;
  }).length;

  const expected = position.trend?.expectedAtTarget ?? null;
  const gap = Number.isFinite(expected) && Number.isFinite(askingPrice) ? askingPrice - expected : null;

  return (
    <Panel dark={dark}>
      <Caption
        dark={dark}
        action={
          position.total ? (
            <Chip dark={dark} tone={cheaper / position.total >= 0.5 ? "red" : "emerald"}>
              {cheaper} von {position.total} günstiger
            </Chip>
          ) : null
        }
      >
        Marktposition
      </Caption>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Je 10.000 km"
          value={position.trend ? `≈ ${euro(position.trend.per10000Km)}` : "–"}
          hint={position.trend ? "Wertverlust im Markt" : "zu wenig Streuung"}
          dark={dark}
        />
        <Metric
          label={`Erwartet bei ${km(result.target.mileageKm)}`}
          value={euro(expected)}
          hint={gap === null ? null : `Angebot ${signedEuro(gap)}`}
          dark={dark}
          accent={gap === null ? "none" : gap > 300 ? "negative" : gap < -300 ? "positive" : "none"}
        />
        {portal?.available && !Number.isFinite(portal.median) ? (
          <Metric
            label={`${portal.source}-Bewertung`}
            value={portal.label}
            hint="Einstufung des Portals"
            dark={dark}
            accent={portal.tone === "HIGH" ? "negative" : portal.tone === "LOW" ? "positive" : "none"}
          />
        ) : portal?.available ? (
          <Metric
            label={`${portal.source}-Median`}
            value={euro(portal.median)}
            hint={
              portal.label
                ? `„${portal.label}“${portal.agrees === true ? " · deckt sich mit uns" : ""}`
                : portal.agrees === true
                  ? "deckt sich mit unserem Wert"
                  : Number.isFinite(portal.agreementPercent)
                    ? `unser Wert ${signedPercent(portal.agreementPercent)}`
                    : null
            }
            dark={dark}
          />
        ) : null}
        {history?.changed ? (
          <Metric
            label="Preisverlauf"
            value={
              history.priceDrop > 0 ? `−${euro(history.priceDrop)}` : euro(result.target.price)
            }
            hint={`seit ${history.firstSeenLabel}: ${euro(history.firstPrice)}`}
            dark={dark}
            accent={history.priceDrop > 0 ? "positive" : "none"}
          />
        ) : null}
      </div>

      <PriceMileageChart
        points={position.points}
        trend={position.trend}
        targetKm={result.target.mileageKm}
        targetPrice={askingPrice}
        limit={live?.limit ?? result.dealer?.maximumPurchasePrice}
        dark={dark}
      />

      <p className={`mt-2 text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
        Angebotspreise wie im Portal. Punkte antippen für Details, klicken öffnet die Anzeige.
      </p>
    </Panel>
  );
}

/* ============================================================ checklist */

function Checklist({ items, dark }) {
  const [done, setDone] = useState(() => new Set());
  if (!items?.length) return <p className="text-xs text-slate-500">Keine Angaben.</p>;

  const areas = [...new Set(items.map((item) => item.area))];

  return (
    <div className="space-y-3">
      {areas.map((area) => (
        <div key={area}>
          <p
            className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
              dark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {area}
          </p>
          <ul className="space-y-1">
            {items
              .filter((item) => item.area === area)
              .map((item) => {
                const key = `${item.area}:${item.text}`;
                const checked = done.has(key);
                return (
                  <li key={key}>
                    <label className="flex cursor-pointer gap-2 text-xs leading-5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setDone((previous) => {
                            const next = new Set(previous);
                            if (next.has(key)) next.delete(key);
                            else next.add(key);
                            return next;
                          })
                        }
                        className="mt-1 h-3.5 w-3.5 shrink-0 accent-sky-600"
                      />
                      <span className={checked ? "line-through opacity-50" : ""}>
                        <span className={dark ? "text-slate-200" : "text-slate-700"}>
                          {item.text}
                        </span>
                        <span className={`block text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                          {item.why}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ================================================================ sidebar */

function VehiclePanel({ result, dark }) {
  const target = result.target;
  const insights = result.insights || {};
  const usage = insights.usage;
  const inspection = insights.inspection;
  const listing = insights.listing;

  const flags = [];
  if (target.condition === "DAMAGED") flags.push({ text: "Unfall / Defekt", tone: "red" });
  else if (target.condition === "REPAIRED_DAMAGE")
    flags.push({ text: "Vorschaden", tone: "amber" });
  else if (target.condition === "ACCIDENT_FREE")
    flags.push({ text: "Unfallfrei", tone: "emerald" });
  if (target.serviceHistory === "YES") flags.push({ text: "Scheckheft", tone: "emerald" });
  if (!target.tuvUntil && !target.newInspection) flags.push({ text: "TÜV unbekannt", tone: "amber" });
  if (target.nonSmoking === true) flags.push({ text: "Nichtraucher", tone: "emerald" });
  if (target.warranty) flags.push({ text: "Garantie", tone: "emerald" });
  if (listing?.demand === "HIGH") flags.push({ text: "Hohe Nachfrage", tone: "amber" });

  const title =
    target.title || [target.make, target.model].filter(Boolean).join(" ") || "Fahrzeug";

  return (
    <Panel dark={dark}>
      <Gallery key={target.listingUrl || title} images={target.images} title={title} dark={dark} />

      <Caption
        dark={dark}
        action={
          target.listingUrl ? (
            <a
              href={target.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline"
            >
              Anzeige <FiExternalLink />
            </a>
          ) : null
        }
      >
        Fahrzeug
      </Caption>

      <div className={dark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
        <Line label="Erstzulassung" value={orDash(target.firstRegistration)} dark={dark} />
        <Line label="Kilometerstand" value={km(target.mileageKm)} dark={dark} />
        {usage?.available ? (
          <Line
            label="Pro Jahr"
            value={`${km(usage.perYear)} · ${usage.label.toLowerCase()}`}
            dark={dark}
            warn={usage.level === "VERY_HIGH" || usage.shortTripRisk}
          />
        ) : null}
        <Line
          label="Leistung"
          value={Number.isFinite(target.powerPs) ? `${target.powerPs} PS` : "–"}
          dark={dark}
        />
        <Line label="Kraftstoff" value={FUEL_LABELS[target.fuel]} dark={dark} />
        <Line label="Getriebe" value={GEARBOX_LABELS[target.gearbox]} dark={dark} />
        <Line
          label="TÜV / HU"
          value={
            inspection?.available
              ? inspection.status === "NEW"
                ? "neu"
                : `${orDash(target.tuvUntil)} · ${inspection.status === "EXPIRED" ? "abgelaufen" : `${inspection.monthsLeft} Mon.`}`
              : orDash(target.tuvUntil)
          }
          dark={dark}
          warn={!inspection?.available || ["EXPIRED", "DUE"].includes(inspection.status)}
        />
        {Number.isFinite(target.ownerCount) ? (
          <Line
            label="Vorbesitzer"
            value={target.ownerCount}
            dark={dark}
            warn={target.ownerCount >= 3}
          />
        ) : null}
        {target.upholstery ? (
          <Line label="Innenausstattung" value={target.upholstery} dark={dark} />
        ) : null}
        {target.driveTrain ? <Line label="Antrieb" value={target.driveTrain} dark={dark} /> : null}
        <Line
          label="Scheckheft"
          value={SERVICE_LABELS[target.serviceHistory]}
          dark={dark}
          warn={target.serviceHistory !== "YES"}
        />
        <Line label="Zustand" value={CONDITION_LABELS[target.condition]} dark={dark} />
        <Line label="Verkäufer" value={SELLER_LABELS[target.sellerType]} dark={dark} />
        <Line label="Standort" value={orDash(target.location)} dark={dark} />
        {Number.isFinite(listing?.daysOnline) ? (
          <Line
            label="Online seit"
            value={`${listing.daysOnline === 0 ? "heute" : `${listing.daysOnline} ${listing.daysOnline === 1 ? "Tag" : "Tagen"}`}${
              Number.isFinite(listing.favorites) ? ` · ${listing.favorites}× gemerkt` : ""
            }`}
            dark={dark}
          />
        ) : null}
      </div>

      {flags.length ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {flags.map((flag) => (
            <Chip dark={dark} key={flag.text} tone={flag.tone}>
              {flag.text}
            </Chip>
          ))}
        </div>
      ) : null}

      {target.damageNote ? (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
          {target.damageNote}
        </p>
      ) : null}
    </Panel>
  );
}

function MarketPanel({ result, dark }) {
  const market = result.market;

  return (
    <Panel dark={dark}>
      <Caption
        dark={dark}
        action={
          Number.isFinite(market.differenceToAskingPercent) ? (
            <Chip dark={dark} tone={market.differenceToAsking > 0 ? "emerald" : "red"}>
              {market.differenceToAsking > 0 ? <FiTrendingDown /> : <FiTrendingUp />}
              {percent(Math.abs(market.differenceToAskingPercent))}
            </Chip>
          ) : null
        }
      >
        Marktlage
      </Caption>

      <div className={dark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
        <Line label="Marktwert" value={euro(market.marketValue)} dark={dark} tone="accent" />
        <Line
          label="Spanne"
          value={`${euro(market.rangeFrom)} – ${euro(market.rangeTo)}`}
          dark={dark}
        />
        <Line
          label="Differenz zum Angebot"
          value={signedEuro(market.differenceToAsking)}
          dark={dark}
          tone={market.differenceToAsking >= 0 ? "positive" : "negative"}
        />
        <Line
          label="Vergleiche"
          value={`${market.comparableCount} · ${market.retailCount} Händler / ${market.privateCount} privat`}
          dark={dark}
        />
        <Line label="Privatmarkt" value={euro(market.privateMarketLevel)} dark={dark} />
        <Line
          label="Ø Übereinstimmung"
          value={market.averageSimilarity !== null ? `${market.averageSimilarity} %` : "–"}
          dark={dark}
        />
      </div>
    </Panel>
  );
}

/**
 * Reasons, risks and questions as tabs rather than three tall columns —
 * the same content in a third of the height.
 *
 * This sits where the "Hinweise" box used to. Risks worth checking and the
 * questions to put to the seller are what a buyer acts on; remarks about the
 * data behind the number belong in the technical section, and are there.
 */
function NotesPanel({ result, dark }) {
  const [tab, setTab] = useState("risks");

  const tabs = [
    { id: "risks", label: "Risiken", values: result.recommendation?.risks },
    { id: "questions", label: "Fragen", values: result.recommendation?.questionsForSeller },
    { id: "checklist", label: "Prüfliste", values: result.insights?.checklist },
    { id: "reasons", label: "Bewertung", values: result.recommendation?.reasons },
  ];

  const active = tabs.find((entry) => entry.id === tab) || tabs[0];

  return (
    <Panel dark={dark}>
      <div
        className={`-mx-4 -mt-4 mb-3 flex border-b px-4 ${
          dark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
              entry.id === active.id
                ? "border-sky-600 text-sky-600"
                : `border-transparent ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {active.id === "checklist" ? (
        <Checklist items={active.values} dark={dark} />
      ) : active.values?.length ? (
        <ul className="space-y-1.5">
          {active.values.map((value, index) => (
            <li
              key={index}
              className={`flex gap-2 text-xs leading-5 ${
                dark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              <span className={dark ? "text-slate-600" : "text-slate-300"}>—</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Keine Angaben.</p>
      )}
    </Panel>
  );
}

/** The model's or the rule engine's summary sentence, under the calculation. */
function SummaryNote({ result, dark }) {
  if (!result.recommendation?.summary) return null;

  return (
    <Panel dark={dark}>
      <Caption
        dark={dark}
        action={
          <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
            {result.recommendation.generatedBy === "regelbasiert"
              ? "regelbasiert"
              : "KI-Formulierung"}
          </span>
        }
      >
        {result.recommendation.headline}
      </Caption>
      <p className={`text-xs leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
        {result.recommendation.summary}
      </p>
    </Panel>
  );
}
function TechnicalDetails({ result, dark }) {
  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [checking, setChecking] = useState(false);

  const runDiagnosis = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/market-analysis?diagnose=1");
      setDiagnosis(await response.json());
    } catch {
      toast.error("Diagnose fehlgeschlagen.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Panel dark={dark}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 font-bold">
          <FiInfo />
          Datengrundlage & Methodik
          {result.warnings?.length ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                dark ? "bg-amber-950 text-amber-300" : "bg-amber-100 text-amber-800"
              }`}
            >
              {result.warnings.length}{" "}
              {result.warnings.length === 1 ? "Anmerkung" : "Anmerkungen"}
            </span>
          ) : null}
        </span>
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {open ? (
        <div className="mt-4 space-y-5">
          {/* Remarks about the data itself — a thin sample, a portal that did
              not answer. They qualify the number, so they live beside it. */}
          {result.warnings?.length ? (
            <ul className="space-y-1.5">
              {result.warnings.map((warning, index) => (
                <li
                  key={index}
                  className={`flex gap-2 rounded px-3 py-2 text-[11px] leading-5 ${
                    dark ? "bg-amber-950/40 text-amber-300" : "bg-amber-50 text-amber-800"
                  }`}
                >
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Kandidaten gefunden"
              value={result.meta.candidatesFound}
              hint={`${result.meta.candidatesAccepted} verwendet`}
              dark={dark}
            />
            <Metric
              label="Ähnlichkeitsschwelle"
              value={`${result.meta.similarityThreshold} %`}
              hint={`Ø ${result.market.averageSimilarity ?? "–"} % erreicht`}
              dark={dark}
            />
            <Metric
              label="Preisspanne roh"
              value={`${euro(result.market.minimumPrice)} – ${euro(result.market.maximumPrice)}`}
              hint={`Median ${euro(result.market.medianPrice)}`}
              dark={dark}
            />
            <Metric
              label="Analysedauer"
              value={`${(result.meta.durationMs / 1000).toFixed(1)} s`}
              hint={new Date(result.meta.analyzedAt).toLocaleString("de-DE")}
              dark={dark}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Quellen</p>
            <div className="space-y-2">
              {result.meta.sources.map((source) => (
                <div
                  key={source.source}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm ${
                    dark ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  <span className="font-semibold">
                    {SOURCE_LABELS[source.source] || source.source}
                  </span>
                  <span className={dark ? "text-slate-400" : "text-slate-500"}>
                    {source.skipped
                      ? "nicht konfiguriert"
                      : source.ok
                        ? `${source.found} gefunden · ${source.used} übernommen`
                        : source.error || "keine Treffer"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {result.rejected?.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Aussortierte Angebote ({result.rejected.length})
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto custom-scroll pr-1">
                {result.rejected.map((entry, index) => (
                  <div
                    key={`${entry.listingUrl}-${index}`}
                    className={`rounded-xl p-3 text-sm ${dark ? "bg-slate-800" : "bg-slate-50"}`}
                  >
                    <p className="font-semibold">{entry.title || "Angebot"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{entry.reason}</p>
                    {entry.listingUrl ? (
                      <a
                        href={entry.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                      >
                        öffnen <FiExternalLink />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <button
              type="button"
              onClick={runDiagnosis}
              disabled={checking}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              {checking ? <FiLoader className="animate-spin" /> : <FiActivity />}
              Quellen-Diagnose ausführen
            </button>

            {diagnosis ? (
              <pre
                className={`mt-3 max-h-64 overflow-auto rounded-xl p-3 text-[11px] leading-4 custom-scroll ${
                  dark ? "bg-slate-950 text-slate-300" : "bg-slate-900 text-slate-100"
                }`}
              >
                {JSON.stringify(diagnosis, null, 2)}
              </pre>
            ) : null}
          </div>

          <p className={`text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            Fahrzeugdaten werden direkt aus der Anzeige gelesen, Vergleichsfahrzeuge über
            die Portale gesucht. Jeder Vergleich wird auf Alter, Laufleistung, Leistung,
            Kraftstoff und Getriebe bewertet, der Preis auf die Spezifikation des
            Zielfahrzeugs bereinigt und Ausreisser über die Interquartilsspanne entfernt.
            Vom realistischen Verkaufspreis werden ausschließlich die Abholkosten
            (Anreise mit der Bahn ab {result.dealer?.pickup?.origin || "Jülich"}, eine
            Stunde beim Verkäufer, Rückfahrt im Fahrzeug – bezahlt nach Stundenlohn, dazu
            Benzin für die tatsächlich gefahrenen Kilometer) sowie eine selbst eingetragene
            Renovierung und der gewünschte Zielgewinn abgezogen. Weitere Kosten werden
            nicht unterstellt. Wird ein verhandelter Preis eingetragen, rechnet die gesamte
            Kalkulation mit diesem statt mit dem Anzeigenpreis.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}

/* ==================================================== saved evaluations
 *
 * A recheck weeks later cannot reproduce a decision: prices move and ads get
 * deleted. So a saved entry keeps the analysis exactly as it was computed, and
 * opening one shows that, not a fresh run.
 */

function SavedAnalyses({ entries, dark, busy, onOpen, onDelete, onRefresh }) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      [entry.title, entry.make, entry.model, entry.listingUrl]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle)),
    );
  }, [entries, query]);

  return (
    <Panel dark={dark} className="mb-4" padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <FiDatabase />
          Gespeicherte Bewertungen
          <span className={`text-[11px] font-normal ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {entries.length}
          </span>
        </span>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="suchen"
            className={`h-7 w-36 rounded border px-2 text-xs outline-none focus:ring-2 ${
              dark
                ? "border-slate-700 bg-slate-800 focus:ring-sky-500/30"
                : "border-slate-300 bg-white focus:ring-sky-200"
            }`}
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={busy}
            aria-label="Liste aktualisieren"
            className={`inline-flex h-7 w-7 items-center justify-center rounded border ${
              dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            {busy ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          </button>
        </div>
      </div>

      {shown.length ? (
        <div className="mt-3 max-h-80 overflow-y-auto custom-scroll">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr
                className={`text-left text-[10px] uppercase tracking-wider ${
                  dark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                <th className="px-4 py-2 font-semibold">Fahrzeug</th>
                <th className="py-2 text-right font-semibold">Preis</th>
                <th className="py-2 text-right font-semibold">Limit</th>
                <th className="py-2 text-right font-semibold">Gewinn</th>
                <th className="py-2 font-semibold">Bewertung</th>
                <th className="py-2 text-right font-semibold">Gespeichert</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className={dark ? "divide-y divide-slate-800" : "divide-y divide-slate-100"}>
              {shown.map((entry) => {
                const meta = verdictMeta(entry.verdict);
                return (
                  <tr
                    key={entry._id}
                    className={dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}
                  >
                    <td className="max-w-[260px] px-4 py-2">
                      <button
                        type="button"
                        onClick={() => onOpen(entry)}
                        className="block max-w-full truncate text-left font-semibold hover:underline"
                        title={entry.title || entry.listingUrl}
                      >
                        {entry.title ||
                          [entry.make, entry.model].filter(Boolean).join(" ") ||
                          "Fahrzeug"}
                      </button>
                      <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                        {[
                          entry.marketplace,
                          entry.firstRegistration,
                          Number.isFinite(entry.mileageKm) ? km(entry.mileageKm) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>

                    <td className="py-2 text-right tabular-nums">
                      {euro(entry.askingPrice)}
                      {entry.negotiatedPrice ? (
                        <span className="block text-[10px] text-emerald-600">verhandelt</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-sky-600">
                      {euro(entry.maximumPurchasePrice)}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums ${
                        entry.expectedProfit >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {signedEuro(entry.expectedProfit)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td
                      className={`py-2 text-right whitespace-nowrap text-[10px] ${
                        dark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {new Date(entry.updatedAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        aria-label="Bewertung löschen"
                        className="text-slate-400 transition hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`px-4 pb-4 pt-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {entries.length
            ? "Keine Bewertung passt zur Suche."
            : "Noch nichts gespeichert. Nach einer Analyse oben auf „Speichern“."}
        </p>
      )}
    </Panel>
  );
}

/* ================================================= mobile.de, the fast way
 *
 * Shown the moment a mobile.de link is entered, instead of asking mobile.de
 * and waiting for its refusal. The ad is already open in the buyer's browser;
 * he copies it there, comes back, and the analysis starts by itself — read
 * from the clipboard where the browser allows it, or with Ctrl+V anywhere.
 */

/** A keyboard key, the way a shortcut is printed on it. */
function Key({ children, dark }) {
  return (
    <kbd
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-none ${
        dark
          ? "border-slate-600 bg-slate-800 text-slate-200"
          : "border-slate-300 bg-white text-slate-700 shadow-[0_1px_0_rgb(203_213_225)]"
      }`}
    >
      {children}
    </kbd>
  );
}

function MobileAssist({ url, dark, clipboardState, onAllowClipboard, onText, onCancel }) {
  const [draft, setDraft] = useState("");
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const arrow = <FiChevronRight className={dark ? "text-slate-600" : "text-slate-300"} />;

  return (
    <Panel dark={dark} className="mb-4 ring-2 ring-sky-500/50">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <FiLoader className="animate-spin text-sky-600" />
          mobile.de-Anzeige kopieren
        </p>
        <button
          type="button"
          onClick={onCancel}
          className={`inline-flex h-7 w-7 items-center justify-center rounded ${
            dark ? "hover:bg-slate-800" : "hover:bg-slate-100"
          }`}
          aria-label="Abbrechen"
        >
          <FiX />
        </button>
      </div>

      {/* The whole job in one line. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:underline"
        >
          Anzeige öffnen <FiExternalLink />
        </a>
        {arrow}
        <span className="inline-flex items-center gap-1">
          <Key dark={dark}>Strg+A</Key>
          <Key dark={dark}>Strg+C</Key>
        </span>
        {arrow}
        {clipboardState === "granted" ? (
          <span className="font-medium">zurückkommen – startet von selbst</span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            hier <Key dark={dark}>Strg+V</Key>
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* For touch screens, where there is no Ctrl+V: a long press here. */}
        <textarea
          data-ad-paste="true"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (looksLikeAdText(event.target.value)) onText(event.target.value);
          }}
          rows={1}
          placeholder="oder hier einfügen"
          className={`min-w-0 flex-1 resize-none rounded border px-3 py-1.5 text-xs outline-none focus:ring-2 ${
            dark
              ? "border-slate-700 bg-slate-900 focus:ring-sky-500/30"
              : "border-slate-300 bg-white focus:ring-sky-200"
          }`}
        />
        {clipboardState === "prompt" ? (
          <button
            type="button"
            onClick={onAllowClipboard}
            title="Einmal erlauben – danach startet die Analyse beim Zurückkommen ohne Strg+V"
            className={`shrink-0 rounded border px-2.5 py-1.5 text-xs font-semibold ${
              dark
                ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Ohne Strg+V: erlauben
          </button>
        ) : null}
      </div>

      <p className={`mt-2 truncate text-[10px] ${muted}`}>{url}</p>
    </Panel>
  );
}

function RecentSearches({ items, dark, onSelect, onClear }) {
  if (!items.length) return null;

  return (
    <Panel dark={dark} className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <FiClock />
          Zuletzt geprüft
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-slate-500 hover:text-red-600"
        >
          Verlauf leeren
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const meta = verdictMeta(item.verdict);
          return (
            <button
              key={item.url}
              type="button"
              onClick={() => onSelect(item.url)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.chip.split(" ")[0]}`} />
              <span className="max-w-[220px] truncate">{item.title}</span>
              <span className="tabular-nums text-slate-500">{euro(item.limit)}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ----------------------------------------------------- paste the ad instead */

/**
 * The dependable route when a portal refuses to serve its pages to a server.
 * The dealer has the ad open anyway: Strg+A, Strg+C, paste. No typing, and it
 * works on every portal — including ones we do not support directly.
 */
function PasteListing({ dark, busy, onSubmit }) {
  const [text, setText] = useState("");
  const enough = text.trim().length >= 80;

  return (
    <Panel dark={dark} className="mt-4">
      <SectionHead
        icon={FiClipboard}
        title="Anzeigentext einfügen"
        subtitle="Schnellster Weg: Anzeige im Browser öffnen, Strg+A, Strg+C, hier einfügen."
        dark={dark}
      />

      <ol
        className={`mb-3 list-inside list-decimal space-y-1 text-sm ${
          dark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        <li>Die Anzeige im Browser öffnen</li>
        <li>
          <strong>Strg+A</strong> (alles markieren), dann <strong>Strg+C</strong> (kopieren)
        </li>
        <li>
          Hier hineinklicken und <strong>Strg+V</strong> drücken
        </li>
      </ol>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={7}
        placeholder="Hier den kopierten Anzeigentext einfügen…"
        className={`w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 ${
          dark
            ? "border-slate-700 bg-slate-800 focus:ring-sky-500/30"
            : "border-slate-300 bg-white focus:ring-sky-200"
        }`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !enough}
          onClick={() => onSubmit(text)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <FiLoader className="animate-spin" /> : <FiSearch />}
          Text auswerten und analysieren
        </button>

        <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>
          {text.trim().length === 0
            ? "Noch nichts eingefügt."
            : enough
              ? `${text.trim().length.toLocaleString("de-DE")} Zeichen bereit.`
              : "Noch zu wenig Text – bitte die ganze Seite kopieren."}
        </span>
      </div>
    </Panel>
  );
}


function Field({ label, children, required = false, dark }) {
  return (
    <label className="block">
      <span
        className={`mb-1 block text-xs font-semibold ${
          dark ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

/* --------------------------------------------------------- manual fallback */

const MANUAL_FIELDS_REQUIRED = ["make", "model", "price", "firstRegistration", "mileageKm"];

/**
 * mobile.de in particular refuses automated reads of its ads. Rather than
 * dead-ending there, the dealer types the handful of figures that drive the
 * valuation — everything downstream (comparables, market value, purchase
 * limit) still runs normally off the other portals.
 */
function ManualEntryForm({ partial, dark, busy, onSubmit }) {
  const [form, setForm] = useState(() => ({
    make: partial?.make || "",
    model: partial?.model || "",
    variant: partial?.variant || "",
    price: partial?.price ?? "",
    firstRegistration: partial?.firstRegistration || "",
    mileageKm: partial?.mileageKm ?? "",
    powerPs: partial?.powerPs ?? "",
    fuel: partial?.fuel || "UNKNOWN",
    gearbox: partial?.gearbox || "UNKNOWN",
    sellerType: partial?.sellerType || "DEALER",
    condition: partial?.condition || "UNKNOWN",
    serviceHistory: partial?.serviceHistory || "UNKNOWN",
    tuvUntil: partial?.tuvUntil || "",
  }));

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const missing = MANUAL_FIELDS_REQUIRED.filter(
    (key) => form[key] === "" || form[key] === null,
  );
  const registrationValid = /^(0?[1-9]|1[0-2])\/(19|20)\d{2}$/.test(
    String(form.firstRegistration).trim(),
  );

  const inputClass = `h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 ${
    dark
      ? "border-slate-700 bg-slate-800 focus:ring-sky-500/30"
      : "border-slate-300 bg-white focus:ring-sky-200"
  }`;

  return (
    <Panel dark={dark} className="mt-4">
      <SectionHead
        icon={FiEdit3}
        title="Fahrzeugdaten selbst eintragen"
        subtitle="Aus der Anzeige abtippen – die Marktanalyse läuft danach vollständig."
        dark={dark}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field dark={dark} label="Marke" required>
          <input className={inputClass} value={form.make} onChange={set("make")} placeholder="z. B. Volkswagen" />
        </Field>
        <Field dark={dark} label="Modell" required>
          <input className={inputClass} value={form.model} onChange={set("model")} placeholder="z. B. Golf" />
        </Field>
        <Field dark={dark} label="Variante / Ausstattung">
          <input className={inputClass} value={form.variant} onChange={set("variant")} placeholder="1.5 TSI Life" />
        </Field>
        <Field dark={dark} label="Angebotspreis (€)" required>
          <input className={inputClass} type="number" min="0" value={form.price} onChange={set("price")} placeholder="17900" />
        </Field>

        <Field dark={dark} label="Erstzulassung (MM/JJJJ)" required>
          <input
            className={`${inputClass} ${
              form.firstRegistration && !registrationValid ? "border-red-400" : ""
            }`}
            value={form.firstRegistration}
            onChange={set("firstRegistration")}
            placeholder="03/2020"
          />
        </Field>
        <Field dark={dark} label="Kilometerstand" required>
          <input className={inputClass} type="number" min="0" value={form.mileageKm} onChange={set("mileageKm")} placeholder="78000" />
        </Field>
        <Field dark={dark} label="Leistung (PS)">
          <input className={inputClass} type="number" min="0" value={form.powerPs} onChange={set("powerPs")} placeholder="150" />
        </Field>
        <Field dark={dark} label="TÜV bis (MM/JJJJ)">
          <input className={inputClass} value={form.tuvUntil} onChange={set("tuvUntil")} placeholder="09/2027" />
        </Field>

        <Field dark={dark} label="Kraftstoff">
          <select className={inputClass} value={form.fuel} onChange={set("fuel")}>
            {["UNKNOWN", "PETROL", "DIESEL", "HYBRID", "PLUGIN_HYBRID", "ELECTRIC", "LPG", "CNG"].map(
              (value) => (
                <option key={value} value={value}>
                  {value === "UNKNOWN" ? "– bitte wählen –" : FUEL_LABELS[value]}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field dark={dark} label="Getriebe">
          <select className={inputClass} value={form.gearbox} onChange={set("gearbox")}>
            {["UNKNOWN", "MANUAL", "AUTOMATIC", "SEMI_AUTOMATIC"].map((value) => (
              <option key={value} value={value}>
                {value === "UNKNOWN" ? "– bitte wählen –" : GEARBOX_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field dark={dark} label="Verkäufer">
          <select className={inputClass} value={form.sellerType} onChange={set("sellerType")}>
            <option value="DEALER">Händler</option>
            <option value="PRIVATE">Privat</option>
            <option value="UNKNOWN">Unbekannt</option>
          </select>
        </Field>
        <Field dark={dark} label="Zustand">
          <select className={inputClass} value={form.condition} onChange={set("condition")}>
            <option value="UNKNOWN">Unbekannt</option>
            <option value="ACCIDENT_FREE">Unfallfrei</option>
            <option value="REPAIRED_DAMAGE">Vorschaden repariert</option>
            <option value="DAMAGED">Unfall / Defekt</option>
          </select>
        </Field>
        <Field dark={dark} label="Scheckheft">
          <select className={inputClass} value={form.serviceHistory} onChange={set("serviceHistory")}>
            <option value="UNKNOWN">Unbekannt</option>
            <option value="YES">Ja</option>
            <option value="NO">Nein</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || missing.length > 0 || !registrationValid}
          onClick={() =>
            onSubmit({
              ...form,
              price: Number(form.price),
              mileageKm: Number(form.mileageKm),
              powerPs: form.powerPs === "" ? null : Number(form.powerPs),
              title: [form.make, form.model, form.variant].filter(Boolean).join(" "),
            })
          }
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <FiLoader className="animate-spin" /> : <FiSearch />}
          Mit diesen Daten analysieren
        </button>

        {missing.length > 0 || !registrationValid ? (
          <span className="text-xs text-amber-600">
            {missing.length > 0
              ? "Bitte alle Pflichtfelder (*) ausfüllen."
              : "Erstzulassung im Format MM/JJJJ eintragen."}
          </span>
        ) : null}
      </div>
    </Panel>
  );
}


const LOADING_STEPS = [
  { at: 0, text: "Anzeige wird gelesen" },
  { at: 4, text: "Fahrzeugdaten werden normalisiert" },
  { at: 8, text: "Vergleichsfahrzeuge werden gesucht" },
  { at: 16, text: "Angebote werden bewertet und bereinigt" },
  { at: 24, text: "Marktwert und Einkaufslimit werden berechnet" },
  { at: 32, text: "Empfehlung wird formuliert" },
];

function LoadingPanel({ seconds, dark }) {
  const step =
    [...LOADING_STEPS].reverse().find((entry) => seconds >= entry.at) || LOADING_STEPS[0];

  return (
    <Panel dark={dark}>
      <div className="flex flex-col items-center py-12 text-center">
        <FiLoader className="animate-spin text-4xl text-sky-600" />
        <h2 className="mt-4 text-lg font-bold">Analyse läuft</h2>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{step.text}</p>
        <p className="mt-1 text-xs tabular-nums text-slate-400">{seconds}s</p>

        <div
          className={`mt-5 h-2 w-full max-w-lg overflow-hidden rounded-full ${
            dark ? "bg-slate-800" : "bg-slate-200"
          }`}
        >
          <div
            className="h-full rounded-full bg-sky-600 transition-all duration-700"
            style={{ width: `${Math.min(95, 12 + seconds * 2.6)}%` }}
          />
        </div>
      </div>
    </Panel>
  );
}


/* ================================================================== page */

export default function MarktanalysePage() {
  const { status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const [dark, setDark] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [lastManual, setLastManual] = useState(null);

  // Everything the user may change after the analysis has run. Held here, not
  // inside the ledger, so the sticky strip and the price scale see the same
  // figures the ledger does.
  const [adjust, setAdjust] = useState(() => initialAdjust(null));

  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [openedFrom, setOpenedFrom] = useState(null);

  const abortRef = useRef(null);

  // What the current car was read from when the portal could not be asked
  // directly (an imported page or pasted text), so a re-run — a postcode for
  // the pickup, "Erneut" — reuses it instead of asking mobile.de again.
  const sourceRef = useRef(null);
  const pendingImportRef = useRef(null);
  const importStartedRef = useRef(false);

  // A mobile.de link waiting for its ad text, and whether the browser lets the
  // page read the clipboard (then the text is picked up without Ctrl+V).
  const [awaiting, setAwaiting] = useState(null);
  const [clipboardState, setClipboardState] = useState("unknown");
  const seenClipboardRef = useRef("");

  const live = useMemo(
    () => (result ? recalculate(result, adjust) : null),
    [result, adjust],
  );

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(saved === "dark" || (!saved && prefersDark));

    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(stored)) setRecent(stored);
    } catch {
      /* ignore unreadable history */
    }
  }, []);

  useEffect(() => {
    // An ad sent by the bookmark arrives in the address fragment. It is taken
    // out of the address at once — and parked, in case a sign-in comes first.
    if (!window.location.hash.startsWith(IMPORT_PREFIX)) return;
    pendingImportRef.current = window.location.hash;
    try {
      sessionStorage.setItem("marktanalyse.import", window.location.hash);
    } catch {
      /* the ref still holds it for this visit */
    }
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch("/api/market-analysis/saved");
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error);
      setSaved(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      // A failing list must never block the analysis itself.
      setSaved([]);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadSaved();
  }, [status, loadSaved]);

  useEffect(() => {
    if (!loading) {
      setSeconds(0);
      return undefined;
    }
    const interval = setInterval(() => setSeconds((value) => value + 1), 1_000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const portal = useMemo(() => detectPortal(url), [url]);

  const rememberSearch = useCallback((data) => {
    // Text pasted without its link cannot be reopened from a link.
    if (!data.target?.listingUrl) return;
    const entry = {
      url: data.target.listingUrl,
      title:
        data.target.title ||
        [data.target.make, data.target.model].filter(Boolean).join(" ") ||
        "Fahrzeug",
      verdict: data.verdict,
      limit: data.dealer?.maximumPurchasePrice ?? null,
      at: data.meta.analyzedAt,
    };

    setRecent((current) => {
      const next = [entry, ...current.filter((item) => item.url !== entry.url)].slice(
        0,
        MAX_RECENT,
      );
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* history is a convenience, not a requirement */
      }
      return next;
    });
  }, []);

  const analyze = useCallback(
    async (targetUrl, manualVehicle = null, pastedText = null, extras = null) => {
      const check = detectPortal(targetUrl);
      // Pasted ad text carries everything; the link is then optional.
      if (check.status !== "supported" && !pastedText) {
        const message =
          check.status === "unsupported"
            ? `${check.host} wird nicht unterstützt. Bitte AutoScout24, mobile.de oder Kleinanzeigen verwenden.`
            : "Bitte einen gültigen Fahrzeug-Link einfügen.";
        setError({ message });
        toast.error(message);
        return;
      }

      if (manualVehicle) setLastManual(manualVehicle);
      setAwaiting(null);

      const cleanUrl = check.status === "supported" ? String(targetUrl).trim() : "";
      let pageHtml = extras?.pageHtml || null;
      let pasted = pastedText;

      if (pageHtml || pasted) {
        sourceRef.current = { url: cleanUrl, pageHtml, pastedText: pasted };
      } else if (!manualVehicle && sourceRef.current?.url === cleanUrl) {
        pageHtml = sourceRef.current.pageHtml;
        pasted = sourceRef.current.pastedText;
      } else if (sourceRef.current?.url !== cleanUrl) {
        sourceRef.current = null;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      setLoading(true);
      setResult(null);
      setError(null);

      try {
        const response = await fetch("/api/market-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: cleanUrl,
            ...(manualVehicle ? { manualVehicle } : {}),
            ...(pasted ? { pastedText: pasted } : {}),
            ...(extras || {}),
            ...(pageHtml ? { pageHtml } : {}),
          }),
          signal: controller.signal,
        });

        const raw = await response.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Der Server hat nicht korrekt geantwortet (HTTP ${response.status}).`);
        }

        if (!response.ok) {
          setError({
            message: data?.error || `Fehler ${response.status}.`,
            hint: data?.hint,
            code: data?.code,
            details: data?.details,
          });
          toast.error(data?.error || "Analyse fehlgeschlagen.");
          return;
        }

        setResult(data);
        setAdjust(initialAdjust(data));
        setSavedAt(null);
        setOpenedFrom(null);
        setLastManual(null);
        rememberSearch(data);
        toast.success(
          data.dealer?.available
            ? `Einkaufslimit ${euro(data.dealer.maximumPurchasePrice)}`
            : "Analyse abgeschlossen.",
        );
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          const message = "Die Analyse hat zu lange gedauert und wurde abgebrochen.";
          setError({ message });
          toast.error(message);
          return;
        }
        const message =
          requestError instanceof TypeError
            ? "Keine Verbindung zum Server. Bitte Internetverbindung prüfen."
            : requestError?.message || "Analyse fehlgeschlagen.";
        setError({ message });
        toast.error(message);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    },
    [rememberSearch],
  );

  /**
   * The analysis as it currently stands on screen, with every edited figure
   * folded back in. This — not the untouched server response — is what gets
   * stored, because it is what the buyer actually decided on.
   */
  const currentResult = useCallback(() => {
    if (!result) return null;
    if (!live) return result;

    return {
      ...result,
      verdict: live.verdict,
      dealer: {
        ...result.dealer,
        listPrice: live.listPrice,
        negotiatedPrice: live.negotiated,
        askingPrice: live.askingPrice,
        savings: live.savings,
        pickupCost: live.pickupCost,
        refurbishmentCost: live.refurbishment,
        targetProfit: live.targetProfit,
        maximumPurchasePrice: live.limit,
        expectedProfit: live.expected,
        requiredDiscount: live.discount,
        pickup: result.dealer?.pickup
          ? {
              ...result.dealer.pickup,
              inboundMinutes: toNumber(adjust.inbound),
              onSiteMinutes: toNumber(adjust.onSite),
              ticketCost: toNumber(adjust.ticket),
              fuelCost: toNumber(adjust.fuel),
              totalMinutes: live.totalMinutes,
              labourCost: live.labourCost,
              totalCost: live.pickupCost,
            }
          : null,
      },
    };
  }, [result, live, adjust]);

  const saveResult = useCallback(async () => {
    const payload = currentResult();
    if (!payload) return;

    setSaving(true);
    try {
      const response = await fetch("/api/market-analysis/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: payload, inputs: adjust }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Speichern fehlgeschlagen.");

      setSavedAt(new Date().toISOString());
      toast.success("Bewertung gespeichert.");
      loadSaved();
    } catch (saveError) {
      toast.error(saveError?.message || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }, [currentResult, adjust, loadSaved]);

  const openSaved = useCallback(async (entry) => {
    try {
      const response = await fetch(`/api/market-analysis/saved/${entry._id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Laden fehlgeschlagen.");

      const stored = data.entry?.result;
      if (!stored) throw new Error("Zu diesem Eintrag liegt keine Analyse vor.");

      setResult(stored);
      setAdjust(data.entry.inputs || initialAdjust(stored));
      setAwaiting(null);
      setUrl(
        stored.target?.listingUrl ||
          (String(entry.listingUrl || "").startsWith("anzeigentext:") ? "" : entry.listingUrl) ||
          "",
      );
      setError(null);
      setSavedAt(data.entry.updatedAt);
      setOpenedFrom(data.entry.updatedAt);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (openError) {
      toast.error(openError?.message || "Laden fehlgeschlagen.");
    }
  }, []);

  const deleteSaved = useCallback(
    async (entry) => {
      // Optimistic: the row disappears at once and comes back if the call fails.
      setSaved((current) => current.filter((item) => item._id !== entry._id));

      try {
        const response = await fetch(`/api/market-analysis/saved/${entry._id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error();
        toast.success("Gelöscht.");
      } catch {
        toast.error("Löschen fehlgeschlagen.");
        loadSaved();
      }
    },
    [loadSaved],
  );

  /**
   * Entering a link. mobile.de is not asked at all — it refuses every time —
   * and the fast path opens instead. Everything else is analysed directly.
   */
  const submit = useCallback(
    (raw) => {
      const link = String(raw || "").trim();
      if (!link) {
        toast.error("Bitte einen Fahrzeug-Link eingeben oder den Anzeigentext einfügen.");
        return;
      }

      const portal = detectPortal(link);
      const known = sourceRef.current?.url === link;
      if (portal.status === "supported" && portal.label === "mobile.de" && !MOBILE_DIRECT && !known) {
        abortRef.current?.abort();
        setResult(null);
        setError(null);
        setAwaiting({ url: link });
        return;
      }

      analyze(link);
    },
    [analyze],
  );

  /** A copied ad arrived — by Ctrl+V, the clipboard, or the text box. */
  const startFromText = useCallback(
    (text) => {
      seenClipboardRef.current = text;
      const link = awaiting?.url || (detectPortal(url).status === "supported" ? url.trim() : "");
      toast.success("Anzeigentext übernommen – Analyse läuft.");
      analyze(link, null, text);
    },
    [awaiting, url, analyze],
  );

  const readClipboard = useCallback(async () => {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return null;
    }
  }, []);

  const clipboardPermission = useCallback(async () => {
    try {
      const status = await navigator.permissions.query({ name: "clipboard-read" });
      setClipboardState(status.state);
      return status.state;
    } catch {
      // Firefox and Safari do not expose this permission: Ctrl+V it is.
      setClipboardState("unsupported");
      return "unsupported";
    }
  }, []);

  // While a mobile.de link waits: coming back to this tab reads the clipboard,
  // if the browser has allowed it once. What was already there when waiting
  // began is ignored — that is never the new ad.
  useEffect(() => {
    if (!awaiting) return undefined;
    let active = true;

    const look = async (initial) => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        if (initial) await clipboardPermission();
        return;
      }
      if ((await clipboardPermission()) !== "granted") return;
      const text = await readClipboard();
      if (!active || text === null) return;
      if (initial) {
        seenClipboardRef.current = text;
        return;
      }
      if (text !== seenClipboardRef.current && looksLikeAdText(text)) startFromText(text);
    };

    look(true);
    const onReturn = () => look(false);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      active = false;
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [awaiting, clipboardPermission, readClipboard, startFromText]);

  /** One click, one browser prompt; after that the clipboard is read by itself. */
  const allowClipboard = useCallback(async () => {
    const text = await readClipboard();
    await clipboardPermission();
    if (text && text !== seenClipboardRef.current && looksLikeAdText(text)) {
      startFromText(text);
    } else if (text !== null) {
      seenClipboardRef.current = text;
      toast.success("Erlaubt – jetzt die Anzeige kopieren und zurückkommen.");
    }
  }, [readClipboard, clipboardPermission, startFromText]);

  // Ctrl+V anywhere on the page: a link starts the check, a copied ad starts
  // the analysis. Pasting into a price or note field stays a normal paste.
  useEffect(() => {
    const onPaste = (event) => {
      if (loading) return;
      const field = event.target?.closest?.("input, textarea, select, [contenteditable='true']");
      if (field && !field.dataset?.adPaste) return;

      const text = event.clipboardData?.getData("text/plain") || "";
      if (looksLikeAdText(text)) {
        event.preventDefault();
        startFromText(text);
        return;
      }

      const link = text.trim();
      if (link && !/\s/.test(link) && detectPortal(link).status === "supported") {
        event.preventDefault();
        setUrl(link);
        submit(link);
      }
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [loading, startFromText, submit]);

  useEffect(() => {
    if (status !== "authenticated" || importStartedRef.current) return;

    let fragment = pendingImportRef.current;
    try {
      fragment = fragment || sessionStorage.getItem("marktanalyse.import");
      sessionStorage.removeItem("marktanalyse.import");
    } catch {
      /* nothing parked */
    }
    if (!fragment) return;

    importStartedRef.current = true;
    (async () => {
      try {
        const { url: importedUrl, html } = await decodeImport(fragment);
        setUrl(importedUrl);
        toast.success("Anzeige aus dem Browser übernommen.");
        analyze(importedUrl, null, null, { pageHtml: html });
      } catch (importError) {
        setError({ message: importError.message });
        toast.error(importError.message);
      }
    })();
  }, [status, analyze]);

  const copySummary = async () => {
    if (!result) return;
    const dealer = result.dealer;

    const lines = [
      result.target.title || [result.target.make, result.target.model].filter(Boolean).join(" "),
      live?.negotiated
        ? `Verhandelt: ${euro(live.negotiated)} (Anzeige ${euro(live.listPrice)})`
        : `Angebot: ${euro(live?.askingPrice ?? result.target.price)}`,
      `EZ ${orDash(result.target.firstRegistration)} · ${km(result.target.mileageKm)}`,
      `Marktwert: ${euro(result.market.marketValue)} (${euro(result.market.rangeFrom)} – ${euro(result.market.rangeTo)})`,
      `Realistischer Verkaufspreis: ${euro(dealer?.sellingPrice)}`,
      dealer?.pickup?.available
        ? `Abholkosten: ${euro(live?.pickupCost ?? dealer.pickupCost)} (${dealer.pickup.oneWayKm} km einfach)`
        : null,
      `Einkaufslimit: ${euro(live?.limit ?? dealer?.maximumPurchasePrice)}`,
      `Erwarteter Gewinn: ${signedEuro(live?.expected ?? dealer?.expectedProfit)}`,
      (live?.discount ?? dealer?.requiredDiscount) > 0
        ? `Nötiger Nachlass: ${euro(live?.discount ?? dealer.requiredDiscount)}`
        : null,
      result.insights?.equipment && result.insights.equipment.level !== "UNKNOWN"
        ? `Ausstattung: ${result.insights.equipment.levelLabel}${result.insights.equipment.highlights.length ? ` (${result.insights.equipment.highlights.join(", ")})` : ""}`
        : null,
      live?.negotiation
        ? live.negotiation.mode === "LIMIT_OFFER"
          ? `Verhandlung: nur Limit-Angebot ${euro(live.negotiation.opening)}, höchstens ${euro(live.negotiation.walkAway)}`
          : `Verhandlung: Einstieg ${euro(live.negotiation.opening)} · Ziel ${euro(live.negotiation.target)} · Grenze ${euro(live.negotiation.walkAway)}`
        : null,
      `Bewertung: ${verdictMeta(live?.verdict ?? result.verdict).label} · Konfidenz ${result.confidence} %`,
      result.target.listingUrl,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Zusammenfassung kopiert.");
    } catch {
      toast.error("Kopieren nicht möglich.");
    }
  };

  const reset = () => {
    setAwaiting(null);
    setUrl("");
    setResult(null);
    setError(null);
    setLastManual(null);
    setSavedAt(null);
    setOpenedFrom(null);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen ${
        dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5">
        {/* toolbar: title and the one input, on a single row */}
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className={`rounded p-2 md:hidden ${
              dark ? "bg-slate-900" : "bg-white shadow-sm"
            }`}
            aria-label="Menü öffnen"
          >
            <FiMenu />
          </button>

          <div className="mr-2">
            <h1 className="text-base font-bold leading-tight">Ankaufs-Check</h1>
            <p className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>
              Marktwert und Einkaufslimit aus einem Fahrzeug-Link
            </p>
          </div>

          <form
            className="flex min-w-[280px] flex-1 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(url);
            }}
          >
            <div className="relative flex-1">
              <FiLink className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                data-ad-paste="true"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={loading}
                placeholder="Link einfügen – oder den kopierten Anzeigentext (Strg+V)"
                className={`h-9 w-full rounded border pl-8 pr-3 text-sm outline-none focus:ring-2 ${
                  dark
                    ? "border-slate-700 bg-slate-900 focus:ring-sky-500/30"
                    : "border-slate-300 bg-white focus:ring-sky-200"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiSearch />}
              {loading ? "Prüft…" : "Prüfen"}
            </button>

            {result || error ? (
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                aria-label="Zurücksetzen"
                className={`inline-flex h-9 w-9 items-center justify-center rounded border ${
                  dark ? "border-slate-700" : "border-slate-300"
                }`}
              >
                <FiRefreshCw />
              </button>
            ) : null}

            {result ? (
              <button
                type="button"
                onClick={copySummary}
                title="Zusammenfassung kopieren"
                className={`inline-flex h-9 w-9 items-center justify-center rounded border ${
                  dark ? "border-slate-700" : "border-slate-300"
                }`}
              >
                <FiCopy />
              </button>
            ) : null}
          </form>
        </header>

        {!url.trim() && !loading && !result && !awaiting ? (
          <p className={`-mt-2 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${dark ? "text-slate-500" : "text-slate-500"}`}>
            <span>Link einfügen</span>
            <span className={dark ? "text-slate-700" : "text-slate-300"}>·</span>
            <span className="inline-flex flex-wrap items-center gap-1">
              bei mobile.de die ganze Seite:
              <Key dark={dark}>Strg+A</Key>
              <Key dark={dark}>Strg+C</Key>
              auf der Anzeige, dann hier
              <Key dark={dark}>Strg+V</Key>
            </span>
          </p>
        ) : null}

        {url.trim() && !loading && portal.status !== "supported" ? (
          <p className="mb-3 text-[11px] text-amber-600">
            {portal.status === "unsupported"
              ? `${portal.host} wird nicht unterstützt.`
              : "Das sieht nicht nach einem gültigen Link aus."}
          </p>
        ) : null}

        {awaiting && !loading ? (
          <MobileAssist
            url={awaiting.url}
            dark={dark}
            clipboardState={clipboardState}
            onAllowClipboard={allowClipboard}
            onText={startFromText}
            onCancel={() => setAwaiting(null)}
          />
        ) : null}

        {!loading && !result && !awaiting ? (
          <SavedAnalyses
            entries={saved}
            dark={dark}
            busy={loadingSaved}
            onOpen={openSaved}
            onDelete={deleteSaved}
            onRefresh={loadSaved}
          />
        ) : null}

        {!loading && !result && !error ? (
          <RecentSearches
            items={recent}
            dark={dark}
            onSelect={(selected) => {
              setUrl(selected);
              submit(selected);
            }}
            onClear={() => {
              setRecent([]);
              try {
                localStorage.removeItem(RECENT_KEY);
              } catch {
                /* ignore */
              }
            }}
          />
        ) : null}

        {error ? (
          <>
            <section
              className={`mb-3 rounded-lg border p-3 ${
                error.details?.canRetryManually
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-red-300 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-2">
                  <FiAlertTriangle className="mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-bold">
                      {error.details?.canRetryManually
                        ? "Anzeige nicht automatisch lesbar"
                        : "Analyse nicht möglich"}
                    </h2>
                    <p className="mt-0.5 text-xs">{error.message}</p>
                    {error.hint ? (
                      <p className="mt-0.5 text-[11px] opacity-80">{error.hint}</p>
                    ) : null}

                    {error.details?.debug ? (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-[11px] font-semibold opacity-80">
                          Technische Details
                        </summary>
                        <pre className="custom-scroll mt-1 max-w-full overflow-auto rounded bg-white/60 p-2 text-[10px] leading-4">
                          {JSON.stringify(error.details.debug, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                </div>

                {url.trim() ? (
                  <button
                    type="button"
                    onClick={() => submit(url)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded border border-current bg-white px-2.5 py-1.5 text-xs font-semibold hover:opacity-80"
                  >
                    <FiRefreshCw /> Erneut
                  </button>
                ) : null}
              </div>
            </section>

            {error.details?.canRetryManually ? (
              <div className="mb-4">
                <PasteListing
                  dark={dark}
                  busy={loading}
                  onSubmit={(text) => analyze(url, null, text)}
                />

                <details className="mt-2">
                  <summary
                    className={`cursor-pointer text-xs font-semibold ${
                      dark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Lieber von Hand eintragen
                  </summary>
                  <ManualEntryForm
                    partial={error.details?.partial || lastManual}
                    dark={dark}
                    busy={loading}
                    onSubmit={(manual) => analyze(url, manual)}
                  />
                </details>
              </div>
            ) : null}
          </>
        ) : null}

        {loading ? <LoadingPanel seconds={seconds} dark={dark} /> : null}

        {!loading && result ? (
          <>
            <DecisionStrip
              result={result}
              live={live}
              dark={dark}
              onSave={saveResult}
              saving={saving}
              savedAt={savedAt}
            />

            {openedFrom ? (
              <p
                className={`mb-3 flex items-center gap-2 text-[11px] ${
                  dark ? "text-slate-500" : "text-slate-500"
                }`}
              >
                <FiDatabase />
                Gespeicherte Bewertung vom{" "}
                {new Date(openedFrom).toLocaleString("de-DE")} – die Zahlen stammen aus
                diesem Stand, nicht aus einer neuen Abfrage.
                <button
                  type="button"
                  onClick={() => submit(url)}
                  className="font-semibold text-sky-600 hover:underline"
                >
                  neu prüfen
                </button>
              </p>
            ) : null}

            {/* Decision on the left, evidence on the right. */}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <div className="min-w-0 space-y-4">
                <Calculation
                  result={result}
                  live={live}
                  adjust={adjust}
                  onAdjust={(field, value) =>
                    setAdjust((current) => ({ ...current, [field]: value }))
                  }
                  dark={dark}
                  busy={loading}
                  onPostcode={(code) => analyze(url, null, null, { pickupPostcode: code })}
                />
                <NegotiationPanel result={result} live={live} dark={dark} />
                <MarketPositionPanel result={result} live={live} dark={dark} />
                <SummaryNote result={result} dark={dark} />
                <ComparablesTable
                  result={result}
                  asking={live?.askingPrice ?? result.target.price}
                  dark={dark}
                />
              </div>

              <aside className="min-w-0 space-y-4">
                <NotesPanel result={result} dark={dark} />
                <VehiclePanel result={result} dark={dark} />
                <EquipmentPanel result={result} dark={dark} />
                <MarketPanel result={result} dark={dark} />
              </aside>
            </div>

            <div className="mt-4">
              <SavedAnalyses
                entries={saved}
                dark={dark}
                busy={loadingSaved}
                onOpen={openSaved}
                onDelete={deleteSaved}
                onRefresh={loadSaved}
              />
            </div>

            <div className="mt-4">
              <TechnicalDetails result={result} dark={dark} />
            </div>

            <p
              className={`mt-4 pb-4 text-center text-[11px] ${
                dark ? "text-slate-600" : "text-slate-400"
              }`}
            >
              Rechnerische Schätzung auf Basis öffentlicher Anzeigen – Zustand, Historie
              und Papiere vor dem Ankauf prüfen.
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
