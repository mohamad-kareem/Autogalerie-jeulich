"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

import {
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiInfo,
  FiLink,
  FiLoader,
  FiMenu,
  FiPhoneCall,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiTag,
  FiTarget,
  FiThumbsUp,
  FiTrendingUp,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

import { useSidebar } from "@/app/(components)/SidebarContext";

const RECENT_SEARCHES_KEY = "dealcheck.recentSearches.professional";

const MAX_RECENT_SEARCHES = 8;

// Request timing. Kleinanzeigen and mobile.de are protected by bot
// detection and render key data client-side, so extraction for those
// sources routinely takes longer than a plain AutoScout24 page. We give
// the backend a generous window and keep the user informed while we wait
// instead of failing fast.
const REQUEST_TIMEOUT_MS = 175_000;

const MAX_MANUAL_RETRIES = 2;

// Only these hosts are supported by the backend extractor. Checking this
// on the client means the user finds out about an unsupported link
// immediately instead of waiting out a long request that was always
// going to fail.
const SUPPORTED_SOURCES = [
  {
    id: "AUTOSCOUT24",
    label: "AutoScout24",
    hosts: ["autoscout24.de", "www.autoscout24.de"],
  },
  {
    id: "MOBILE_DE",
    label: "mobile.de",
    hosts: ["mobile.de", "www.mobile.de", "suchen.mobile.de"],
  },
  {
    id: "KLEINANZEIGEN",
    label: "Kleinanzeigen",
    hosts: ["kleinanzeigen.de", "www.kleinanzeigen.de"],
  },
];

function detectSource(rawUrl) {
  if (!rawUrl?.trim()) {
    return { status: "empty" };
  }

  let parsed;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { status: "invalid" };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return { status: "invalid" };
  }

  const match = SUPPORTED_SOURCES.find((source) =>
    source.hosts.includes(parsed.hostname.toLowerCase()),
  );

  if (!match) {
    return { status: "unsupported", hostname: parsed.hostname };
  }

  return { status: "supported", source: match };
}

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

const RATING_META = {
  VERY_GOOD: {
    icon: FiThumbsUp,
    banner: "border-emerald-300 bg-emerald-50",
    accent: "text-emerald-700",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
    label: "Sehr gut",
  },

  GOOD: {
    icon: FiCheckCircle,
    banner: "border-emerald-300 bg-emerald-50",
    accent: "text-emerald-700",
    badge: "border-emerald-200 bg-emerald-100 text-emerald-800",
    label: "Gut",
  },

  CONDITIONAL: {
    icon: FiPhoneCall,
    banner: "border-amber-300 bg-amber-50",
    accent: "text-amber-700",
    badge: "border-amber-200 bg-amber-100 text-amber-800",
    label: "Bedingt",
  },

  TOO_EXPENSIVE: {
    icon: FiXCircle,
    banner: "border-red-300 bg-red-50",
    accent: "text-red-700",
    badge: "border-red-200 bg-red-100 text-red-800",
    label: "Zu teuer",
  },

  INSUFFICIENT_DATA: {
    icon: FiInfo,
    banner: "border-slate-300 bg-slate-50",
    accent: "text-slate-600",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    label: "Zu wenig Daten",
  },
};

function ratingMeta(value) {
  return RATING_META[value] || RATING_META.INSUFFICIENT_DATA;
}

function Panel({ children, darkMode, className = "" }) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${
        darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      } ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ icon: Icon, title, description, darkMode, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div
            className={`rounded-xl p-2.5 ${
              darkMode
                ? "bg-slate-800 text-blue-400"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <Icon />
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-bold">{title}</h2>

          {description ? (
            <p
              className={`mt-0.5 text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, darkMode, warn = false }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        warn
          ? darkMode
            ? "border-amber-800 bg-amber-950/40"
            : "border-amber-200 bg-amber-50"
          : darkMode
            ? "border-slate-700 bg-slate-800/70"
            : "border-slate-200 bg-slate-50"
      }`}
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

function BigNumber({ label, value, helper, darkMode, accent = false }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        darkMode
          ? "border-slate-700 bg-slate-800"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          darkMode ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-extrabold ${
          accent ? "text-blue-600" : ""
        }`}
      >
        {value}
      </p>

      {helper ? (
        <p
          className={`mt-1 text-xs ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function VerdictBanner({ result }) {
  const recommendation = result.recommendation;

  const meta = ratingMeta(recommendation.rating);

  const Icon = meta.icon;

  return (
    <section className={`rounded-2xl border-2 p-5 shadow-sm ${meta.banner}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`rounded-xl bg-white/70 p-2.5 text-2xl ${meta.accent}`}>
          <Icon />
        </div>

        <div className="min-w-[240px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-xs font-bold uppercase tracking-wide ${meta.accent}`}
            >
              Deal-Check
            </p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.badge}`}
            >
              {meta.label}
            </span>
          </div>

          <h2 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">
            {recommendation.headline}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            {recommendation.summary}
          </p>
        </div>
      </div>
    </section>
  );
}

// The numbers a Händler actually needs to decide whether, and for how
// much, to buy the car. This is intentionally the first thing shown
// after the headline verdict.
function PurchaseCalculation({ result, darkMode }) {
  const assessment = result.dealerAssessment;

  const confidence = result.recommendation.confidence;

  return (
    <Panel darkMode={darkMode}>
      <SectionTitle
        icon={FiTarget}
        title="Ankaufskalkulation"
        description="Diese Zahlen entscheiden über den Kauf – Rest ist Hintergrund."
        darkMode={darkMode}
        action={
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              confidence >= 70
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : confidence >= 40
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            Konfidenz {confidence}%
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <BigNumber
          label="Empfohlener Einkauf"
          value={`${formatPrice(assessment.recommendedPurchasePriceFrom)} – ${formatPrice(
            assessment.recommendedPurchasePriceTo,
          )}`}
          darkMode={darkMode}
        />

        <BigNumber
          label="Verhandlungsziel"
          value={formatPrice(assessment.negotiationTarget)}
          helper="Erster realistischer Zielpreis"
          darkMode={darkMode}
          accent
        />

        <BigNumber
          label="Absolutes Maximum"
          value={formatPrice(assessment.absoluteMaximumPurchasePrice)}
          helper="Darüber lohnt sich der Deal nicht mehr"
          darkMode={darkMode}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <BigNumber
          label="Erwarteter Verkaufspreis"
          value={formatPrice(assessment.assumedSellingPrice)}
          darkMode={darkMode}
        />

        <BigNumber
          label="Gewinn beim Angebotspreis"
          value={formatSignedPrice(assessment.estimatedProfitAtAskingPrice)}
          helper={
            numericValue(assessment.returnOnInvestmentPercent) === null
              ? undefined
              : `Rendite ${assessment.returnOnInvestmentPercent}%`
          }
          darkMode={darkMode}
          accent
        />

        <BigNumber
          label="Kostenreserven"
          value={formatPrice(
            (numericValue(assessment.estimatedPreparationCosts) || 0) +
              (numericValue(assessment.estimatedRepairReserve) || 0) +
              (numericValue(assessment.estimatedWarrantyReserve) || 0),
          )}
          helper="Aufbereitung, Reparatur, Gewährleistung"
          darkMode={darkMode}
        />
      </div>

      {assessment.explanation ? (
        <p
          className={`mt-4 rounded-xl p-4 text-sm leading-6 ${
            darkMode
              ? "bg-slate-800 text-slate-300"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          {assessment.explanation}
        </p>
      ) : null}
    </Panel>
  );
}

function RiskChips({ vehicle }) {
  const chips = [];

  if (vehicle.accidentStatus === "DAMAGED") {
    chips.push({ text: "Beschädigt / defekt", tone: "red" });
  } else if (vehicle.accidentStatus === "REPAIRED_DAMAGE") {
    chips.push({ text: "Reparierter Vorschaden", tone: "amber" });
  } else if (vehicle.accidentStatus === "UNKNOWN") {
    chips.push({ text: "Unfallstatus unklar", tone: "amber" });
  }

  if (!vehicle.tuvUntil) {
    chips.push({ text: "TÜV-Termin unbekannt", tone: "amber" });
  }

  if (vehicle.serviceHistory !== "YES") {
    chips.push({ text: "Kein Scheckheft bestätigt", tone: "amber" });
  }

  if (!chips.length) {
    return null;
  }

  const toneClasses = {
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <span
          key={index}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[chip.tone]}`}
        >
          <FiAlertTriangle className="text-[13px]" />
          {chip.text}
        </span>
      ))}
    </div>
  );
}

function TargetCard({ vehicle, darkMode }) {
  const title =
    vehicle.title ||
    [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ") ||
    "Fahrzeug";

  return (
    <Panel darkMode={darkMode}>
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

      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
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

      <RiskChips vehicle={vehicle} />

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
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
              ? `${formatNumber(vehicle.powerPs)} PS`
              : vehicle.powerKw
                ? `${formatNumber(vehicle.powerKw)} kW`
                : "–"
          }
          darkMode={darkMode}
        />

        <DetailItem
          label="TÜV / HU"
          value={vehicle.tuvUntil}
          darkMode={darkMode}
          warn={!vehicle.tuvUntil}
        />

        <DetailItem
          label="Scheckheft"
          value={serviceLabel(vehicle.serviceHistory)}
          darkMode={darkMode}
          warn={vehicle.serviceHistory !== "YES"}
        />

        <DetailItem
          label="Verkäufer"
          value={sellerLabel(vehicle.sellerType)}
          darkMode={darkMode}
        />
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
    </Panel>
  );
}

function ComparableCard({ vehicle, targetPrice, index, darkMode }) {
  const isDirect =
    vehicle.sourceType === "DIRECT_LISTING" ||
    Boolean(vehicle.directListingUrl);

  const referencePrice =
    numericValue(vehicle.adjustedPrice) ?? numericValue(vehicle.price);

  const targetNumber = numericValue(targetPrice);

  const delta =
    referencePrice !== null && targetNumber !== null
      ? targetNumber - referencePrice
      : null;

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
            {sourceLabel(vehicle.source)} · {vehicle.similarityScore}% ähnlich
          </p>

          <h3 className="mt-1 font-bold">
            {vehicle.title ||
              [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "Vergleichsfahrzeug"}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
            isDirect
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {isDirect ? "Direkte Anzeige" : "Suchausschnitt"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <p className="text-2xl font-bold text-blue-600">
          {formatPrice(vehicle.price)}
        </p>

        {vehicle.adjustedPrice &&
        numericValue(vehicle.adjustedPrice) !== numericValue(vehicle.price) ? (
          <p
            className={`text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            bereinigt {formatPrice(vehicle.adjustedPrice)}
          </p>
        ) : null}

        {delta !== null ? (
          <span
            className={`text-xs font-semibold ${
              delta >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {delta >= 0 ? "Angebot liegt darunter" : "Angebot liegt darüber"} (
            {formatSignedPrice(-delta)})
          </span>
        ) : null}
      </div>

      <div
        className={`mt-3 space-y-1.5 text-sm ${
          darkMode ? "text-slate-300" : "text-slate-700"
        }`}
      >
        <p>
          <strong>EZ:</strong> {valueOrDash(vehicle.firstRegistration)} ·{" "}
          <strong>Km:</strong> {formatMileage(vehicle.mileageKm)}
        </p>

        <p>
          <strong>Motor:</strong>{" "}
          {[vehicle.fuelType, vehicle.powerPs ? `${vehicle.powerPs} PS` : null]
            .filter(Boolean)
            .join(" ") || "–"}{" "}
          · <strong>Getriebe:</strong> {valueOrDash(vehicle.transmission)}
        </p>

        <p>
          <strong>Verkäufer:</strong> {sellerLabel(vehicle.sellerType)}
        </p>
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

      {isDirect && vehicle.listingUrl ? (
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

function MarketStatistics({ statistics, darkMode }) {
  return (
    <Panel darkMode={darkMode}>
      <SectionTitle
        icon={FiBarChart2}
        title="Marktpreis"
        description="Preisspanne vergleichbarer Fahrzeuge am Markt, zur Einordnung."
        darkMode={darkMode}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <BigNumber
          label="Marktwert-Spanne"
          value={`${formatPrice(statistics.estimatedRetailPriceFrom)} – ${formatPrice(
            statistics.estimatedRetailPriceTo,
          )}`}
          darkMode={darkMode}
        />

        <BigNumber
          label="Gewichteter Marktpreis"
          value={formatPrice(statistics.weightedMarketPrice)}
          darkMode={darkMode}
          accent
        />

        <BigNumber
          label="Differenz zum Angebot"
          value={formatSignedPrice(statistics.priceDifferenceToMarket)}
          helper="Positiv = Angebot unter Marktwert"
          darkMode={darkMode}
        />
      </div>

      {statistics.explanation ? (
        <p
          className={`mt-4 rounded-xl p-4 text-sm leading-6 ${
            darkMode
              ? "bg-slate-800 text-slate-300"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          {statistics.explanation}
        </p>
      ) : null}
    </Panel>
  );
}

function ListsSection({ result, darkMode }) {
  const groups = [
    {
      title: "Argumente für den Kauf",
      values: result.recommendation.reasons,
      icon: FiCheckCircle,
    },
    {
      title: "Risiken",
      values: result.recommendation.risks,
      icon: FiAlertTriangle,
    },
    {
      title: "Fragen an den Verkäufer",
      values: result.recommendation.questionsForSeller,
      icon: FiPhoneCall,
    },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {groups.map(({ title, values, icon: Icon }) => (
        <Panel key={title} darkMode={darkMode}>
          <div className="mb-3 flex items-center gap-2 font-bold">
            <Icon />
            {title}
          </div>

          {values?.length ? (
            <ul className="space-y-2">
              {values.map((value, index) => (
                <li
                  key={index}
                  className={`rounded-lg p-3 text-sm leading-5 ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Keine Angaben.</p>
          )}
        </Panel>
      ))}
    </div>
  );
}

function WarningsPanel({ warnings, darkMode }) {
  if (!warnings?.length) {
    return null;
  }

  return (
    <Panel
      darkMode={darkMode}
      className={darkMode ? "border-amber-800" : "border-amber-200"}
    >
      <div className="flex items-start gap-3">
        <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600" />

        <div>
          <h2 className="font-bold">Hinweise zur Datenqualität</h2>

          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

// Everything here is background/audit information a Händler will rarely
// open day to day, but that matters when a number needs to be double
// checked. Collapsed by default so the main flow stays short.
function AdvancedDetails({ result, darkMode }) {
  const [open, setOpen] = useState(false);

  const statistics = result.marketStatistics;

  const research = result.research;

  const rejected = result.rejectedCandidates;

  return (
    <Panel darkMode={darkMode}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 font-bold">
          <FiInfo />
          Erweiterte Daten & Methodik
        </div>

        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {open ? (
        <div className="mt-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <BigNumber
              label="Geeignete Vergleiche"
              value={statistics.comparableCount}
              helper={`${research?.rawCandidateCount || 0} Rohkandidaten gefunden`}
              darkMode={darkMode}
            />

            <BigNumber
              label="Direkte Anzeigen"
              value={statistics.directListingCount}
              helper={`${statistics.snippetCount} Suchausschnitte`}
              darkMode={darkMode}
            />

            <BigNumber
              label="Ø Ähnlichkeit"
              value={
                statistics.averageSimilarity === null
                  ? "–"
                  : `${statistics.averageSimilarity}%`
              }
              darkMode={darkMode}
            />

            <BigNumber
              label="Preisspanne am Markt"
              value={`${formatPrice(statistics.minimumPrice)} – ${formatPrice(statistics.maximumPrice)}`}
              helper={`Median ${formatPrice(statistics.medianPrice)} · Ø ${formatPrice(statistics.averagePrice)}`}
              darkMode={darkMode}
            />
          </div>

          {rejected?.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold">
                Abgelehnte Vergleiche ({rejected.length})
              </p>

              <div className="space-y-2">
                {rejected.map((candidate, index) => (
                  <div
                    key={`${candidate.listingUrl}-${index}`}
                    className={`rounded-xl p-3 text-sm ${
                      darkMode ? "bg-slate-800" : "bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {candidate.title || "Unbekanntes Angebot"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {candidate.reason}
                    </p>

                    {candidate.listingUrl ? (
                      <a
                        href={candidate.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Quelle öffnen
                        <FiExternalLink />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p
            className={`text-xs leading-5 ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Die Zielanzeige und Vergleichskandidaten werden automatisch
            ausgelesen und normalisiert. Duplikate, unpassende Angebote und
            Ausreißer werden vor der Preisberechnung herausgefiltert; Marktwert,
            Ankaufsempfehlung und Konfidenz werden anschließend deterministisch
            berechnet.
            {result.searchedAt
              ? ` Analysezeitpunkt: ${new Date(result.searchedAt).toLocaleString("de-DE")}.`
              : ""}
          </p>
        </div>
      ) : null}
    </Panel>
  );
}

function RecentSearches({ items, darkMode, onSelect, onClear }) {
  if (!items.length) {
    return null;
  }

  return (
    <Panel darkMode={darkMode} className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FiClock />
          Letzte Prüfungen
        </div>

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
    </Panel>
  );
}

function LoadingPanel({ seconds, sourceLabelText, darkMode }) {
  const steps = [
    { minimum: 0, text: "Zielanzeige wird ausgelesen" },
    { minimum: 8, text: "Fahrzeugdaten werden normalisiert" },
    { minimum: 18, text: "Marktplätze werden durchsucht" },
    {
      minimum: 35,
      text: "Duplikate und ungeeignete Angebote werden entfernt",
    },
    { minimum: 50, text: "Marktwert und Händlermarge werden berechnet" },
    { minimum: 65, text: "Zusammenfassung wird erstellt" },
  ];

  const currentStep =
    [...steps].reverse().find((step) => seconds >= step.minimum) || steps[0];

  const isSlowSource =
    sourceLabelText === "mobile.de" || sourceLabelText === "Kleinanzeigen";

  return (
    <Panel darkMode={darkMode}>
      <div className="flex flex-col items-center py-12 text-center">
        <FiLoader className="animate-spin text-4xl text-blue-600" />

        <h2 className="mt-4 text-lg font-bold">Deal-Check läuft</h2>

        <p className="mt-2 text-sm text-slate-500">{currentStep.text}</p>

        <p className="mt-1 text-xs text-slate-400">{seconds} Sekunden</p>

        {isSlowSource && seconds > 25 ? (
          <p className="mt-3 max-w-md text-xs text-amber-600">
            {sourceLabelText} erschwert automatisiertes Auslesen aktiv – das
            kann bei dieser Quelle deutlich länger dauern als bei AutoScout24.
            Bitte weiter warten.
          </p>
        ) : null}

        <div className="mt-5 h-2 w-full max-w-lg overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-1000"
            style={{
              width: `${Math.min(95, 10 + seconds)}%`,
            }}
          />
        </div>
      </div>
    </Panel>
  );
}

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

  const [retryCount, setRetryCount] = useState(0);

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
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [loading]);

  const comparableVehicles = useMemo(
    () => result?.comparableVehicles || [],
    [result],
  );

  const urlCheck = useMemo(() => detectSource(url), [url]);

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
        `Der Server lieferte keine gültige Antwort (HTTP ${response.status}). ` +
          "Das passiert gelegentlich, wenn die Quellseite den automatisierten " +
          "Zugriff blockiert – ein erneuter Versuch hilft oft.",
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          `Serverfehler ${response.status}. Bitte erneut versuchen.`,
      );
    }

    return data;
  }

  async function runAnalysis(targetUrl) {
    const check = detectSource(targetUrl);

    if (check.status !== "supported") {
      const message =
        check.status === "unsupported"
          ? `${check.hostname} wird nicht unterstützt. Bitte einen Link von AutoScout24, mobile.de oder Kleinanzeigen verwenden.`
          : "Bitte einen gültigen Fahrzeug-Link einfügen.";

      setError(message);
      toast.error(message);

      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

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
      setRetryCount(0);
      saveRecentSearch(data);

      toast.success("Deal-Check abgeschlossen.");
    } catch (requestError) {
      console.error(requestError);

      let message;

      if (requestError?.name === "AbortError") {
        message =
          check.source.id === "AUTOSCOUT24"
            ? "Die Analyse hat zu lange gedauert und wurde abgebrochen. Bitte erneut versuchen."
            : `Die Analyse von ${check.source.label} hat zu lange gedauert und wurde abgebrochen. Diese Quelle blockt automatisierte Zugriffe gelegentlich – ein erneuter Versuch löst das meistens.`;
      } else if (requestError instanceof TypeError) {
        message =
          "Verbindung zum Server fehlgeschlagen. Internetverbindung prüfen und erneut versuchen.";
      } else {
        message = requestError?.message || "Analyse fehlgeschlagen.";
      }

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

    setRetryCount(0);
    runAnalysis(url);
  }

  function handleRetry() {
    setRetryCount((current) => current + 1);
    runAnalysis(url);
  }

  function handleReset() {
    setUrl("");
    setResult(null);
    setError("");
    setRetryCount(0);
  }

  async function copySummary() {
    if (!result) {
      return;
    }

    const vehicle = result.targetVehicle;

    const statistics = result.marketStatistics;

    const assessment = result.dealerAssessment;

    const summary = [
      vehicle.title || [vehicle.make, vehicle.model].filter(Boolean).join(" "),

      `Angebotspreis: ${formatPrice(vehicle.price)}`,

      `Marktwert: ${formatPrice(
        statistics.estimatedRetailPriceFrom,
      )} – ${formatPrice(statistics.estimatedRetailPriceTo)}`,

      `Empfohlener Einkauf: ${formatPrice(
        assessment.recommendedPurchasePriceFrom,
      )} – ${formatPrice(assessment.recommendedPurchasePriceTo)}`,

      `Verhandlungsziel: ${formatPrice(assessment.negotiationTarget)}`,

      `Absolutes Maximum: ${formatPrice(
        assessment.absoluteMaximumPurchasePrice,
      )}`,

      `Erwarteter Verkaufspreis: ${formatPrice(
        assessment.assumedSellingPrice,
      )}`,

      `Geschätzter Gewinn: ${formatSignedPrice(
        assessment.estimatedProfitAtAskingPrice,
      )}`,

      `Konfidenz: ${result.recommendation.confidence}%`,

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
            aria-label="Menü öffnen"
          >
            <FiMenu />
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold sm:text-2xl">
              KI-Deal-Check für Händler
            </h1>

            <p
              className={`mt-1 text-sm ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Ankaufspreis, Marge und Risiken auf einen Blick
            </p>
          </div>
        </header>

        <Panel darkMode={darkMode} className="mb-5">
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
                    Analyse läuft…
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
                  className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 ${
                    darkMode ? "border-slate-700" : "border-slate-300"
                  }`}
                  aria-label="Analyse zurücksetzen"
                >
                  <FiRefreshCw />
                </button>
              ) : null}
            </div>

            {url.trim() && !loading ? (
              <p
                className={`mt-2 text-xs ${
                  urlCheck.status === "supported"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {urlCheck.status === "supported"
                  ? `${urlCheck.source.label} erkannt.`
                  : urlCheck.status === "unsupported"
                    ? `${urlCheck.hostname} wird aktuell nicht unterstützt. Bitte AutoScout24, mobile.de oder Kleinanzeigen nutzen.`
                    : "Das sieht nicht nach einem gültigen Link aus."}
              </p>
            ) : null}
          </form>
        </Panel>

        {!loading && !result ? (
          <RecentSearches
            items={recentSearches}
            darkMode={darkMode}
            onSelect={(selectedUrl) => {
              setUrl(selectedUrl);
              setRetryCount(0);
              runAnalysis(selectedUrl);
            }}
            onClear={clearRecentSearches}
          />
        ) : null}

        {error ? (
          <section className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <FiAlertTriangle className="mt-0.5 shrink-0" />

                <div>
                  <h2 className="font-bold">Analyse fehlgeschlagen</h2>

                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>

              {url.trim() && retryCount < MAX_MANUAL_RETRIES ? (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <FiRefreshCw />
                  Erneut versuchen
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {loading ? (
          <LoadingPanel
            seconds={loadingSeconds}
            sourceLabelText={urlCheck.source?.label}
            darkMode={darkMode}
          />
        ) : null}

        {!loading && result ? (
          <div className="space-y-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <FiCopy />
                Zusammenfassung kopieren
              </button>
            </div>

            <VerdictBanner result={result} />

            <PurchaseCalculation result={result} darkMode={darkMode} />

            <TargetCard vehicle={result.targetVehicle} darkMode={darkMode} />

            <WarningsPanel
              warnings={result.overallWarnings}
              darkMode={darkMode}
            />

            <Panel darkMode={darkMode}>
              <SectionTitle
                icon={FiTruck}
                title="Vergleichsfahrzeuge"
                description={`${comparableVehicles.length} vergleichbare Angebote am Markt.`}
                darkMode={darkMode}
              />

              {comparableVehicles.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {comparableVehicles.map((vehicle, index) => (
                    <ComparableCard
                      key={vehicle.listingUrl || `${vehicle.title}-${index}`}
                      vehicle={vehicle}
                      targetPrice={result.targetVehicle.price}
                      index={index}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`rounded-xl p-5 text-sm ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  Keine ausreichend vergleichbaren Fahrzeuge gefunden.
                </div>
              )}
            </Panel>

            <MarketStatistics
              statistics={result.marketStatistics}
              darkMode={darkMode}
            />

            <ListsSection result={result} darkMode={darkMode} />

            <AdvancedDetails result={result} darkMode={darkMode} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
