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
  FiHelpCircle,
  FiLoader,
  FiXCircle,
} from "react-icons/fi";

const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : "–";

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
            <p className="text-sm font-semibold">Tiefe Analyse läuft …</p>
            <p className={`text-[11px] ${muted}`}>
              Vergleiche prüfen, Anzeige lesen, Schwachstellen und Marktwissen – dauert etwa 20–40 Sekunden.
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
            <p className="text-sm font-semibold">Tiefe Analyse</p>
            <p className={`text-[11px] ${muted}`}>
              {error ||
                "Prüft die Vergleiche, liest die Anzeige, nennt Schwachstellen und Aufbereitung – aus Händlersicht, mit Fazit."}
            </p>
          </div>
        </div>
        <button type="button" onClick={onRun} className={button}>
          <FiCpu /> {error ? "Erneut versuchen" : "Tiefe Analyse starten"}
        </button>
      </section>
    );
  }

  // The recommendation must match the calculation on screen. When the buyer
  // has changed costs or profit since, the badge follows the same rule as the
  // server: over 25 % discount needed = not buyable, above the limit = negotiate.
  let action = deep.decision?.action || null;
  let actionNote = deep.decisionNote || null;
  if (action && live && Number.isFinite(live.askingPrice) && live.askingPrice > 0) {
    const gap = (live.askingPrice - (live.limit || 0)) / live.askingPrice;
    if ((live.limit <= 0 || gap > 0.25) && action !== "NICHT_KAUFEN") {
      action = "NICHT_KAUFEN";
      actionNote = "Empfehlung an die aktuelle Kalkulation angepasst: So viel Nachlass ist nicht realistisch verhandelbar.";
    } else if (gap > 0.05 && action === "KAUFEN") {
      action = "VERHANDELN";
      actionNote = "Empfehlung an die aktuelle Kalkulation angepasst: Das Angebot liegt über dem Einkaufslimit.";
    }
  }
  const decision = action ? ACTIONS[action] || ACTIONS.VERHANDELN : null;
  // When the badge had to change, the AI's headline no longer fits it.
  const headline =
    action && deep.decision && action !== deep.decision.action
      ? action === "NICHT_KAUFEN"
        ? "Zum Angebotspreis nicht kaufen – das Fahrzeug trägt die Kosten nicht"
        : action === "PRUEFEN"
          ? "Auffällig günstig – vor dem Kauf den Grund klären"
          : "Erst verhandeln – das Angebot liegt über dem Einkaufslimit"
      : deep.decision?.headline || null;
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
              <FiCpu className="size-3" /> Fazit · Tiefe Analyse
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
          <p className={`mt-2 max-w-4xl text-[13px] leading-relaxed ${text}`}>{deep.decision.summary}</p>
        ) : null}

        {actionNote ? <p className={`mt-2 text-xs font-semibold ${action === "NICHT_KAUFEN" ? "text-red-600" : "text-amber-600"}`}>{actionNote}</p> : null}

        {deep.targetProfit ? (
          <p className={`mt-1.5 text-xs ${muted}`}>
            <span className={`font-semibold ${text}`}>Marge angepasst:</span> {euro(deep.targetProfit.from)} → {euro(deep.targetProfit.to)}
            {deep.targetProfit.limited ? <span className={faint}> (KI-Vorschlag {euro(deep.targetProfit.proposed)}, begrenzt)</span> : null}
            {deep.targetProfit.reason ? <> – {deep.targetProfit.reason}</> : null}
          </p>
        ) : null}

        {/* why */}
        {reasons.length || risks.length ? (
          <ul className={`mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[13px] md:grid-cols-3 ${text}`}>
            {(reasons.length ? reasons : risks.map((risk) => risk.text)).slice(0, 3).map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${dark ? "bg-slate-500" : "bg-slate-400"}`} />
                <span>{reason}</span>
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
                    <span className={`font-semibold ${meta.tone}`}>{meta.label}:</span> {finding.text}
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
                  <span className="font-semibold">{point.title}</span>
                  {point.detail ? <span className={muted}> – {point.detail}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={muted}>Keine bekannten Schwachstellen für dieses Modell.</p>
          )}
        </Section>

        {deep.removed?.length ? (
          <div className="md:col-span-2">
            <Section
              title="Vergleiche aussortiert"
              dark={dark}
              aside={
                <span className={`text-[10px] ${faint}`}>
                  Marktwert {euro(deep.before?.marketValue)} → {euro(market?.marketValue)}
                </span>
              }
            >
              <ul className={`divide-y ${divide}`}>
                {deep.removed.map((entry) => (
                  <li key={`${entry.listingUrl}-${entry.title}`} className="flex items-baseline gap-2 py-1 first:pt-0">
                    {entry.listingUrl ? (
                      <a href={entry.listingUrl} target="_blank" rel="noreferrer" className="min-w-0 max-w-[45%] shrink-0 truncate font-medium hover:underline">
                        {entry.title || "Fahrzeug"}
                      </a>
                    ) : (
                      <span className="min-w-0 max-w-[45%] shrink-0 truncate font-medium">{entry.title || "Fahrzeug"}</span>
                    )}
                    <span className={`min-w-0 flex-1 truncate ${faint}`} title={entry.reason}>{entry.reason}</span>
                    <span className="shrink-0 tabular-nums">{euro(entry.price)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        ) : null}
      </div>

      <p className={`border-t px-4 py-1.5 text-[10px] ${line} ${faint}`}>
        {deep.model} ·{" "}
        {deep.removalSkipped
          ? "Vergleiche unverändert (KI hätte zu viele aussortiert) · "
          : !deep.removed?.length
            ? "Vergleiche geprüft: alle passen · "
            : ""}
        {deep.sellability?.reason ? `Verkauf: ${deep.sellability.reason} · ` : ""}
        {deep.expertNotesGiven ? `${deep.expertNotesGiven} passende Einträge aus dem Marktwissen` : "noch kein Marktwissen hinterlegt"}
        {deep.expertUsed?.length ? ` (genutzt: ${deep.expertUsed.join(", ")})` : ""} · Zahlen rechnet das System, nicht die KI.
      </p>
    </section>
  );
}
