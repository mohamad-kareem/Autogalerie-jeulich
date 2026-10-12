"use client";

/**
 * Tiefe Analyse — the AI-reviewed report on the car, shown above the
 * calculation.
 *
 *   Fazit      decision, headline, summary and the main reasons.
 *   Evidence   right below, always open: what the ad says, known weak points
 *              of this model, comparison cars that were taken out.
 *
 * No figures here: Angebot, Einkaufslimit and Nachlass are in the strip at
 * the top, everything else in the calculation. Work needed before resale is
 * listed in the calculation, where the dealer enters his own prices.
 */

import {
  FiCheckCircle,
  FiCpu,
  FiExternalLink,
  FiHelpCircle,
  FiLoader,
  FiXCircle,
} from "react-icons/fi";

const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : "–";

/** A source as host ("adac.de") and a short title without the site name. */
function sourceParts(source) {
  let host = "";
  try {
    host = new URL(source.url).hostname.replace(/^(www|assets|club)\./, "");
  } catch {
    /* title alone */
  }
  let title = source.title && source.title !== source.url ? source.title : "";
  // "Xenon-Scheinwerfer - Funktion & Nachrüsten | HELLA" → "Xenon-Scheinwerfer - Funktion & Nachrüsten"
  title = title
    .replace(/\s*\|\s*[^|]{1,30}$/, "") // "… | HELLA"
    .replace(/\s+[-–]\s+\S{1,4}$/, "") // cut-off tail "… - VO"
    .trim();
  return { host: host || "Quelle", title };
}

/* ---------------------------------------------------------- citations
 * Web search leaves its sources inline: "… Wastegate-Dose.
 * ([motor-talk.de](https://…?utm_source=openai))". Shown as a small link tag
 * at the end of the sentence instead — also for analyses saved earlier.
 */
const CITATION = /\s*\(\s*\[([^\]]*)\]\((https?:[^)\s]+)\)\s*\)|\[([^\]]+)\]\((https?:[^)\s]+)\)/g;

const cleanHref = (url) => String(url).replace(/([?&])utm_source=openai(&?)/, (_, sep, next) => (next ? sep : "")).replace(/[?&]$/, "");

function hostOf(url, fallback = "") {
  try {
    return new URL(url).hostname.replace(/^(www|assets|club)\./, "");
  } catch {
    return fallback || "Quelle";
  }
}

/** The text without any inline citations — for places that show plain text. */
function plainText(value) {
  return String(value || "")
    .replace(CITATION, (match, _label, _url, label2) => (label2 ? label2 : ""))
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

/** Text with its citations turned into small link tags. */
function Cited({ text, dark }) {
  const value = String(text || "");
  const links = [];
  const body = value
    .replace(CITATION, (match, label, url, label2, url2) => {
      if (url) {
        links.push({ url: cleanHref(url), host: hostOf(url, label) });
        return "";
      }
      // A plain markdown link inside the sentence keeps its words.
      links.push({ url: cleanHref(url2), host: hostOf(url2, label2) });
      return label2;
    })
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  const unique = links.filter((link, index) => links.findIndex((other) => other.url === link.url) === index);
  return (
    <>
      {body}
      {unique.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          title={link.url}
          className={`ml-1 inline-flex items-center gap-0.5 whitespace-nowrap rounded border px-1 align-[1px] text-[9px] font-medium leading-[14px] transition ${
            dark
              ? "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800"
          }`}
        >
          {link.host}
          <FiExternalLink className="size-2" />
        </a>
      ))}
    </>
  );
}

const ACTIONS = {
  KAUFEN: {
    label: "Kaufen",
    icon: FiCheckCircle,
    light: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dark: "border-emerald-800 bg-emerald-950/50 text-emerald-300",
    bar: "bg-emerald-600",
  },
  VERHANDELN: {
    label: "Verhandeln",
    icon: FiHelpCircle,
    light: "border-amber-300 bg-amber-50 text-amber-800",
    dark: "border-amber-800 bg-amber-950/50 text-amber-300",
    bar: "bg-amber-500",
  },
  PRUEFEN: {
    label: "Erst prüfen",
    icon: FiHelpCircle,
    light: "border-amber-300 bg-amber-50 text-amber-800",
    dark: "border-amber-800 bg-amber-950/50 text-amber-300",
    bar: "bg-amber-500",
  },
  NICHT_KAUFEN: {
    label: "Nicht kaufen",
    icon: FiXCircle,
    light: "border-red-300 bg-red-50 text-red-800",
    dark: "border-red-800 bg-red-950/50 text-red-300",
    bar: "bg-red-600",
  },
};

// How big the repair behind a possible cause usually is — no prices.
const EFFORT = {
  KLEIN: { label: "kleiner Eingriff", tone: "text-emerald-600" },
  MITTEL: { label: "größere Reparatur", tone: "text-amber-600" },
  GROSS: { label: "teure Reparatur", tone: "text-red-600" },
};

const SELL = {
  SCHNELL: { label: "Schnell", tone: "text-emerald-600" },
  NORMAL: { label: "Normal", tone: "" },
  LANGSAM: { label: "Langsam", tone: "text-amber-600" },
};

const FINDING = {
  RISIKO: { label: "Risiko", tone: "text-red-600" },
  PLUS: { label: "Plus", tone: "text-emerald-600" },
  FRAGE: { label: "Nachfragen", tone: "text-sky-600" },
};

function Section({ title, aside, dark, children }) {
  return (
    <div className="min-w-0">
      <div className={`mb-1.5 flex items-center justify-between gap-2 border-b pb-1 ${dark ? "border-slate-800" : "border-slate-100"}`}>
        <h3 className={`text-[11px] font-bold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>{title}</h3>
        {aside}
      </div>
      {children}
    </div>
  );
}

/**
 * @param {object} props
 * @param {object|null} props.deep     result.deep, once there
 * @param {object|null} props.live     the live calculation (limit, discount …)
 * @param {object|null} props.market   result.market
 * @param {boolean} props.running
 * @param {string|null} props.error
 * @param {() => void} props.onRun     starts (or repeats) the deep analysis
 */
export default function DeepPanel({ deep, live, market, running, error, onRun, dark }) {
  const panel = `rounded-lg border ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`;
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const faint = dark ? "text-slate-500" : "text-slate-400";
  const text = dark ? "text-slate-200" : "text-slate-800";
  const line = dark ? "border-slate-800" : "border-slate-100";
  const divide = dark ? "divide-slate-800" : "divide-slate-100";
  const button = `inline-flex h-8 items-center gap-1.5 rounded border px-3 text-xs font-semibold transition disabled:opacity-60 ${
    dark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
  }`;

  if (running) {
    return (
      <section className={`${panel} p-4`}>
        <div className="flex items-center gap-2.5">
          <FiLoader className="animate-spin text-sky-600" />
          <div>
            <p className="text-sm font-semibold">KI-Bewertung läuft …</p>
            <p className={`text-[11px] ${muted}`}>
              Vergleiche prüfen, im Web recherchieren, Anzeige lesen – meist 1–2 Minuten.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!deep) {
    return (
      <section className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="flex items-start gap-2.5">
          <FiCpu className={`mt-0.5 ${faint}`} />
          <div>
            <p className="text-sm font-semibold">KI-Bewertung</p>
            <p className={`text-[11px] ${error ? "text-red-600" : muted}`}>
              {error ||
                (onRun
                  ? "Für diese Analyse liegt noch keine KI-Bewertung vor."
                  : "Ohne Vergleichsfahrzeuge ist keine KI-Bewertung möglich.")}
            </p>
          </div>
        </div>
        {onRun ? (
          <button type="button" onClick={onRun} className={button}>
            <FiCpu /> {error ? "Erneut versuchen" : "KI-Bewertung starten"}
          </button>
        ) : null}
      </section>
    );
  }

  // The decision is the AI's own — shown as it was made.
  const action = deep.decision?.action || null;
  const actionNote = deep.decisionNote || null;
  const decision = action ? ACTIONS[action] || ACTIONS.VERHANDELN : null;
  // When the badge had to change, the AI's headline no longer fits it.
  const headline = deep.decision?.headline || null;
  const sell = deep.sellability ? SELL[deep.sellability.rating] || SELL.NORMAL : null;
  const risks = (deep.findings || []).filter((finding) => finding.type === "RISIKO");
  const reasons = deep.decision?.reasons || [];

  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="p-4">
        {/* ---------- Fazit ---------- */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${faint}`}>
              <FiCpu className="size-3" /> Fazit · KI-Bewertung
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {decision ? (
                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold ${dark ? decision.dark : decision.light}`}>
                  <decision.icon className="size-3.5" /> {decision.label}
                </span>
              ) : null}
              {headline ? <h2 className="text-[15px] font-bold leading-snug">{headline}</h2> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {sell ? (
              <span className={`text-[11px] ${muted}`}>
                Verkäuflichkeit <span className={`font-semibold ${sell.tone || text}`}>{sell.label}</span>
              </span>
            ) : null}
          </div>
        </div>

        {deep.decision?.summary ? (
          <p className={`mt-2 max-w-4xl text-[13px] leading-relaxed ${text}`}><Cited text={deep.decision.summary} dark={dark} /></p>
        ) : null}

        {actionNote ? <p className={`mt-2 text-xs font-semibold ${action === "NICHT_KAUFEN" ? "text-red-600" : "text-amber-600"}`}>{actionNote}</p> : null}

        {deep.targetProfit ? (
          <p className={`mt-1.5 text-xs ${muted}`}>
            <span className={`font-semibold ${text}`}>Marge angepasst:</span> {euro(deep.targetProfit.from)} → {euro(deep.targetProfit.to)}
            {deep.targetProfit.limited ? <span className={faint}> (KI-Vorschlag {euro(deep.targetProfit.proposed)}, begrenzt)</span> : null}
            {deep.targetProfit.reason ? <> – <Cited text={deep.targetProfit.reason} dark={dark} /></> : null}
          </p>
        ) : null}

        {/* why */}
        {reasons.length || risks.length ? (
          <ul className={`mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] md:grid-cols-3 ${text}`}>
            {(reasons.length ? reasons : risks.map((risk) => risk.text)).slice(0, 3).map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${dark ? "bg-slate-500" : "bg-slate-400"}`} />
                <span><Cited text={reason} dark={dark} /></span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* ---------- evidence — always open, part of the report ---------- */}
      <div className={`grid grid-cols-1 gap-x-6 gap-y-4 border-t p-4 text-xs md:grid-cols-2 ${line}`}>
        <Section title="Aus der Anzeige" dark={dark}>
          {deep.findings?.length ? (
            <ul className="space-y-1.5">
              {deep.findings.map((finding, index) => {
                const meta = FINDING[finding.type] || FINDING.FRAGE;
                return (
                  <li key={index} className="leading-snug">
                    <span className={`font-semibold ${meta.tone}`}>{meta.label}:</span> <Cited text={finding.text} dark={dark} />
                    {finding.evidence ? <span className={`block italic ${faint}`}>„{finding.evidence}“</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={muted}>Keine Auffälligkeiten im Anzeigentext.</p>
          )}
        </Section>

        <Section title="Bekannte Schwachstellen" dark={dark}>
          {deep.corrections?.length ? (
            <p className="mb-1.5 text-[11px] text-amber-600">{deep.corrections.join(" ")}</p>
          ) : null}
          {deep.weakPoints?.length ? (
            <ul className={`divide-y ${divide}`}>
              {deep.weakPoints.map((point, index) => (
                <li key={index} className="py-1.5 leading-snug first:pt-0">
                  <span className="font-semibold">{plainText(point.title)}</span>
                  {point.detail ? <span className={muted}> – <Cited text={point.detail} dark={dark} /></span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={muted}>Keine bekannten Schwachstellen für dieses Modell.</p>
          )}
        </Section>

        {deep.causes?.length ? (
          <div className="space-y-3 md:col-span-2">
            {deep.causes.map((entry, index) => (
              <Section key={index} title={`Mögliche Ursachen: ${entry.symptom}`} dark={dark}>
                <ol className={`divide-y ${divide}`}>
                  {entry.options.map((option, optionIndex) => {
                    const effort = EFFORT[option.effort] || EFFORT.MITTEL;
                    return (
                      <li key={optionIndex} className="flex items-baseline gap-2 py-1 leading-snug first:pt-0">
                        <span className={`w-3 shrink-0 tabular-nums ${faint}`}>{optionIndex + 1}.</span>
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">{plainText(option.cause)}</span>
                          {option.reason ? <span className={muted}> – <Cited text={option.reason} dark={dark} /></span> : null}
                        </span>
                        <span className={`shrink-0 text-[10px] font-semibold ${effort.tone}`}>{effort.label}</span>
                      </li>
                    );
                  })}
                </ol>
              </Section>
            ))}
          </div>
        ) : null}

      </div>

      {/* Web sources the AI cited — small chips, to check what it found. */}
      {deep.sources?.length ? (
        <div className={`flex flex-wrap items-center gap-1.5 border-t px-4 py-2 ${line}`}>
          <span className={`mr-0.5 text-[10px] font-semibold uppercase tracking-wider ${faint}`}>Quellen</span>
          {deep.sources.map((source) => {
            const { host, title } = sourceParts(source);
            return (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                title={source.title || source.url}
                className={`inline-flex max-w-[260px] items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-tight transition ${
                  dark
                    ? "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800"
                }`}
              >
                <FiExternalLink className="size-2.5 shrink-0" />
                <span className={`shrink-0 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{host}</span>
                {title ? <span className="truncate">{title}</span> : null}
              </a>
            );
          })}
        </div>
      ) : null}

      <p className={`border-t px-4 py-1.5 text-[10px] ${line} ${faint}`}>
        {deep.model}
        {Number.isFinite(deep.searches)
          ? deep.searches > 0
            ? ` · ${deep.searches} Websuche${deep.searches === 1 ? "" : "n"}`
            : " · keine Websuche"
          : ""}{" "}
        ·{" "}
        {deep.sellability?.reason ? `Verkauf: ${plainText(deep.sellability.reason)} · ` : ""}
        {deep.expertNotesGiven ? `${deep.expertNotesGiven} passende Einträge aus dem Marktwissen` : "noch kein Marktwissen hinterlegt"}
        {deep.expertUsed?.length ? ` (genutzt: ${deep.expertUsed.join(", ")})` : ""} · Zahlen rechnet das System, nicht die KI.
      </p>
    </section>
  );
}
