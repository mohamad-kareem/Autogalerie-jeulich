/**
 * Marktanalyse – Standardwerte.
 *
 * Die Preisliste und die Gewinnspanne kann der Händler unter
 * Einstellungen → Marktanalyse ändern. Alles andere wird hier gepflegt.
 * Diese Datei ist reines Wissen: keine Importe, kein Code mit Nebenwirkungen.
 */

/** Preisliste des Händlers (Startwerte, in Euro). */
export const PRICE_LIST = [
  { key: "aufbereitung", label: "Aufbereitung", unit: "pauschal", value: 250 },
  { key: "tuev", label: "TÜV / HU inkl. kleiner Mängel", unit: "pauschal", value: 350 },
  { key: "lackTeil", label: "Lackierung", unit: "pro Teil", value: 350 },
  { key: "delle", label: "Delle (ohne Lack)", unit: "pro Stück", value: 90 },
  { key: "hagel", label: "Hagelschaden", unit: "pauschal", value: 1500 },
  { key: "rost", label: "Rost beseitigen", unit: "pro Stelle", value: 400 },
  { key: "kupplung", label: "Kupplung", unit: "pauschal", value: 900 },
  { key: "bremsen", label: "Bremsen (Scheiben + Beläge)", unit: "pro Achse", value: 300 },
  { key: "zahnriemen", label: "Zahnriemen / Steuerkette", unit: "pauschal", value: 700 },
  { key: "service", label: "Inspektion / Ölwechsel", unit: "pauschal", value: 250 },
  { key: "reifen", label: "Reifen", unit: "Satz", value: 400 },
  { key: "scheibe", label: "Windschutzscheibe", unit: "pauschal", value: 450 },
  { key: "klima", label: "Klimaanlage instand setzen", unit: "pauschal", value: 400 },
  { key: "auspuff", label: "Auspuff / Abgasanlage", unit: "pauschal", value: 450 },
  { key: "fahrwerk", label: "Fahrwerk / Achse / Lenkung", unit: "pauschal", value: 500 },
  { key: "elektrik", label: "Elektrik / Steuergerät / Warnleuchte", unit: "pauschal", value: 400 },
  { key: "innenraum", label: "Innenraum (Sitze, Himmel, Geruch)", unit: "pauschal", value: 300 },
  { key: "oelverlust", label: "Ölverlust abdichten", unit: "pauschal", value: 450 },
  { key: "turbo", label: "Turbolader", unit: "pauschal", value: 1400 },
  { key: "dpf", label: "Partikelfilter / AGR / AdBlue", unit: "pauschal", value: 900 },
  { key: "unfallKlein", label: "Unfallschaden klein", unit: "pauschal", value: 800 },
  { key: "unfallMittel", label: "Unfallschaden mittel", unit: "pauschal", value: 2200 },
  { key: "unfallGross", label: "Unfallschaden groß", unit: "pauschal", value: 4500 },
  { key: "unklar", label: "Unklare Mängel (Pauschale)", unit: "pauschal", value: 500 },
];

export const DEFAULT_SETTINGS = {
  profitMin: 2300,
  profitGoal: 3000, kmWarn: 150000,
  prices: Object.fromEntries(PRICE_LIST.map((item) => [item.key, item.value])),
};

/** Feste Stellschrauben der Bewertung. Änderungen hier wirken auf jede Analyse. */
export const TUNING = {
  // Abschlag vom Händler-Angebotspreis auf den realistischen Verkaufspreis.
  sellDiscountPct: 3,
  // In diesen Grenzen darf das Gehirn den Abschlag selbst nachstellen.
  sellDiscountRange: [2, 6],
  // "Verhandeln": so weit darf der Angebotspreis über dem Einkaufslimit liegen.
  negotiationZonePct: 10,
  negotiationZoneMaxPct: 20,
  // Vergleichsfahrzeuge: ab so vielen guten Händlerangeboten wird nicht weiter gesucht.
  enoughComparables: 10,
  minComparables: 3,
  // Suchschritte: EZ ± Jahre, km ± Anteil, PS ± Anteil.
  steps: [
    { ez: 1, km: 0.2, ps: 0.1 },
    { ez: 2, km: 0.3, ps: 0.15 },
    { ez: 3, km: 0.4, ps: 0.2 },
  ],
  // Wertverlust, wenn zu wenige Vergleichsfahrzeuge für eine eigene Rechnung da sind:
  // Anteil vom Preis je 1.000 km bzw. je Monat.
  lossPer1000KmPct: 0.35,
  lossPerMonthPct: 0.55,
  // Korrektur eines Vergleichsfahrzeugs höchstens um diesen Anteil seines Preises.
  maxAdjustPct: 25,
  // Preis so weit unter Marktwert gilt ohne erkennbaren Grund als auffällig.
  suspiciousBelowPct: 25,
  // Abschläge auf den Verkaufspreis.
  deductions: {
    repairedAccident: 7, // reparierter Unfall-/Vorschaden
    fleetHistory: 5, // Mietwagen, Taxi, Fahrschule
    importCar: 3, // EU-Import / Reimport
    manyOwners: 3, // ungewöhnlich viele Halter
    dieselEuro5: 5, // Diesel mit Euro 5: Fahrverbote, schwer verkäuflich
    dieselEuro4: 9, // Diesel mit Euro 4 oder älter
    reducedMarket: 1, // viele Händler haben den Preis schon gesenkt
  },
  // Ausstattungslinien: Mehrwert je Stufe gegenüber der Basis, in Prozent vom Preis.
  // Ein Vergleichsfahrzeug wird um den Unterschied zur Linie des analysierten Autos korrigiert.
  trimValuePct: { base: 0, mid: 4, top: 8, sport: 10 },
  // Vergleichsfahrzeug einer benachbarten Stufe bzw. ohne erkennbare Linie zählt so viel.
  trimNeighbourWeight: 0.75,
  trimUnknownWeight: 0.85,
  // Vom Portal als zu teuer bewertete Angebote (4 = erhöhter Preis, 5 = hoher Preis) werden
  // angezeigt, zählen aber nicht in den Marktwert: sie zeigen eher Wunsch- als Verkaufspreise.
  overpricedFromRating: 4,
  // Mängel aus der Anzeige vorerst nur anzeigen, nicht vom Einkaufslimit abziehen.
  countRepairs: false,
  // "Fairer Preis" (3) zählt halb so viel wie gute und sehr gute Angebote.
  fairPriceWeight: 0.5,
  // Ab diesem Anteil reduzierter Händlerangebote (mobile.de, AutoScout24) gilt der Markt als überteuert angeboten.
  reducedShare: 0.4,
  // Vergleichsfahrzeug, dessen Generation nicht sicher ist (Jahr des Modellwechsels): zählt so viel.
  unsureGenerationWeight: 0.7,
};

export const PORTAL_LABEL = {
  MOBILE_DE: "mobile.de",
  AUTOSCOUT24: "AutoScout24",
  KLEINANZEIGEN: "Kleinanzeigen",
};
