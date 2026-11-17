/** Modellwissen zuordnen. Ein Treffer ist ein Prüfhinweis, keine Fahrzeugdiagnose. */
import { MODEL_KNOWLEDGE } from "./knowledge/models.js";
import { makeName } from "./search.js";
import { norm } from "./text.js";

/** Nur Fahrzeugbezeichnung verwenden: Freitext kann andere Motoren erwähnen. */
export function vehicleIdentity(subject) {
  return norm(`${subject.model || ""} ${subject.variant || ""} ${subject.title || ""}`);
}

/** Zusätzliche Motor-/Getriebekennung und Ausschlüsse aus der Wissenstabelle. */
export function matchesIdentity(entry, identity) {
  return (!entry.model || new RegExp(entry.model).test(identity)) &&
    (!entry.identity || new RegExp(entry.identity).test(identity)) &&
    (!entry.exclude || !new RegExp(entry.exclude).test(identity));
}

export function modelHints(subject) {
  if (!subject || !Number.isFinite(subject.regMonths)) return [];
  const make = makeName(subject.make);
  const year = Math.floor(subject.regMonths / 12);
  const identity = vehicleIdentity(subject);
  const within = (range, value) => !range || (Number.isFinite(value) && value >= range[0] && value <= range[1]);
  return MODEL_KNOWLEDGE.filter((entry) =>
    entry.makes.includes(make) &&
    (!entry.fuel || entry.fuel === subject.fuel) &&
    (!entry.gearbox || entry.gearbox === subject.gearbox) &&
    within(entry.years, year) && within(entry.ccm, subject.ccm) && within(entry.ps, subject.powerPs) &&
    matchesIdentity(entry, identity));
}
