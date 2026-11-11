// 12900 → "zwölftausendneunhundert" (for "Kaufpreis in Worten"). Pure JS.

const ONES = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

function below100(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${ONES[o]}und${TENS[t]}` : TENS[t];
}

function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${h ? `${ONES[h]}hundert` : ""}${r ? below100(r) : ""}`;
}

/** whole euros as German words; "eins" at the end, "eine Million" etc. */
export function numberToGerman(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (!n) return "null";
  if (n >= 1e9) return String(n);
  const mio = Math.floor(n / 1e6);
  n %= 1e6;
  const tsd = Math.floor(n / 1000);
  const rest = n % 1000;
  let out = "";
  if (mio) out += mio === 1 ? "einemillion" : `${below1000(mio)}millionen`;
  if (tsd) out += `${below1000(tsd)}tausend`;
  if (rest) out += below1000(rest);
  // "…ein" at the very end is spoken "…eins" (101 → hunderteins)
  if (rest % 100 === 1) out += "s";
  return out;
}

/** "Zwölftausendneunhundert Euro" */
export function euroInWords(value) {
  const w = numberToGerman(value);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} Euro`;
}
