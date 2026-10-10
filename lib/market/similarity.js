/**
 * How comparable is a candidate to the target car?
 *
 * Two stages: a hard gate that throws out anything that is not the same car
 * in the same condition class, then a 0–100 score that drives both the
 * ranking and the weight each comparable gets in the market price.
 */

import { generationMismatch } from "./generations";
import { POLICY } from "./config";
import { compareTrim } from "./trim";
import { clamp, isPrivateSeller, normalizeText, round, textMatches, tokenSimilarity } from "./utils";

/**
 * Component weights — they add up to 100. Year and km dominate the price;
 * the Ausstattungslinie (Trendline vs. Highline …) and the body (Kombi,
 * Cabrio …) come right after.
 */
const WEIGHTS = {
  identity: 8,
  trim: 12,
  age: 22,
  mileage: 22,
  power: 12,
  fuel: 8,
  gearbox: 8,
  body: 8,
};

/** Credit given when a value is missing: enough to stay usable, not to win. */
const UNKNOWN_CREDIT = 0.55;

function identityText(vehicle) {
  return [vehicle.make, vehicle.model, vehicle.variant, vehicle.title]
    .filter(Boolean)
    .join(" ");
}

/**
 * Anything that makes a candidate unusable, in German, or null when it passes.
 */
/**
 * The same car, listed again (often on a second portal): same first
 * registration, practically the same km and price, same place. It must not
 * count as its own comparison.
 */
export function isSameVehicle(candidate, target) {
  if (
    !Number.isFinite(candidate.registrationMonths) ||
    candidate.registrationMonths !== target.registrationMonths ||
    !Number.isFinite(candidate.mileageKm) ||
    !Number.isFinite(target.mileageKm)
  ) {
    return false;
  }
  const kmGap = Math.abs(candidate.mileageKm - target.mileageKm);
  const postcode = (vehicle) => (String(vehicle.location || "").match(/\b\d{5}\b/) || [])[0] || null;
  const a = postcode(candidate);
  const b = postcode(target);
  const priceGap =
    Number.isFinite(candidate.price) && Number.isFinite(target.price)
      ? Math.abs(candidate.price - target.price) / Math.max(target.price, 1)
      : null;

  if (a && b) {
    // Same place: km within 1 % and price within 5 % (sellers adjust a little).
    return a === b && kmGap <= Math.max(300, target.mileageKm * 0.01) && (priceGap === null || priceGap <= 0.05);
  }
  // Place unknown on one side: only when km and price match almost exactly.
  return kmGap <= Math.max(100, target.mileageKm * 0.003) && priceGap !== null && priceGap <= 0.01;
}

export function rejectionReason(candidate, target, generations = null) {
  if (!candidate.price || candidate.price < 300 || candidate.price > 1_000_000) {
    return "Kein plausibler Fahrzeugpreis.";
  }

  if (isSameVehicle(candidate, target)) {
    return "Gleiches Fahrzeug wie die geprüfte Anzeige (anderes Inserat/Portal).";
  }

  if (target.make && candidate.make && !textMatches(candidate.make, target.make)) {
    return `Andere Marke (${candidate.make}).`;
  }

  if (target.model && candidate.model && !textMatches(candidate.model, target.model)) {
    // Portals spell models differently ("Golf" / "Golf VII"), so before
    // rejecting we check the model names themselves and the candidate title.
    // The comparison deliberately ignores the trim line: a Passat and a Golf
    // can both be a "1.5 TSI Life" and must still not be comparable.
    const modelOverlap = tokenSimilarity(candidate.model, target.model);
    const titleCarriesModel = Boolean(
      candidate.title &&
        normalizeText(candidate.title).includes(normalizeText(target.model)),
    );

    if (modelOverlap < 0.5 && !titleCarriesModel) {
      return `Anderes Modell (${candidate.model}).`;
    }
  }

  // Same model name, different generation (Marktwissen S01).
  const otherGeneration = generationMismatch(generations, candidate, target);
  if (otherGeneration) return otherGeneration;

  if (
    Number.isFinite(candidate.registrationMonths) &&
    Number.isFinite(target.registrationMonths)
  ) {
    const gap = Math.abs(candidate.registrationMonths - target.registrationMonths);
    if (gap > POLICY.maxAgeGapMonths) {
      return `Erstzulassung weicht um ${Math.round(gap / 12)} Jahre ab.`;
    }
  }

  if (Number.isFinite(candidate.mileageKm) && Number.isFinite(target.mileageKm)) {
    const gap = Math.abs(candidate.mileageKm - target.mileageKm);
    if (gap > POLICY.maxMileageGapKm) {
      return `Kilometerstand weicht um ${Math.round(gap / 1_000)}.000 km ab.`;
    }
  }

  if (
    Number.isFinite(candidate.powerKw) &&
    Number.isFinite(target.powerKw) &&
    target.powerKw > 0
  ) {
    const deviation = Math.abs(candidate.powerKw - target.powerKw) / target.powerKw;
    if (deviation > POLICY.maxPowerGapPercent) {
      return `Motorisierung weicht deutlich ab (${candidate.powerPs} PS).`;
    }
  }

  if (
    candidate.fuel && candidate.fuel !== "UNKNOWN" &&
    target.fuel && target.fuel !== "UNKNOWN" &&
    candidate.fuel !== target.fuel
  ) {
    return `Andere Kraftstoffart (${candidate.fuel}).`;
  }

  if (candidate.gearbox && target.gearbox && candidate.gearbox !== "UNKNOWN" &&
      target.gearbox !== "UNKNOWN" && candidate.gearbox !== target.gearbox) {
    return "Andere Getriebeart – kein direkter Preisvergleich.";
  }

  // GTI vs. normal Golf, cabrio vs. closed car: not the same car.
  const trim = compareTrim(candidate, target);
  if (trim.reject) return trim.reject;

  // A damaged car is valued as it will be sold: repaired. Intact cars are the
  // reference, the repair is a cost in the calculation. A damaged comparable
  // is never a reference — its damage is unknown.
  if (candidate.condition === "DAMAGED") {
    return "Unfall-/Defektfahrzeug – kein Preisvergleich.";
  }

  return null;
}

function ageComponent(candidate, target, differences) {
  if (
    !Number.isFinite(candidate.registrationMonths) ||
    !Number.isFinite(target.registrationMonths)
  ) {
    differences.push("Erstzulassung unbekannt");
    return UNKNOWN_CREDIT;
  }

  const gap = Math.abs(candidate.registrationMonths - target.registrationMonths);
  if (gap > 6) {
    const years = round(gap / 12, 1);
    differences.push(
      candidate.registrationMonths > target.registrationMonths
        ? `${years} Jahre jünger`
        : `${years} Jahre älter`,
    );
  }

  // 0 months -> 1.0, 42 months -> 0.
  return clamp(1 - gap / POLICY.maxAgeGapMonths, 0, 1);
}

function mileageComponent(candidate, target, differences) {
  if (!Number.isFinite(candidate.mileageKm) || !Number.isFinite(target.mileageKm)) {
    differences.push("Kilometerstand unbekannt");
    return UNKNOWN_CREDIT;
  }

  const gap = Math.abs(candidate.mileageKm - target.mileageKm);
  if (gap > 10_000) {
    differences.push(
      `${Math.round(gap / 1_000)}.000 km ${
        candidate.mileageKm > target.mileageKm ? "mehr" : "weniger"
      }`,
    );
  }

  return clamp(1 - gap / POLICY.maxMileageGapKm, 0, 1);
}

function powerComponent(candidate, target, differences) {
  if (!Number.isFinite(candidate.powerPs) || !Number.isFinite(target.powerPs)) {
    return UNKNOWN_CREDIT;
  }

  const gap = Math.abs(candidate.powerPs - target.powerPs);
  if (gap > 8) differences.push(`${gap} PS Unterschied`);

  const relative = target.powerPs > 0 ? gap / target.powerPs : 1;
  return clamp(1 - relative / POLICY.maxPowerGapPercent, 0, 1);
}

/**
 * @returns {{score:number,differences:string[],weight:number}}
 */
export function scoreComparable(candidate, target) {
  const differences = [];
  let points = 0;

  const identity = tokenSimilarity(identityText(candidate), identityText(target));
  points += WEIGHTS.identity * clamp(identity * 1.4, 0, 1);

  const trim = compareTrim(candidate, target);
  points += WEIGHTS.trim * (trim.trimScore ?? 0.7);
  for (const note of trim.notes || []) if (note) differences.push(note);

  points += WEIGHTS.age * ageComponent(candidate, target, differences);
  points += WEIGHTS.mileage * mileageComponent(candidate, target, differences);
  points += WEIGHTS.power * powerComponent(candidate, target, differences);

  if (!candidate.fuel || !target.fuel || candidate.fuel === "UNKNOWN" || target.fuel === "UNKNOWN") {
    points += WEIGHTS.fuel * UNKNOWN_CREDIT;
  } else {
    points += WEIGHTS.fuel * (candidate.fuel === target.fuel ? 1 : 0);
  }

  if (!candidate.gearbox || !target.gearbox || candidate.gearbox === "UNKNOWN" || target.gearbox === "UNKNOWN") {
    points += WEIGHTS.gearbox * UNKNOWN_CREDIT;
  } else if (candidate.gearbox === target.gearbox) {
    points += WEIGHTS.gearbox;
  } else {
    differences.push(`Getriebe: ${candidate.gearbox === "MANUAL" ? "Schalt" : "Automatik"}`);
  }

  points += WEIGHTS.body * (trim.bodyScore ?? UNKNOWN_CREDIT);

  const score = clamp(Math.round(points), 0, 100);

  // Weight rewards similarity steeply and penalises thin data.
  let weight = (score / 100) ** 2.2 * 100;
  if (!Number.isFinite(candidate.mileageKm)) weight *= 0.6;
  if (!Number.isFinite(candidate.registrationMonths)) weight *= 0.6;
  if (candidate.sellerType === "UNKNOWN") weight *= 0.92;
  if (isPrivateSeller(candidate)) weight *= 0.75;

  return {
    score,
    differences: differences.slice(0, 5),
    weight: round(Math.max(1, weight), 2),
    trim: trim.candidateTrim ? trim.candidateTrim.name : null,
  };
}

/**
 * Applies the similarity ladder: start strict, relax only as far as needed to
 * reach a usable sample. Returns the accepted set plus the threshold used.
 */
export function selectComparables(scored) {
  const ladder = POLICY.similarityLadder;

  // Closest first, and never more than the cap: with plenty of close
  // matches, the far ones only add noise.
  const closest = (list) =>
    [...list].sort((a, b) => b.similarityScore - a.similarityScore).slice(0, POLICY.maxComparablesForValue);

  for (const threshold of ladder) {
    const accepted = scored.filter((entry) => entry.similarityScore >= threshold);
    if (accepted.length >= POLICY.minComparablesForHighConfidence) {
      return { accepted: closest(accepted), threshold };
    }
  }

  const lowest = ladder[ladder.length - 1];
  return {
    accepted: closest(scored.filter((entry) => entry.similarityScore >= lowest)),
    threshold: lowest,
  };
}
