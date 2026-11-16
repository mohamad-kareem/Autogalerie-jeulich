/** Marktanalyse – kleine Texthelfer. Rein, ohne Importe. */

/** Kleinbuchstaben, Umlaute aufgelöst, Sonderzeichen zu Leerzeichen. */
export function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9€%.,/+\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nur Buchstaben und Ziffern – für Modellvergleiche ("C 180" = "c180"). */
export const squash = (value) => norm(value).replace(/[^a-z0-9]/g, "");

export function toInt(value) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : null;
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/** "03/2018", "2018-03", "03-2018", "2018" → Monate seit Jahr 0 (Jahr*12+Monat-1). */
export function regMonths(value) {
  const text = String(value ?? "").trim();
  let m = text.match(/^(19|20)(\d{2})(0[1-9]|1[0-2])$/); // "201903"
  if (m) return Number(m[1] + m[2]) * 12 + Number(m[3]) - 1;
  m = text.match(/(\d{1,2})\s*[/.\-]\s*(\d{4})/);
  if (m) return Number(m[2]) * 12 + Math.min(12, Math.max(1, Number(m[1]))) - 1;
  m = text.match(/(\d{4})\s*[/.\-]\s*(\d{1,2})/);
  if (m) return Number(m[1]) * 12 + Math.min(12, Math.max(1, Number(m[2]))) - 1;
  m = text.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  return m ? Number(m[1]) * 12 + 5 : null;
}

export function monthsLabel(months) {
  if (!Number.isFinite(months)) return null;
  return `${String((months % 12) + 1).padStart(2, "0")}/${Math.floor(months / 12)}`;
}

export const nowMonths = (now = new Date()) => now.getFullYear() * 12 + now.getMonth();

export function fuelKey(value) {
  const t = norm(value);
  if (!t) return null;
  if (/plug|phev/.test(t)) return "PLUGIN_HYBRID";
  if (/hybrid/.test(t)) return "HYBRID";
  if (/elektr|electric|^e$|strom/.test(t)) return "ELECTRIC";
  if (/diesel|^d$/.test(t)) return "DIESEL";
  if (/benzin|petrol|super|gasoline|^b$/.test(t)) return "PETROL";
  if (/autogas|lpg/.test(t)) return "LPG";
  if (/erdgas|cng/.test(t)) return "CNG";
  return null;
}

export function gearKey(value) {
  const t = norm(value);
  if (!t) return null;
  if (/halbautomat|automat|dsg|tiptronic|steptronic|s tronic|doppelkuppl|cvt|^a$/.test(t)) return "AUTOMATIC";
  if (/schalt|manuell|manual|^m$/.test(t)) return "MANUAL";
  return null;
}

export function sellerKey(value) {
  const t = norm(value);
  if (!t) return "UNKNOWN";
  if (/privat|private|fsbo/.test(t)) return "PRIVATE";
  if (/haendler|handler|dealer|gewerb|autohaus|gmbh|comm/.test(t)) return "DEALER";
  return "UNKNOWN";
}

/** Karosserieform, grob – für "Kombi gegen Limousine". */
export function bodyKey(value) {
  const t = norm(value);
  if (!t) return null;
  if (/cabrio|roadster|convertible/.test(t)) return "CABRIO";
  if (/coupe|sportscar|sportwagen/.test(t)) return "COUPE";
  if (/kombi|estate|variant|touring|avant|t-modell|tmodell|sportstourer|sw\b|break|turnier|caravan/.test(t)) return "KOMBI";
  if (/suv|offroad|gelaende|pickup/.test(t)) return "SUV";
  if (/van|bus|minibus|transporter|kasten/.test(t)) return "VAN";
  if (/kleinwagen|smallcar/.test(t)) return "SMALL";
  if (/limousine|sedan|saloon|schraegheck|kompakt/.test(t)) return "LIMO";
  return null;
}

/** Sportlinie / Sportpaket im Titel. */
export function hasSportLine(value) {
  return /\b(amg|s[ -]?line|m[ -]?sport|m[ -]?paket|r[ -]?line|st[ -]?line|gt[ -]?line|n[ -]?line|fr\b|rs\b|gti|gtd|gte|opc|vrs|cupra|john cooper|jcw|sportpaket|black edition|competition)\b/.test(norm(value));
}

export const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : "–";

export const roundTo = (value, step = 50) => Math.round(value / step) * step;
export const floorTo = (value, step = 50) => Math.floor(value / step) * step;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** "Euro6d-TEMP", "Euro 5" → 6, 5. */
export function euroClass(value) {
  const m = norm(value).match(/euro ?-?([1-7])/);
  return m ? Number(m[1]) : null;
}

/** Preisbewertung der Portale auf eine gemeinsame Skala: 1 = sehr gut … 5 = hoch. */
export function ratingLevel(value) {
  const t = norm(value).replace(/[_-]/g, " ");
  if (!t) return null;
  if (/very good|sehr gut|top price|top preis/.test(t)) return 1;
  if (/good|guter/.test(t)) return 2;
  if (/reasonable|fair/.test(t)) return 3;
  if (/increased|erhoeht|somewhat|leicht/.test(t)) return 4;
  if (/high|hoch|expensive|teuer/.test(t)) return 5;
  return null;
}

export const RATING_LABEL = { 1: "Sehr guter Preis", 2: "Guter Preis", 3: "Fairer Preis", 4: "Erhöhter Preis", 5: "Hoher Preis" };
