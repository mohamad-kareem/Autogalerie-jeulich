/**
 * The canonical vehicle shape every source normalises into, plus the
 * enum mapping for the German market vocabulary.
 */

import {
  cleanText,
  normalizeText,
  registrationToMonths,
  monthsToRegistration,
  toNumber,
  round,
} from "./utils";

export const FUEL = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in-Hybrid",
  ELECTRIC: "Elektro",
  LPG: "Autogas (LPG)",
  CNG: "Erdgas (CNG)",
  HYDROGEN: "Wasserstoff",
  OTHER: "Sonstige",
  UNKNOWN: "Unbekannt",
};

export const GEARBOX = {
  MANUAL: "Schaltgetriebe",
  AUTOMATIC: "Automatik",
  SEMI_AUTOMATIC: "Halbautomatik",
  UNKNOWN: "Unbekannt",
};

export const SELLER = {
  DEALER: "Händler",
  PRIVATE: "Privat",
  UNKNOWN: "Unbekannt",
};

export const PRICE_TYPE = {
  VAT_DEDUCTIBLE: "MwSt. ausweisbar",
  MARGIN_TAXED: "Differenzbesteuert (§25a)",
  UNKNOWN: "Steuerstatus unbekannt",
};

export const CONDITION = {
  ACCIDENT_FREE: "Unfallfrei",
  REPAIRED_DAMAGE: "Repariert / Vorschaden",
  DAMAGED: "Unfallfahrzeug / defekt",
  UNKNOWN: "Unbekannt",
};

/** Values that are already canonical pass through untouched. */
function passThrough(value, allowed) {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return allowed.includes(upper) ? upper : null;
}

export function normalizeFuel(value) {
  const known = passThrough(value, Object.keys(FUEL));
  if (known) return known;
  const text = normalizeText(value);
  if (!text) return "UNKNOWN";
  if (/(plug.?in|phev)/.test(text)) return "PLUGIN_HYBRID";
  if (/(elektro|electric|^ev$|batterie)/.test(text)) return "ELECTRIC";
  if (/hybrid/.test(text)) return "HYBRID";
  if (/(diesel|^d$)/.test(text)) return "DIESEL";
  if (/(benzin|petrol|super|gasoline|^b$|^p$)/.test(text)) return "PETROL";
  if (/(autogas|lpg|fluessiggas)/.test(text)) return "LPG";
  if (/(erdgas|cng|ngt)/.test(text)) return "CNG";
  if (/(wasserstoff|hydrogen)/.test(text)) return "HYDROGEN";
  if (/(andere|sonstige|other)/.test(text)) return "OTHER";
  return "UNKNOWN";
}

export function normalizeGearbox(value) {
  const known = passThrough(value, Object.keys(GEARBOX));
  if (known) return known;
  const text = normalizeText(value);
  if (!text) return "UNKNOWN";
  if (/(halbautomat|semi.?automat|automatisiert)/.test(text)) {
    return "SEMI_AUTOMATIC";
  }
  if (/(automat|dsg|tiptronic|s.?tronic|pdk|cvt|steptronic|^a$)/.test(text)) {
    return "AUTOMATIC";
  }
  if (/(schalt|manuell|manual|^m$|gang)/.test(text)) return "MANUAL";
  return "UNKNOWN";
}

export function normalizeSeller(value) {
  const known = passThrough(value, Object.keys(SELLER));
  if (known) return known;
  const text = normalizeText(value);
  if (!text) return "UNKNOWN";
  if (/(dealer|haendler|gewerb|autohaus|commercial|firma)/.test(text)) {
    return "DEALER";
  }
  if (/(private|privat|owner|for sale by owner)/.test(text)) return "PRIVATE";
  return "UNKNOWN";
}

export function normalizeCondition(value) {
  const known = passThrough(value, Object.keys(CONDITION));
  if (known) return known;
  const text = normalizeText(value);
  if (!text) return "UNKNOWN";
  if (/(unfallfrei|accident free|kein unfall|unbeschaedigt)/.test(text)) {
    return "ACCIDENT_FREE";
  }
  if (/(repariert|instandgesetzt|behoben|repaired)/.test(text)) {
    return "REPAIRED_DAMAGE";
  }
  if (/(unfall|beschaedigt|defekt|damaged|bastler|motorschaden)/.test(text)) {
    return "DAMAGED";
  }
  return "UNKNOWN";
}

/** kW -> PS and back, so a source only has to supply one of them. */
export function derivePower({ powerKw, powerPs }) {
  const kw = toNumber(powerKw);
  const ps = toNumber(powerPs);
  if (Number.isFinite(kw) && kw > 0) {
    return { powerKw: round(kw), powerPs: Math.round(kw * 1.35962) };
  }
  if (Number.isFinite(ps) && ps > 0) {
    return { powerKw: Math.round(ps / 1.35962), powerPs: Math.round(ps) };
  }
  return { powerKw: null, powerPs: null };
}

/**
 * Detects the VAT status from free text. German dealers key their whole
 * calculation off this, so it is worth extracting properly.
 */
export function detectPriceType(text) {
  const haystack = cleanText(text).toLowerCase();
  if (!haystack) return "UNKNOWN";
  if (/(nicht\s+ausweisbar|differenzbesteuer|§\s?25a|25a\s?ustg)/.test(haystack)) {
    return "MARGIN_TAXED";
  }
  if (
    /(mwst\.?\s*ausweisbar|mwst\.?\s*ausweißbar|umsatzsteuer\s*ausweisbar|inkl\.?\s*\d{1,2}\s*%\s*mwst|zzgl\.?\s*\d{1,2}\s*%\s*mwst|netto\s*preis|vat\s*deductible)/.test(
      haystack,
    )
  ) {
    return "VAT_DEDUCTIBLE";
  }
  return "UNKNOWN";
}

/** Pulls a TÜV/HU date out of free text. */
export function detectTuv(text) {
  const haystack = cleanText(text);
  if (!haystack) return null;

  const patterns = [
    /(?:T[ÜU]V|HU)[^0-9A-Za-zÄÖÜäöü]{0,12}(?:bis|neu\s*bis)?[^0-9]{0,6}(\d{1,2}[./]\d{4})/i,
    /(?:HU|T[ÜU]V)[^0-9]{0,12}(\d{2}\/\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (match) return match[1].replace(".", "/");
  }

  if (/(t[üu]v|hu)\s*(ist\s*)?neu/i.test(haystack)) return "Neu";
  return null;
}

/** Wording that marks a link or menu entry rather than a statement about this car. */
const NAVIGATION_CONTEXT =
  /(kaufen|ankauf|verkaufen|verkauf|suchen|suche|angebote|b[öo]rse|gesucht|inserieren|bewerten|ratgeber|mehr\s+erfahren|jetzt\s)/;

/** Wording that shows the damage is being asserted about the vehicle. */
const STATEMENT_CONTEXT =
  /(hat|hatte|ist|war|mit|wurde|besteht|liegt|weist|leider|achtung|defekt|vorhanden|am|an\s+der|vorne|hinten|links|rechts)/;

const DAMAGE_TERMS =
  /(unfallfahrzeug\w*|unfallwagen|unfallschaden|hagelschaden|motorschaden|getriebeschaden|totalschaden|bastlerfahrzeug|nicht\s+fahrbereit)/g;

function hasDamageStatement(haystack) {
  DAMAGE_TERMS.lastIndex = 0;
  let hit;

  while ((hit = DAMAGE_TERMS.exec(haystack)) !== null) {
    const before = haystack.slice(Math.max(0, hit.index - 45), hit.index);
    const after = haystack.slice(
      hit.index + hit[0].length,
      hit.index + hit[0].length + 45,
    );

    // "Unfallfahrzeuge kaufen", "Unfallwagen Ankauf" — a menu, not this car.
    if (NAVIGATION_CONTEXT.test(after) || NAVIGATION_CONTEXT.test(before)) continue;

    // "Das Fahrzeug hat einen Unfallschaden am Heck" — a real statement.
    if (STATEMENT_CONTEXT.test(before) || STATEMENT_CONTEXT.test(after)) return true;
  }

  return false;
}

/**
 * Reads the accident status.
 *
 * This must be conservative. An ad page contains the words "Unfallfahrzeug"
 * or "Unfallschaden" in filter menus, legal boilerplate and neighbouring ads,
 * so scanning a whole page for those words marks every car as damaged — which
 * is exactly what happened. Rules, in order:
 *
 *   1. an explicit label/value pair decides it ("Unfallfrei: Nein")
 *   2. otherwise a clear statement that the car IS undamaged
 *   3. otherwise a clear statement of damage
 *   4. otherwise UNKNOWN — never a guess
 *
 * Callers pass the ad's own text (headline, data rows, description), never the
 * whole document.
 */
export function detectConditionFromText(text) {
  const haystack = cleanText(text).toLowerCase();
  if (!haystack) return "UNKNOWN";

  /* 1 — labelled values are decisive ------------------------------------ */

  const labelled = [
    // "Unfallfrei: Nein" / "Unfallfrei — ja"
    { pattern: /unfallfrei\s*[:\-–]?\s*(ja|nein|yes|no)\b/, yes: "ACCIDENT_FREE", no: "DAMAGED" },
    { pattern: /unfallschaden\s*[:\-–]?\s*(ja|nein)\b/, yes: "DAMAGED", no: "ACCIDENT_FREE" },
    { pattern: /unfallwagen\s*[:\-–]?\s*(ja|nein)\b/, yes: "DAMAGED", no: "ACCIDENT_FREE" },
  ];

  for (const entry of labelled) {
    const hit = haystack.match(entry.pattern);
    if (!hit) continue;
    const affirmative = /^(ja|yes)$/.test(hit[1]);
    return affirmative ? entry.yes : entry.no;
  }

  // "Fahrzeugzustand: Unfallfrei" and friends.
  const state = haystack.match(/fahrzeugzustand\s*[:\-–]?\s*([a-zäöüß /-]{3,40})/);
  if (state) {
    const value = state[1];
    if (/unfallfrei|unbesch[äa]digt/.test(value)) return "ACCIDENT_FREE";
    if (/unfall|besch[äa]digt|defekt/.test(value)) return "DAMAGED";
  }

  /* 2 — a plain statement that the car is undamaged ---------------------- */

  if (/\b(unfallfrei|unfallfreies fahrzeug|kein unfallschaden|keine unf[äa]lle|accident[- ]free)\b/.test(haystack)) {
    return "ACCIDENT_FREE";
  }

  /* 3 — a plain statement of damage -------------------------------------- */

  // Word presence is not enough. Portal pages carry navigation like
  // "Unfallfahrzeuge kaufen" or "Unfallwagen Ankauf", which says nothing about
  // the car being viewed. Each occurrence is judged by its surroundings.
  if (hasDamageStatement(haystack)) return "DAMAGED";

  // German adjectives decline: repariert/reparierter/reparierten/repariertem.
  if (
    /\b(repariert\w*\s+(vor)?schaden|(vor)?schaden\s+repariert|instandgesetzt|nachlackiert|unfallschaden\s+behoben)\b/.test(
      haystack,
    )
  ) {
    return "REPAIRED_DAMAGE";
  }

  /* 4 — say nothing rather than guess ------------------------------------ */

  return "UNKNOWN";
}

export function detectServiceHistory(text) {
  const haystack = cleanText(text).toLowerCase();
  if (!haystack) return "UNKNOWN";
  if (/(scheckheft|serviceheft|service.?historie|full service history)/.test(haystack)) {
    if (/(kein|ohne|nicht)\s+(scheckheft|serviceheft)/.test(haystack)) return "NO";
    return "YES";
  }
  return "UNKNOWN";
}

/**
 * Creates a canonical vehicle. Every source funnels through this so the rest
 * of the pipeline only ever sees one shape.
 */
export function createVehicle(input = {}) {
  const power = derivePower(input);
  const registrationMonths =
    input.registrationMonths ?? registrationToMonths(input.firstRegistration);

  const price = toNumber(input.price);
  const mileageKm = toNumber(input.mileageKm);

  return {
    source: input.source || "UNKNOWN",
    sourceLevel: input.sourceLevel || "RETAIL",
    listingId: input.listingId ? String(input.listingId) : null,
    listingUrl: input.listingUrl || null,

    title: cleanText(input.title) || null,
    make: cleanText(input.make) || null,
    model: cleanText(input.model) || null,
    variant: cleanText(input.variant) || null,

    price: Number.isFinite(price) && price > 0 ? Math.round(price) : null,
    priceType: input.priceType || "UNKNOWN",
    negotiable: Boolean(input.negotiable),

    firstRegistration:
      cleanText(input.firstRegistration) ||
      monthsToRegistration(registrationMonths),
    registrationMonths: Number.isFinite(registrationMonths)
      ? registrationMonths
      : null,

    mileageKm:
      Number.isFinite(mileageKm) && mileageKm >= 0
        ? Math.round(mileageKm)
        : null,

    fuel: input.fuel ? normalizeFuel(input.fuel) : "UNKNOWN",
    gearbox: input.gearbox ? normalizeGearbox(input.gearbox) : "UNKNOWN",
    powerKw: power.powerKw,
    powerPs: power.powerPs,

    bodyType: cleanText(input.bodyType) || null,
    doors: toNumber(input.doors),
    seats: toNumber(input.seats),
    color: cleanText(input.color) || null,
    ownerCount: toNumber(input.ownerCount),

    condition: input.condition ? normalizeCondition(input.condition) : "UNKNOWN",
    damageNote: cleanText(input.damageNote) || null,
    tuvUntil: cleanText(input.tuvUntil) || null,
    serviceHistory: input.serviceHistory || "UNKNOWN",

    sellerType: input.sellerType ? normalizeSeller(input.sellerType) : "UNKNOWN",
    sellerName: cleanText(input.sellerName) || null,
    location: cleanText(input.location) || null,

    images: Array.isArray(input.images) ? input.images.filter(Boolean).slice(0, 12) : [],
    equipment: Array.isArray(input.equipment)
      ? input.equipment.map(cleanText).filter(Boolean).slice(0, 60)
      : [],
    description: cleanText(input.description)?.slice(0, 4_000) || null,

    extractedFrom: input.extractedFrom || null,
    fetchedAt: new Date().toISOString(),
  };
}

/** Fields the valuation cannot work without. */
export function missingCoreFields(vehicle) {
  const missing = [];
  if (!vehicle.make) missing.push("Marke");
  if (!vehicle.model) missing.push("Modell");
  if (!vehicle.price) missing.push("Preis");
  if (!Number.isFinite(vehicle.mileageKm)) missing.push("Kilometerstand");
  if (!Number.isFinite(vehicle.registrationMonths)) missing.push("Erstzulassung");
  return missing;
}

/** Soft data-quality gaps, surfaced as warnings rather than errors. */
export function missingDetailFields(vehicle) {
  const missing = [];
  if (vehicle.fuel === "UNKNOWN") missing.push("Kraftstoff");
  if (vehicle.gearbox === "UNKNOWN") missing.push("Getriebe");
  if (!Number.isFinite(vehicle.powerPs)) missing.push("Leistung");
  if (!vehicle.tuvUntil) missing.push("TÜV/HU");
  if (vehicle.serviceHistory === "UNKNOWN") missing.push("Scheckheft");
  if (vehicle.condition === "UNKNOWN") missing.push("Unfallstatus");
  if (vehicle.priceType === "UNKNOWN") missing.push("MwSt.-Status");
  return missing;
}

export function vehicleLabel(vehicle) {
  return (
    [vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" ") ||
    vehicle.title ||
    "Fahrzeug"
  );
}
