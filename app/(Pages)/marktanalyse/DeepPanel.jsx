"use client";

/**
 * Tiefe Analyse — the AI-reviewed report on the car, shown above the
 * calculation.
 *
 *   Fazit      decision, headline, summary, the key figures (from the system,
 *              live with the calculation), why, and what to do next.
 *   Details    right below, always open: comparison check, ad text, weak
 *              points, refurbishment, resale.
 *
 * The dealer can decide from the Fazit alone; the evidence is in view.
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

const signedEuro = (value) =>
  Number.isFinite(value) ? `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(Math.round(value)).toLocaleString("de-DE")} €` : "–";

const range = (from, to) => {
  if (Number.isFinite(from) && Number.isFinite(to) && to > from) return `${euro(from)} – ${euro(to)}`;
  if (Number.isFinite(from)) return euro(from);
  if (Number.isFinite(to)) return euro(to);
  return null;
};

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

function Figure({ label, value, hint, tone = "", dark }) {
  return (
    <div className="min-w-0">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-0.5 truncate text-[15px] font-bold tabular-nums ${tone}`}>{value}</p>
      {hint ? <p className={`truncate text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{hint}</p> : null}
    </div>
  );
}

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
 * @param {(amount:number) => void} props.onAddCost
 */
export default function DeepPanel({ deep, live, market, running, error, onRun, onAddCost, costApplied = 0, dark }) {
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
              Vergleiche prüfen, Anzeige lesen, Schwachstellen und Expertenwissen – dauert etwa 20–40 Sekunden.
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
        : "Erst verhandeln – das Angebot liegt über dem Einkaufslimit"
      : deep.decision?.headline || null;
  const sell = deep.sellability ? SELL[deep.sellability.rating] || SELL.NORMAL : null;
  const refurb = deep.refurbishment || [];
  const refurbLow = refurb.reduce((sum, item) => sum + (Number.isFinite(item.costFrom) ? item.costFrom : 0), 0);
  const refurbHigh = refurb.reduce(
    (sum, item) => sum + (Number.isFinite(item.costTo) ? item.costTo : Number.isFinite(item.costFrom) ? item.costFrom : 0),
    0,
  );
  const refurbMid = Math.round((refurbLow + refurbHigh) / 2 / 50) * 50;
  const risks = (deep.findings || []).filter((finding) => finding.type === "RISIKO");
  const reasons = deep.decision?.reasons || [];
  const steps = deep.nextSteps || [];

  const discount = live?.discount ?? null;
  const expected = live?.expected ?? null;

  return (
    <section className={`${panel} overflow-hidden`}>
      {/* coloured edge = decision */}
      <div className={`h-1 ${decision ? decision.bar : dark ? "bg-slate-700" : "bg-slate-300"}`} />

      <div className="p-4">
        {/* ---------- Fazit ---------- */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${faint}`}>
              <FiCpu className="size-3" /> Tiefe Analyse · Fazit
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
          <button type="button" onClick={onRun} className={button} title="Tiefe Analyse wiederholen">
            Neu
          </button>
        </div>

        {deep.decision?.summary ? (
          <p className={`mt-2 max-w-4xl text-[13px] leading-relaxed ${text}`}>{deep.decision.summary}</p>
        ) : null}

        {/* key figures not already in the sticky strip above (Angebot,
            Einkaufslimit, Nachlass) — from the system, live with the calculation */}
        <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border px-3 py-2.5 sm:grid-cols-4 ${line} ${dark ? "bg-slate-950/40" : "bg-slate-50"}`}>
          <Figure dark={dark} label="Marktwert" value={euro(market?.marketValue)} hint={market?.comparableCount ? `${market.comparableCount} Vergleiche` : null} />
          <Figure
            dark={dark}
            label="Gewinn zum Angebot"
            value={signedEuro(expected)}
            tone={Number.isFinite(expected) ? (expected >= (live?.targetProfit ?? 0) ? "text-emerald-600" : expected < 0 ? "text-red-600" : "text-amber-600") : ""}
            hint={Number.isFinite(live?.targetProfit) ? `Ziel ${euro(live.targetProfit)}` : null}
          />
          <Figure dark={dark} label="Verkäuflichkeit" value={sell ? sell.label : "–"} tone={sell?.tone || ""} hint={deep.sellability?.buyers ? deep.sellability.buyers.split(/[,(]/)[0] : null} />
          <Figure dark={dark} label="Aufbereitung" value={refurbHigh > 0 ? range(refurbLow, refurbHigh) : "–"} hint={refurbHigh > 0 ? "geschätzt" : null} />
        </div>

        {actionNote ? <p className={`mt-2 text-xs font-semibold ${action === "NICHT_KAUFEN" ? "text-red-600" : "text-amber-600"}`}>{actionNote}</p> : null}

        {deep.targetProfit ? (
          <p className={`mt-2 text-xs ${muted}`}>
            <span className={`font-semibold ${text}`}>Zielgewinn angepasst:</span> {euro(deep.targetProfit.from)} → {euro(deep.targetProfit.to)}
            {deep.targetProfit.limited ? <span className={faint}> (KI-Vorschlag {euro(deep.targetProfit.proposed)}, begrenzt)</span> : null}
            {deep.targetProfit.reason ? <> – {deep.targetProfit.reason}</> : null}
          </p>
        ) : null}

        {/* why / next steps */}
        {reasons.length || steps.length || risks.length ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className={`mb-1 text-[11px] font-bold uppercase tracking-wider ${faint}`}>Warum</h3>
              <ul className={`space-y-1 text-[13px] ${text}`}>
                {(reasons.length ? reasons : risks.map((risk) => risk.text)).slice(0, 4).map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <span className={`mt-[7px] size-1.5 shrink-0 rounded-full ${dark ? "bg-slate-500" : "bg-slate-400"}`} />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={`mb-1 text-[11px] font-bold uppercase tracking-wider ${faint}`}>Nächste Schritte</h3>
              {steps.length ? (
                <ol className={`space-y-1 text-[13px] ${text}`}>
                  {steps.map((step, index) => (
                    <li key={step} className="flex gap-2">
                      <span className={`mt-px inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-600"}`}>
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={`text-xs ${muted}`}>
                  {live && live.limit <= 0
                    ? "Kein Angebot abgeben – das Fahrzeug trägt die Kosten nicht."
                    : discount > 0
                      ? `Höchstens ${euro(live?.limit)} anbieten.`
                      : "Besichtigung vereinbaren."}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------- Details — always open, as part of the report ---------- */}
      <div className={`border-t ${line}`}>
        <div className="grid gap-x-6 gap-y-5 p-4 text-xs md:grid-cols-2">
          {deep.removed?.length || deep.removalSkipped ? (
          <Section title="Vergleiche geprüft" dark={dark}>
            {deep.removed?.length ? (
              <>
                <p className={`mb-1.5 ${muted}`}>
                  {deep.removed.length} {deep.removed.length === 1 ? "Fahrzeug" : "Fahrzeuge"} aussortiert – Marktwert vorher{" "}
                  {euro(deep.before?.marketValue)}, jetzt {euro(market?.marketValue)}.
                </p>
                <ul className={`divide-y ${divide}`}>
                  {deep.removed.map((entry) => (
                    <li key={`${entry.listingUrl}-${entry.title}`} className="py-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        {entry.listingUrl ? (
                          <a href={entry.listingUrl} target="_blank" rel="noreferrer" className="min-w-0 truncate font-medium hover:underline">
                            {entry.title || "Fahrzeug"}
                          </a>
                        ) : (
                          <span className="min-w-0 truncate font-medium">{entry.title || "Fahrzeug"}</span>
                        )}
                        <span className="shrink-0 tabular-nums">{euro(entry.price)}</span>
                      </div>
                      <p className={faint}>{entry.reason}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={muted}>Die KI hätte zu viele Vergleiche aussortiert – die Liste bleibt unverändert.</p>
            )}
          </Section>
          ) : null}

          <Section title="Aus der Anzeige" dark={dark}>
            {deep.findings?.length ? (
              <ul className="space-y-1.5">
                {deep.findings.map((finding, index) => {
                  const meta = FINDING[finding.type] || FINDING.FRAGE;
                  return (
                    <li key={index}>
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

          <Section title="Bekannte Schwachstellen" dark={dark} aside={<span className={`text-[10px] ${faint}`}>KI-Erfahrungswissen – vor Ort prüfen</span>}>
            {deep.weakPoints?.length ? (
              <ul className={`divide-y ${divide}`}>
                {deep.weakPoints.map((point, index) => (
                  <li key={index} className="py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{point.title}</span>
                      {range(point.costFrom, point.costTo) ? (
                        <span className="shrink-0 tabular-nums text-amber-600">{range(point.costFrom, point.costTo)}</span>
                      ) : null}
                    </div>
                    {point.detail ? <p className={muted}>{point.detail}</p> : null}
                    {point.check ? <p className={faint}>Prüfen: {point.check}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={muted}>Keine bekannten Schwachstellen für dieses Modell.</p>
            )}
          </Section>

          <Section
            title="Aufbereitung vor dem Verkauf"
            dark={dark}
            aside={
              refurbMid > 0 && onAddCost ? (
                costApplied ? (
                  <span className="text-[11px] font-semibold text-emerald-600">
                    ✓ {euro(costApplied)} übernommen ·{" "}
                    <button type="button" onClick={() => onAddCost(refurbMid)} className={`font-normal underline underline-offset-2 ${muted} hover:opacity-80`}>
                      rückgängig
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => onAddCost(refurbMid)} className="text-[11px] font-semibold text-sky-600 hover:underline">
                    + {euro(refurbMid)} in die Kalkulation
                  </button>
                )
              ) : null
            }
          >
            {refurb.length ? (
              <ul className={`divide-y ${divide}`}>
                {refurb.map((item, index) => (
                  <li key={index} className="py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{item.item}</span>
                      {range(item.costFrom, item.costTo) ? <span className="shrink-0 tabular-nums">{range(item.costFrom, item.costTo)}</span> : null}
                    </div>
                    {item.reason ? <p className={muted}>{item.reason}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={muted}>Keine besondere Aufbereitung zu erwarten.</p>
            )}
          </Section>

          {deep.sellability ? (
            <div className="md:col-span-2">
              <Section title="Verkauf" dark={dark}>
                <p>
                  <span className={`font-semibold ${sell?.tone || ""}`}>{sell?.label} verkäuflich.</span>{" "}
                  <span className={muted}>{deep.sellability.reason}</span>
                  {deep.sellability.buyers ? <span className={muted}> · Käufer: {deep.sellability.buyers}</span> : null}
                </p>
              </Section>
            </div>
          ) : null}
        </div>

        <p className={`border-t px-4 py-1.5 text-[10px] ${line} ${faint}`}>
          {deep.model} ·{" "}
          {!deep.removed?.length && !deep.removalSkipped ? "Vergleiche geprüft: alle passen · " : ""}
          {deep.expertNotesGiven ? `${deep.expertNotesGiven} Antworten aus dem Expertenwissen berücksichtigt` : "noch kein Expertenwissen hinterlegt"}
          {deep.expertUsed?.length ? ` (genutzt: ${deep.expertUsed.join(", ")})` : ""} · Zahlen rechnet das System, nicht die KI.
        </p>
      </div>
    </section>
  );
}
