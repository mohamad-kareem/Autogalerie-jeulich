"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";

import { toast } from "react-hot-toast";

import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiLink,
  FiLoader,
  FiMenu,
  FiPhoneCall,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiSlash,
  FiTag,
  FiThumbsUp,
  FiTrendingUp,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { useSidebar } from "@/app/(components)/SidebarContext";

const RECENT_SEARCHES_KEY = "dealcheck.recentSearches.playwright";

const MAX_RECENT_SEARCHES = 8;

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

function numericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function formatPrice(value) {
  const number = numericValue(value);

  if (number === null) {
    return "–";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatSignedPrice(value) {
  const number = numericValue(value);

  if (number === null) {
    return "–";
  }

  return `${number > 0 ? "+" : ""}${formatPrice(number)}`;
}

function formatNumber(value) {
  const number = numericValue(value);

  if (number === null) {
    return "–";
  }

  return new Intl.NumberFormat("de-DE").format(number);
}

function formatMileage(value) {
  const number = numericValue(value);

  if (number === null) {
    return "–";
  }

  return `${formatNumber(number)} km`;
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "–" : value;
}

function sourceLabel(source) {
  switch (source) {
    case "AUTOSCOUT24":
      return "AutoScout24";

    case "MOBILE_DE":
      return "mobile.de";

    case "KLEINANZEIGEN":
      return "Kleinanzeigen";

    default:
      return "Unbekannte Quelle";
  }
}

function serviceLabel(value) {
  if (value === "YES") {
    return "Ja";
  }

  if (value === "NO") {
    return "Nein";
  }

  return "Unbekannt";
}

function accidentLabel(value) {
  switch (value) {
    case "ACCIDENT_FREE":
      return "Unfallfrei";

    case "DAMAGED":
      return "Beschädigt / defekt";

    case "REPAIRED_DAMAGE":
      return "Reparierter Vorschaden";

    default:
      return "Unbekannt";
  }
}

function sellerLabel(value) {
  if (value === "DEALER") {
    return "Händler";
  }

  if (value === "PRIVATE") {
    return "Privat";
  }

  return "Unbekannt";
}

// -----------------------------------------------------------------------------
// Rating presentation
// -----------------------------------------------------------------------------

const RATING_META = {
  VERY_GOOD: {
    icon: FiThumbsUp,

    banner: "border-emerald-300 bg-emerald-50",

    accent: "text-emerald-700",

    badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },

  GOOD: {
    icon: FiCheckCircle,

    banner: "border-emerald-300 bg-emerald-50",

    accent: "text-emerald-700",

    badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },

  CONDITIONAL: {
    icon: FiPhoneCall,

    banner: "border-amber-300 bg-amber-50",

    accent: "text-amber-700",

    badge: "border-amber-200 bg-amber-100 text-amber-800",
  },

  TOO_EXPENSIVE: {
    icon: FiXCircle,

    banner: "border-red-300 bg-red-50",

    accent: "text-red-700",

    badge: "border-red-200 bg-red-100 text-red-800",
  },

  INSUFFICIENT_DATA: {
    icon: FiSlash,

    banner: "border-slate-300 bg-slate-50",

    accent: "text-slate-600",

    badge: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function ratingMeta(value) {
  return RATING_META[value] || RATING_META.INSUFFICIENT_DATA;
}

// -----------------------------------------------------------------------------
// Components
// -----------------------------------------------------------------------------

function DetailItem({ icon: Icon, label, value, darkMode, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        darkMode
          ? "border-slate-700 bg-slate-800/70"
          : "border-slate-200 bg-slate-50"
      } ${highlight ? "ring-1 ring-blue-400/50" : ""}`}
    >
      <div
        className={`mb-1 flex items-center gap-2 text-xs ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {Icon ? <Icon /> : null}

        <span>{label}</span>
      </div>

      <p className="text-sm font-semibold">{valueOrDash(value)}</p>
    </div>
  );
}

function VerdictBanner({ result }) {
  const recommendation = result.recommendation;

  const meta = ratingMeta(recommendation.rating);

  const Icon = meta.icon;

  return (
    <section className={`rounded-2xl border-2 p-5 shadow-sm ${meta.banner}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`rounded-xl bg-white/70 p-2.5 text-2xl ${meta.accent}`}
          >
            <Icon />
          </div>

          <div>
            <p
              className={`text-xs font-bold uppercase tracking-wide ${meta.accent}`}
            >
              KI-Deal-Check
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
              {recommendation.headline}
            </h2>

            <p className="mt-1 max-w-3xl text-sm text-slate-700">
              {recommendation.summary}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Geschätzter Gewinn
          </p>

          <p className={`text-3xl font-extrabold ${meta.accent}`}>
            {formatSignedPrice(
              result.dealerAssessment.estimatedProfitAtAskingPrice,
            )}
          </p>

          <p className="text-xs text-slate-500">
            KI-Konfidenz: {recommendation.confidence}%
          </p>
        </div>
      </div>
    </section>
  );
}

function TargetCard({ vehicle, darkMode }) {
  const title =
    vehicle.title ||
    [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ") ||
    "Fahrzeug";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Angefragtes Fahrzeug
          </span>

          <h2 className="mt-2 text-xl font-bold">{title}</h2>

          <p
            className={`mt-1 text-sm ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {sourceLabel(vehicle.source)}

            {vehicle.location ? ` · ${vehicle.location}` : ""}
          </p>
        </div>

        {vehicle.listingUrl ? (
          <a
            href={vehicle.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
              darkMode
                ? "border-slate-700 hover:bg-slate-800"
                : "border-slate-300 hover:bg-slate-50"
            }`}
          >
            Originalanzeige
            <FiExternalLink />
          </a>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className={`text-xs uppercase ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Angebotspreis
          </p>

          <p className="text-3xl font-bold text-blue-600">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        <span
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            vehicle.accidentStatus === "ACCIDENT_FREE"
              ? "bg-emerald-100 text-emerald-700"
              : vehicle.accidentStatus === "UNKNOWN"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {accidentLabel(vehicle.accidentStatus)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <DetailItem
          icon={FiCalendar}
          label="Erstzulassung"
          value={vehicle.firstRegistration}
          darkMode={darkMode}
        />

        <DetailItem
          label="Kilometerstand"
          value={formatMileage(vehicle.mileageKm)}
          darkMode={darkMode}
        />

        <DetailItem
          icon={FiTag}
          label="Kraftstoff"
          value={vehicle.fuelType}
          darkMode={darkMode}
        />

        <DetailItem
          icon={FiSettings}
          label="Getriebe"
          value={vehicle.transmission}
          darkMode={darkMode}
        />

        <DetailItem
          label="Leistung"
          value={
            vehicle.powerPs
              ? `${formatNumber(vehicle.powerPs)} PS${
                  vehicle.powerKw
                    ? ` / ${formatNumber(vehicle.powerKw)} kW`
                    : ""
                }`
              : vehicle.powerKw
                ? `${formatNumber(vehicle.powerKw)} kW`
                : "–"
          }
          darkMode={darkMode}
        />

        <DetailItem
          label="Hubraum"
          value={
            vehicle.engineCapacityCcm
              ? `${formatNumber(vehicle.engineCapacityCcm)} cm³`
              : "–"
          }
          darkMode={darkMode}
        />

        <DetailItem
          label="TÜV / HU"
          value={vehicle.tuvUntil}
          darkMode={darkMode}
        />

        <DetailItem
          label="Scheckheft"
          value={serviceLabel(vehicle.serviceHistory)}
          darkMode={darkMode}
        />

        <DetailItem
          label="Verkäufer"
          value={sellerLabel(vehicle.sellerType)}
          darkMode={darkMode}
        />

        <DetailItem
          label="Generation"
          value={vehicle.generation}
          darkMode={darkMode}
        />

        <DetailItem
          label="Karosserie"
          value={vehicle.bodyType}
          darkMode={darkMode}
        />

        <DetailItem label="Farbe" value={vehicle.color} darkMode={darkMode} />
      </div>

      {vehicle.damageDescription ? (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${
            darkMode
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <strong>Schäden / Defekte:</strong> {vehicle.damageDescription}
        </div>
      ) : null}

      {vehicle.missingFields?.length ? (
        <p className="mt-3 text-xs text-amber-600">
          Fehlende Angaben: {vehicle.missingFields.join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function ComparableCard({ vehicle, index, darkMode }) {
  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Vergleich #{index + 1} · {sourceLabel(vehicle.source)}
          </p>

          <h3 className="mt-1 font-bold">
            {vehicle.title ||
              [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "Vergleichsfahrzeug"}
          </h3>
        </div>

        <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
          {vehicle.similarityScore}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-2xl font-bold text-blue-600">
          {formatPrice(vehicle.price)}
        </p>

        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            vehicle.directListingUrl
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {vehicle.directListingUrl ? "Direkte Anzeige" : "Suchausschnitt"}
        </span>
      </div>

      <p
        className={`mt-1 text-xs ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        KI-bereinigter Wert:{" "}
        <strong>{formatPrice(vehicle.adjustedPrice)}</strong>
      </p>

      <div
        className={`mt-4 space-y-1.5 text-sm ${
          darkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        <p>
          <strong>EZ:</strong> {valueOrDash(vehicle.firstRegistration)}
        </p>

        <p>
          <strong>Km:</strong> {formatMileage(vehicle.mileageKm)}
        </p>

        <p>
          <strong>Motor:</strong>{" "}
          {[vehicle.fuelType, vehicle.powerPs ? `${vehicle.powerPs} PS` : null]
            .filter(Boolean)
            .join(" ") || "–"}
        </p>

        <p>
          <strong>Getriebe:</strong> {valueOrDash(vehicle.transmission)}
        </p>

        <p>
          <strong>Verkäufer:</strong> {sellerLabel(vehicle.sellerType)}
        </p>
      </div>

      <div
        className={`mt-4 rounded-xl p-3 text-xs ${
          darkMode
            ? "bg-slate-800 text-slate-300"
            : "bg-slate-50 text-slate-600"
        }`}
      >
        <p className="font-semibold">Vergleich</p>

        <p className="mt-1">{vehicle.comparisonReason}</p>
      </div>

      <div
        className={`mt-3 rounded-xl p-3 text-xs ${
          darkMode
            ? "bg-slate-800 text-slate-300"
            : "bg-slate-50 text-slate-600"
        }`}
      >
        <p className="font-semibold">Preisanpassung</p>

        <p className="mt-1">{vehicle.adjustmentExplanation}</p>
      </div>

      {vehicle.mainDifferences?.length ? (
        <ul
          className={`mt-3 list-inside list-disc space-y-1 text-xs ${
            darkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {vehicle.mainDifferences.map((difference, differenceIndex) => (
            <li key={differenceIndex}>{difference}</li>
          ))}
        </ul>
      ) : null}

      {vehicle.listingUrl ? (
        <a
          href={vehicle.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          Anzeige öffnen
          <FiExternalLink />
        </a>
      ) : (
        <p className="mt-4 text-xs text-amber-600">
          Nur als Marktplatz-Suchausschnitt verfügbar.
        </p>
      )}
    </article>
  );
}

function RecentSearches({ items, darkMode, onSelect, onClear }) {
  if (!items.length) {
    return null;
  }

  return (
    <section
      className={`mb-5 rounded-2xl border p-4 ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiClock />
          Letzte Prüfungen
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-slate-500"
        >
          Verlauf leeren
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const meta = ratingMeta(item.rating);

          return (
            <button
              key={`${item.url}-${item.searchedAt}`}
              type="button"
              onClick={() => onSelect(item.url)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.badge}`}
            >
              {item.title}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function MarketAnalysisPage() {
  const { status } = useSession();

  const router = useRouter();

  const { openSidebar } = useSidebar();

  const [darkMode, setDarkMode] = useState(false);

  const [url, setUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const [result, setResult] = useState(null);

  const [error, setError] = useState("");

  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    setDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));

    try {
      const saved = JSON.parse(
        localStorage.getItem(RECENT_SEARCHES_KEY) || "[]",
      );

      if (Array.isArray(saved)) {
        setRecentSearches(saved);
      }
    } catch {
      // Ignore invalid storage.
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!loading) {
      setLoadingSeconds(0);
      return undefined;
    }

    const interval = setInterval(() => {
      setLoadingSeconds((current) => current + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [loading]);

  function saveRecentSearch(data) {
    const vehicle = data.targetVehicle;

    const entry = {
      url: vehicle.listingUrl,

      title:
        vehicle.title ||
        [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
        "Fahrzeug",

      rating: data.recommendation.rating,

      searchedAt: data.searchedAt,
    };

    setRecentSearches((current) => {
      const updated = [
        entry,

        ...current.filter((item) => item.url !== entry.url),
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Non-critical.
      }

      return updated;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);

    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Non-critical.
    }
  }

  async function readJsonResponse(response) {
    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Der Server lieferte keine gültige JSON-Antwort. HTTP ${response.status}: ${raw.slice(
          0,
          350,
        )}`,
      );
    }

    if (!response.ok) {
      throw new Error(data?.error || `Serverfehler ${response.status}`);
    }

    return data;
  }

  async function runAnalysis(targetUrl) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 175_000);

    try {
      setLoading(true);
      setResult(null);
      setError("");

      const response = await fetch("/api/market-analysis", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          url: targetUrl.trim(),
        }),

        signal: controller.signal,
      });

      const data = await readJsonResponse(response);

      setResult(data);
      saveRecentSearch(data);

      toast.success("KI-Deal-Check abgeschlossen.");
    } catch (requestError) {
      console.error(requestError);

      const message =
        requestError?.name === "AbortError"
          ? "Die Analyse wurde nach 175 Sekunden beendet."
          : requestError?.message || "Analyse fehlgeschlagen.";

      setError(message);
      toast.error(message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!url.trim()) {
      toast.error("Bitte einen Fahrzeug-Link eingeben.");

      return;
    }

    runAnalysis(url);
  }

  function handleReset() {
    setUrl("");
    setResult(null);
    setError("");
  }

  async function copySummary() {
    if (!result) {
      return;
    }

    const vehicle = result.targetVehicle;

    const summary = [
      vehicle.title || [vehicle.make, vehicle.model].filter(Boolean).join(" "),

      `Angebotspreis: ${formatPrice(vehicle.price)}`,

      `Marktwert: ${formatPrice(
        result.marketStatistics.estimatedRetailPriceFrom,
      )} – ${formatPrice(result.marketStatistics.estimatedRetailPriceTo)}`,

      `Empfohlener Einkauf: ${formatPrice(
        result.dealerAssessment.recommendedPurchasePriceFrom,
      )} – ${formatPrice(result.dealerAssessment.recommendedPurchasePriceTo)}`,

      `Verhandlungsziel: ${formatPrice(
        result.dealerAssessment.negotiationTarget,
      )}`,

      `Absolutes Maximum: ${formatPrice(
        result.dealerAssessment.absoluteMaximumPurchasePrice,
      )}`,

      `Geschätzter Gewinn: ${formatSignedPrice(
        result.dealerAssessment.estimatedProfitAtAskingPrice,
      )}`,

      `Ergebnis: ${result.recommendation.headline}`,

      vehicle.listingUrl,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);

      toast.success("Zusammenfassung kopiert.");
    } catch {
      toast.error("Kopieren fehlgeschlagen.");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <FiLoader className="animate-spin text-3xl" />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen p-3 sm:p-5 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="mx-auto max-w-screen-2xl">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className={`rounded-lg p-2 md:hidden ${
              darkMode ? "bg-slate-800" : "bg-white shadow-sm"
            }`}
          >
            <FiMenu />
          </button>

          <div>
            <h1 className="text-xl font-bold sm:text-2xl">KI-Deal-Check</h1>

            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Zielanzeige im Browser auslesen, Marktplätze durchsuchen und durch
              OpenAI analysieren.
            </p>
          </div>
        </header>

        <section
          className={`mb-5 rounded-2xl border p-5 shadow-sm ${
            darkMode
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold">
              Fahrzeug-Link
            </label>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <FiLink className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  disabled={loading}
                  placeholder="AutoScout24-, mobile.de- oder Kleinanzeigen-Link"
                  className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none focus:ring-2 ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 focus:ring-blue-500/30"
                      : "border-slate-300 bg-white focus:ring-blue-200"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    KI prüft…
                  </>
                ) : (
                  <>
                    <FiSearch />
                    Fahrzeug prüfen
                  </>
                )}
              </button>

              {result || error ? (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className={`h-11 rounded-xl border px-4 ${
                    darkMode ? "border-slate-700" : "border-slate-300"
                  }`}
                >
                  <FiRefreshCw />
                </button>
              ) : null}
            </div>
          </form>
        </section>

        {!loading && !result ? (
          <RecentSearches
            items={recentSearches}
            darkMode={darkMode}
            onSelect={(selectedUrl) => {
              setUrl(selectedUrl);
              runAnalysis(selectedUrl);
            }}
            onClear={clearRecentSearches}
          />
        ) : null}

        {error ? (
          <section className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex gap-3">
              <FiAlertTriangle />

              <div>
                <h2 className="font-bold">Analyse fehlgeschlagen</h2>

                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section
            className={`rounded-2xl border py-20 text-center ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <FiLoader className="mx-auto animate-spin text-5xl text-blue-600" />

            <h2 className="mt-4 text-lg font-bold">
              Fahrzeug und Markt werden geprüft
            </h2>

            <p
              className={`mx-auto mt-2 max-w-xl text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Chromium öffnet die Zielanzeige wie ein Browser. Danach sucht
              Perplexity nach Vergleichsangeboten und OpenAI übernimmt die
              komplette Analyse.
            </p>

            <p className="mt-3 font-mono text-blue-600">
              {loadingSeconds} Sekunden
            </p>
          </section>
        ) : result ? (
          <div className="space-y-5">
            <VerdictBanner result={result} />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={copySummary}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                  darkMode ? "border-slate-700" : "border-slate-300"
                }`}
              >
                <FiCopy />
                Zusammenfassung kopieren
              </button>
            </div>

            <TargetCard vehicle={result.targetVehicle} darkMode={darkMode} />

            <section>
              <h2 className="mb-1 text-lg font-bold">Vergleichsfahrzeuge</h2>

              <p
                className={`mb-3 text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {result.comparableVehicles.length} von OpenAI ausgewählte
                Angebote
              </p>

              {result.comparableVehicles.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {result.comparableVehicles.map((vehicle, index) => (
                    <ComparableCard
                      key={`${vehicle.evidenceUrl || vehicle.listingUrl || index}`}
                      vehicle={vehicle}
                      index={index}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-5 ${
                    darkMode
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  Keine belastbaren Vergleichsangebote gefunden.
                </div>
              )}
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <FiTrendingUp className="text-blue-600" />
                  Marktanalyse
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <DetailItem
                    label="Vergleiche"
                    value={result.marketStatistics.comparableCount}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Gewichteter Marktpreis"
                    value={formatPrice(
                      result.marketStatistics.weightedMarketPrice,
                    )}
                    darkMode={darkMode}
                    highlight
                  />

                  <DetailItem
                    label="Niedrigster Preis"
                    value={formatPrice(result.marketStatistics.minimumPrice)}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Höchster Preis"
                    value={formatPrice(result.marketStatistics.maximumPrice)}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Durchschnitt"
                    value={formatPrice(result.marketStatistics.averagePrice)}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Median"
                    value={formatPrice(result.marketStatistics.medianPrice)}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Marktwert von"
                    value={formatPrice(
                      result.marketStatistics.estimatedRetailPriceFrom,
                    )}
                    darkMode={darkMode}
                    highlight
                  />

                  <DetailItem
                    label="Marktwert bis"
                    value={formatPrice(
                      result.marketStatistics.estimatedRetailPriceTo,
                    )}
                    darkMode={darkMode}
                    highlight
                  />
                </div>

                <p
                  className={`mt-4 rounded-xl p-3 text-sm ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  {result.marketStatistics.explanation}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                  <FiTruck className="text-emerald-600" />
                  Ankaufsempfehlung
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <DetailItem
                    label="Empfohlen von"
                    value={formatPrice(
                      result.dealerAssessment.recommendedPurchasePriceFrom,
                    )}
                    darkMode={darkMode}
                    highlight
                  />

                  <DetailItem
                    label="Empfohlen bis"
                    value={formatPrice(
                      result.dealerAssessment.recommendedPurchasePriceTo,
                    )}
                    darkMode={darkMode}
                    highlight
                  />

                  <DetailItem
                    label="Verhandlungsziel"
                    value={formatPrice(
                      result.dealerAssessment.negotiationTarget,
                    )}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Absolutes Maximum"
                    value={formatPrice(
                      result.dealerAssessment.absoluteMaximumPurchasePrice,
                    )}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Aufbereitung"
                    value={formatPrice(
                      result.dealerAssessment.estimatedPreparationCosts,
                    )}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Reparaturreserve"
                    value={formatPrice(
                      result.dealerAssessment.estimatedRepairReserve,
                    )}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Gewährleistung"
                    value={formatPrice(
                      result.dealerAssessment.estimatedWarrantyReserve,
                    )}
                    darkMode={darkMode}
                  />

                  <DetailItem
                    label="Gewinn"
                    value={formatSignedPrice(
                      result.dealerAssessment.estimatedProfitAtAskingPrice,
                    )}
                    darkMode={darkMode}
                    highlight
                  />
                </div>

                <p
                  className={`mt-4 rounded-xl p-3 text-sm ${
                    darkMode ? "bg-slate-800" : "bg-slate-50"
                  }`}
                >
                  {result.dealerAssessment.explanation}
                </p>
              </div>
            </section>

            <section
              className={`rounded-2xl border p-5 ${
                darkMode
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <h2 className="mb-3 flex items-center gap-2 font-bold text-emerald-600">
                    <FiCheckCircle />
                    Gründe
                  </h2>

                  {result.recommendation.reasons.length ? (
                    <div className="space-y-2">
                      {result.recommendation.reasons.map((reason, index) => (
                        <p
                          key={index}
                          className={`rounded-xl p-3 text-sm ${
                            darkMode ? "bg-slate-800" : "bg-slate-50"
                          }`}
                        >
                          {reason}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Keine ausreichenden positiven Gründe.
                    </p>
                  )}
                </div>

                <div>
                  <h2 className="mb-3 flex items-center gap-2 font-bold text-amber-600">
                    <FiAlertTriangle />
                    Risiken
                  </h2>

                  {result.recommendation.risks.length ? (
                    <div className="space-y-2">
                      {result.recommendation.risks.map((risk, index) => (
                        <p
                          key={index}
                          className={`rounded-xl p-3 text-sm ${
                            darkMode ? "bg-slate-800" : "bg-slate-50"
                          }`}
                        >
                          {risk}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Keine besonderen Risiken angegeben.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {result.recommendation.questionsForSeller?.length ? (
              <section
                className={`rounded-2xl border p-5 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <FiPhoneCall className="text-blue-600" />
                  Fragen an den Verkäufer
                </h2>

                <ol className="list-inside list-decimal space-y-2">
                  {result.recommendation.questionsForSeller.map(
                    (question, index) => (
                      <li
                        key={index}
                        className={`rounded-xl p-3 text-sm ${
                          darkMode ? "bg-slate-800" : "bg-slate-50"
                        }`}
                      >
                        {question}
                      </li>
                    ),
                  )}
                </ol>
              </section>
            ) : null}

            {result.overallWarnings?.length ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <h2 className="font-bold">Recherchehinweise</h2>

                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {result.overallWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <details
              className={`rounded-xl border p-3 text-xs ${
                darkMode
                  ? "border-slate-800 bg-slate-900 text-slate-400"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <summary className="cursor-pointer font-semibold">
                Technische Details
              </summary>

              <div className="mt-3 space-y-1">
                <p>Ablauf: {result.debug?.architecture}</p>

                <p>Dauer: {Math.round(result.durationMs / 1000)} Sekunden</p>

                <p>
                  Browser-Extraktion:{" "}
                  {result.debug?.targetExtraction?.browserExtractionOk
                    ? "erfolgreich"
                    : "fehlgeschlagen"}
                </p>

                <p>
                  Blockiert:{" "}
                  {result.debug?.targetExtraction?.blocked ? "ja" : "nein"}
                </p>

                <p>
                  Sichtbarer Text:{" "}
                  {result.debug?.targetExtraction?.visibleTextLength ?? 0}{" "}
                  Zeichen
                </p>

                <p>
                  Spezifikationstext:{" "}
                  {result.debug?.targetExtraction?.specificationTextLength ?? 0}{" "}
                  Zeichen
                </p>

                <p>
                  Relevante Skripte:{" "}
                  {result.debug?.targetExtraction?.relevantScriptCount ?? 0}
                </p>

                <p>
                  JSON-LD Blöcke:{" "}
                  {result.debug?.targetExtraction?.jsonLdCount ?? 0}
                </p>

                <p>
                  Ziel-Konfidenz:{" "}
                  {result.debug?.targetExtraction?.targetConfidence ?? 0}%
                </p>

                <p>
                  Rohe Suchkandidaten: {result.debug?.rawCandidateCount ?? 0}
                </p>

                <p>
                  Verwendbare Kandidaten:{" "}
                  {result.debug?.discoveredCandidateCount ?? 0}
                </p>

                <p>Akzeptiert: {result.debug?.acceptedCandidateCount ?? 0}</p>

                <p>Abgelehnt: {result.debug?.rejectedCandidateCount ?? 0}</p>

                {result.debug?.marketplaceSearches?.map((search) => (
                  <p key={search.marketplace}>
                    {search.marketplace}:{" "}
                    {search.ok
                      ? `${search.candidateCount} Kandidaten, ${search.searchResultCount} Suchresultate`
                      : `Fehler: ${search.error}`}
                  </p>
                ))}
              </div>
            </details>
          </div>
        ) : (
          <section
            className={`rounded-2xl border border-dashed py-16 text-center ${
              darkMode
                ? "border-slate-800 bg-slate-900/50"
                : "border-slate-300 bg-white"
            }`}
          >
            <FiTruck className="mx-auto text-6xl text-slate-300" />

            <h2 className="mt-4 text-lg font-bold">
              Noch kein Fahrzeug geprüft
            </h2>

            <p
              className={`mx-auto mt-2 max-w-xl text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Füge einen direkten Fahrzeug-Link ein.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
