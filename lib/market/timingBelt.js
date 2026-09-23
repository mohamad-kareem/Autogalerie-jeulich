/**
 * Zahnriemen — is a timing-belt change likely due on this car?
 *
 * Three questions, answered from what the ad actually says first and from the
 * engine second:
 *
 *   1. Belt or chain?   The ad text wins ("Zahnriemen neu", "Steuerkette").
 *                       Otherwise a short table of engines whose drive is
 *                       well established (VW TDI, PureTech, BMW, Toyota …).
 *                       Anything not in the table stays "unbekannt" — a wrong
 *                       "Kette, alles gut" costs more than an honest question.
 *   2. Last change?     From the ad text ("Zahnriemen bei 182.000 km
 *                       gewechselt", "ZR neu 05/2022") or the portal field.
 *   3. Due?             Kilometres and years since then (or since new) against
 *                       a practical workshop interval. Whichever runs out
 *                       first decides — rubber ages even when the car stands.
 *
 * Intervals and costs are Richtwerte for a buyer's first estimate, not the
 * manufacturer's figure for a specific engine code; the UI says so.
 */

import { cleanText, currentMonths, registrationToMonths } from "./utils";

const euro = (value) => `${Math.round(value).toLocaleString("de-DE")} €`;
const kmText = (value) => `${Math.round(value).toLocaleString("de-DE")} km`;

/* ------------------------------------------------------------ engine rules */

const BELT = "BELT";
const WET_BELT = "WET_BELT";
const CHAIN = "CHAIN";

// Practical intervals and typical workshop prices incl. water pump.
const PROFILES = {
  VAG_TDI: { drive: BELT, km: 180_000, years: 10, cost: [700, 1_100] },
  VAG_EA211: { drive: BELT, km: 180_000, years: 10, cost: [600, 1_000] },
  PURETECH: { drive: WET_BELT, km: 100_000, years: 6, cost: [900, 1_600] },
  PSA_DIESEL: { drive: BELT, km: 180_000, years: 10, cost: [700, 1_200] },
  ECOBOOST_WET: { drive: WET_BELT, km: 150_000, years: 10, cost: [800, 1_400] },
  FORD_SIGMA: { drive: BELT, km: 160_000, years: 8, cost: [450, 800] },
  FORD_TDCI: { drive: BELT, km: 150_000, years: 10, cost: [700, 1_200] },
  K9K_DCI: { drive: BELT, km: 120_000, years: 6, cost: [500, 900] },
  FIAT_FIRE: { drive: BELT, km: 120_000, years: 5, cost: [400, 750] },
  FIAT_MULTIJET: { drive: BELT, km: 150_000, years: 6, cost: [600, 1_000] },
  VOLVO: { drive: BELT, km: 180_000, years: 10, cost: [700, 1_200] },
};

// Used only to tell the buyer when a belt *would* be due if it is one.
const GENERIC_BELT = { km: 150_000, years: 8, cost: [500, 1_200] };

/** Engine displacement in litres, one decimal: 1.199 cm³ → 1.2. */
function litresOf(target, text) {
  if (Number.isFinite(target.displacementCcm) && target.displacementCcm > 500) {
    return Math.round(target.displacementCcm / 100) / 10;
  }
  // "1.25" (Ford) rounds to 1.3 like 1.242 cm³ would; "3,5 t" is a weight.
  const match = text.match(
    /\b([0-6])[.,](\d{1,2})\s*(?:l\b|v6|v8|tdi|tsi|tfsi|fsi|mpi|tce|sce|dci|hdi|bluehdi|e-?hdi|puretech|ecoboost|tdci|cdti|crdi|d-?4d|multijet|jtd|t-?jet|16v|8v|12v|turbo|benzin|diesel|i-?vtec)/i,
  ) || text.match(/\b([0-6])[.,](\d{1,2})\b(?!\s*t\b)/);
  return match ? Math.round(Number(`${match[1]}.${match[2]}`) * 10) / 10 : null;
}

const MAKE_GROUPS = {
  VAG: /^(volkswagen|vw|audi|skoda|škoda|seat|cupra)$/,
  STELLANTIS_PSA: /^(peugeot|citro[eë]n|ds|ds automobiles)$/,
  OPEL: /^opel$/,
  FORD: /^ford$/,
  RENAULT: /^(renault|dacia|nissan)$/,
  FIAT: /^(fiat|abarth|alfa romeo|lancia)$/,
  CHAIN_BRANDS: /^(bmw|toyota|lexus|honda|porsche|smart|suzuki|mitsubishi|hyundai|kia|mazda|mini|mercedes-benz|mercedes)$/,
  VOLVO: /^volvo$/,
};

/**
 * @returns {{profile?:object, drive:string, engine:string, weakChain?:string}|null}
 */
function engineRule(target, text, litres) {
  const make = String(target.make || "").toLowerCase().trim();
  const year = Number.isFinite(target.registrationMonths)
    ? Math.floor(target.registrationMonths / 12)
    : null;
  const diesel = target.fuel === "DIESEL";
  const petrol = ["PETROL", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG"].includes(target.fuel);
  const l = litres;
  const rule = (key, engine) => ({ profile: PROFILES[key], drive: PROFILES[key].drive, engine });
  const chain = (engine, weakChain = null) => ({ drive: CHAIN, engine, weakChain });

  /* VW group */
  if (MAKE_GROUPS.VAG.test(make)) {
    if (diesel && l && l <= 2.0) return rule("VAG_TDI", `${l.toFixed(1)} TDI`);
    if (diesel && !l && /tdi/.test(text)) return rule("VAG_TDI", "TDI");
    if (diesel && l && l >= 2.7) return chain(`${l.toFixed(1)} TDI V6/V8`);
    if (petrol && l) {
      if (l >= 1.8 && l <= 2.0 && /tsi|tfsi|gti|\bs3\b|cupra|\bvrs\b|\brs\b/.test(text)) {
        return chain(`${l.toFixed(1)} TSI (EA888)`);
      }
      if ((l === 1.2 || l === 1.4) && /tsi|tfsi/.test(text) && year) {
        if (year <= 2012) return chain(`${l.toFixed(1)} TSI (EA111)`, "Bei diesem Motor ist Kettenlängung bekannt – Kaltstart auf Rasseln prüfen.");
        if (year >= 2014) return rule("VAG_EA211", `${l.toFixed(1)} TSI (EA211)`);
        return null;
      }
      if ((l === 1.0 || l === 1.5) && /tsi|tfsi|etsi/.test(text)) {
        return rule("VAG_EA211", `${l.toFixed(1)} TSI (EA211)`);
      }
      if (l === 1.0 && year && year >= 2011) return rule("VAG_EA211", "1.0 MPI (EA211)");
    }
    return null;
  }

  /* Peugeot, Citroën, DS — and Opel since the PSA engines arrived */
  const stellantisOpel =
    MAKE_GROUPS.OPEL.test(make) &&
    year &&
    ((/crossland|grandland/.test(text)) ||
      (/corsa/.test(text) && year >= 2020) ||
      (/astra/.test(text) && year >= 2022) ||
      (/mokka/.test(text) && year >= 2021) ||
      (/combo|zafira life|vivaro/.test(text) && year >= 2019));

  if (MAKE_GROUPS.STELLANTIS_PSA.test(make) || stellantisOpel) {
    if (petrol && l === 1.2) return rule("PURETECH", "1.2 PureTech");
    if (petrol && l === 1.6 && /thp|turbo|\bgt\b/.test(text)) {
      return chain("1.6 THP", "Bei diesem Motor ist Kettenlängung bekannt – Kaltstart auf Rasseln prüfen.");
    }
    if (diesel && l && l >= 1.5 && l <= 2.0) return rule("PSA_DIESEL", `${l.toFixed(1)} (Blue)HDi`);
    return null;
  }

  /* Ford */
  if (MAKE_GROUPS.FORD.test(make)) {
    if (petrol && l === 1.0 && (/ecoboost|turbo/.test(text) || (target.powerPs || 0) >= 95)) {
      return rule("ECOBOOST_WET", "1.0 EcoBoost");
    }
    if (petrol && l === 1.5 && year && year >= 2018 && /ecoboost/.test(text)) {
      return rule("ECOBOOST_WET", "1.5 EcoBoost (3 Zyl.)");
    }
    if (petrol && l && [1.2, 1.3, 1.4, 1.6].includes(l) && !/ecoboost|turbo|\bst\b/.test(text)) {
      return rule("FORD_SIGMA", `${l.toFixed(1)} Ti-VCT`);
    }
    if (petrol && l === 1.1 && year && year >= 2017) return rule("FORD_SIGMA", "1.1 Ti-VCT");
    if (diesel && l && l >= 1.4 && l <= 2.0) return rule("FORD_TDCI", `${l.toFixed(1)} TDCi/EcoBlue`);
    return null;
  }

  /* Renault, Dacia, Nissan — and the Mercedes with the Renault diesel */
  // A 160 d / A 180 d / B 180 d / CLA 180 d and the Citan run the Renault 1.5.
  const k9kMercedes =
    /^mercedes/.test(make) &&
    diesel &&
    (l === 1.5 || (!l && /\b(?:a|b|cla|gla)\s*1[68]0\s*(?:d|cdi)\b|citan/.test(text)));
  if (MAKE_GROUPS.RENAULT.test(make) || k9kMercedes) {
    if (diesel && (l === 1.5 || k9kMercedes)) return rule("K9K_DCI", "1.5 dCi");
    if (diesel && l && l >= 1.6) return chain(`${l.toFixed(1)} dCi`);
    if (petrol && /tce|dig-t|turbo/.test(text)) return chain(`${l ? l.toFixed(1) : ""} TCe`.trim());
    if (petrol && /sce/.test(text)) return chain("SCe");
    return null;
  }

  /* Fiat group */
  if (MAKE_GROUPS.FIAT.test(make)) {
    if (petrol && /twinair|0[.,]9/.test(text)) return chain("0.9 TwinAir");
    if (petrol && /firefly|hybrid/.test(text) && l === 1.0) return chain("1.0 FireFly");
    if (petrol && (l === 1.2 || l === 1.4)) return rule("FIAT_FIRE", `${l.toFixed(1)} FIRE/T-Jet`);
    // 1.248 cm³ rounds to 1.2 — still the chain-driven 1.3 Multijet.
    if (diesel && l && l <= 1.3) return chain("1.3 Multijet");
    if (diesel && l && l >= 1.6 && l <= 2.3) return rule("FIAT_MULTIJET", `${l.toFixed(1)} Multijet`);
    return null;
  }

  /* Volvo: the four-cylinder VEA engines and the older five-cylinders */
  if (MAKE_GROUPS.VOLVO.test(make)) {
    if (year && year >= 2006) return rule("VOLVO", diesel ? "Volvo Diesel" : "Volvo Benziner");
    return null;
  }

  /* Brands whose current engines run on a chain */
  if (MAKE_GROUPS.CHAIN_BRANDS.test(make)) {
    if (/^mini$/.test(make) && diesel && year && year <= 2010) {
      return rule("PSA_DIESEL", "1.6 Diesel (PSA)");
    }
    if (/^mazda$/.test(make) && diesel && l === 1.6) return rule("PSA_DIESEL", "1.6 Diesel (PSA)");
    // Proace vans are Peugeot/Citroën underneath.
    if (/^toyota$/.test(make) && /proace/.test(text)) {
      return diesel ? rule("PSA_DIESEL", "Diesel (PSA)") : null;
    }
    if (/^suzuki$/.test(make) && diesel) return null;
    if (/^(hyundai|kia)$/.test(make) && year && year < 2011) return null;
    if (/^bmw$/.test(make) && diesel && l === 2.0 && year && year <= 2011) {
      return chain("2.0 Diesel (N47)", "Bei diesem Motor ist Kettenverschleiß bekannt – Kaltstart auf Rasseln prüfen.");
    }
    if (/^mini$/.test(make) && petrol && year && year <= 2013) {
      return chain("1.6 (Prince)", "Bei diesem Motor ist Kettenlängung bekannt – Kaltstart auf Rasseln prüfen.");
    }
    return chain(make === "mercedes-benz" || make === "mercedes" ? "Mercedes-Motor" : `${target.make}-Motor`);
  }

  return null;
}

/* ------------------------------------------------------------ the ad itself */

const DONE_WORDS =
  "(?:neu|erneuert|gewechselt|getauscht|gemacht|ersetzt|durchgeführt|erfolgt|komplett)";

// One character of the same sentence. A dot only ends it when it is not part
// of "185.000" or an abbreviation like "inkl." or "ca.".
const SEG = "(?:[^.;!\\n]|\\.(?=\\d)|(?<=\\b(?:inkl|incl|ca|bzw|zzgl|evtl|tkm|km|nr|mind|u|z|b))\\.)";

/** Kilometres or a month/year following a mention: "bei 182.000 km", "05/2022". */
function readFigures(snippet, mileageKm) {
  let km = null;
  const kmMatch =
    snippet.match(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*(?:km|kilometer)/i) ||
    snippet.match(/(\d{2,3})\s*(?:tkm|tsd\.?\s*km|tausend)/i);
  if (kmMatch) {
    const raw = Number(kmMatch[1].replace(/[.\s]/g, ""));
    km = /tkm|tsd|tausend/i.test(kmMatch[0]) ? raw * 1_000 : raw;
    // A figure above today's reading is not a past service.
    if (!Number.isFinite(km) || km < 1_000 || (Number.isFinite(mileageKm) && km > mileageKm + 500)) {
      km = null;
    }
  }

  let months = null;
  let yearOnly = false;
  const monthYear = snippet.match(/\b(0?[1-9]|1[0-2])[./](20\d{2})\b/);
  const year = snippet.match(/(?:^|[^\d.])(20[0-3]\d)(?![\d.])/);
  if (monthYear) months = Number(monthYear[2]) * 12 + Number(monthYear[1]) - 1;
  else if (year) {
    months = Number(year[1]) * 12 + 5;
    yearOnly = true;
  }
  if (months !== null && months > currentMonths()) months = null;

  return { km, months, yearOnly: months !== null && yearOnly };
}

/** What the seller wrote about belt or chain. */
export function beltEvidence(target) {
  const text = cleanText(
    [target.title, target.variant, target.description, ...(target.equipment || [])]
      .filter(Boolean)
      .join(" . "),
  );

  const evidence = {
    mentionsBelt: false,
    mentionsChain: false,
    noBelt: false,
    done: null,
    pending: false,
    chainDone: false,
  };
  if (!text) return evidence;

  const belt = /(zahnriemen|\bzr\b(?=[\s-]*(?:neu|gewechselt|wechsel|erneuert)))/i;
  evidence.mentionsBelt = belt.test(text);
  evidence.mentionsChain = /steuerkette/i.test(text);
  // "Steuerkette statt Zahnriemen", "kein Zahnriemen" — the seller says chain.
  evidence.noBelt =
    new RegExp(
      `kein(?:en)?\\s+zahnriemen|steuerkette\\s*\\(?(?:statt|anstatt|anstelle|kein)|zahnriemen${SEG}{0,25}(?:entfällt|nicht nötig|nicht notwendig|nicht vorhanden)`,
      "i",
    ).test(text);

  if (evidence.mentionsBelt) {
    const pending = new RegExp(
      `(?:zahnriemen|\\bzr\\b)${SEG}{0,40}?(?:fällig|steht an|muss|müsste|sollte|nicht gewechselt|noch nicht|ansteht)`,
      "i",
    );
    evidence.pending = pending.test(text);

    const done =
      text.match(new RegExp(`(?:zahnriemen\\w*|\\bzr\\b)${SEG}{0,70}?${DONE_WORDS}${SEG}{0,60}`, "i")) ||
      text.match(new RegExp(`(?:neue[rnms]?)\\s+zahnriemen${SEG}{0,60}`, "i")) ||
      text.match(new RegExp(`zahnriemen\\w*\\s*(?:bei|am|im|mit)\\s*${SEG}{0,40}`, "i"));

    if (done && !evidence.pending && !evidence.noBelt) {
      const figures = readFigures(done[0], target.mileageKm);
      // "Bei 150.000 km Zahnriemen neu": a km figure right before counts too,
      // but nothing else from before — that is where EZ and HU dates sit.
      if (!Number.isFinite(figures.km)) {
        const before = text.slice(Math.max(0, done.index - 40), done.index);
        const lead = before.match(/(?:bei|mit)\s*(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*km\D{0,12}$/i);
        const value = lead ? Number(lead[1].replace(/[.\s]/g, "")) : null;
        if (value && value >= 1_000 && (!Number.isFinite(target.mileageKm) || value <= target.mileageKm + 500)) {
          figures.km = value;
        }
      }
      evidence.done = { ...figures, quote: cleanText(done[0]).slice(0, 110) };
    }
  }

  if (evidence.mentionsChain) {
    evidence.chainDone = new RegExp(`steuerkette${SEG}{0,50}?${DONE_WORDS}`, "i").test(text);
  }

  return evidence;
}

/* ------------------------------------------------------------ assessment */

function fromPortalField(value, mileageKm) {
  const raw = cleanText(value);
  if (!raw) return null;
  const months = registrationToMonths(raw);
  const figures = readFigures(raw, mileageKm);
  return {
    km: figures.km,
    months: Number.isFinite(months) && months <= currentMonths() ? months : figures.months,
    quote: raw,
  };
}

function monthLabel(months) {
  if (!Number.isFinite(months)) return null;
  return `${String((months % 12) + 1).padStart(2, "0")}/${Math.floor(months / 12)}`;
}

/**
 * @returns {{
 *   available:boolean, status:string, drive:string, driveSource:string,
 *   engine:string|null, interval:{km:number,years:number}|null,
 *   lastChange:{km:number|null, months:number|null, label:string, source:string}|null,
 *   kmLeft:number|null, monthsLeft:number|null, costRange:number[]|null,
 *   label:string, short:string, detail:string, weakChain:string|null
 * }}
 */
export function timingBeltStatus(target) {
  if (target.fuel === "ELECTRIC") {
    return { available: false, status: "NONE", drive: "NONE" };
  }
  if (!Number.isFinite(target.mileageKm) || !Number.isFinite(target.registrationMonths)) {
    return { available: false, status: "UNKNOWN", drive: "UNKNOWN" };
  }

  const text = cleanText(`${target.title || ""} ${target.variant || ""} ${target.model || ""}`).toLowerCase();
  const litres = litresOf(target, text);
  const rule = engineRule(target, text, litres);
  const evidence = beltEvidence(target);

  const ageMonths = Math.max(currentMonths() - target.registrationMonths, 0);
  const mileage = target.mileageKm;

  /* belt or chain */
  let drive = rule?.drive || "UNKNOWN";
  let driveSource = rule ? "ENGINE" : "UNKNOWN";
  if (evidence.noBelt) {
    drive = CHAIN;
    driveSource = "AD";
  } else if (evidence.mentionsBelt && (evidence.done || evidence.pending)) {
    if (drive === CHAIN || drive === "UNKNOWN") drive = BELT;
    driveSource = "AD";
  } else if (evidence.mentionsChain && !evidence.mentionsBelt) {
    drive = CHAIN;
    driveSource = "AD";
  }

  const engine = rule?.engine || null;
  const weakChain = drive === CHAIN ? rule?.weakChain || null : null;
  const base = { available: true, drive, driveSource, engine, weakChain };

  /* chain: no interval, but a note where a chain is known to stretch */
  if (drive === CHAIN) {
    const chainLabel = evidence.chainDone ? "Steuerkette laut Anzeige erneuert" : "Steuerkette";
    const watch = !evidence.chainDone && (weakChain || mileage >= 200_000);
    return {
      ...base,
      status: watch ? "CHAIN_WATCH" : "CHAIN",
      interval: null,
      lastChange: null,
      kmLeft: null,
      monthsLeft: null,
      costRange: null,
      short: evidence.chainDone ? "Kette · erneuert" : "Kette · kein Intervall",
      label: chainLabel,
      detail: evidence.chainDone
        ? "Die Anzeige nennt eine erneuerte Steuerkette – Rechnung verlangen."
        : weakChain
          ? `${engine}: Steuerkette ohne festes Wechselintervall. ${weakChain}`
          : `${engine ? `${engine}: ` : ""}Steuerkette ohne festes Wechselintervall${mileage >= 200_000 ? " – bei dieser Laufleistung Kaltstart auf Rasseln prüfen" : ""}.`,
    };
  }

  const profile = rule?.profile || GENERIC_BELT;
  const interval = { km: profile.km, years: profile.years };
  const costRange = profile.cost;

  /* when was it last done */
  let lastChange = null;
  if (evidence.done) {
    lastChange = { ...evidence.done, source: "AD" };
  } else if (target.lastBeltService) {
    const portal = fromPortalField(target.lastBeltService, mileage);
    if (portal) lastChange = { ...portal, source: "PORTAL" };
  }
  if (lastChange) {
    const parts = [
      Number.isFinite(lastChange.km) ? `bei ${kmText(lastChange.km)}` : null,
      Number.isFinite(lastChange.months)
        ? lastChange.yearOnly
          ? String(Math.floor(lastChange.months / 12))
          : monthLabel(lastChange.months)
        : null,
    ].filter(Boolean);
    lastChange.label = parts.join(", ") || "ohne Datum";
  }

  /* how far since then — or since new */
  const undated = lastChange && !Number.isFinite(lastChange.km) && !Number.isFinite(lastChange.months);
  const kmSince = lastChange
    ? Number.isFinite(lastChange.km)
      ? mileage - lastChange.km
      : null
    : mileage;
  const monthsSince = lastChange
    ? Number.isFinite(lastChange.months)
      ? currentMonths() - lastChange.months
      : null
    : ageMonths;

  const kmLeft = Number.isFinite(kmSince) ? interval.km - kmSince : null;
  const monthsLeft = Number.isFinite(monthsSince) ? interval.years * 12 - monthsSince : null;

  const overdue =
    evidence.pending ||
    (Number.isFinite(kmLeft) && kmLeft <= 0) ||
    (Number.isFinite(monthsLeft) && monthsLeft <= 0);
  const soon =
    !overdue &&
    ((Number.isFinite(kmLeft) && kmLeft <= 20_000) ||
      (Number.isFinite(monthsLeft) && monthsLeft <= 12));

  const kind = drive === WET_BELT ? "Zahnriemen im Ölbad" : "Zahnriemen";
  const rhythm = `Richtwert alle ${kmText(interval.km)} bzw. ${interval.years} Jahre`;
  const range = `${costRange[0].toLocaleString("de-DE")}–${euro(costRange[1])}`;
  const cost = `ca. ${range} inkl. Wasserpumpe`;

  // Which limit ran out, in words.
  const overBy = () => {
    const kmOver = Number.isFinite(kmLeft) && kmLeft <= 0;
    const ageOver = Number.isFinite(monthsLeft) && monthsLeft <= 0;
    const years = `${Math.floor(monthsSince / 12)} Jahre`;
    if (lastChange) {
      const parts = [kmOver ? kmText(kmSince) : null, ageOver ? years : null].filter(Boolean);
      return `${parts.join(" und ")} seit dem letzten Wechsel`;
    }
    return [kmOver ? `${kmText(kmSince)} gelaufen` : null, ageOver ? `${years} alt` : null]
      .filter(Boolean)
      .join(" und ");
  };

  const until = () => {
    const parts = [];
    if (Number.isFinite(kmLeft)) parts.push(`noch ca. ${kmText(Math.max(kmLeft, 0))}`);
    if (Number.isFinite(monthsLeft)) {
      parts.push(
        monthsLeft >= 24
          ? `${Math.floor(monthsLeft / 12)} Jahre`
          : `${Math.max(monthsLeft, 0)} Monate`,
      );
    }
    return parts.join(" bzw. ");
  };

  /* drive not known: say when a belt would be due, and ask */
  if (drive === "UNKNOWN") {
    const wouldBeDue = overdue;
    return {
      ...base,
      status: wouldBeDue ? "CHECK_URGENT" : soon ? "CHECK" : "CHECK_LOW",
      interval,
      lastChange,
      kmLeft,
      monthsLeft,
      costRange,
      short: wouldBeDue ? "unklar · ggf. fällig" : "Riemen oder Kette?",
      risk: wouldBeDue
        ? `Unklar, ob Zahnriemen oder Kette – falls Riemen, wäre der Wechsel fällig (ca. ${range}).`
        : null,
      label: "Zahnriemen oder Steuerkette – unklar",
      detail: wouldBeDue
        ? `Aus der Anzeige geht nicht hervor, ob der Motor Zahnriemen oder Kette hat. Falls Zahnriemen: bei ${overBy()} wäre der Wechsel fällig (${rhythm}, ${cost}).`
        : `Aus der Anzeige geht nicht hervor, ob der Motor Zahnriemen oder Kette hat – beim Verkäufer erfragen.`,
    };
  }

  const known = driveSource === "AD" ? kind : `${kind} (${engine})`;

  if (undated && !evidence.pending) {
    return {
      ...base,
      status: "DONE_UNVERIFIED",
      interval,
      lastChange,
      kmLeft: null,
      monthsLeft: null,
      costRange,
      short: "laut Anzeige neu",
      label: "Zahnriemen laut Anzeige gewechselt",
      detail: `„${lastChange.quote}“ – ohne Kilometerstand oder Datum. Rechnung verlangen; ohne Nachweis gilt er als fällig.`,
    };
  }

  if (overdue) {
    return {
      ...base,
      status: "OVERDUE",
      interval,
      lastChange,
      kmLeft,
      monthsLeft,
      costRange,
      short: "wahrscheinlich fällig",
      risk: `Zahnriemenwechsel wahrscheinlich fällig${engine ? ` (${engine})` : ""} – ca. ${range}.`,
      label: "Zahnriemenwechsel wahrscheinlich fällig",
      detail: evidence.pending
        ? `Die Anzeige sagt selbst, dass der Zahnriemen ansteht. ${known}: ${cost}.`
        : `${known}: ${overBy()}${lastChange ? "" : ", in der Anzeige ist kein Wechsel erwähnt"} – ${rhythm}. ${cost[0].toUpperCase()}${cost.slice(1)}.`,
    };
  }

  if (soon) {
    return {
      ...base,
      status: "DUE_SOON",
      interval,
      lastChange,
      kmLeft,
      monthsLeft,
      costRange,
      short: "bald fällig",
      risk: `Zahnriemenwechsel steht bald an (${until()}) – ca. ${range}.`,
      label: "Zahnriemenwechsel steht bald an",
      detail: `${known}: ${until()} bis zum nächsten Wechsel (${rhythm}). ${cost[0].toUpperCase()}${cost.slice(1)}.`,
    };
  }

  return {
    ...base,
    status: lastChange ? "DONE" : "OK",
    interval,
    lastChange,
    kmLeft,
    monthsLeft,
    costRange,
    short: lastChange ? `gewechselt ${lastChange.label}` : "noch nicht fällig",
    label: lastChange ? `Zahnriemen gewechselt ${lastChange.label}` : "Zahnriemen noch nicht fällig",
    detail: `${known}: ${until()} bis zum nächsten Wechsel (${rhythm}).${lastChange ? " Rechnung zum letzten Wechsel verlangen." : ""}`,
  };
}

/** Statuses that should reach the buyer's attention. */
export const BELT_ATTENTION = new Set(["OVERDUE", "DUE_SOON", "CHECK_URGENT", "DONE_UNVERIFIED"]);
