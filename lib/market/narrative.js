/**
 * The written recommendation.
 *
 * A complete German write-up is always produced in code, so the endpoint
 * never depends on a model being fast or available. If an OpenAI key is
 * configured we let the model rewrite the prose — it receives the numbers
 * pre-formatted as strings and is told not to invent any, and anything it
 * returns that fails validation is discarded in favour of the local text.
 */

import { isNarrativeModelEnabled, NARRATIVE_MODEL, POLICY } from "./config";
import { settleWithTimeout } from "./utils";
import { vehicleLabel } from "./vehicle";

const VERDICT_HEADLINES = {
  EXCELLENT: "Klarer Ankauf – der Gewinn steht mit Puffer",
  GOOD: "Lohnender Ankauf zum aufgerufenen Preis",
  NEGOTIABLE: "Nur mit Nachlass interessant",
  TOO_EXPENSIVE: "Für den Wiederverkauf zu teuer",
  INSUFFICIENT_DATA: "Datenlage reicht für eine belastbare Entscheidung nicht aus",
};

export function euro(value) {
  if (!Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value, suffix = "") {
  if (!Number.isFinite(value)) return "–";
  return `${new Intl.NumberFormat("de-DE").format(Math.round(value))}${suffix}`;
}

/* --------------------------------------------------------- deterministic */

/**
 * A car can be cheap in the market and still not pay: when the asking price
 * is below the market value but above the limit, the costs and the margin are
 * the reason — not the price. Said plainly, so nobody reads "zu teuer" as
 * "überteuert".
 */
export function verdictCause({ market, dealerCase, verdict }) {
  if (!["NEGOTIABLE", "TOO_EXPENSIVE"].includes(verdict)) return null;
  const asking = dealerCase.askingPrice;
  if (!Number.isFinite(asking) || !Number.isFinite(market.marketValue)) return null;
  if (asking > market.marketValue) return null;

  const room = dealerCase.sellingPrice - asking;
  const costs = [];
  if (dealerCase.pickup?.available && dealerCase.pickupCost > 0) {
    costs.push(`${euro(dealerCase.pickupCost)} Abholkosten`);
  }
  if (dealerCase.refurbishmentCost > 0) costs.push(`${euro(dealerCase.refurbishmentCost)} Renovierung`);

  return `Der Preis ist im Marktvergleich günstig (${euro(market.marketValue - asking)} unter Marktwert). Zwischen Angebot und realistischem Verkaufspreis bleiben aber nur ${euro(room)}${
    costs.length ? `, davon gehen ${costs.join(" und ")} ab` : ""
  } – zu wenig für den Zielgewinn von ${euro(dealerCase.targetProfit)}.`;
}

function buildSummary({ target, market, dealerCase, verdict }) {
  const label = vehicleLabel(target);

  if (verdict === "INSUFFICIENT_DATA") {
    return `Für den ${label} wurden nur ${market.comparableCount} ausreichend ähnliche Fahrzeuge gefunden. Das reicht nicht für einen belastbaren Marktwert und damit auch nicht für ein Einkaufslimit.`;
  }

  const parts = [];

  parts.push(
    `Vergleichbare ${label} liegen bei ${euro(market.marketValue)} (${euro(market.rangeFrom)} – ${euro(market.rangeTo)}), ermittelt aus ${market.comparableCount} Angeboten. Realistisch erzielbar sind ${euro(dealerCase.sellingPrice)}.`,
  );

  const costs = [];
  if (dealerCase.pickup?.available) {
    costs.push(`${euro(dealerCase.pickupCost)} Abholkosten`);
  }
  if (dealerCase.refurbishmentCost > 0) {
    costs.push(`${euro(dealerCase.refurbishmentCost)} Renovierung`);
  }

  parts.push(
    costs.length
      ? `Abzüglich ${costs.join(" und ")} sowie ${euro(dealerCase.targetProfit)} Zielgewinn liegt das Einkaufslimit bei ${euro(dealerCase.maximumPurchasePrice)}.`
      : `Abzüglich ${euro(dealerCase.targetProfit)} Zielgewinn liegt das Einkaufslimit bei ${euro(dealerCase.maximumPurchasePrice)}.`,
  );

  if (verdict === "EXCELLENT" || verdict === "GOOD") {
    parts.push(
      `Der Angebotspreis von ${euro(dealerCase.askingPrice)} liegt darunter – daraus ergibt sich ein erwarteter Gewinn von ${euro(dealerCase.expectedProfit)}.`,
    );
  } else if (verdict === "NEGOTIABLE") {
    parts.push(
      `Mit ${euro(dealerCase.askingPrice)} liegt das Angebot ${euro(dealerCase.requiredDiscount)} über dem Limit. Ab ${euro(dealerCase.maximumPurchasePrice)} wird der Wagen interessant.`,
    );
  } else {
    parts.push(
      `Mit ${euro(dealerCase.askingPrice)} liegt das Angebot ${euro(dealerCase.requiredDiscount)} über dem Einkaufslimit. Ohne entsprechenden Nachlass lohnt der Ankauf nicht.`,
    );
  }

  const cause = verdictCause({ market, dealerCase, verdict });
  if (cause) parts.push(cause);

  return parts.join(" ");
}

function buildReasons({ target, market, dealerCase }) {
  const reasons = [];

  if (Number.isFinite(market.differenceToAsking)) {
    reasons.push(
      market.differenceToAsking > 0
        ? `Das Angebot liegt ${euro(market.differenceToAsking)} unter dem Marktwert.`
        : `Das Angebot liegt ${euro(Math.abs(market.differenceToAsking))} über dem Marktwert.`,
    );
  }

  if (Number.isFinite(dealerCase.expectedProfit)) {
    reasons.push(
      `Erwarteter Gewinn beim Angebotspreis: ${euro(dealerCase.expectedProfit)}${
        Number.isFinite(dealerCase.profitMarginPercent)
          ? ` (${number(dealerCase.profitMarginPercent)} % vom Einkauf)`
          : ""
      }.`,
    );
  }

  if (dealerCase.pickup?.available) {
    reasons.push(
      `Abholung ${dealerCase.pickup.origin} – ${dealerCase.pickup.destination}: ${number(dealerCase.pickup.oneWayKm)} km einfach, ${number(dealerCase.pickup.roundTripKm)} km hin und zurück, ${euro(dealerCase.pickupCost)}.`,
    );
  }

  reasons.push(
    `${market.comparableCount} Vergleichsfahrzeuge, davon ${market.retailCount} Händlerangebote${
      market.privateCount ? ` und ${market.privateCount} Privatangebote` : ""
    }.`,
  );

  if (target.serviceHistory === "YES") {
    reasons.push("Scheckheftpflege ist in der Anzeige bestätigt.");
  }
  if (target.condition === "ACCIDENT_FREE") {
    reasons.push("Die Anzeige weist das Fahrzeug als unfallfrei aus.");
  }

  return reasons.slice(0, 6);
}

function buildRisks({ target, market, dealerCase, insights }) {
  const risks = [];

  if (target.condition === "DAMAGED") {
    risks.push("Die Anzeige nennt einen Unfall- oder Motorschaden.");
  } else if (target.condition === "REPAIRED_DAMAGE") {
    risks.push("Reparierter Vorschaden – Qualität der Instandsetzung prüfen.");
  } else if (target.condition === "UNKNOWN") {
    risks.push("Unfallstatus ist der Anzeige nicht zu entnehmen.");
  }

  const inspection = insights?.inspection;
  if (inspection?.status === "EXPIRED" || inspection?.status === "DUE") {
    risks.push(`${inspection.label} – neue HU vor dem Verkauf einplanen.`);
  } else if (!target.tuvUntil && !target.newInspection) {
    risks.push("Kein TÜV-/HU-Datum in der Anzeige.");
  }
  if (target.serviceHistory !== "YES") risks.push("Scheckheft nicht bestätigt.");

  const belt = insights?.belt;
  if (belt?.risk) risks.push(belt.risk);

  const usage = insights?.usage;
  if (usage?.shortTripRisk) {
    risks.push(`Diesel mit nur ${number(usage.perYear, " km")} pro Jahr – Kurzstreckenbetrieb, Partikelfilter prüfen.`);
  } else if (usage?.level === "VERY_HIGH") {
    risks.push(`Sehr hohe Nutzung: ${number(usage.perYear, " km")} pro Jahr.`);
  }

  const portal = insights?.portal;
  if (portal?.available && portal.agrees === false && Number.isFinite(portal.agreementPercent)) {
    risks.push(
      `${portal.source} sieht den Marktpreis bei ${euro(portal.median)} – unser Marktwert weicht um ${Math.abs(portal.agreementPercent).toLocaleString("de-DE")} % ab.`,
    );
  }

  if (Number.isFinite(target.mileageKm) && target.mileageKm > 180_000) {
    risks.push(`Hohe Laufleistung von ${number(target.mileageKm, " km")}.`);
  }

  if (dealerCase.pickupUnknown) {
    risks.push("Abholkosten fehlen – Standort des Fahrzeugs ist unbekannt.");
  }

  if (
    Number.isFinite(market.spread) &&
    market.marketValue &&
    market.spread / market.marketValue > 0.1
  ) {
    risks.push("Die Marktpreise streuen stark – Ausstattung und Zustand entscheiden.");
  }

  risks.push("Angaben stammen aus der Online-Anzeige; Zustand und Papiere vor Ort prüfen.");

  return risks.slice(0, 6);
}

function buildQuestions(target, insights) {
  const questions = [
    "Ist der Preis der Endpreis und ist das Fahrzeug noch verfügbar?",
  ];

  // Specific to this car first — the generic ones below only fill up.
  const ids = new Set((insights?.equipment?.items || []).map((item) => item.id));
  const days = insights?.listing?.daysOnline;

  if (Number.isFinite(days) && days > 45) {
    questions.push(`Das Fahrzeug ist seit ${days} Tagen inseriert – woran lag es bisher?`);
  }
  if (ids.has("TOW_BAR")) {
    questions.push("Wurde regelmäßig mit Anhänger oder Wohnwagen gefahren?");
  }
  if (insights?.usage?.shortTripRisk) {
    questions.push("Wurde überwiegend Kurzstrecke gefahren? Gab es Probleme mit dem Partikelfilter?");
  }
  const belt = insights?.belt;
  if (belt?.lastChange) {
    questions.push(`Zahnriemenwechsel ${belt.lastChange.label}: liegt die Rechnung vor?`);
  } else if (belt?.status === "OVERDUE" || belt?.status === "DUE_SOON") {
    questions.push("Wurde der Zahnriemen schon gewechselt? Gibt es eine Rechnung?");
  } else if (belt?.status?.startsWith("CHECK")) {
    questions.push("Hat der Motor Zahnriemen oder Steuerkette – und wann wurde gewechselt?");
  } else if (belt?.status === "CHAIN_WATCH") {
    questions.push("Gab es Geräusche beim Kaltstart oder wurde die Steuerkette schon erneuert?");
  }

  if (target.condition !== "ACCIDENT_FREE") {
    questions.push("Gibt es Vorschäden, Nachlackierungen oder Unfallschäden?");
  }
  if (target.serviceHistory !== "YES") {
    questions.push("Liegt ein lückenloses Scheckheft mit Werkstattrechnungen vor?");
  }
  if (!target.tuvUntil) {
    questions.push("Bis wann läuft die HU und gibt es Mängel aus der letzten Prüfung?");
  }

  // These apply to every purchase, so the list is never thin.
  if (!Number.isFinite(target.ownerCount)) {
    questions.push("Wie viele Vorbesitzer hat das Fahrzeug?");
  }
  questions.push(
    "Wie viele Schlüssel, Bordbücher und Radsätze sind dabei?",
    target.fuel === "DIESEL"
      ? "Sind Mängel bekannt (Öl, Kupplung, Klima, Elektronik, DPF/AGR)?"
      : "Sind Mängel bekannt (Öl, Kupplung, Klima, Elektronik)?",
  );
  if (!belt?.available) {
    questions.push("Wann wurden Zahnriemen, Bremsen und Service zuletzt gemacht?");
  }
  questions.push("Ist eine Besichtigung mit Probefahrt und Bühne möglich?");

  return questions.slice(0, 7);
}

/** Always available, always correct. */
export function buildFallbackNarrative(context) {
  const cheapButUnprofitable = Boolean(verdictCause(context));
  return {
    headline: cheapButUnprofitable
      ? "Günstig im Markt, aber nach Kosten kein Gewinn"
      : VERDICT_HEADLINES[context.verdict] || VERDICT_HEADLINES.INSUFFICIENT_DATA,
    summary: buildSummary(context),
    reasons: buildReasons(context),
    risks: buildRisks(context),
    questionsForSeller: buildQuestions(context.target, context.insights),
    generatedBy: "regelbasiert",
  };
}

/* ------------------------------------------------------------- with OpenAI */

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" }, maxItems: 6 },
    risks: { type: "array", items: { type: "string" }, maxItems: 6 },
    questionsForSeller: { type: "array", items: { type: "string" }, maxItems: 7 },
  },
  required: ["headline", "summary", "reasons", "risks", "questionsForSeller"],
};

function isUsable(candidate) {
  return (
    candidate &&
    typeof candidate.headline === "string" &&
    candidate.headline.length > 5 &&
    typeof candidate.summary === "string" &&
    candidate.summary.length > 40 &&
    Array.isArray(candidate.reasons) &&
    Array.isArray(candidate.risks) &&
    Array.isArray(candidate.questionsForSeller)
  );
}

/**
 * Facts handed to the model. Numbers are pre-formatted strings so the model
 * copies them instead of computing anything.
 */
function factSheet({ target, market, dealerCase, verdict, confidence, insights }) {
  return {
    ausstattung: insights?.equipment
      ? `${insights.equipment.levelLabel}: ${insights.equipment.highlights.join(", ") || "keine wertrelevanten Extras"}`
      : "unbekannt",
    kmProJahr: insights?.usage?.available
      ? `${number(insights.usage.perYear, " km")} (üblich ${number(insights.usage.norm, " km")})`
      : "unbekannt",
    hu: insights?.inspection?.label || "unbekannt",
    zahnriemen: insights?.belt?.available
      ? `${insights.belt.label} – ${insights.belt.detail}`
      : "keine Angabe",
    portalBewertung: insights?.portal?.available
      ? `${insights.portal.source}: Median ${euro(insights.portal.median)}${insights.portal.label ? `, ${insights.portal.label}` : ""}`
      : "keine",
    tageOnline: Number.isFinite(insights?.listing?.daysOnline)
      ? insights.listing.daysOnline
      : "unbekannt",
    fahrzeug: vehicleLabel(target),
    erstzulassung: target.firstRegistration || "unbekannt",
    kilometerstand: Number.isFinite(target.mileageKm)
      ? number(target.mileageKm, " km")
      : "unbekannt",
    leistung: Number.isFinite(target.powerPs) ? `${target.powerPs} PS` : "unbekannt",
    kraftstoff: target.fuel,
    getriebe: target.gearbox,
    zustand: target.condition,
    standort: target.location || "unbekannt",

    angebotspreis: euro(dealerCase.askingPrice),
    marktwert: euro(market.marketValue),
    marktspanne: `${euro(market.rangeFrom)} – ${euro(market.rangeTo)}`,
    anzahlVergleiche: market.comparableCount,

    realistischerVerkaufspreis: euro(dealerCase.sellingPrice),
    abholkosten: dealerCase.pickup?.available
      ? `${euro(dealerCase.pickupCost)} für ${number(dealerCase.pickup.oneWayKm)} km einfach bzw. ${number(dealerCase.pickup.roundTripKm)} km hin und zurück`
      : "unbekannt",
    renovierung: euro(dealerCase.refurbishmentCost),
    zielgewinn: euro(dealerCase.targetProfit),
    einkaufslimit: euro(dealerCase.maximumPurchasePrice),
    erwarteterGewinn: euro(dealerCase.expectedProfit),
    noetigerNachlass: euro(dealerCase.requiredDiscount),

    bewertung: verdict,
    konfidenz: `${confidence} %`,
    hauptgrund: verdictCause({ market, dealerCase, verdict }) || "",
  };
}

async function generateWithOpenAI(context) {
  if (!process.env.OPENAI_API_KEY) return null;

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: NARRATIVE_MODEL,
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content: [
          "Du bist Einkäufer in einem deutschen Autohaus und bewertest Ankäufe.",
          "Du bekommst fertig berechnete Zahlen und formulierst daraus die Empfehlung.",
          "Übernimm jede Zahl exakt so, wie sie geliefert wird – rechne nichts nach und erfinde nichts.",
          "Schreibe knapp, sachlich und auf Deutsch, in der Sprache des Autohandels.",
          "Keine Floskeln, keine Anrede, keine Emojis.",
          "Erwähne keine Mehrwertsteuer, Differenzbesteuerung, Rücklagen, Gewährleistung, Standzeit oder Standkosten – diese spielen in dieser Kalkulation keine Rolle.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          "Erstelle die Ankaufsempfehlung als JSON nach diesem Schema:",
          JSON.stringify(SCHEMA),
          "",
          "Daten:",
          JSON.stringify(factSheet(context), null, 2),
          "",
          "headline: max. 70 Zeichen, klare Aussage zum Ankauf.",
          "summary: 3–5 Sätze mit Marktwert, Einkaufslimit und konkreter Handlungsempfehlung.",
          "reasons: Argumente für bzw. gegen den Ankauf.",
          "risks: konkrete Risiken dieses Fahrzeugs.",
          "questionsForSeller: Fragen, die vor dem Ankauf zu klären sind.",
          "Ist hauptgrund gefüllt, erkläre ihn in der summary: Der Preis ist dann im Markt günstig, nur Kosten und Zielgewinn machen den Ankauf unrentabel – nenne den Angebotspreis in diesem Fall nicht überhöht oder zu hoch.",
        ].join("\n"),
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response?.choices?.[0]?.message?.content;
  if (!raw) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isUsable(parsed)) return null;

  return {
    headline: parsed.headline.slice(0, 120),
    summary: parsed.summary.slice(0, 1_200),
    reasons: parsed.reasons.filter((entry) => typeof entry === "string").slice(0, 6),
    risks: parsed.risks.filter((entry) => typeof entry === "string").slice(0, 6),
    questionsForSeller: parsed.questionsForSeller
      .filter((entry) => typeof entry === "string")
      .slice(0, 7),
    generatedBy: NARRATIVE_MODEL,
  };
}

/**
 * Returns the write-up. Never throws, never blocks longer than the budget.
 */
export async function buildNarrative(context) {
  const fallback = buildFallbackNarrative(context);

  if (!process.env.OPENAI_API_KEY || context.skipModel || !isNarrativeModelEnabled()) {
    return fallback;
  }

  const generated = await settleWithTimeout(
    generateWithOpenAI(context).catch(() => null),
    POLICY.narrativeTimeoutMs,
    null,
  );

  if (!generated) return fallback;

  // The risk list is safety relevant: keep the computed one as the floor.
  return {
    ...generated,
    risks: generated.risks.length ? generated.risks : fallback.risks,
    questionsForSeller: generated.questionsForSeller.length
      ? generated.questionsForSeller
      : fallback.questionsForSeller,
  };
}

export { VERDICT_HEADLINES };
