/**
 * German words for the internal codes, for everything an AI model reads.
 * The models must never see (and then repeat) "ACCIDENT_FREE" or "PETROL".
 */

const MAPS = {
  fuel: { PETROL: "Benzin", DIESEL: "Diesel", HYBRID: "Hybrid", PLUGIN_HYBRID: "Plug-in-Hybrid", ELECTRIC: "Elektro", LPG: "Autogas", CNG: "Erdgas", HYDROGEN: "Wasserstoff", OTHER: "Sonstige" },
  gearbox: { MANUAL: "Schaltgetriebe", AUTOMATIC: "Automatik", SEMI_AUTOMATIC: "Halbautomatik" },
  condition: { ACCIDENT_FREE: "unfallfrei", REPAIRED_DAMAGE: "reparierter Vorschaden", DAMAGED: "Unfall- oder Defektfahrzeug" },
  seller: { DEALER: "Händler", PRIVATE: "Privat" },
  service: { YES: "ja", NO: "nein" },
  priceType: { MARGIN_TAXED: "differenzbesteuert", VAT_DEDUCTIBLE: "MwSt. ausweisbar" },
  verdict: { EXCELLENT: "sehr guter Einkauf", GOOD: "guter Einkauf", NEGOTIABLE: "verhandelbar", TOO_EXPENSIVE: "zu teuer", INSUFFICIENT_DATA: "zu wenig Daten" },
};

/** "PETROL" → "Benzin"; unknown or missing → "unbekannt". */
export function de(kind, code) {
  if (code === null || code === undefined || code === "" || code === "UNKNOWN") return "unbekannt";
  return MAPS[kind]?.[code] || String(code);
}
