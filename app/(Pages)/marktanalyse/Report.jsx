"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/app/(components)/sales/ui";
import {
  AlertOctagon, AlertTriangle, Ban, CarFront, Check, CheckCircle2, ChevronDown, ExternalLink,
  HelpCircle, Info, ListChecks, Loader2, MapPin, MessageCircleQuestion, RefreshCw, ThumbsUp, Wrench,
} from "lucide-react";
import { durationDE, useTravel } from "@/app/(components)/TravelTime";
import { PORTAL_LABEL } from "@/lib/marktanalyse/knowledge/defaults.js";
import { portalOf } from "@/lib/marktanalyse/search.js";
import { euro, norm } from "@/lib/marktanalyse/text.js";
import { inspectionExpiryFromText } from "@/lib/portals/utils.js";
import Kurzfazit from "./Kurzfazit";

const TONE = {
  KAUFEN: "ma-tone-good",
  KNAPP: "ma-tone-good",
  VERHANDELN: "ma-tone-warn",
  FINGER_WEG: "ma-tone-danger",
};
const VERDICT_ICON = { KAUFEN: CheckCircle2, KNAPP: CheckCircle2, VERHANDELN: AlertTriangle, FINGER_WEG: Ban };
const FUEL = { PETROL: "Benzin", DIESEL: "Diesel", HYBRID: "Hybrid", PLUGIN_HYBRID: "Plug-in-Hybrid", ELECTRIC: "Elektro", LPG: "Autogas", CNG: "Erdgas" };
const GEAR = { MANUAL: "Schaltgetriebe", AUTOMATIC: "Automatik" };
const SELLER = { DEALER: "Händler", PRIVATE: "Privat", UNKNOWN: "Unbekannt" };
const CONDITION = { NONE: "Unfallfrei", REPAIRED: "Reparierter Unfallschaden", DAMAGED: "Unfall / Defekt" };
const FLAG = {
  killer: { icon: AlertOctagon, tone: "ma-danger-text", label: "Ausschluss" },
  serious: { icon: AlertTriangle, tone: "ma-danger-text", label: "Ernst" },
  warn: { icon: AlertTriangle, tone: "ma-warn-text", label: "Warnung" },
  info: { icon: Info, tone: "text-slate-600", label: "Hinweis" },
};
const COMPARISON_VIEWS = [
  ["dealer", "Händler"],
  ["private", "Privat"],
  ["excluded", "Ausgeschlossen"],
];
const EQUIPMENT_PRIORITY = [
  /\bklima(?:anlage|automatik)\b/,
  /\bstart[ /-]*stopp?\b/,
  /\bsitzheizung\b/,
  /\bbluetooth\b/,
  /\brueckfahrkamera\b/,
  /\beinparkhilfe\b/,
  /\b(?:wlan|wi[ -]?fi|hotspot)\b/,
  /\b(?:elektr(?:isch\w*)?|elektronisch\w*)[. -]+(?:aussen|seiten)spiegel\b/,
  /\bnichtraucher\b/,
];
const km = (value) => Number.isFinite(value) ? value.toLocaleString("de-DE") + " km" : null;
const safeLink = (value) => portalOf(value) ? value : null;

export function VerdictBadge({ verdict, label, small = false }) {
  return (
    <span className={ "ma-verdict-badge " + (TONE[verdict] || "border-line bg-slate-50 text-ink") + (small ? " text-[12px]" : "") }>
      {label}
    </span>
  );
}

function EquipmentList({ items }) {
  return (
    <ul className="ma-equipment-list" role="list">
      {items.map((item) => (
        <li key={item}><Check size={12} strokeWidth={2} aria-hidden="true" /><span>{item}</span></li>
      ))}
    </ul>
  );
}

/** Ausstattung aus der Anzeige, ohne Doppelte. */
function equipmentOf(subject) {
  return Array.isArray(subject?.equipment)
    ? [...new Set(subject.equipment.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : [];
}

/** Wichtigste Ausstattung zuerst (6 Stück), der Rest hinter „weitere anzeigen“. */
function splitEquipment(items) {
  const groups = EQUIPMENT_PRIORITY.map(() => []);
  const other = [];
  for (const item of items) {
    const rank = EQUIPMENT_PRIORITY.findIndex((pattern) => pattern.test(norm(item)));
    (groups[rank] ?? other).push(item);
  }
  const featured = groups.flat();
  const extra = Math.max(0, 6 - featured.length);
  return { preview: [...featured, ...other.slice(0, extra)], remaining: other.slice(extra) };
}

function EquipmentPreview({ items }) {
  const { preview, remaining } = splitEquipment(items);
  return (
    <>
      <EquipmentList items={preview} />
      {remaining.length > 0 && (
        <details className="ma-inline-details ma-more-equipment">
          <summary>
            <span className="ma-when-closed">{remaining.length} weitere anzeigen</span>
            <span className="ma-when-open">Weniger anzeigen</span>
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <EquipmentList items={remaining} />
        </details>
      )}
    </>
  );
}

// Frühere Darstellung in der Fahrzeugkarte (zurzeit nicht benutzt; Ausstattung steht unter „Fragen an den Verkäufer“).
function VehicleEquipment({ items }) {
  const groups = EQUIPMENT_PRIORITY.map(() => []);
  const other = [];
  for (const item of items) {
    const label = norm(item);
    const rank = EQUIPMENT_PRIORITY.findIndex((pattern) => pattern.test(label));
    (groups[rank] ?? other).push(item);
  }
  const featured = groups.flat();
  const extraPreviewCount = Math.max(0, 6 - featured.length);
  const preview = [...featured, ...other.slice(0, extraPreviewCount)];
  const remaining = other.slice(extraPreviewCount);

  return (
    <section className="ma-equipment" aria-labelledby="ma-equipment-title">
      <div className="ma-panel-heading ma-panel-heading-subtle ma-equipment-heading">
        <h3 id="ma-equipment-title">Ausstattung</h3>
        {items.length > 0 && <span className="ind-count">{items.length}</span>}
      </div>
      {items.length ? <EquipmentList items={preview} /> : (
        <p className="ma-equipment-empty">Keine Ausstattung angegeben.</p>
      )}
      {remaining.length > 0 && (
        <details className="ma-inline-details ma-more-equipment">
          <summary>
            <span className="ma-when-closed">{remaining.length} weitere anzeigen</span>
            <span className="ma-when-open">Weniger anzeigen</span>
            <ChevronDown size={14} aria-hidden="true" />
          </summary>
          <EquipmentList items={remaining} />
        </details>
      )}
    </section>
  );
}

/** Kurze Zeile für die Fahrzeugkarte: links Zahnriemen oder Steuerkette, rechts nur die Angabe. */
/**
 * Lange Anzeigentitel in der Vergleichstabelle: höchstens etwa 60 Zeichen, dann „…“
 * (voller Titel beim Darüberfahren). Gezählt wird nach Zeichen, weil viele Händler
 * Wörter ohne Leerzeichen mit * oder | aneinanderhängen.
 */
function shortTitle(title, max = 60) {
  const text = String(title || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const at = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("*"), cut.lastIndexOf("|"), cut.lastIndexOf(","), cut.lastIndexOf("/"));
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s*|,/–-]+$/, "") + " …";
}

function timingRow(fact) {
  if (!fact) return ["Zahnriemen / Kette", null];
  if (/^unklar/.test(fact)) return ["Zahnriemen / Kette", "unklar"];
  const unsure = / \(nicht sicher\)$/.test(fact);
  const [name, info] = fact.replace(/ \(nicht sicher\)$/, "").split(" – Wechsel etwa ");
  const label = name === "Zahnriemen im Ölbad" ? "Zahnriemen (Ölbad)" : name;
  if (info) return [label, (unsure ? "wohl " : "") + info.replace(" oder ", " / ").replace("Jahre", "J.")];
  return [label, unsure ? "vermutlich" : name === "Steuerkette" ? "kein fester Wechsel" : "Intervall unbekannt"];
}

function VehicleCard({ subject, ask, facts }) {
  const [failedImage, setFailedImage] = useState(null);
  const title = subject.title || [subject.make, subject.model].filter(Boolean).join(" ") || "Fahrzeug";
  const details = [
    ["Angebotspreis", euro(ask) + (subject.negotiable ? " · VB" : "")],
    ["Vorheriger Preis", facts?.oldPrice ? euro(facts.oldPrice) : null],
    ["Preisbewertung Portal", facts?.portalRating],
    ["Generation", facts?.generation],
    ["Ausstattungslinie", facts?.trim],
    ["Erstzulassung", subject.firstRegistration || "–"],
    ["Kilometerstand", km(subject.mileageKm) || "–"],
    ["Leistung", subject.powerPs ? subject.powerPs + " PS" : "–"],
    ["Kraftstoff", FUEL[subject.fuel] || "–"],
    ["Getriebe", GEAR[subject.gearbox] || "–"],
    ["Schadstoffklasse", facts?.emission],
    timingRow(facts?.timing),
    ["TÜV / HU", subject.tuv || inspectionExpiryFromText(subject.description) || "Nicht angegeben"],
    ["Zustand", CONDITION[subject.accident]],
    ["Scheckheft", { YES: "Ja", NO: "Nein" }[subject.serviceHistory]],
    ["Halter", subject.owners],
    ["Farbe", subject.color],
    ["Kilometer pro Jahr", km(facts?.kmPerYear)],
    ["Verkäufer", SELLER[subject.sellerType] || SELLER.UNKNOWN],
    ["Standort", subject.location],
    ["Online seit", Number.isFinite(facts?.daysOnline) ? (facts.daysOnline === 0 ? "Heute" : facts.daysOnline === 1 ? "1 Tag" : facts.daysOnline + " Tagen") : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <section className="ind-panel ma-panel ma-vehicle" aria-labelledby="ma-vehicle-title">
      <header className="ma-panel-heading ma-vehicle-heading">
        <h2 id="ma-vehicle-title" title={title}>{title}</h2>
      </header>

      <div className="ma-vehicle-photo">
        {subject.image && subject.image !== failedImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={subject.image} alt={title} referrerPolicy="no-referrer" onError={() => setFailedImage(subject.image)} />
        ) : (
          <div className="ma-photo-placeholder"><CarFront size={32} strokeWidth={1.35} aria-hidden="true" /><span>Kein Fahrzeugfoto verfügbar</span></div>
        )}
      </div>

      <dl className="ma-vehicle-specs">
        {details.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

    </section>
  );
}

/**
 * "Gekauft": Der Händler meldet den Kauf mit Kaufpreis. Nur was er hier einträgt,
 * gilt als gekauft – es gibt keine automatische Zuordnung.
 */
function Purchase({ id, ask, feedback, onFeedback }) {
  const bought = Number.isFinite(feedback?.boughtPrice) && feedback.boughtPrice > 0;
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trigger = useRef(null);
  if (!id) return null;

  const closeForm = () => {
    setEditing(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const openForm = () => {
    setPrice(String(bought ? feedback.boughtPrice : ask || ""));
    setError("");
    setEditing(true);
  };

  async function send(body) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/marktanalyse/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      onFeedback?.(data.feedback);
      closeForm();
    } catch (problem) {
      setError(problem?.message || "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  function save(event) {
    event.preventDefault();
    const value = Number(price);
    if (!Number.isInteger(value) || value < 1) return setError("Bitte den Kaufpreis in ganzen Euro eingeben.");
    send({ bought: true, price: value });
  }

  return (
    <div className="ma-purchase">
      {bought && <span className="ma-purchase-done"><Check size={13} aria-hidden="true" /> Gekauft für {euro(feedback.boughtPrice)}</span>}
      <button ref={trigger} type="button" className="btn btn-secondary btn-sm" aria-haspopup="dialog" onClick={openForm}>
        {bought ? "Ändern" : "Gekauft"}
      </button>
      {editing && createPortal(
        <div className="dash-shell">
          <Modal
            open
            onClose={() => { if (!busy) closeForm(); }}
            title={bought ? "Kauf bearbeiten" : "Kauf erfassen"}
            footer={
              <>
                {bought && <button type="button" className="btn btn-secondary mr-auto" onClick={() => send({ bought: false })} disabled={busy}>Nicht gekauft</button>}
                <button type="button" className="btn btn-secondary" onClick={closeForm} disabled={busy}>Abbrechen</button>
                <button className="btn btn-primary" type="submit" form="ma-purchase-form" disabled={busy || !price}>
                  {busy ? "Speichern …" : "Speichern"}
                </button>
              </>
            }
          >
            <form id="ma-purchase-form" onSubmit={save} aria-busy={busy}>
              <label htmlFor="ma-purchase-price" className="mb-1 block text-sm font-medium text-slate-700">Kaufpreis</label>
              <div className="relative">
                <input id="ma-purchase-price" className="field w-full pr-9 tabular-nums" type="text" inputMode="numeric"
                  autoComplete="off" autoFocus value={price} disabled={busy} aria-invalid={!!error}
                  aria-describedby={error ? "ma-purchase-error" : undefined}
                  onChange={(event) => setPrice(event.target.value.replace(/[^\d]/g, "").slice(0, 7))} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">€</span>
              </div>
              {error && <p id="ma-purchase-error" role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
            </form>
          </Modal>
        </div>,
        document.body
      )}
    </div>
  );
}

/** Was der Kauf bedeutet: Abstand zum Limit und erwarteter Gewinn. */
function PurchaseNote({ feedback, prices, settings }) {
  if (!(feedback?.boughtPrice > 0)) return null;
  const paid = feedback.boughtPrice;
  const parts = [`Gekauft für ${euro(paid)}${feedback.boughtAt ? " am " + new Date(feedback.boughtAt).toLocaleDateString("de-DE") : ""}.`];
  let over = false;
  if (prices) {
    const gap = paid - prices.limit;
    over = gap > 0;
    parts.push(gap > 0 ? `Das sind ${euro(gap)} über dem Einkaufslimit.` : gap < 0 ? `Das sind ${euro(-gap)} unter dem Einkaufslimit.` : "Genau am Einkaufslimit.");
    const profit = prices.sell - prices.costs - paid;
    parts.push(`Erwarteter Gewinn ${euro(profit)}.`);
  }
  return <p className={"ind-panel ma-panel ma-panel-message " + (over ? "ma-warn-text" : "text-ink")}>{parts.join(" ")}</p>;
}

function Assessment({ report, id, feedback, onFeedback, onReportChange }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const { verdict, prices } = report;
  const Icon = prices ? VERDICT_ICON[verdict.key] || Info : Info;

  async function refresh() {
    setRefreshing(true);
    setRefreshed(false);
    setRefreshError("");
    try {
      const response = await fetch(`/api/marktanalyse/${id}`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.report?.ok) throw new Error(data.error || "Die Analyse konnte nicht neu berechnet werden.");
      onReportChange(data.report);
      setRefreshed(true);
    } catch (problem) {
      setRefreshError(problem.message || "Die Analyse konnte nicht neu berechnet werden.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="ind-panel ma-panel ma-decision-panel" aria-labelledby="ma-decision-title">
      <header className="ma-decision">
        <span className={"ma-decision-icon " + (prices ? TONE[verdict.key] || "" : "border-line bg-slate-50 text-muted")}>
          <Icon size={15} aria-hidden="true" />
        </span>
        <div className="ma-decision-copy">
          <h2 id="ma-decision-title">{verdict.headline}</h2>
          {verdict.unsure && prices && <p className="text-[12px] ma-warn-text">Unsicher – bitte selbst prüfen.</p>}
        </div>
        <div className="ma-decision-actions">
          {id && onReportChange && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={refresh} disabled={refreshing}
              title="Gespeicherte Vergleichsdaten erneut auswerten">
              {refreshed ? <Check size={13} aria-hidden="true" /> : (
                <RefreshCw size={13} className={refreshing ? "motion-safe:animate-spin" : undefined} aria-hidden="true" />
              )}
              {refreshing ? "Wird neu berechnet …" : "Neu berechnen"}
            </button>
          )}
          <Purchase id={id} ask={report.ask} feedback={feedback} onFeedback={onFeedback} />
        </div>
      </header>
      <span className="sr-only" role="status">{refreshed ? "Analyse neu berechnet." : ""}</span>
      {refreshError && <p className="ma-panel-message ma-danger-text" role="alert">{refreshError}</p>}
      {prices && <Pricing prices={prices} />}
      <Kurzfazit id={id} report={report} />
    </section>
  );
}

function Pricing({ prices }) {
  const details = [
    { label: "Zielpreis", value: prices.target },
    { label: "Nötige Arbeiten", value: prices.costs },
    { label: "Privatpreis", value: prices.privateValue || null },
  ];

  return (
    <div className="ma-pricing">
      <dl className="ma-price-lead">
        <div><dt>Einkaufslimit</dt><dd>{euro(prices.limit)}</dd></div>
        <div><dt>Marktwert</dt><dd>{euro(prices.marketValue)}</dd></div>
        <div><dt>Verkaufspreis</dt><dd>{euro(prices.sell)}</dd></div>
      </dl>
      <dl className="ma-price-details">
        {details.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{euro(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Finding({ title, icon: Icon, count, open = false, children }) {
  return (
    <details className="ma-inline-details ma-finding" open={open}>
      <summary>
        <Icon size={15} aria-hidden="true" />
        <span className="flex-1">{title}</span>
        <span className="ind-count">{count}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div className="ma-finding-body">{children}</div>
    </details>
  );
}

/** Standort aus der Anzeige als Suchadresse: "68163 Baden-Württemberg - Mannheim" → "68163 Mannheim". */
function travelAddress(location) {
  const text = String(location || "").replace(/^DE-/i, "").trim();
  const zip = text.match(/\b\d{5}\b/)?.[0];
  const city = text.split(/\s+-\s+/).pop().replace(/\b\d{5}\b/, "").trim();
  if (zip) return `${zip} ${city}`.trim() + ", Deutschland";
  return text.length >= 4 ? `${text}, Deutschland` : "";
}

/** Fahrzeit und Entfernung von der Firma zum Standort des Fahrzeugs (wie bei „Ankauf bestätigen“). */
function Distance({ location }) {
  const address = travelAddress(location);
  const { data, loading } = useTravel(address);
  if (!address) return null;
  return (
    <section className="ma-finding" aria-labelledby="ma-distance-title">
      <div className="ma-finding-head">
        <MapPin size={15} aria-hidden="true" />
        <h3 className="flex-1" id="ma-distance-title">Entfernung</h3>
      </div>
      <div className="ma-finding-body">
        {loading ? (
          <p className="inline-flex items-center gap-1.5 text-muted"><Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" /> Fahrzeit wird berechnet …</p>
        ) : data?.minutes ? (
          <p>
            <strong>ca. {durationDE(data.minutes)} Fahrt</strong>
            <span className="text-muted"> · {String(data.km).replace(".", ",")} km ab Firma · {location}</span>
          </p>
        ) : (
          <p className="text-muted">Fahrzeit nicht verfügbar · {location}</p>
        )}
      </div>
    </section>
  );
}

function Findings({ report, location, equipment = [] }) {
  const { costs, flags, positives, questions, unknown, prices } = report;
  const pluses = report.pluses || [];
  const detailedLabels = new Set(pluses.map(({ label }) => norm(label)));
  const highlights = [
    ...pluses.map(({ id, label, quote }) => ({ id, label, quote })),
    ...positives.filter(({ id, text }) =>
      !detailedLabels.has(norm(text.replace(/\.$/, ""))) &&
      !(id === "erneuert" && pluses.some((plus) => plus.id.startsWith("neu-")))
    ).map(({ id, text }) => ({ id, label: text })),
  ];
  return (
    <section className="ma-findings" aria-label="Bewertung und Hinweise">
      <div className="ma-finding ma-summary-pair">
        <section className="ma-positives" aria-labelledby="ma-positives-title">
          <div className="ma-fixed-heading">
            <ThumbsUp size={15} className="text-emerald-700" aria-hidden="true" />
            <h3 className="flex-1" id="ma-positives-title">Pluspunkte</h3>
          </div>
          <div className="ma-finding-body">
          {highlights.length ? (
            <ul className="ma-findings-list">
              {highlights.map(({ id, label, quote }) => (
                <li key={id}>
                  <Check size={13} className="text-emerald-700" aria-hidden="true" />
                  <div><strong>{label}</strong>{quote && <small>„{quote}“</small>}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">Die Anzeige nennt keine besonderen Pluspunkte.</p>}
          </div>
        </section>
        <section aria-labelledby="ma-risks-title">
          <h3 className="ma-fixed-heading ma-risks-heading" id="ma-risks-title"><AlertTriangle size={15} aria-hidden="true" /> Risiken und Hinweise</h3>
          <div className="ma-finding-body">
          {flags.length ? (
            <ul className="ma-findings-list">
              {flags.map((flag, index) => {
                const { icon: Icon, tone, label } = FLAG[flag.level] || FLAG.info;
                return (
                  <li key={flag.id + "-" + index}>
                    <Icon className={tone} aria-hidden="true" />
                    <span><span className="sr-only">{label}: </span>{flag.text}{flag.source && <small>Quelle: {flag.source}</small>}</span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-muted">Keine Auffälligkeiten gefunden.</p>}
          </div>
        </section>
      </div>
      <div className="ma-finding-group">
        <Distance location={location} />
        <Finding title="Nötige Arbeiten" icon={Wrench} count={costs.length} open={costs.length > 0}>
          {costs.length ? (
            <div>
              <ul className="ma-cost-list">
                {costs.map((cost) => (
                  <li key={cost.id}>
                    <div>
                      <span>{cost.label}{cost.qty > 1 ? " × " + cost.qty : ""}</span>
                      {(cost.reason || cost.quote) && <small className="ma-cost-note">{cost.reason}{cost.reason && cost.quote ? ": " : ""}{cost.quote && <>„{cost.quote}“</>}</small>}
                    </div>
                    <strong className="ma-cost-amount">{cost.noPrice ? <span className="font-normal text-muted">nach Besichtigung</span> : euro(cost.amount)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : <p className="text-muted">Die Anzeige nennt keinen Mangel, der nach der Preisliste Geld kostet.</p>}
        </Finding>
        <Finding title="Ausstattung" icon={ListChecks} count={equipment.length} open>
          {equipment.length ? <EquipmentPreview items={equipment} /> : <p className="text-muted">Keine Ausstattung angegeben.</p>}
        </Finding>
        {unknown.length > 0 && (
          <Finding title="Unbekannte Hinweise" icon={HelpCircle} count={unknown.length} open>
            <p className="mb-2 text-violet-700">Mögliche Mängel aus dem Anzeigentext, die nicht in die Bewertung eingeflossen sind.</p>
            <ul className="ma-bullet-list">{unknown.map((entry, index) => <li key={index}>„{entry.quote}“</li>)}</ul>
          </Finding>
        )}
        {questions.length > 0 && (
          <Finding title="Fragen an den Verkäufer" icon={MessageCircleQuestion} count={questions.length}>
            <ul className="ma-bullet-list">{questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
          </Finding>
        )}
      </div>
    </section>
  );
}

function CarTable({ cars, excluded }) {
  return (
    <div className="ma-table-scroll" tabIndex={0} role="region" aria-label="Vergleichstabelle">
      <table className="ma-table ma-car-table" aria-labelledby="ma-comparables-title">
        <thead className="ind-thead">
          <tr>
            <th scope="col">Fahrzeug</th>
            <th scope="col" className="ma-number">EZ</th>
            <th scope="col" className="ma-number">km</th>
            <th scope="col" className="ma-number">PS</th>
            <th scope="col" className="ma-number">Preis</th>
            {excluded ? <th scope="col">Grund</th> : (
              <>
                <th scope="col" className="ma-number">Angeglichen</th>
                <th scope="col" className="ma-number">Gewicht</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => {
            const href = safeLink(car.url);
            const sources = [car.source, ...(car.alsoOn || [])].map((source) => PORTAL_LABEL[source]).filter(Boolean).join(" + ");
            return (
              <tr key={car.key} className="ind-row">
                <td className="ma-table-car">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="ma-text-link">
                      <span title={car.title}>{shortTitle(car.title)}</span><ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : <strong title={car.title}>{shortTitle(car.title)}</strong>}
                  <small>{[sources, car.trim, car.location].filter(Boolean).join(" · ")}</small>
                </td>
                <td className="ma-number">{car.firstRegistration || "–"}</td>
                <td className="ma-number">{Number.isFinite(car.mileageKm) ? car.mileageKm.toLocaleString("de-DE") : "–"}</td>
                <td className="ma-number">{car.powerPs || "–"}</td>
                <td className="ma-number">{euro(car.price)}</td>
                {excluded ? <td className="text-muted">{car.reason}</td> : (
                  <>
                    <td className="ma-number font-semibold">{euro(car.adjusted)}</td>
                    <td className="ma-number text-muted">{Number.isFinite(car.weight) ? Math.round(car.weight * 100) + " %" : "–"}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Comparables({ market, portals }) {
  const [list, setList] = useState("dealer");
  const lists = { dealer: market.dealer || [], private: market.private || [], excluded: market.excluded || [] };
  const cars = lists[list];
  const searchLinks = ["MOBILE_DE", "KLEINANZEIGEN", "AUTOSCOUT24"]
    .map((source) => ({ source, href: portals?.[source]?.searchUrl }))
    .filter(({ source, href }) => portalOf(href) === source);
  const portalNotes = Object.entries(portals || {}).filter(([, portal]) => portal?.error);
  const listNotes = {
    private: "Privatangebote fließen nicht in den Marktwert ein.",
    excluded: "Der Ausschlussgrund steht bei jedem Angebot.",
  };

  return (
    <section className="ind-panel ma-panel" aria-labelledby="ma-comparables-title">
      <div className="ma-panel-heading ma-comparison-heading">
        <div className="ma-comparison-title">
          <h2 id="ma-comparables-title">Vergleichsfahrzeuge</h2>
          <p className="ma-comparison-meta">
            <span>{cars.length} {cars.length === 1 ? "Ergebnis" : "Ergebnisse"}</span>
            {searchLinks.map(({ source, href }) => (
              <a key={source} className="ma-text-link" href={href} target="_blank" rel="noopener noreferrer">
                {PORTAL_LABEL[source]} <ExternalLink size={11} aria-hidden="true" />
              </a>
            ))}
          </p>
        </div>
        <div className="ind-seg inline-flex" role="group" aria-label="Vergleichsangebote filtern">
          {COMPARISON_VIEWS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setList(key)} className={"ind-seg-btn " + (list === key ? "ind-seg-on" : "")} aria-pressed={list === key}>
              {label} <span className="ind-count">{lists[key].length}</span>
            </button>
          ))}
        </div>
      </div>
      {cars.length ? <CarTable cars={cars} excluded={list === "excluded"} /> : (
        <p className="px-4 py-5 text-center text-[13px] text-muted">Keine Fahrzeuge in dieser Liste.</p>
      )}
      {listNotes[list] && <p className="ma-table-note">{listNotes[list]}</p>}
      {portalNotes.length > 0 && (
        <ul className="ma-table-note text-violet-700">
          {portalNotes.map(([name, portal]) => <li key={name}>{PORTAL_LABEL[name]}: {portal.error}</li>)}
        </ul>
      )}
    </section>
  );
}

export default function Report({ id, subject, report, feedback, onFeedback, onReportChange }) {
  if (!subject || !report) return null;

  return (
    <div className="ma-report">
      <div className="ma-report-grid">
        <div className="ma-report-main">
          <Assessment report={report} id={id} feedback={feedback} onFeedback={onFeedback} onReportChange={onReportChange} />
          <PurchaseNote feedback={feedback} prices={report.prices} settings={report.settings} />
          <Findings report={report} location={subject.location} equipment={equipmentOf(subject)} />
        </div>
        <VehicleCard subject={subject} ask={report.ask} facts={report.facts} />
      </div>
      <Comparables market={report.market} portals={report.portals} />
    </div>
  );
}
