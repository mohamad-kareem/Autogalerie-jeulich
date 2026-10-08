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

const kmText = (value) => `${Math.round(value).toLocaleString("de-DE")} km`;

/* ------------------------------------------------------------ engine rules */

const BELT = "BELT";
const WET_BELT = "WET_BELT";
const CHAIN = "CHAIN";

// Intervals from manufacturer maintenance plans (via Haynes, ADAC) and parts
// makers (NTN-SNR, Gates, ContiTech), researched 10/2026. Where the maker
// gives no year limit, `years` is null. Costs: typical workshop price incl.
// water pump. `note` replaces the standard "Richtwert alle …" wording.
const PROFILES = {
  // VW group
  VAG_TDI_CR: { drive: BELT, km: 210_000, years: null, cost: [700, 1_100], note: "Herstellervorgabe 210.000 km, keine Jahresgrenze" },
  VAG_TDI_PD_OLD: { drive: BELT, km: 120_000, years: null, cost: [700, 1_100] },
  VAG_TDI_PD: { drive: BELT, km: 150_000, years: null, cost: [700, 1_100] },
  VAG_TDI_BITURBO: { drive: BELT, km: 120_000, years: null, cost: [800, 1_300] },
  VAG_EA211: { drive: BELT, km: 210_000, years: null, cost: [600, 1_000], note: "kein festes Wechselintervall – bei hoher Laufleistung prüfen" },
  VAG_CLASSIC: { drive: BELT, km: 90_000, years: 5, cost: [400, 750], note: "Prüfung ab 90.000 km, dann alle 30.000 km" },
  // Peugeot / Citroën / DS / Opel (Stellantis)
  PURETECH: { drive: WET_BELT, km: 100_000, years: 6, cost: [900, 1_600], note: "100.000 km / 6 Jahre (früher 175.000 / 10 – gilt nicht mehr)" },
  PSA_HDI_OLD: { drive: BELT, km: 240_000, years: 10, cost: [700, 1_200] },
  PSA_EHDI: { drive: BELT, km: 175_000, years: 10, cost: [700, 1_200] },
  PSA_DV5: { drive: BELT, km: 180_000, years: 10, cost: [700, 1_200], note: "180.000 km / 10 Jahre – zusätzlich Nockenwellenkette ab 100.000 km prüfen" },
  PSA_DW10: { drive: BELT, km: 180_000, years: 10, cost: [800, 1_300] },
  // Opel (GM engines)
  OPEL_PETROL_OLD: { drive: BELT, km: 150_000, years: 10, cost: [500, 900] },
  OPEL_PETROL: { drive: BELT, km: 150_000, years: 6, cost: [500, 900] },
  OPEL_CDTI: { drive: BELT, km: 150_000, years: 6, cost: [700, 1_200] },
  // Ford
  ECOBOOST_WET: { drive: WET_BELT, km: 160_000, years: 10, cost: [800, 1_400], note: "Hersteller 240.000 km / 10 J, Teilehersteller 160.000 / 10 J – sicherer Wert 160.000 km / 10 Jahre" },
  ECOBLUE_WET: { drive: WET_BELT, km: 160_000, years: 6, cost: [900, 1_500], note: "160.000 km / 6 Jahre (früher 240.000 / 10 – gilt nicht mehr)" },
  FORD_SIGMA: { drive: BELT, km: 160_000, years: 8, cost: [450, 800] },
  FORD_ECOBOOST4: { drive: BELT, km: 200_000, years: 10, cost: [700, 1_200] },
  FORD_TDCI_15: { drive: BELT, km: 200_000, years: 10, cost: [700, 1_200] },
  FORD_TDCI: { drive: BELT, km: 160_000, years: 8, cost: [700, 1_200] },
  // Renault / Dacia / Nissan
  K9K_OLD: { drive: BELT, km: 120_000, years: 5, cost: [500, 900] },
  K9K_MID: { drive: BELT, km: 160_000, years: 6, cost: [500, 900] },
  K9K: { drive: BELT, km: 150_000, years: 6, cost: [500, 900] },
  RENAULT_16V: { drive: BELT, km: 120_000, years: 6, cost: [450, 800] },
  // Fiat group
  FIAT_FIRE: { drive: BELT, km: 120_000, years: 5, cost: [400, 750] },
  FIAT_MULTIAIR: { drive: BELT, km: 120_000, years: 6, cost: [500, 900] },
  FIAT_MULTIJET: { drive: BELT, km: 150_000, years: 5, cost: [600, 1_000] },
  // Volvo
  VOLVO_D5: { drive: BELT, km: 180_000, years: 10, cost: [800, 1_300] },
  VOLVO_VEA_D_EARLY: { drive: BELT, km: 150_000, years: 10, cost: [700, 1_200] },
  VOLVO_VEA: { drive: BELT, km: 240_000, years: 10, cost: [700, 1_200] },
  // Brands that are mostly chain — their belt exceptions
  MINI_MAZDA_PSA_D: { drive: BELT, km: 200_000, years: 10, cost: [700, 1_200] },
  HK_OLD: { drive: BELT, km: 90_000, years: 6, cost: [450, 900], note: "Richtwert 90.000–120.000 km / 6 Jahre – Serviceheft prüfen" },
  TOYOTA_D4D_OLD: { drive: BELT, km: 100_000, years: 6, cost: [600, 1_000], note: "Richtwert ca. 100.000 km – Serviceheft prüfen" },
  SUZUKI_16D: { drive: BELT, km: 150_000, years: 5, cost: [600, 1_000] },
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
  CHAIN_BRANDS: /^(bmw|toyota|lexus|honda|porsche|smart|suzuki|mitsubishi|mazda|mini|mercedes-benz|mercedes)$/,
  VOLVO: /^volvo$/,
};

/**
 * Many ads do not state the engine size ("Ford Fiesta Celebration
 * *AUTOMATIK*"). For a few very common engines, power and year identify it
 * reliably on their own — then we do not leave the buyer with "unklar".
 * @returns {{litres:number, tag:string}|null}
 */
function inferEngine(target, text) {
  const make = String(target.make || "").toLowerCase().trim();
  const year = Number.isFinite(target.registrationMonths) ? Math.floor(target.registrationMonths / 12) : null;
  const ps = Math.round(target.powerPs || 0);
  const petrol = ["PETROL", "HYBRID", "LPG"].includes(target.fuel);
  if (!petrol || !year || !ps) return null;
  const near = (...values) => values.some((value) => Math.abs(ps - value) <= 1);

  // Ford 1.0 EcoBoost: 100 PS (74 kW) from 2012; 125 / 140 PS from 2014.
  if (MAKE_GROUPS.FORD.test(make) && year >= 2012 && year <= 2018 && !/\b1[.,][1-6]\b|\bst\b/.test(text)) {
    if (near(100) || (year >= 2014 && near(125, 140))) return { litres: 1.0, tag: "ecoboost" };
  }
  // Peugeot / Citroën / DS 1.2 PureTech: 75 / 82 / 100 / 110 / 130 / 155 PS.
  if (MAKE_GROUPS.STELLANTIS_PSA.test(make) && year >= 2014 && near(75, 82, 100, 110, 130, 155)) {
    return { litres: 1.2, tag: "puretech" };
  }
  // VW group TSI without size: 1.0 TSI 95 / 110 / 115 PS (2015+), 1.5 TSI 130 / 150 PS (2017+).
  if (MAKE_GROUPS.VAG.test(make) && /tsi|tfsi/.test(text)) {
    if (year >= 2015 && near(95, 110, 115)) return { litres: 1.0, tag: "tsi" };
    if (year >= 2017 && near(130, 150)) return { litres: 1.5, tag: "tsi" };
  }
  return null;
}

/**
 * @returns {{profile?:object, drive:string, engine:string, weakChain?:string}|null}
 */
function engineRule(target, text, litres) {
  const make = String(target.make || "").toLowerCase().trim();
  const year = Number.isFinite(target.registrationMonths)
    ? Math.floor(target.registrationMonths / 12)
    : null;
  const month = Number.isFinite(target.registrationMonths) ? (target.registrationMonths % 12) + 1 : null;
  const diesel = target.fuel === "DIESEL";
  const petrol = ["PETROL", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG"].includes(target.fuel);
  const l = litres;
  const ps = target.powerPs || 0;
  const rule = (key, engine) => ({ profile: PROFILES[key], drive: PROFILES[key].drive, engine });
  const chain = (engine, weakChain = null) => ({ drive: CHAIN, engine, weakChain });
  const stretch = "Bei diesem Motor ist Kettenlängung bekannt – Kaltstart auf Rasseln prüfen.";

  /* VW group */
  if (MAKE_GROUPS.VAG.test(make)) {
    if (diesel && l && l >= 2.7) return chain(`${l.toFixed(1)} TDI V6/V8`);
    if (diesel && (l ? l <= 2.0 : /tdi/.test(text))) {
      const size = l ? `${l.toFixed(1)} TDI` : "TDI";
      if (l === 2.0 && ps >= 230) return rule("VAG_TDI_BITURBO", "2.0 TDI BiTurbo");
      // Pumpe-Düse until about 2008 (1.4 TDI 3-cyl. until 2010), common rail after.
      const pd = /\bpd\b|pumpe/.test(text) || (year && (year <= 2008 || (l === 1.4 && year <= 2010)));
      if (pd && year) return rule(year < 2007 ? "VAG_TDI_PD_OLD" : "VAG_TDI_PD", `${size} Pumpe-Düse`);
      if (year) return rule("VAG_TDI_CR", `${size} Common-Rail`);
      return null;
    }
    if (petrol && l) {
      if (l >= 1.8 && l <= 2.0 && /tsi|tfsi|gti|\bs3\b|cupra|\bvrs\b|\brs\b/.test(text)) {
        return chain(`${l.toFixed(1)} TSI (EA888)`);
      }
      if ((l === 1.2 || l === 1.4) && /tsi|tfsi/.test(text) && year) {
        if (year <= 2012) return chain(`${l.toFixed(1)} TSI (EA111)`, "Bei diesem Motor ist Kettenlängung häufig (60–100 Tkm) – Kaltstart auf Rasseln prüfen.");
        if (year >= 2014) return rule("VAG_EA211", `${l.toFixed(1)} TSI (EA211)`);
        return null;
      }
      if ((l === 1.0 || l === 1.5) && /tsi|tfsi|etsi/.test(text)) {
        return rule("VAG_EA211", `${l.toFixed(1)} TSI (EA211)`);
      }
      if (l === 1.0 && year && year >= 2011) return rule("VAG_EA211", "1.0 MPI (EA211)");
      // The classic naturally aspirated and early turbo petrols (Golf 3–6,
      // Polo, Octavia, A3 …: 1.4/1.6 16V, 1.6 8V, 1.8T, 2.0 8V) run a belt.
      if (year && year <= 2013 && [1.4, 1.6, 1.8, 2.0].includes(l) && !/tsi|tfsi|fsi/.test(text)) {
        return rule("VAG_CLASSIC", `${l.toFixed(1)} Benziner`);
      }
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
    if (petrol && (l === 1.2 || l === 1.0)) {
      // Third generation (2023+: Turbo 100, Hybrid 100/136) runs a chain.
      if (year && year >= 2024) return chain(`${l.toFixed(1)} PureTech (Gen. 3)`);
      return rule("PURETECH", `${l.toFixed(1)} PureTech`);
    }
    if (petrol && l === 1.6) return chain("1.6 THP / VTi", stretch);
    if (diesel && l === 1.4) return rule("PSA_HDI_OLD", "1.4 HDi");
    if (diesel && l === 1.5) return rule("PSA_DV5", "1.5 BlueHDi");
    if (diesel && l === 1.6) {
      return year && year <= 2010 ? rule("PSA_HDI_OLD", "1.6 HDi") : rule("PSA_EHDI", "1.6 e-HDi / BlueHDi");
    }
    if (diesel && l && l >= 1.9 && l <= 2.2) return rule("PSA_DW10", `${l.toFixed(1)} (Blue)HDi`);
    return null;
  }

  /* Opel with its own (GM) engines */
  if (MAKE_GROUPS.OPEL.test(make)) {
    if (petrol && l && l <= 1.4) {
      if (l === 1.0 && /turbo/.test(text)) return null; // 1.0 Turbo (2014–2019): drive not confirmed
      if (year && year >= 2009) return chain(`${l.toFixed(1)} Benziner`);
      return null;
    }
    if (petrol && (l === 1.6 || l === 1.8)) {
      if (/sidi/.test(text) || (l === 1.6 && year && year >= 2013 && /turbo/.test(text) && ps >= 170)) {
        return chain("1.6 SIDI Turbo");
      }
      if (year && year >= 2006 && year <= 2018) {
        return rule(year <= 2010 ? "OPEL_PETROL_OLD" : "OPEL_PETROL", `${l.toFixed(1)} Benziner`);
      }
      return null;
    }
    if (diesel && l === 1.3) return chain("1.3 CDTI");
    if (diesel && l === 1.6 && year && year >= 2013) return chain("1.6 CDTI");
    if (diesel && (l === 1.7 || (l === 2.0 && year && year >= 2008 && year <= 2018))) {
      return rule("OPEL_CDTI", `${l.toFixed(1)} CDTI`);
    }
    return null;
  }

  /* Ford */
  if (MAKE_GROUPS.FORD.test(make)) {
    if (petrol && l === 1.0 && (/ecoboost|turbo/.test(text) || ps >= 95)) {
      // From about 2018 partly chain (cylinder deactivation) – not certain.
      if (year && year >= 2019) return null;
      return rule("ECOBOOST_WET", "1.0 EcoBoost");
    }
    if (petrol && l === 1.5 && year && year >= 2018 && /ecoboost/.test(text) && ps < 170) {
      return chain("1.5 EcoBoost (3 Zyl.)");
    }
    if (petrol && (l === 1.5 || l === 1.6) && /ecoboost|scti|turbo/.test(text)) {
      return rule("FORD_ECOBOOST4", `${l.toFixed(1)} EcoBoost`);
    }
    if (petrol && l === 2.0 && /ecoboost/.test(text)) return chain("2.0 EcoBoost");
    if (petrol && l && [1.1, 1.2, 1.3, 1.4, 1.6].includes(l) && !/ecoboost|turbo|\bst\b/.test(text)) {
      return rule("FORD_SIGMA", `${l.toFixed(1)} Ti-VCT`);
    }
    if (diesel && l === 2.0 && (/ecoblue/.test(text) || (year && year >= 2017))) {
      return rule("ECOBLUE_WET", "2.0 EcoBlue");
    }
    if (diesel && l === 1.5 && /ecoblue/.test(text)) return null; // not confirmed
    if (diesel && l === 1.5) return rule("FORD_TDCI_15", "1.5 TDCi");
    if (diesel && l && l >= 1.4 && l <= 2.0) return rule("FORD_TDCI", `${l.toFixed(1)} TDCi`);
    return null;
  }

  /* Renault, Dacia, Nissan — and the Mercedes with the Renault diesel */
  // A 160 d / A 180 d / B 180 d / CLA 180 d and the Citan run the Renault 1.5.
  const k9kMercedes =
    /^mercedes/.test(make) &&
    diesel &&
    (l === 1.5 || (!l && /\b(?:a|b|cla|gla)\s*1[68]0\s*(?:d|cdi)\b|citan/.test(text)));
  if (MAKE_GROUPS.RENAULT.test(make) || k9kMercedes) {
    if (diesel && (l === 1.5 || k9kMercedes)) {
      if (year && year < 2006) return rule("K9K_OLD", "1.5 dCi");
      if (year && (year < 2012 || (year === 2012 && month && month < 7))) return rule("K9K_MID", "1.5 dCi");
      return rule("K9K", "1.5 dCi");
    }
    if (diesel && l && l >= 1.6) return chain(`${l.toFixed(1)} dCi`);
    if (petrol && /tce|dig-t|turbo/.test(text)) return chain(`${l ? l.toFixed(1) : ""} TCe`.trim());
    if (petrol && /sce/.test(text)) return chain("SCe");
    if (petrol && l && [1.2, 1.4, 1.6, 2.0].includes(l) && year && year <= 2018 && /^(renault|dacia)$/.test(make)) {
      return rule("RENAULT_16V", `${l.toFixed(1)} 16V`);
    }
    return null;
  }

  /* Fiat group */
  if (MAKE_GROUPS.FIAT.test(make)) {
    if (petrol && /twinair|0[.,]9/.test(text)) return chain("0.9 TwinAir");
    if (petrol && /firefly|hybrid/.test(text) && l === 1.0) return chain("1.0 FireFly");
    if (petrol && /multiair/.test(text)) return rule("FIAT_MULTIAIR", "1.4 MultiAir");
    if (petrol && (l === 1.2 || l === 1.4)) return rule("FIAT_FIRE", `${l.toFixed(1)} FIRE/T-Jet`);
    // 1.248 cm³ rounds to 1.2 — still the chain-driven 1.3 Multijet.
    if (diesel && l && l <= 1.3) return chain("1.3 Multijet");
    if (diesel && l && l >= 1.6 && l <= 2.3) return rule("FIAT_MULTIJET", `${l.toFixed(1)} Multijet`);
    return null;
  }

  /* Volvo: the five-cylinder diesels, then the four-cylinder VEA engines */
  if (MAKE_GROUPS.VOLVO.test(make)) {
    if (!year) return null;
    if (diesel) {
      if (year < 2014) return rule("VOLVO_D5", "Volvo Diesel (5 Zyl.)");
      if (year <= 2018) return rule("VOLVO_VEA_D_EARLY", "Volvo Drive-E Diesel");
      return rule("VOLVO_VEA", "Volvo Drive-E Diesel");
    }
    if (year >= 2014) return rule("VOLVO_VEA", "Volvo Drive-E Benziner");
    return null;
  }

  /* Hyundai / Kia: chain on today's engines, belt on some older ones */
  if (/^(hyundai|kia)$/.test(make)) {
    if (petrol && l && l <= 1.1 && year && year < 2011) return rule("HK_OLD", `${l.toFixed(1)} Benziner`);
    if (petrol && l && l <= 1.6 && year && year >= 2007) return chain(`${l.toFixed(1)} Benziner`);
    if (petrol && l === 2.0 && year && year <= 2011) return rule("HK_OLD", "2.0 Benziner");
    if (diesel && l && l <= 1.7) return chain(`${l.toFixed(1)} CRDi`);
    if (diesel && l === 2.0 && year && year <= 2010) return rule("HK_OLD", "2.0 CRDi");
    if (year && year >= 2011) return chain(`${target.make}-Motor`);
    return null;
  }

  /* Brands whose engines run on a chain — with their belt exceptions */
  if (MAKE_GROUPS.CHAIN_BRANDS.test(make)) {
    if (/^mini$/.test(make) && diesel && l === 1.6 && year && year <= 2014) {
      return rule("MINI_MAZDA_PSA_D", "1.6 Diesel (PSA)");
    }
    if (/^mazda$/.test(make) && diesel && (l === 1.6 || l === 1.4)) return rule("MINI_MAZDA_PSA_D", `${l.toFixed(1)} Diesel (PSA)`);
    // Proace vans are Peugeot/Citroën underneath; the old Aygo diesel too.
    if (/^toyota$/.test(make) && /proace/.test(text)) {
      return diesel ? rule("PSA_DW10", "Diesel (PSA)") : null;
    }
    if (/^toyota$/.test(make) && diesel && l === 1.4 && /aygo/.test(text)) return rule("PSA_HDI_OLD", "1.4 Diesel (PSA)");
    if (/^toyota$/.test(make) && diesel && l === 2.0 && year && year <= 2006) return rule("TOYOTA_D4D_OLD", "2.0 D-4D");
    if (/^suzuki$/.test(make) && diesel) {
      if (l === 1.6) return rule("SUZUKI_16D", "1.6 DDiS");
      if (l === 1.3) return chain("1.3 DDiS");
      return null;
    }
    if (/^mitsubishi$/.test(make) && diesel && year && year <= 2012) return null;
    if (/^bmw$/.test(make) && diesel && l === 2.0 && year && year <= 2011) {
      return chain("2.0 Diesel (N47)", "Bei diesem Motor ist Kettenverschleiß bekannt – Kaltstart auf Rasseln prüfen.");
    }
    if (/^mini$/.test(make) && petrol && year && year <= 2013) {
      return chain("1.6 (Prince)", stretch);
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
  let litres = litresOf(target, text);
  let engineText = text;
  let inferred = false;
  if (litres === null) {
    const guess = inferEngine(target, text);
    if (guess) {
      litres = guess.litres;
      engineText = `${text} ${guess.tag}`;
      inferred = true;
    }
  }
  let rule = engineRule(target, engineText, litres);
  if (rule && inferred) {
    rule = { ...rule, engine: `${rule.engine} (aus PS und Baujahr erkannt)`, inferred: true };
  }
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
  const monthsLeft =
    Number.isFinite(monthsSince) && Number.isFinite(interval.years) ? interval.years * 12 - monthsSince : null;

  const overdue =
    evidence.pending ||
    (Number.isFinite(kmLeft) && kmLeft <= 0) ||
    (Number.isFinite(monthsLeft) && monthsLeft <= 0);
  const soon =
    !overdue &&
    ((Number.isFinite(kmLeft) && kmLeft <= 20_000) ||
      (Number.isFinite(monthsLeft) && monthsLeft <= 12));

  const kind = drive === WET_BELT ? "Zahnriemen im Ölbad" : "Zahnriemen";
  const rhythm = profile.note
    ? profile.note
    : Number.isFinite(interval.years)
      ? `Richtwert alle ${kmText(interval.km)} bzw. ${interval.years} Jahre`
      : `Richtwert alle ${kmText(interval.km)} (keine Jahresgrenze vom Hersteller)`;
  // costRange stays in the data, but no price is put into the texts: what a
  // belt change costs depends on the workshop, and the dealer enters his own
  // figure in the calculation.

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
        ? `Unklar, ob Zahnriemen oder Kette – falls Riemen, wäre der Wechsel fällig.`
        : null,
      label: "Zahnriemen oder Steuerkette – unklar",
      detail: wouldBeDue
        ? `Aus der Anzeige geht nicht hervor, ob der Motor Zahnriemen oder Kette hat. Falls Zahnriemen, wäre der Wechsel fällig: ${overBy()} (${rhythm}).`
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
      risk: `Zahnriemenwechsel wahrscheinlich fällig${engine ? ` (${engine})` : ""}.`,
      label: "Zahnriemenwechsel wahrscheinlich fällig",
      detail: evidence.pending
        ? `Die Anzeige sagt selbst, dass der Zahnriemen ansteht (${known}).`
        : `${known}: ${overBy()}${lastChange ? "" : ", in der Anzeige ist kein Wechsel erwähnt"} – ${rhythm}.`,
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
      risk: `Zahnriemenwechsel steht bald an (${until()}).`,
      label: "Zahnriemenwechsel steht bald an",
      detail: `${known}: ${until()} bis zum nächsten Wechsel (${rhythm}).`,
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
