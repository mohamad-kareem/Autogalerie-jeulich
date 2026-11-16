/**
 * Marktanalyse – Zustand aus der Anzeige lesen.
 *
 * Der Anzeigentext wird Satz für Satz mit dem Wörterbuch verglichen.
 * Verneinungen ("kein Rost", "unfallfrei") und erledigte Arbeiten
 * ("Kupplung neu") werden erkannt. Was nach Mangel klingt, aber nicht
 * eingeordnet werden kann, kommt unter "Unbekannte Hinweise".
 */

import { BODY_PARTS, DICTIONARY, SIGNAL_WORDS } from "./knowledge/dictionary.js";
import { PRICE_LIST } from "./knowledge/defaults.js";
import { norm, nowMonths, regMonths } from "./text.js";

// Verneinung direkt vor der Fundstelle: "keine Kratzer oder Dellen", "nicht undicht".
const NEGATION_NEAR = /(?<![a-z])(kein|keine|keinen|keiner|keinerlei|ohne|weder|frei von|null)( [a-z0-9.\-/]+){0,2} ?$/;
const NEGATION_DIRECT = /(?<![a-z])(nicht|nie|niemals)( [a-z0-9]+){0,1} ?$/;
const CLAUSE_BREAK = /[,;:]| aber | jedoch | allerdings | sondern | ausser | bis auf | dafuer /;
const DONE = /(?<![a-z])(neu|neue|neuer|neuen|neues|erneuert|gewechselt|gemacht|ersetzt|getauscht|ueberholt|repariert|instandgesetzt|instand gesetzt|behoben|erledigt|frisch|durchgefuehrt)(?![a-z])/;
const NEEDED = /(?<![a-z])(muss|muesste|muessen|muessten|sollte|sollten|faellig|ueberfaellig|noetig|notwendig|erforderlich|steht an|stehen an|demnaechst|bald|defekt|kaputt|verschlissen)(?![a-z])/;

const compile = (source) => new RegExp(`(?<![a-z])(?:${source})`, "g");
const COMPILED = DICTIONARY.map((entry) => ({
  ...entry,
  regex: entry.patterns.map(compile),
  mentionRegex: (entry.mention || []).map((m) => compile(`${m}(?![a-z])`)),
}));
const LABEL = Object.fromEntries(PRICE_LIST.map((item) => [item.key, item.label]));
const PORTAL_STATUS_LABELS = new Set(["gebrauchtfahrzeug", "neufahrzeug", "beschaedigt", "unbeschaedigt", "unfallfrei"]);

/** Sätze der Anzeige: Original und normalisiert. */
export function sentences(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .split(/\n+|(?<=[.!?])\s+|\s[•*✔✅➤►–-]\s|\s{3,}/)
    .map((raw) => raw.trim())
    .filter((raw) => raw.length >= 3)
    .slice(0, 400)
    .map((raw) => ({ raw: raw.slice(0, 240), text: norm(raw) }))
    .filter((sentence) => sentence.text.length >= 3);
}

/** Steht direkt vor der Fundstelle eine Verneinung (im selben Satzteil)? */
function negated(text, index, length) {
  const after = text.slice(index + length, index + length + 6);
  if (/^ ?frei(?![a-z])/.test(after) || /^(frei|los)(?![a-z])/.test(text.slice(index + length))) return true;
  const before = text.slice(Math.max(0, index - 40), index);
  const breakAt = Math.max(...[...before.matchAll(new RegExp(CLAUSE_BREAK, "g"))].map((m) => m.index), -1);
  const clause = before.slice(breakAt + 1);
  return NEGATION_NEAR.test(clause) || NEGATION_DIRECT.test(clause);
}

function countParts(text) {
  const found = new Set();
  for (const part of BODY_PARTS) {
    if (new RegExp(`(?<![a-z])${part}`).test(text)) found.add(part.split(" ")[0].replace(/^(fahrer|beifahrer)/, ""));
  }
  const number = text.match(/(?<![a-z0-9])([2-6]|zwei|drei|vier) (kleine |leichte )?(dellen|kratzer|beulen|stellen|teile|rostst)/);
  const counted = number ? ({ zwei: 2, drei: 3, vier: 4 }[number[1]] || Number(number[1])) : 0;
  return Math.max(1, Math.min(6, Math.max(found.size, counted)));
}

/** Schäden von außen: im Bericht genannt, aber ohne Preis. */
const OUTSIDE = new Set(["unfall", "unfallLeicht", "lack", "delle", "hagel", "rost", "scheibe", "stossstange", "totalschaden"]);

/**
 * @param subject  das analysierte Fahrzeug
 * @param prices   Preisliste des Händlers { key: euro }
 * @returns { findings[], positives[], unknown[], costs[], costTotal, killer, serious }
 */
export function readCondition(subject, prices, { now = new Date() } = {}) {
  const findings = new Map();
  const positives = new Map();
  const unknown = [];
  const list = sentences(`${subject.title || ""}\n${subject.conditionText || ""}\n${subject.description || ""}`);
  let portalDamageAccidentFree = false;

  const add = (entry, sentence, qty) => {
    const previous = findings.get(entry.id);
    if (previous) {
      previous.qty = Math.max(previous.qty, qty);
      if (!previous.quotes.includes(sentence.raw) && previous.quotes.length < 3) previous.quotes.push(sentence.raw);
      return;
    }
    findings.set(entry.id, { id: entry.id, label: entry.label, kind: entry.kind, severity: entry.severity, cost: entry.cost, qty, quotes: [sentence.raw] });
  };

  for (const sentence of list) {
    const labels = sentence.raw.split(/[,;/]/).map((label) => norm(label).replace(/\.$/, ""));
    if (labels.every((label) => PORTAL_STATUS_LABELS.has(label))) {
      if (labels.includes("beschaedigt") && labels.includes("unfallfrei")) portalDamageAccidentFree = true;
      continue;
    }

    let matched = false;
    for (const pass of ["specific", "vague"]) {
      if (pass === "vague" && matched) break;
      for (const entry of COMPILED) {
        if ((entry.kind === "vague") !== (pass === "vague")) continue;
        let hit = null;
        for (const regex of entry.regex) {
          regex.lastIndex = 0;
          for (const match of sentence.text.matchAll(regex)) {
            if (!negated(sentence.text, match.index, match[0].length)) { hit = match; break; }
            matched = true; // verneint: kein Mangel, aber auch kein unbekannter Hinweis
          }
          if (hit) break;
        }
        if (entry.kind === "positive") {
          if (hit) { positives.set(entry.id, { id: entry.id, label: entry.label, quote: sentence.raw }); matched = true; }
          continue;
        }
        const done = DONE.test(sentence.text) && !NEEDED.test(sentence.text);
        if (hit && entry.fixable && done) {
          positives.set(`neu-${entry.id}`, { id: `neu-${entry.id}`, label: `${entry.label}: erneuert`, quote: sentence.raw });
          matched = true;
          continue;
        }
        if (hit) {
          add(entry, sentence, entry.qty === "parts" ? countParts(sentence.text) : entry.qty || 1);
          matched = true;
          continue;
        }
        // bloße Nennung: "Zahnriemen neu" ist ein Plus, "Zahnriemen muss gemacht werden" kostet
        const mention = entry.mentionRegex.some((regex) => { regex.lastIndex = 0; return regex.test(sentence.text); });
        if (mention && done) {
          positives.set(`neu-${entry.id}`, { id: `neu-${entry.id}`, label: `${entry.label}: erneuert`, quote: sentence.raw });
          matched = true;
        } else if (mention && NEEDED.test(sentence.text) && !negated(sentence.text, sentence.text.search(NEEDED), 0)) {
          add(entry, sentence, 1);
          matched = true;
        }
      }
    }
    if (!matched) {
      // "keine Mängel", "ohne Probleme" sind keine Hinweise.
      const signal = SIGNAL_WORDS.find((word) => {
        const hit = sentence.text.match(new RegExp(`(?<![a-z])${word}`));
        return hit && !negated(sentence.text, hit.index, hit[0].length);
      });
      if (signal && sentence.text.length <= 220 && unknown.length < 12) unknown.push({ quote: sentence.raw, signal });
    }
  }

  /* ---- Angaben des Portals ---- */
  const quote = (text) => ({ raw: text, text: norm(text) });
  const portalDamageUnclear = portalDamageAccidentFree && ![...findings.values()]
    .some((f) => f.kind === "body" || f.kind === "history" && f.id === "vorschaden" || f.kind === "mech" && f.severity >= 2);
  if (portalDamageUnclear) {
    add(COMPILED.find((e) => e.id === "unklar"), quote("Portalangaben: „Beschädigt“ und „Unfallfrei“"), 1);
  }
  if (subject.accident === "DAMAGED" && !portalDamageAccidentFree && ![...findings.values()].some((f) => f.kind === "body" && f.severity >= 3)) {
    add(COMPILED.find((e) => e.id === "unfall"), quote("Im Portal als beschädigt / Unfallfahrzeug gekennzeichnet"), 1);
  }
  if (subject.accident === "REPAIRED" && !findings.has("vorschaden")) {
    add(COMPILED.find((e) => e.id === "vorschaden"), quote("Im Portal als repariertes Unfallfahrzeug gekennzeichnet"), 1);
  }
  // TÜV: abgelaufen oder in weniger als drei Monaten fällig
  const tuv = String(subject.tuv || "");
  const tuvMonths = /neu/i.test(tuv) ? null : regMonths(tuv);
  let tuvLeft = null;
  if (Number.isFinite(tuvMonths)) {
    tuvLeft = tuvMonths - nowMonths(now);
    if (tuvLeft < 3 && !findings.has("tuevFehlt") && !positives.has("plusTuevNeu")) {
      add(COMPILED.find((e) => e.id === "tuevFehlt"), quote(tuvLeft < 0 ? `HU laut Anzeige abgelaufen (${tuv})` : `HU laut Anzeige nur noch bis ${tuv}`), 1);
    }
  }
  if (positives.has("plusTuevNeu") || /neu/i.test(tuv)) findings.delete("tuevFehlt");

  /* ---- Kosten nach Preisliste ---- */
  // Außenschäden (Lack, Dellen, Hagel, Unfall …) werden genannt, aber ohne Preis:
  // ihr Aufwand hängt von der Besichtigung ab und soll das Ergebnis nicht verschieben.
  const costs = [];
  for (const finding of findings.values()) {
    if (!finding.cost && !OUTSIDE.has(finding.id)) continue;
    if (OUTSIDE.has(finding.id)) {
      costs.push({ id: finding.id, item: finding.cost, label: finding.label, qty: finding.qty, unit: 0, amount: 0, noPrice: true, reason: finding.label, quote: finding.quotes[0] });
      continue;
    }
    const unit = Number(prices?.[finding.cost]) || 0;
    costs.push({
      id: finding.id, item: finding.cost, label: LABEL[finding.cost] || finding.label, qty: finding.qty, unit,
      amount: Math.round(unit * finding.qty), reason: finding.label, quote: finding.quotes[0],
    });
  }
  // Unfall und einzelne Karosserieschäden nicht doppelt rechnen.
  const accident = costs.find((c) => c.id === "unfall" || c.id === "unfallLeicht");
  const filtered = accident && !accident.noPrice ? costs.filter((c) => c === accident || c.noPrice || !["lack", "delle", "stossstange"].includes(c.id) || c.amount > accident.amount) : costs;

  const all = [...findings.values()];
  return {
    findings: all.sort((a, b) => b.severity - a.severity),
    positives: [...positives.values()],
    unknown,
    portalDamageAccidentFree,
    portalDamageUnclear,
    costs: filtered.sort((a, b) => Number(Boolean(a.noPrice)) - Number(Boolean(b.noPrice)) || b.amount - a.amount),
    costTotal: filtered.reduce((sum, cost) => sum + cost.amount, 0),
    killer: all.filter((f) => f.severity >= 4),
    serious: all.filter((f) => f.severity === 3),
    tuvMonthsLeft: tuvLeft,
  };
}
