/**
 * How comparable is a candidate to the target car?
 *
 * Two stages: a hard gate that throws out anything that is not the same car
 * in the same condition class, then a 0–100 score that drives both the
 * ranking and the weight each comparable gets in the market price.
 */

import { POLICY } from "./config";
import { clamp, normalizeText, round, textMatches, tokenSimilarity } from "./utils";

/** Component weights — they add up to 100. */
const WEIGHTS = {
  identity: 18,
  age: 22,
  mileage: 22,
  power: 14,
  fuel: 10,
  gearbox: 9,
  body: 5,
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
export function rejectionReason(candidate, target) {
  if (!candidate.price || candidate.price < 300 || candidate.price > 1_000_000) {
    return "Kein plausibler Fahrzeugpreis.";
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
    candidate.fuel !== "UNKNOWN" &&
    target.fuel !== "UNKNOWN" &&
    candidate.fuel !== target.fuel
  ) {
    return `Andere Kraftstoffart (${candidate.fuel}).`;
  }

  // A wrecked car is not a price reference for a driveable one.
  if (candidate.condition === "DAMAGED" && target.condition !== "DAMAGED") {
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

  if (
    candidate.variant &&
    target.variant &&
    tokenSimilarity(candidate.variant, target.variant) < 0.35
  ) {
    differences.push(`Ausstattung: ${candidate.variant}`);
  }

  points += WEIGHTS.age * ageComponent(candidate, target, differences);
  points += WEIGHTS.mileage * mileageComponent(candidate, target, differences);
  points += WEIGHTS.power * powerComponent(candidate, target, differences);

  if (candidate.fuel === "UNKNOWN" || target.fuel === "UNKNOWN") {
    points += WEIGHTS.fuel * UNKNOWN_CREDIT;
  } else {
    points += WEIGHTS.fuel * (candidate.fuel === target.fuel ? 1 : 0);
  }

  if (candidate.gearbox === "UNKNOWN" || target.gearbox === "UNKNOWN") {
    points += WEIGHTS.gearbox * UNKNOWN_CREDIT;
  } else if (candidate.gearbox === target.gearbox) {
    points += WEIGHTS.gearbox;
  } else {
    differences.push(`Getriebe: ${candidate.gearbox === "MANUAL" ? "Schalt" : "Automatik"}`);
  }

  if (candidate.bodyType && target.bodyType) {
    points += WEIGHTS.body * (textMatches(candidate.bodyType, target.bodyType) ? 1 : 0.3);
  } else {
    points += WEIGHTS.body * UNKNOWN_CREDIT;
  }

  const score = clamp(Math.round(points), 0, 100);

  // Weight rewards similarity steeply and penalises thin data.
  let weight = (score / 100) ** 2.2 * 100;
  if (!Number.isFinite(candidate.mileageKm)) weight *= 0.6;
  if (!Number.isFinite(candidate.registrationMonths)) weight *= 0.6;
  if (candidate.sellerType === "UNKNOWN") weight *= 0.92;
  if (candidate.sourceLevel === "PRIVATE") weight *= 0.75;

  return {
    score,
    differences: differences.slice(0, 5),
    weight: round(Math.max(1, weight), 2),
  };
}

/**
 * Applies the similarity ladder: start strict, relax only as far as needed to
 * reach a usable sample. Returns the accepted set plus the threshold used.
 */
export function selectComparables(scored) {
  const ladder = POLICY.similarityLadder;

  for (const threshold of ladder) {
    const accepted = scored.filter((entry) => entry.similarityScore >= threshold);
    if (accepted.length >= POLICY.minComparablesForHighConfidence) {
      return { accepted, threshold };
    }
  }

  const lowest = ladder[ladder.length - 1];
  return {
    accepted: scored.filter((entry) => entry.similarityScore >= lowest),
    threshold: lowest,
  };
}
