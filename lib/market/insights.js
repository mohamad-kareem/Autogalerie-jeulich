/**
 * Insights — everything beyond "what is it worth and what may I pay".
 *
 *   Ausstattung       what the car has, how well equipped it is, what is missing
 *   Nutzung           km per year against the norm for its fuel type
 *   HU                how long the inspection still runs
 *   Marktposition     where the asking price sits among the comparables, and
 *                     what a kilometre costs in this market (price/km trend)
 *   Portal-Bewertung  the portal's own verdict on this price, where published
 *   Anzeige           how long it has been online and how much interest it has
 *   Verhandlung       arguments, counter-arguments and a stance
 *   Besichtigung      a checklist built from this car's data, not a generic one
 *   Preisverlauf      what it cost when it was looked at before
 *
 * Every statement is derived from data that was actually read, and each one
 * carries the figure it is based on. Nothing is estimated from model
 * knowledge — a checklist item appears because of this car's fuel type,
 * mileage, age or equipment, never because "that engine is known for …".
 */

import { analyzeEquipment } from "./equipment";
import { negotiationPlan } from "./negotiation";
import {
  cleanText,
  currentMonths,
  median,
  registrationToMonths,
  round,
  roundTo,
} from "./utils";

const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : "–";
const km = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} km` : "–";

/* ------------------------------------------------------------ usage */

/**
 * Typical annual mileage in Germany, by fuel. Diesels are bought to be driven;
 * a diesel doing 6.000 km a year is a short-trip car, and that is its own risk.
 */
const ANNUAL_NORM_KM = {
  DIESEL: 20_000,
  ELECTRIC: 13_000,
  PLUGIN_HYBRID: 14_000,
  DEFAULT: 13_500,
};

export function usageProfile(target) {
  const age =
    Number.isFinite(target.registrationMonths)
      ? (currentMonths() - target.registrationMonths) / 12
      : null;

  if (!Number.isFinite(age) || !Number.isFinite(target.mileageKm)) {
    return { available: false };
  }

  const years = Math.max(age, 0.5);
  const perYear = Math.round(target.mileageKm / years / 100) * 100;
  const norm = ANNUAL_NORM_KM[target.fuel] ?? ANNUAL_NORM_KM.DEFAULT;
  const ratio = perYear / norm;

  let level = "NORMAL";
  if (ratio < 0.55) level = "LOW";
  else if (ratio > 1.6) level = "VERY_HIGH";
  else if (ratio > 1.2) level = "HIGH";

  const labels = {
    LOW: "Wenig gefahren",
    NORMAL: "Normal gefahren",
    HIGH: "Viel gefahren",
    VERY_HIGH: "Sehr viel gefahren",
  };

  return {
    available: true,
    ageYears: round(age, 1),
    perYear,
    norm,
    ratio: round(ratio, 2),
    level,
    label: labels[level],
    // A diesel that barely moves is a short-trip diesel: soot, DPF, EGR.
    shortTripRisk: target.fuel === "DIESEL" && ratio < 0.55,
  };
}

/* ------------------------------------------------------------ inspection */

export function inspectionStatus(target) {
  if (target.newInspection === true || /^neu$/i.test(cleanText(target.tuvUntil))) {
    return { available: true, status: "NEW", label: "HU neu", monthsLeft: 24 };
  }

  const months = registrationToMonths(target.tuvUntil);
  if (!Number.isFinite(months)) return { available: false, status: "UNKNOWN", label: "HU unbekannt" };

  const left = months - currentMonths();

  let status = "OK";
  if (left < 0) status = "EXPIRED";
  else if (left <= 3) status = "DUE";
  else if (left <= 8) status = "SOON";

  const labels = {
    EXPIRED: "HU abgelaufen",
    DUE: `HU fällig in ${Math.max(left, 0)} ${left === 1 ? "Monat" : "Monaten"}`,
    SOON: `HU noch ${left} Monate`,
    OK: `HU noch ${left} Monate`,
  };

  return { available: true, status, monthsLeft: left, until: target.tuvUntil, label: labels[status] };
}

/* ------------------------------------------------------------ market position */

/**
 * Theil–Sen line through price over mileage: the median of all pairwise
 * slopes. One mispriced ad cannot tilt it, which an ordinary least-squares fit
 * with a dozen points cannot promise.
 */
export function priceMileageTrend(points) {
  const usable = points.filter(
    (point) => Number.isFinite(point.km) && Number.isFinite(point.price),
  );
  if (usable.length < 5) return null;

  const kms = usable.map((point) => point.km);
  const spread = Math.max(...kms) - Math.min(...kms);
  // Twelve cars all within 8.000 km of each other say nothing about mileage.
  if (spread < 20_000) return null;

  const slopes = [];
  for (let i = 0; i < usable.length; i += 1) {
    for (let j = i + 1; j < usable.length; j += 1) {
      const dx = usable[j].km - usable[i].km;
      if (Math.abs(dx) < 2_000) continue;
      slopes.push((usable[j].price - usable[i].price) / dx);
    }
  }
  if (slopes.length < 6) return null;

  const slope = median(slopes);
  const intercept = median(usable.map((point) => point.price - slope * point.km));

  // A market where more kilometres make a car dearer is noise, not a trend.
  if (!Number.isFinite(slope) || slope >= 0) return null;

  return {
    slope,
    intercept,
    per10000Km: roundTo(-slope * 10_000, 10),
    at: (kilometres) => intercept + slope * kilometres,
    minKm: Math.min(...kms),
    maxKm: Math.max(...kms),
  };
}

export function marketPosition({ target, comparables, askingPrice }) {
  const priced = comparables.filter((entry) =>
    Number.isFinite(entry.adjustedPrice ?? entry.price),
  );

  const cheaper = Number.isFinite(askingPrice)
    ? priced.filter((entry) => (entry.adjustedPrice ?? entry.price) < askingPrice).length
    : null;

  // The chart draws raw asking prices — what the buyer would see on the
  // portal. The trend line is drawn through the same points.
  const points = priced
    .filter((entry) => Number.isFinite(entry.mileageKm) && Number.isFinite(entry.price))
    .map((entry) => ({
      km: entry.mileageKm,
      price: entry.price,
      adjusted: entry.adjustedPrice ?? null,
      title: entry.title || null,
      url: entry.listingUrl || null,
      source: entry.source || null,
      year: Number.isFinite(entry.registrationMonths)
        ? Math.floor(entry.registrationMonths / 12)
        : null,
      similarity: entry.similarityScore ?? null,
    }));

  const trend = priceMileageTrend(points);

  const expectedAtTarget =
    trend && Number.isFinite(target.mileageKm)
      ? roundTo(trend.at(target.mileageKm), 50)
      : null;

  return {
    total: priced.length,
    cheaper,
    dearer: cheaper === null ? null : priced.length - cheaper,
    // 0 = cheapest of all, 100 = dearest of all.
    percentile:
      cheaper === null || !priced.length ? null : Math.round((cheaper / priced.length) * 100),
    points,
    trend: trend
      ? {
          per10000Km: trend.per10000Km,
          // Two ends of the line, enough to draw it.
          from: { km: trend.minKm, price: Math.round(trend.at(trend.minKm)) },
          to: { km: trend.maxKm, price: Math.round(trend.at(trend.maxKm)) },
          expectedAtTarget,
          differenceToAsking:
            expectedAtTarget !== null && Number.isFinite(askingPrice)
              ? Math.round(askingPrice - expectedAtTarget)
              : null,
        }
      : null,
  };
}

/* ------------------------------------------------------------ portal's opinion */

/**
 * AutoScout24's price label categories. 0 and 6 mark prices outside its
 * rating bands and carry no label.
 */
const PORTAL_CATEGORY_LABELS = {
  1: "Top-Preis",
  2: "Guter Preis",
  3: "Fairer Preis",
  4: "Erhöhter Preis",
  5: "Hoher Preis",
};

/** Verdicts as mobile.de prints them, from buyer-friendly to dear. */
const VERDICT_TONE = {
  "top-preis": "LOW",
  "top preis": "LOW",
  "sehr guter preis": "LOW",
  "guter preis": "LOW",
  "fairer preis": "FAIR",
  "erhöhter preis": "HIGH",
  "hoher preis": "HIGH",
};

export function portalOpinion({ target, market, askingPrice }) {
  const portal = target.portalValuation;
  if (!portal) return { available: false };

  // mobile.de publishes only its verdict, no median to compare against.
  if (!Number.isFinite(portal.median)) {
    if (!portal.label) return { available: false };
    return {
      available: true,
      source: portal.source || "Portal",
      median: null,
      category: null,
      label: portal.label,
      tone: VERDICT_TONE[portal.label.toLowerCase()] || null,
      differenceToAsking: null,
      agreementPercent: null,
      agrees: null,
    };
  }

  const difference = Number.isFinite(askingPrice) ? askingPrice - portal.median : null;
  const agreement =
    Number.isFinite(market.marketValue) && portal.median > 0
      ? (market.marketValue - portal.median) / portal.median
      : null;

  return {
    available: true,
    source: portal.source || "Portal",
    median: portal.median,
    category: portal.category,
    label: PORTAL_CATEGORY_LABELS[portal.category] || portal.label || null,
    tone: VERDICT_TONE[(PORTAL_CATEGORY_LABELS[portal.category] || portal.label || "").toLowerCase()] || null,
    differenceToAsking: difference,
    // How far our own market value sits from the portal's median, in percent.
    agreementPercent: agreement === null ? null : round(agreement * 100, 1),
    agrees: agreement === null ? null : Math.abs(agreement) <= 0.08,
  };
}

/* ------------------------------------------------------------ the ad itself */

export function listingSignals(target) {
  const listedAt = target.listedAt ? new Date(target.listedAt) : null;
  const days =
    listedAt && !Number.isNaN(listedAt.getTime())
      ? Math.max(0, Math.floor((Date.now() - listedAt.getTime()) / 86_400_000))
      : null;

  const favorites = target.interest?.favorites ?? null;
  const views = target.interest?.views ?? null;

  let freshness = null;
  if (days !== null) {
    if (days <= 3) freshness = "FRESH";
    else if (days <= 30) freshness = "NORMAL";
    else if (days <= 60) freshness = "LONG";
    else freshness = "VERY_LONG";
  }

  // Saves per day is the honest measure — 40 saves after a year mean little,
  // 40 after three days mean a queue of buyers.
  const favoritesPerDay =
    Number.isFinite(favorites) && days !== null ? favorites / Math.max(days, 1) : null;

  let demand = null;
  if (favoritesPerDay !== null) {
    if (favoritesPerDay >= 5 || (days <= 7 && favorites >= 20)) demand = "HIGH";
    else if (favoritesPerDay < 0.5 && days >= 14) demand = "LOW";
    else demand = "NORMAL";
  }

  return {
    listedAt: target.listedAt || null,
    daysOnline: days,
    freshness,
    views,
    favorites,
    demand,
  };
}

/* ------------------------------------------------------------ negotiation */

/**
 * The arguments, each tied to a number the buyer can quote. Weight says how
 * much it moves the seller: 3 is a fact he cannot argue with, 1 is colour.
 */
function negotiationArguments({
  target,
  market,
  askingPrice,
  position,
  portal,
  usage,
  inspection,
  listing,
  equipment,
  history,
}) {
  const pro = [];
  const contra = [];

  if (Number.isFinite(market.marketValue) && Number.isFinite(askingPrice)) {
    const over = askingPrice - market.marketValue;
    if (over > market.marketValue * 0.03) {
      pro.push({
        weight: 3,
        text: `Angebot liegt ${euro(over)} über dem ermittelten Marktwert von ${euro(market.marketValue)}.`,
      });
    } else if (over < -market.marketValue * 0.05) {
      contra.push({
        weight: 3,
        text: `Angebot liegt bereits ${euro(-over)} unter dem Marktwert – viel Spielraum ist nicht zu erwarten.`,
      });
    }
  }

  if (position.total >= 4 && position.cheaper !== null) {
    const share = position.cheaper / position.total;
    if (share >= 0.4) {
      pro.push({
        weight: share >= 0.6 ? 3 : 2,
        text: `${position.cheaper} von ${position.total} vergleichbaren Fahrzeugen sind günstiger (auf diesen Wagen umgerechnet).`,
      });
    } else if (share <= 0.15) {
      contra.push({
        weight: 2,
        text: `Nur ${position.cheaper} von ${position.total} Vergleichsfahrzeugen sind günstiger.`,
      });
    }
  }

  // A verdict without a median still carries weight: it is the portal's own.
  if (portal.available && !Number.isFinite(portal.median) && portal.label) {
    if (portal.tone === "HIGH") {
      pro.push({
        weight: 2,
        text: `${portal.source} selbst stuft das Angebot als „${portal.label}“ ein.`,
      });
    } else if (portal.tone === "LOW") {
      contra.push({
        weight: 2,
        text: `${portal.source} stuft das Angebot als „${portal.label}“ ein – viel Spielraum ist nicht zu erwarten.`,
      });
    }
  }

  if (portal.available && Number.isFinite(portal.differenceToAsking)) {
    if (portal.differenceToAsking > portal.median * 0.03) {
      pro.push({
        weight: 3,
        text: `${portal.source} selbst sieht den Marktpreis bei ${euro(portal.median)}${portal.label ? ` und stuft das Angebot als „${portal.label}“ ein` : ""}.`,
      });
    } else if (portal.differenceToAsking < -portal.median * 0.03 && portal.label) {
      contra.push({
        weight: 2,
        text: `${portal.source} stuft das Angebot als „${portal.label}“ ein – Marktpreis dort ${euro(portal.median)}.`,
      });
    }
  }

  if (position.trend && Number.isFinite(position.trend.differenceToAsking)) {
    const gap = position.trend.differenceToAsking;
    if (gap > 300) {
      pro.push({
        weight: 2,
        text: `Bei ${km(target.mileageKm)} erwartet der Markt rund ${euro(position.trend.expectedAtTarget)} – jede 10.000 km kosten hier etwa ${euro(position.trend.per10000Km)}.`,
      });
    }
  }

  if (usage.available) {
    if (usage.level === "HIGH" || usage.level === "VERY_HIGH") {
      pro.push({
        weight: usage.level === "VERY_HIGH" ? 3 : 2,
        text: `Laufleistung überdurchschnittlich: ${km(usage.perYear)} pro Jahr (üblich ${km(usage.norm)}).`,
      });
    } else if (usage.level === "LOW" && !usage.shortTripRisk) {
      contra.push({
        weight: 1,
        text: `Wenig gefahren: ${km(usage.perYear)} pro Jahr.`,
      });
    }
    if (usage.shortTripRisk) {
      pro.push({
        weight: 2,
        text: `Diesel mit nur ${km(usage.perYear)} pro Jahr – Kurzstreckenbetrieb, Risiko für Partikelfilter und AGR.`,
      });
    }
  }

  if (inspection.available) {
    if (inspection.status === "EXPIRED" || inspection.status === "DUE") {
      pro.push({
        weight: 3,
        text: `${inspection.label} – Kosten und Mängelrisiko der neuen HU trägt der Käufer.`,
      });
    } else if (inspection.status === "NEW") {
      contra.push({ weight: 1, text: "HU ist neu." });
    }
  }

  if (listing.freshness === "LONG" || listing.freshness === "VERY_LONG") {
    pro.push({
      weight: listing.freshness === "VERY_LONG" ? 3 : 2,
      text: `Seit ${listing.daysOnline} Tagen online – der Verkäufer wartet schon länger auf einen Käufer.`,
    });
  } else if (listing.freshness === "FRESH") {
    contra.push({
      weight: 1,
      text: `Erst ${listing.daysOnline === 0 ? "heute" : `seit ${listing.daysOnline} ${listing.daysOnline === 1 ? "Tag" : "Tagen"}`} online – der Verkäufer hat noch keinen Druck.`,
    });
  }

  if (listing.demand === "HIGH") {
    contra.push({
      weight: 2,
      text: `Hohe Nachfrage: ${listing.favorites} Mal gemerkt${listing.daysOnline !== null ? ` in ${Math.max(listing.daysOnline, 1)} ${listing.daysOnline === 1 ? "Tag" : "Tagen"}` : ""}. Wer zögert, verliert den Wagen.`,
    });
  } else if (listing.demand === "LOW") {
    pro.push({
      weight: 1,
      text: `Wenig Interesse: nur ${listing.favorites} Mal gemerkt in ${listing.daysOnline} Tagen.`,
    });
  }

  if (equipment.listIsComplete && equipment.notListed.length) {
    pro.push({
      weight: equipment.notListed.includes("Navigationssystem") ? 2 : 1,
      text: `Nicht in der Ausstattung: ${equipment.notListed.slice(0, 3).join(", ")} – beim Wiederverkauf gefragt.`,
    });
  }
  if (equipment.level === "PREMIUM" || equipment.level === "HIGH") {
    contra.push({
      weight: 1,
      text: `Gute Ausstattung (${equipment.levelLabel}): ${equipment.highlights.slice(0, 4).join(", ")}.`,
    });
  }

  if (Number.isFinite(target.ownerCount) && target.ownerCount >= 3) {
    pro.push({ weight: 1, text: `${target.ownerCount} Vorbesitzer.` });
  }

  if (target.serviceHistory === "NO") {
    pro.push({ weight: 2, text: "Kein Scheckheft." });
  } else if (target.serviceHistory === "UNKNOWN") {
    pro.push({ weight: 1, text: "Scheckheft nicht belegt – Nachweise verlangen." });
  }

  if (target.condition === "REPAIRED_DAMAGE") {
    pro.push({ weight: 2, text: "Reparierter Vorschaden – mindert den Wiederverkaufswert." });
  }

  if (target.negotiable) {
    pro.push({ weight: 1, text: "Preis ist als Verhandlungsbasis (VB) angegeben." });
  }

  if (history?.priceDrop > 0) {
    pro.push({
      weight: 2,
      text: `Preis wurde seit ${history.firstSeenLabel} bereits um ${euro(history.priceDrop)} gesenkt – der Verkäufer ist beweglich.`,
    });
  }

  const byWeight = (a, b) => b.weight - a.weight;
  return { pro: pro.sort(byWeight), contra: contra.sort(byWeight) };
}

function stanceFrom({ pro, contra }) {
  const score =
    pro.reduce((sum, entry) => sum + entry.weight, 0) -
    contra.reduce((sum, entry) => sum + entry.weight, 0);

  if (score >= 5) return "FIRM";
  if (score <= -2) return "SOFT";
  return "NORMAL";
}

/* ------------------------------------------------------------ inspection checklist */

/**
 * What to look at on site, built from this car's data. Every item says why
 * it is on the list, so the buyer can tell a rule from a real concern.
 */
export function inspectionChecklist({ target, usage, inspection, equipment }) {
  const items = [];
  const add = (area, text, why) => items.push({ area, text, why });

  const text = `${target.title || ""} ${target.variant || ""}`.toLowerCase();
  const ids = new Set(equipment.items.map((item) => item.id));
  const kmValue = target.mileageKm;
  const age = usage.available ? usage.ageYears : null;
  const registrationYear = Number.isFinite(target.registrationMonths)
    ? Math.floor(target.registrationMonths / 12)
    : null;

  /* papers first — nothing else matters if these are wrong */
  add("Papiere", "Fahrgestellnummer an Fahrzeug, ZB I und ZB II abgleichen", "Pflicht bei jedem Ankauf");
  if (target.serviceHistory !== "YES") {
    add("Papiere", "Serviceheft und Rechnungen einsehen", "Scheckheft ist in der Anzeige nicht belegt");
  }
  if (target.condition === "UNKNOWN") {
    add("Papiere", "Unfallfreiheit schriftlich im Kaufvertrag bestätigen lassen", "Anzeige macht keine Angabe zum Unfallstatus");
  }
  if (Number.isFinite(target.ownerCount) && target.ownerCount >= 3) {
    add("Papiere", "Nach dem Grund für die vielen Halterwechsel fragen", `${target.ownerCount} Vorbesitzer`);
  }
  if (target.sellerType === "PRIVATE") {
    add("Papiere", "Mängel im Kaufvertrag protokollieren (Privatverkauf ohne Gewährleistung)", "Privatanbieter");
  }

  /* engine and drivetrain */
  if (target.fuel === "DIESEL") {
    add("Motor", "Partikelfilter/AGR: Kontrollleuchten, Leistung bei Volllast, Rauch", "Diesel");
    if (registrationYear && registrationYear >= 2016) {
      add("Motor", "AdBlue-System: keine Warnmeldung, Restreichweite", "Diesel ab Euro 6");
    }
    if (usage.shortTripRisk) {
      add("Motor", "Regenerationsverhalten des Partikelfilters erfragen, Fehlerspeicher auslesen", `nur ${km(usage.perYear)} pro Jahr`);
    }
  }
  if (target.fuel === "ELECTRIC" || target.fuel === "PLUGIN_HYBRID" || target.fuel === "HYBRID") {
    add("Antrieb", "Batteriezustand (SoH) als Zertifikat verlangen", "elektrifizierter Antrieb");
    if (target.fuel !== "HYBRID") {
      add("Antrieb", "Laden testen: Ladebuchse, Ladekabel vorhanden", "Stecker-Fahrzeug");
    }
  }
  if (Number.isFinite(kmValue) && kmValue >= 100_000) {
    add(
      "Motor",
      target.lastBeltService
        ? `Zahnriemen/Steuertrieb: letzter Wechsel ${target.lastBeltService} – Nachweis prüfen`
        : "Zahnriemen- bzw. Steuerkettenwechsel nachweisen lassen",
      `${km(kmValue)}`,
    );
  }
  if (target.gearbox === "AUTOMATIC" || /(dsg|s tronic|s-tronic|edc|powershift)/.test(text)) {
    add("Antrieb", "Getriebe: ruckfreies Schalten, Anfahren am Berg, kein Rutschen", "Automatik");
    if (/(dsg|s tronic|s-tronic)/.test(text) && Number.isFinite(kmValue) && kmValue >= 55_000) {
      add("Antrieb", "DSG-Ölwechsel (alle 60.000 km) nachweisen", "Doppelkupplung, über 55.000 km");
    }
  }
  if (target.gearbox === "MANUAL" && Number.isFinite(kmValue) && kmValue >= 120_000) {
    add("Antrieb", "Kupplung und Zweimassenschwungrad: Rupfen, Klappern im Leerlauf", `Schaltwagen, ${km(kmValue)}`);
  }
  if (ids.has("AWD")) {
    add("Antrieb", "Reifen gleichmäßig abgefahren, gleiche Marke rundum", "Allrad – ungleiche Reifen belasten das Verteilergetriebe");
  }

  /* body and chassis */
  if (Number.isFinite(age) && age >= 8) {
    add("Karosserie", "Unterboden, Schweller und Radläufe auf Rost; Bremsleitungen", `${Math.floor(age)} Jahre alt`);
  }
  if (target.condition === "REPAIRED_DAMAGE" || target.damageNote) {
    add("Karosserie", "Lackschichtdicke messen, Spaltmaße, Reparaturnachweis verlangen", target.damageNote || "Vorschaden angegeben");
  } else {
    add("Karosserie", "Lackschichtdicke an Türen, Kotflügeln und Hauben messen", "Unfallfreiheit überprüfen");
  }
  if (Number.isFinite(kmValue) && kmValue >= 150_000) {
    add("Fahrwerk", "Fahrwerk: Buchsen, Koppelstangen, Stoßdämpfer auf Geräusche", `${km(kmValue)}`);
  }
  if (inspection.status === "EXPIRED" || inspection.status === "DUE") {
    add("Karosserie", "Vor dem Kauf auf HU-relevante Mängel prüfen lassen", inspection.label);
  }

  /* equipment that fails expensively */
  if (ids.has("PANORAMA") || ids.has("SUNROOF")) {
    add("Ausstattung", "Dach: Wasserabläufe frei, Dichtungen, Himmel ohne Wasserflecken", "Glas-/Schiebedach");
  }
  if (ids.has("TOW_BAR")) {
    add("Ausstattung", "AHK: Mechanik und Steckdose; Anhängerbetrieb erfragen", "Anhängerkupplung – Zugbetrieb belastet Kupplung und Getriebe");
  }
  if (ids.has("AUX_HEATER")) {
    add("Ausstattung", "Standheizung einmal laufen lassen", "Standheizung – Reparatur teuer");
  }
  if (ids.has("AIR_SUSPENSION")) {
    add("Ausstattung", "Luftfederung: steht der Wagen morgens gerade? Kompressor-Geräusche", "Luftfederung – Reparatur teuer");
  }
  if (ids.has("CAMERA") || ids.has("CAMERA_360") || ids.has("PARKING_SENSORS")) {
    add("Ausstattung", "Kamera und Parksensoren beim Rangieren testen", "Assistenzsysteme");
  }
  if (ids.has("NAVIGATION")) {
    add("Ausstattung", "Navigation starten, Kartenstand und Display prüfen", "Navigationssystem");
  }
  if (ids.has("LEATHER") || ids.has("PART_LEATHER")) {
    add("Ausstattung", "Sitzwangen und Nähte auf Verschleiß", "Leder – Aufbereitung kostet");
  }

  /* always: the test drive */
  add("Probefahrt", "Kaltstart, Bremsen, Lenkung geradeaus, alle Warnleuchten aus", "Pflicht bei jedem Ankauf");

  return items;
}

/* ------------------------------------------------------------ price history */

/**
 * @param {Array<{price:number, observedAt:string}>} observations  oldest first
 * @param {number} currentPrice
 */
export function priceHistory(observations, currentPrice) {
  const usable = (observations || []).filter(
    (entry) => Number.isFinite(entry.price) && entry.observedAt,
  );
  if (!usable.length || !Number.isFinite(currentPrice)) return null;

  const first = usable[0];
  const highest = Math.max(...usable.map((entry) => entry.price), currentPrice);
  const drop = highest - currentPrice;

  return {
    points: usable.map((entry) => ({ price: entry.price, observedAt: entry.observedAt })),
    firstSeen: first.observedAt,
    firstSeenLabel: new Date(first.observedAt).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    firstPrice: first.price,
    highestPrice: highest,
    priceDrop: drop > 0 ? drop : 0,
    changed: usable.some((entry) => entry.price !== currentPrice),
  };
}

/* ------------------------------------------------------------ all together */

/**
 * @param {object} input
 * @param {object} input.target
 * @param {object} input.market       computeMarketValue result
 * @param {object[]} input.comparables the comparables actually used
 * @param {object} input.dealerCase   computeDealerCase result
 * @param {object[]} [input.observations] earlier price observations of this ad
 */
export function buildInsights({ target, market, comparables, dealerCase, observations = [] }) {
  const askingPrice = Number.isFinite(dealerCase?.askingPrice)
    ? dealerCase.askingPrice
    : target.price;

  const equipment = analyzeEquipment(target);
  const usage = usageProfile(target);
  const inspection = inspectionStatus(target);
  const position = marketPosition({ target, comparables, askingPrice });
  const portal = portalOpinion({ target, market, askingPrice });
  const listing = listingSignals(target);
  const history = priceHistory(observations, target.price);

  const argumentsFound = negotiationArguments({
    target,
    market,
    askingPrice,
    position,
    portal,
    usage,
    inspection,
    listing,
    equipment,
    history,
  });

  const stance = stanceFrom(argumentsFound);

  return {
    equipment,
    usage,
    inspection,
    position,
    portal,
    listing,
    history,
    negotiation: {
      stance,
      arguments: argumentsFound.pro.slice(0, 8),
      counterArguments: argumentsFound.contra.slice(0, 5),
      // Server-side plan for the saved record and the summary. The page
      // recomputes it live from the current limit with the same function.
      plan: dealerCase?.available
        ? negotiationPlan({
            limit: dealerCase.maximumPurchasePrice,
            askingPrice,
            stance,
          })
        : null,
    },
    checklist: inspectionChecklist({ target, usage, inspection, equipment }),
    photos: target.images || [],
  };
}
