/** Marktanalyse – Ausstattungslinie aus dem Titel lesen. Rein, ohne Netzwerk und Datenbank. */

import { TRIMS, TRIM_LABEL, TRIM_LEVELS, TRIM_RANK } from "./knowledge/trims.js";
import { makeName } from "./search.js";
import { norm } from "./text.js";

const pattern = (name) => {
  const words = norm(name).split(/[ -]+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![a-z0-9])${words.join("[ -]?")}(?![a-z0-9+])`);
};

const INDEX = Object.fromEntries(Object.entries(TRIMS).map(([make, levels]) => [
  make,
  TRIM_LEVELS.flatMap((level) => (levels[level] || [])
    // längere Namen zuerst: "OPC Line" vor "OPC", "Comfort+" vor "Comfort"
    .slice().sort((a, b) => b.length - a.length)
    .map((name) => ({ level, name, regex: name.endsWith("+") ? new RegExp(`(?<![a-z0-9])${norm(name).replace("+", "\\+")}`) : pattern(name) }))),
]));

/** Beispiele für die Frage an den Verkäufer, passend zur Marke: "Pure, Select, Style" (Basis → Top). */
export function trimExamples(make) {
  const levels = TRIMS[makeName(make)];
  const names = levels ? ["base", "mid", "top"].map((level) => levels[level]?.[0]).filter(Boolean) : [];
  return names.length >= 2 ? names.join(", ") : null;
}

/**
 * @returns { name, level, rank, label } oder null, wenn der Titel keine bekannte Linie nennt.
 */
export function trimOf(make, text) {
  const entries = INDEX[makeName(make)];
  if (!entries) return null;
  const title = norm(text);
  for (const level of TRIM_LEVELS) {
    const hit = entries.find((entry) => entry.level === level && entry.regex.test(title));
    if (hit) return { name: hit.name, level, rank: TRIM_RANK[level], label: `${hit.name} (${TRIM_LABEL[level]})` };
  }
  return null;
}
