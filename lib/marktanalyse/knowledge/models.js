/**
 * Marktanalyse – Modellwissen (bekannte Schwachstellen).
 *
 * Jeder Eintrag ist ein HINWEIS, keine Diagnose: Der Bericht sagt
 * "bekannte Schwachstelle, beim Verkäufer nachfragen" und behauptet nicht,
 * dass dieses Auto den Fehler hat.
 *
 *   makes     Marken (klein geschrieben, wie text.js → norm())
 *   model     regulärer Ausdruck auf "modell + variante + titel" (normalisiert), optional
 *   fuel      PETROL | DIESEL | …, optional
 *   gearbox   AUTOMATIC | MANUAL, optional
 *   years     [von, bis] Erstzulassung
 *   ccm / ps  [von, bis], optional – grenzt den Motor ein
 *   level     info | warn
 *   text      der Hinweis
 *   ask       Frage an den Verkäufer
 *   source    woher das Wissen stammt
 *
 * Der Startbestand deckt häufige, gut dokumentierte Fälle ab und ist bewusst
 * klein. Weitere Tabellen (z. B. Zahnriemen / Steuerkette mit Intervallen)
 * werden später ergänzt.
 */

export const MODEL_KNOWLEDGE = [
  { id: "vag-14tsi-kette", makes: ["volkswagen", "vw", "skoda", "seat", "audi"], fuel: "PETROL", years: [2007, 2012], ccm: [1380, 1400], ps: [120, 185], level: "warn",
    text: "1.4 TSI der Baujahre bis 2012 (EA111): Steuerkette kann sich längen (Rasseln beim Kaltstart).",
    ask: "Wurde die Steuerkette schon erneuert? Rechnung vorhanden?", source: "ADAC / Herstellerkulanz, allgemein dokumentiert" },
  { id: "vag-tfsi-oel", makes: ["volkswagen", "vw", "skoda", "seat", "audi"], fuel: "PETROL", years: [2008, 2012], ccm: [1780, 2000], ps: [155, 215], level: "warn",
    text: "1.8 / 2.0 TFSI / TSI (EA888, 2. Generation): erhöhter Ölverbrauch durch Kolbenringe bekannt.",
    ask: "Wie viel Öl verbraucht der Motor auf 1.000 km? Wurden Kolben oder Kolbenringe getauscht?", source: "ADAC, Herstellermaßnahmen" },
  { id: "vag-dsg7-trocken", makes: ["volkswagen", "vw", "skoda", "seat", "audi"], gearbox: "AUTOMATIC", years: [2008, 2015], ps: [60, 150], ccm: [990, 1600], level: "info",
    text: "7-Gang-DSG mit Trockenkupplung (DQ200): Mechatronik und Kupplungen sind bekannte Schwachstellen.",
    ask: "Schaltet das Getriebe ruckfrei? Wurde Mechatronik oder Kupplung schon getauscht?", source: "ADAC Pannenstatistik, Rückrufe" },
  { id: "vag-ea189", makes: ["volkswagen", "vw", "skoda", "seat", "audi"], fuel: "DIESEL", years: [2008, 2015], ccm: [1590, 2000], level: "info",
    text: "TDI der Reihe EA189: Software-Update (Abgas) – danach teils Probleme mit AGR-Ventil und Injektoren.",
    ask: "Ist das Software-Update durchgeführt? Gab es danach Reparaturen an AGR oder Injektoren?", source: "KBA-Rückruf" },
  { id: "bmw-n47-kette", makes: ["bmw"], fuel: "DIESEL", years: [2007, 2011], ccm: [1990, 2000], level: "warn",
    text: "BMW 2,0-Liter-Diesel N47 bis etwa 2011: Steuerkette (motorrückseitig) kann rasseln und reißen – teure Reparatur.",
    ask: "Wurde die Steuerkette erneuert? Rasselt der Motor im Leerlauf?", source: "ADAC, allgemein dokumentiert" },
  { id: "bmw-n20-kette", makes: ["bmw"], fuel: "PETROL", years: [2011, 2015], ccm: [1990, 2000], ps: [150, 250], level: "info",
    text: "BMW 2,0-Liter-Benziner N20 bis etwa 2015: Steuerkette und Ölpumpenantrieb bekannt anfällig.",
    ask: "Wurde die Steuerkette schon gewechselt?", source: "Herstellermaßnahmen, allgemein dokumentiert" },
  { id: "mini-n14", makes: ["mini"], fuel: "PETROL", years: [2006, 2010], ccm: [1590, 1600], ps: [170, 215], level: "warn",
    text: "Mini Cooper S / JCW mit N14-Motor: Steuerkette, Ölverbrauch und Verkokung bekannt.",
    ask: "Wurde der Kettenspanner oder die Kette erneuert? Ölverbrauch?", source: "ADAC, allgemein dokumentiert" },
  { id: "mb-m271-kette", makes: ["mercedes-benz", "mercedes"], fuel: "PETROL", years: [2002, 2012], ccm: [1590, 1800], level: "info",
    text: "Mercedes 1.6 / 1.8 Kompressor und CGI (M271): Steuerkette und Nockenwellenversteller bekannt anfällig.",
    ask: "Wurde die Steuerkette erneuert? Rasselt der Motor beim Kaltstart?", source: "allgemein dokumentiert" },
  { id: "mb-om651-injektoren", makes: ["mercedes-benz", "mercedes"], fuel: "DIESEL", years: [2008, 2011], ccm: [2140, 2150], level: "info",
    text: "Mercedes 2,1-Liter-Diesel OM651 der ersten Jahre: Injektoren (Piezo) wurden vielfach getauscht.",
    ask: "Wurden die Injektoren im Rahmen der Herstelleraktion getauscht?", source: "Herstellermaßnahme" },
  { id: "ford-ecoboost-10", makes: ["ford"], fuel: "PETROL", years: [2012, 2019], ccm: [990, 1000], level: "warn",
    text: "Ford 1.0 EcoBoost: Zahnriemen läuft im Ölbad – bei falschem Öl oder langem Intervall löst er sich auf; frühe Baujahre zusätzlich Kühlmittelschlauch.",
    ask: "Wurde der Zahnriemen gewechselt und immer das vorgeschriebene Öl verwendet? Rechnungen?", source: "Rückruf (Kühlsystem), allgemein dokumentiert" },
  { id: "ford-powershift", makes: ["ford"], gearbox: "AUTOMATIC", years: [2010, 2018], ccm: [990, 1600], level: "info",
    text: "Ford Powershift mit Trockenkupplung (Fiesta, Focus, B-Max): Kupplungsrupfen und Steuergerät bekannt.",
    ask: "Ruckelt das Getriebe beim Anfahren? Wurde die Kupplung getauscht?", source: "allgemein dokumentiert" },
  { id: "psa-puretech-12", makes: ["peugeot", "citroen", "ds", "ds automobiles", "opel"], fuel: "PETROL", years: [2013, 2022], ccm: [1190, 1200], level: "warn",
    text: "1.2 PureTech (bei Opel ab etwa 2017 als 1.2 Turbo): Zahnriemen im Ölbad löst sich auf, verstopft das Ölsieb – Öldruckwarnung, Motorschaden möglich.",
    ask: "Wurde der Zahnriemen schon gewechselt (wann, bei welchem km-Stand)? Gab es eine Öldruck-Warnung?", source: "Herstellermaßnahme / verlängerte Garantie" },
  { id: "renault-12tce", makes: ["renault", "dacia", "nissan"], fuel: "PETROL", years: [2012, 2016], ccm: [1190, 1200], ps: [110, 135], level: "warn",
    text: "1.2 TCe / DIG-T (H5Ft): hoher Ölverbrauch bis zum Motorschaden bekannt.",
    ask: "Wie hoch ist der Ölverbrauch? Wurde der Motor schon instand gesetzt oder getauscht?", source: "allgemein dokumentiert" },
  { id: "opel-m32", makes: ["opel"], gearbox: "MANUAL", years: [2005, 2013], ps: [110, 200], model: "astra|corsa|zafira|meriva|insignia", level: "info",
    text: "Opel 6-Gang-Schaltgetriebe M32: Lagerschäden bekannt (Schalthebel bewegt sich unter Last, Heulen).",
    ask: "Macht das Getriebe Geräusche im 5. oder 6. Gang? Wurden die Lager erneuert?", source: "allgemein dokumentiert" },
];
