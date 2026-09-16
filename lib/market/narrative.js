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

function buildRisks({ target, market, dealerCase }) {
  const risks = [];

  if (target.condition === "DAMAGED") {
    risks.push("Die Anzeige nennt einen Unfall- oder Motorschaden.");
  } else if (target.condition === "REPAIRED_DAMAGE") {
    risks.push("Reparierter Vorschaden – Qualität der Instandsetzung prüfen.");
  } else if (target.condition === "UNKNOWN") {
    risks.push("Unfallstatus ist der Anzeige nicht zu entnehmen.");
  }

  if (!target.tuvUntil) risks.push("Kein TÜV-/HU-Datum in der Anzeige.");
  if (target.serviceHistory !== "YES") risks.push("Scheckheft nicht bestätigt.");

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

function buildQuestions(target) {
  const questions = [
    "Ist der Preis der Endpreis und ist das Fahrzeug noch verfügbar?",
  ];

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
  questions.push(
    "Wie viele Vorbesitzer hat das Fahrzeug?",
    "Wie viele Schlüssel, Bordbücher und Radsätze sind dabei?",
    "Sind Mängel bekannt (Öl, Kupplung, Klima, Elektronik, DPF/AGR)?",
    "Wann wurden Zahnriemen, Bremsen und Service zuletzt gemacht?",
    "Ist eine Besichtigung mit Probefahrt und Bühne möglich?",
  );

  return questions.slice(0, 7);
}

/** Always available, always correct. */
export function buildFallbackNarrative(context) {
  return {
    headline: VERDICT_HEADLINES[context.verdict] || VERDICT_HEADLINES.INSUFFICIENT_DATA,
    summary: buildSummary(context),
    reasons: buildReasons(context),
    risks: buildRisks(context),
    questionsForSeller: buildQuestions(context.target),
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
function factSheet({ target, market, dealerCase, verdict, confidence }) {
  return {
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
