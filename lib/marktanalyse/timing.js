/** Marktanalyse – Zahnriemen oder Steuerkette für ein Fahrzeug bestimmen. Rein, ohne Netzwerk und Datenbank. */

import { DRIVE_LABEL, TIMING } from "./knowledge/timing.js";
import { makeName } from "./search.js";
import { norm, nowMonths } from "./text.js";

const overlap = (a, b) => a[0] <= b[1] && b[0] <= a[1];

/** Hubraum als Bereich: genau aus dem Portal oder grob aus dem Titel ("1.6 TDI" → 1540–1650). */
function displacement(subject) {
  if (Number.isFinite(subject.ccm) && subject.ccm > 400) return { range: [subject.ccm, subject.ccm], exact: true };
  const litres = norm(`${subject.title || ""} ${subject.variant || ""}`).match(/(?<![0-9.,])([0-6])[.,]([0-9])(?![0-9.,])(?! ?(l\/|l |liter|ltr|zoll|"))/);
  if (!litres) return null;
  const ccm = Number(litres[1]) * 1000 + Number(litres[2]) * 100;
  if (ccm < 600) return null;
  return { range: [ccm - 60, ccm + 50], exact: false };
}

const intervalText = (entry) => [entry.km ? `${entry.km.toLocaleString("de-DE")} km` : null, entry.years ? `${entry.years} Jahre` : null].filter(Boolean).join(" oder ");

/** Liegt der Wert kurz vor oder kurz nach einem fälligen Wechsel? "due" | "past" | null */
function phase(value, interval) {
  if (!interval || !Number.isFinite(value)) return null;
  const ratio = value / interval;
  if (ratio < 0.9) return null;
  const part = ratio - Math.floor(ratio);
  return part >= 0.9 || (ratio >= 1 && part < 0.35) ? "due" : "past";
}

/**
 * @returns null, wenn der Motor nicht in der Tabelle steht, sonst
 *   { drive: belt|wet|chain|unclear, label, engine, sure, km, years, interval, state, fact }
 *   state  "cost"  Wechsel fällig und Angaben sicher → Kosten einrechnen
 *          "ask"   Wechsel möglicherweise fällig oder Angaben unsicher → nur fragen
 *          null    nichts zu tun
 */
export function timingOf(subject, { now = new Date() } = {}) {
  if (!["PETROL", "DIESEL"].includes(subject?.fuel) || !Number.isFinite(subject?.regMonths)) return null;
  const make = makeName(subject.make);
  const year = Math.floor(subject.regMonths / 12);
  const size = displacement(subject);
  const ps = subject.powerPs;

  let matches = TIMING.filter((entry) =>
    entry.makes.includes(make) &&
    (!entry.fuel || entry.fuel === subject.fuel) &&
    year >= entry.years[0] && year <= entry.years[1] &&
    (!entry.ccm || (size && overlap(entry.ccm, size.range))) &&
    (!entry.ps || (Number.isFinite(ps) && ps >= entry.ps[0] && ps <= entry.ps[1])));
  if (matches.some((entry) => entry.ccm)) matches = matches.filter((entry) => entry.ccm);
  if (!matches.length) return null;

  const ageYears = Math.max(0, (nowMonths(now) - subject.regMonths) / 12);
  const km = subject.mileageKm;
  const old = (Number.isFinite(km) && km >= 90000) || ageYears >= 6;

  const drives = [...new Set(matches.map((entry) => entry.drive))];
  if (drives.length > 1) {
    const options = matches.map((entry) => `${entry.name}: ${DRIVE_LABEL[entry.drive]}`).join(" / ");
    return { drive: "unclear", label: "Zahnriemen oder Steuerkette unklar", engine: options, sure: false, state: old && drives.some((d) => d !== "chain") ? "ask" : null, fact: "unklar – je nach Motorversion" };
  }

  const drive = drives[0];
  // mehrere Zeilen mit gleichem Antrieb: die mit dem kürzesten Intervall, aber dann nur als Richtwert
  const entry = matches.slice().sort((a, b) => (a.km || Infinity) - (b.km || Infinity))[0];
  const sure = (size?.exact || !entry.ccm) && !entry.unsure && matches.length === 1;
  const base = { drive, label: DRIVE_LABEL[drive], engine: entry.name, sure, km: entry.km || null };
  if (drive === "chain") return { ...base, state: null, fact: `Steuerkette${sure ? "" : " (nicht sicher)"}` };

  const interval = intervalText({ km: entry.km, years: entry.interval });
  const phases = [phase(km, entry.km), phase(ageYears, entry.interval)];
  const due = phases.includes("due");
  const past = phases.includes("past");
  let state = null;
  if (due) state = sure && !entry.est ? "cost" : "ask";
  else if (past || (!interval && old)) state = "ask";
  return {
    ...base, years: entry.interval || null, interval: interval || null, due, state,
    fact: `${DRIVE_LABEL[drive]}${interval ? ` – Wechsel etwa alle ${interval}` : ""}${sure ? "" : " (nicht sicher)"}`,
  };
}
