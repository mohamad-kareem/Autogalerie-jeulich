/**
 * Marktwissen — the knowledge base the deep analysis ("Tief") draws on.
 *
 * Two kinds of entries:
 *
 *   setting   filled in by the business itself (A01 — minimum profit per
 *             selling price). The only dealer-specific entry; the code reads
 *             it for the purchase limit.
 *   research  general knowledge about the German used-car market, the same
 *             for every dealer. Written to be answered by an AI with deep web
 *             research: each question names its scope, a fixed column order
 *             and an example line. One fact per line, so the analysis can
 *             pick only the lines that match the car in front of it (make,
 *             model, engine) instead of sending everything.
 *
 * Ids are stable; never renumber them, the saved answers hang on them. A01 and
 * E01 keep their old meaning. The research questions use new ids so answers
 * to the earlier, dealer-specific questions are not attached to new ones.
 *
 * kind "vehicle": lines are about specific makes/models/engines — only lines
 *                 matching the analysed car are used.
 * kind "rules":   general rules — used for every car, as far as space allows.
 */

export const EXPERT_CATEGORIES = [
  { id: "E", title: "Zahnriemen & Steuertrieb" },
  { id: "K", title: "Motoren & Schwachstellen" },
  { id: "L", title: "Getriebe, Antrieb & Fahrwerk" },
  { id: "M", title: "Zuverlässigkeit & Rückrufe" },
  { id: "N", title: "Wertfaktoren & Preise" },
  { id: "O", title: "Nachfrage & Standzeit" },
  { id: "R", title: "Anzeigen lesen" },
  { id: "S", title: "Modelle, Generationen & Linien" },
  { id: "P", title: "Händlerverkauf & Gewährleistung" },
];

/** What every research answer must look like — sent along with the questions. */
export const RESEARCH_SCOPE =
  "Gebrauchtwagenmarkt Deutschland · Pkw und Kleintransporter · Baujahre ab 2008 · alle in Deutschland verbreiteten Marken (u. a. VW, Audi, Skoda, Seat/Cupra, Opel, Ford, Mercedes-Benz, BMW, Mini, Renault, Dacia, Peugeot, Citroën, DS, Fiat, Alfa Romeo, Hyundai, Kia, Toyota, Mazda, Nissan, Honda, Suzuki, Mitsubishi, Volvo, Land Rover, Tesla).";

export const ANSWER_RULES = [
  "Antworte auf Deutsch.",
  "Eine Tatsache pro Zeile. Felder mit „ | “ trennen, genau in der angegebenen Spaltenreihenfolge.",
  "Keine Einleitung, keine Fließtexte, keine Markdown-Tabellen, keine Aufzählungszeichen, keine Überschriften innerhalb einer Antwort.",
  "Marke immer ausschreiben wie im Handel üblich (VW, Mercedes-Benz, BMW …). Motor mit Hubraum, Leistung in PS und – wenn bekannt – Motorcode, z. B. „1.4 TSI 122 PS (CAXA)“.",
  "Baujahre als „2012–2017“, offen als „ab 2019“. Kilometer als ganze Zahl ohne Punkt (150000). Prozent als „8 %“.",
  "Schwere: 1 = gering (Kleinigkeit), 2 = mittel (spürbare Reparatur), 3 = hoch (Motor-/Getriebeschaden, Verkauf an Endkunden riskant).",
  "Unbekanntes Feld: „?“. Keine Schätzungen ohne Beleg – lieber weglassen.",
  "Nur belegte Angaben: Hersteller, TÜV-Report, ADAC-Pannenstatistik, DAT-Report, Garantieversicherer, KBA-Rückrufdatenbank, Fachpresse (auto motor und sport, AUTO BILD, ADAC-Tests). Keine Forenmeinungen als alleinige Quelle.",
  "Höchstens 120 Zeilen pro Frage, die wichtigsten und häufigsten Fahrzeuge zuerst.",
  "Die Beispielzeile zeigt nur das Format – ihre Werte (x, y, ?) nicht übernehmen.",
  "Letzte Zeile jeder Antwort: „Quellen: …“ (kurz, kommagetrennt).",
];

const S = (id, question, hint) => ({ id, category: id[0], kind: "setting", question, hint });
const V = (id, question, columns, example) => ({ id, category: id[0], kind: "vehicle", question, columns, example });
const R = (id, question, columns, example) => ({ id, category: id[0], kind: "rules", question, columns, example });

export const EXPERT_QUESTIONS = [
  /* E — timing belt and chain */
  V(
    "E01",
    "Welche Motoren haben einen Zahnriemen (trocken oder im Ölbad) oder eine Steuerkette, und welches Wechselintervall gibt der Hersteller vor?",
    ["Marke", "Motor (Hubraum, PS, Code)", "Baujahre", "Antrieb (Zahnriemen / Zahnriemen im Ölbad / Steuerkette)", "Intervall km / Jahre (Hersteller)", "Hinweis"],
    "VW | 2.0 TDI 150 PS (CRLB) | 2012–2020 | Zahnriemen | 210000 / keine Jahresgrenze | Wasserpumpe mit wechseln",
  ),
  V(
    "E11",
    "Bei welchen Motoren mit Steuerkette sind Kettenlängung, Spanner- oder Führungsschäden bekannt?",
    ["Marke", "Motor (Hubraum, PS, Code)", "Baujahre", "Problem", "typisch ab km", "Schwere 1–3"],
    "VW | 1.4 TSI 122 PS (CAXA) | 2007–2012 | Steuerkette längt sich, Spanner | 60000 | 3",
  ),
  V(
    "E12",
    "Bei welchen Motoren hat der Hersteller das Wechselintervall nachträglich geändert oder je Baujahr zwischen Riemen und Kette gewechselt?",
    ["Marke", "Motor", "Baujahre", "Änderung (alt → neu)", "gilt ab"],
    "Peugeot | 1.2 PureTech 110/130 PS | 2014–2022 | 175000 km / 10 J → 100000 km / 6 J | 2022",
  ),

  /* K — engines and known weak points */
  V(
    "K01",
    "Welche Benzinmotoren haben bekannte Serienprobleme (Ölverbrauch, Kolben/Kolbenringe, Turbolader, Zündung, Einspritzung, Kühlung, Kopfdichtung)? Steuerkette/Zahnriemen nicht hier (siehe E).",
    ["Marke", "Motor (Hubraum, PS, Code)", "Baujahre", "verbaut in (Modelle)", "Problem", "typisch ab km", "Schwere 1–3"],
    "Audi | 1.8 TFSI 160 PS (CDAA) | 2008–2012 | A3, A4, VW Passat | hoher Ölverbrauch, Kolbenringe | 80000 | 3",
  ),
  V(
    "K02",
    "Welche Dieselmotoren haben bekannte Serienprobleme (DPF, AGR, AdBlue/SCR, Injektoren, Hochdruckpumpe, Nockenwelle, Turbolader, Ölpumpe)?",
    ["Marke", "Motor (Hubraum, PS, Code)", "Baujahre", "verbaut in (Modelle)", "Problem", "typisch ab km", "Schwere 1–3"],
    "Renault | 1.5 dCi 110 PS (K9K) | 2008–2013 | Megane, Kangoo, Dacia Duster | Pleuellagerschaden bei Ölmangel | 120000 | 3",
  ),
  V(
    "K03",
    "Welche Motoren gelten als besonders robust und langlebig (gut für den Wiederverkauf auch mit hoher Laufleistung)?",
    ["Marke", "Motor (Hubraum, PS, Code)", "Baujahre", "verbaut in (Modelle)", "warum robust"],
    "Toyota | 1.8 Hybrid 122 PS (2ZR-FXE) | ab 2016 | Corolla, C-HR | einfache Technik, kaum Defekte laut Pannenstatistik",
  ),
  V(
    "K04",
    "Welche Hybrid- und Elektrofahrzeuge haben bekannte Batterie- oder Antriebsprobleme, und welche Batteriegarantie gibt der Hersteller?",
    ["Marke", "Modell", "Baujahre", "Batterie kWh", "Batteriegarantie Jahre / km / % SoH", "bekanntes Problem", "Schwere 1–3"],
    "Nissan | Leaf (ZE0) | 2011–2017 | 24 | ? | starker Kapazitätsverlust ohne aktive Batteriekühlung | 3",
  ),
  V(
    "K05",
    "Welche Modelle haben bekannte Rostprobleme, und an welcher Stelle?",
    ["Marke", "Modell / Baureihe", "Baujahre", "Stelle", "Schwere 1–3"],
    "Mazda | 6 (GH) | 2008–2012 | hintere Radläufe, Schweller | 2",
  ),
  V(
    "K06",
    "Welche Modelle haben bekannte Elektrik- und Elektronikprobleme (Steuergeräte, Infotainment, Sensoren, Kabelbäume, Wassereintritt)?",
    ["Marke", "Modell / Baureihe", "Baujahre", "Problem", "Schwere 1–3"],
    "Ford | Focus (MK3) | 2011–2018 | SYNC-Infotainment stürzt ab, Bildschirm schwarz | 1",
  ),

  /* L — gearbox, drivetrain, chassis */
  V(
    "L01",
    "Welche Automatik-, Doppelkupplungs- und CVT-Getriebe haben bekannte Probleme?",
    ["Marke", "Getriebe (Name, Code)", "Baujahre", "verbaut in (Modelle)", "Problem", "typisch ab km", "Schwere 1–3"],
    "VW | DSG 7-Gang trocken (DQ200 / 0AM) | 2008–2013 | Golf, Polo, Octavia | Mechatronik, Kupplung rupft | 60000 | 3",
  ),
  R(
    "L02",
    "Welche Getriebeölwechsel-Intervalle schreiben die Hersteller für Automatik-, DSG- und CVT-Getriebe vor?",
    ["Getriebe (Name, Code)", "Marke", "Intervall km / Jahre", "Hersteller-Vorgabe oder Empfehlung"],
    "DSG 6-Gang nass (DQ250) | VW, Audi, Skoda, Seat | 60000 / – | Hersteller-Vorgabe",
  ),
  V(
    "L03",
    "Welche Modelle haben bekannte Probleme mit Kupplung und Zweimassenschwungrad oder mit dem Allradsystem (Haldex, xDrive, 4MATIC, quattro, 4x4)?",
    ["Marke", "Modell / Motor", "Baujahre", "Bauteil", "Problem", "typisch ab km", "Schwere 1–3"],
    "Opel | Insignia A 2.0 CDTI | 2008–2013 | Zweimassenschwungrad | Klappern im Leerlauf | 100000 | 2",
  ),
  V(
    "L04",
    "Welche Modelle haben bekannte Fahrwerks-, Lenkungs-, Bremsen- oder Luftfederungsprobleme?",
    ["Marke", "Modell / Baureihe", "Baujahre", "Bauteil", "Problem", "Schwere 1–3"],
    "Mercedes-Benz | E-Klasse (W212) mit Airmatic | 2009–2016 | Luftfederung | Federbein undicht, Kompressor | 3",
  ),

  /* M — reliability statistics and recalls */
  V(
    "M01",
    "Wie schneiden die Modelle im aktuellen TÜV-Report ab (Mängelquote je Altersklasse, häufigste Mängel)?",
    ["Marke", "Modell", "Altersklasse (Jahre)", "Mängelquote %", "häufigste Mängel", "Report-Jahr"],
    "Marke | Modell | 6–7 | xx,x % | Bremsscheiben, Achsaufhängung, Licht | 2025",
  ),
  V(
    "M02",
    "Welche Pannenschwerpunkte nennt die ADAC-Pannenstatistik je Modell und Baujahr?",
    ["Marke", "Modell", "Baujahre", "Pannenschwerpunkt", "Bewertung (gut / mittel / schlecht)", "Statistik-Jahr"],
    "Hyundai | i30 | 2017–2019 | Starterbatterie | gut | 2025",
  ),
  V(
    "M03",
    "Welche wichtigen Rückrufe, Software-Updates und Serienmängel mit Folgen für den Wiederverkauf gibt es (z. B. Airbags, Diesel-Software, Brandgefahr)?",
    ["Marke", "Modell", "Baujahre", "Thema", "Folge für Wiederverkauf (z. B. Nachweis nötig, Wertabschlag)"],
    "VW | Golf VI 1.6/2.0 TDI (EA189) | 2009–2013 | Diesel-Software-Update | Update-Nachweis nötig, sonst Zulassungsproblem",
  ),

  /* N — value drivers and prices */
  R(
    "N01",
    "Wie hoch ist der typische Wertverlust von Gebrauchtwagen in Deutschland je Fahrzeugklasse – pro Jahr und je 10.000 km?",
    ["Fahrzeugklasse", "Wertverlust % pro Jahr (Alter 3–8 J.)", "Wertverlust % je 10.000 km", "Quelle/Jahr"],
    "Kompaktklasse Diesel | x % | x % | DAT-Report 2025",
  ),
  V(
    "N02",
    "Wie viel mehr ist eine höhere Ausstattungslinie gebraucht wert als die Basislinie desselben Modells?",
    ["Marke", "Modell", "Linie", "Mehrwert gebraucht % ggü. Basis", "Hinweis"],
    "VW | Golf VII | Highline | x % | gegenüber Trendline, gleiche Motorisierung",
  ),
  R(
    "N03",
    "Welche einzelnen Ausstattungen erhöhen den Gebrauchtwagenpreis spürbar, welche sind neutral und welche Fehlende senken ihn?",
    ["Ausstattung", "Wirkung (+ % / neutral / − % wenn fehlend)", "Fahrzeugklasse"],
    "Automatik | +x % | Kompaktklasse und höher",
  ),
  R(
    "N04",
    "Wie beeinflussen Lackfarbe, Getriebeart und Kraftstoff (inkl. Euro-Norm, Umweltzonen, Fahrverbote) den Gebrauchtwagenpreis in Deutschland?",
    ["Merkmal", "Ausprägung", "Wirkung auf Preis / Verkaufsdauer", "Fahrzeugklasse"],
    "Lackfarbe | Gelb, Grün, Orange | −x %, längere Standzeit | Kompakt und Mittelklasse",
  ),
  R(
    "N05",
    "Welche typischen Preisabschläge gelten für Unfallvorschaden, fehlendes Scheckheft, viele Vorbesitzer, Re-Import, ehemalige Miet-/Taxi-/Fahrschulwagen, Raucherfahrzeug und abgelaufene HU?",
    ["Merkmal", "typischer Abschlag", "Bedingung"],
    "Unfallvorschaden fachgerecht repariert | x–y % | je nach Schwere, mit Gutachten",
  ),
  R(
    "N06",
    "Wie groß ist in Deutschland der Unterschied zwischen Privat- und Händlerpreisen und zwischen Inseratspreis und tatsächlichem Verkaufspreis?",
    ["Kennzahl", "Wert", "Fahrzeugklasse / Bedingung", "Quelle/Jahr"],
    "Händlerpreis über Privatpreis | x–y % | Fahrzeuge 3–8 Jahre | DAT-Report 2025",
  ),
  R(
    "N07",
    "Wie wirkt sich die Jahreszeit auf Nachfrage und Preis einzelner Fahrzeugtypen aus?",
    ["Fahrzeugtyp", "starke Monate", "schwache Monate", "Preiseffekt"],
    "Cabrio | März–Juni | Oktober–Januar | +x % im Frühjahr",
  ),

  /* O — demand and time on the lot */
  V(
    "O01",
    "Welche Gebrauchtwagen verkaufen sich in Deutschland besonders schnell, und welche stehen lange (durchschnittliche Standzeit)?",
    ["Marke", "Modell", "Baujahre / Motor", "Ø Standzeit Tage", "schnell / normal / langsam", "Quelle/Jahr"],
    "Skoda | Octavia Combi 2.0 TDI | 2017–2020 | xx | schnell | Quelle 2025",
  ),
  R(
    "O02",
    "Welche Käufergruppen kaufen welche Fahrzeugsegmente beim Händler, und welche Ausstattung erwarten sie mindestens?",
    ["Segment", "Käufergruppe", "erwartete Mindestausstattung", "Preisrahmen €"],
    "Kleinwagen | Fahranfänger, Zweitwagen | Klima, ZV, 5 Türen | 4000–10000",
  ),
  R(
    "O03",
    "Ab welchem Alter und welcher Laufleistung ist ein Fahrzeug im Händlerverkauf an Endkunden schwer verkäuflich, je Klasse – und wann eher Export oder Händlerverkauf?",
    ["Fahrzeugklasse / Typ", "km-Grenze", "Alters-Grenze", "danach eher (Export / Händler / Privat)"],
    "Kleinwagen Benzin | 150000 | 12 Jahre | Export oder Händler",
  ),
  V(
    "O04",
    "Welche Fahrzeuge sind im Export besonders gefragt (auch mit hoher Laufleistung oder Schaden), und in welche Märkte?",
    ["Marke", "Modell / Motor", "Baujahre", "Exportmarkt", "warum gefragt"],
    "Toyota | Land Cruiser / Hilux Diesel | ab 2008 | Afrika, Naher Osten | robust, Ersatzteile verfügbar",
  ),

  /* R — reading ads */
  R(
    "R01",
    "Welche Formulierungen in Gebrauchtwagen-Inseraten deuten auf versteckte Mängel, Exportfahrzeuge oder Händler mit Privatanzeige hin?",
    ["Formulierung", "was sie meist bedeutet", "Risiko 1–3"],
    "„Motor läuft unrund, sonst top“ | Motorschaden möglich | 3",
  ),
  R(
    "R02",
    "Welche Formulierungen und Angaben in Inseraten sind echte Pluspunkte für den Wiederverkauf?",
    ["Formulierung / Angabe", "Bedeutung", "Wirkung (gering / mittel / hoch)"],
    "„Zahnriemen bei 180.000 km gewechselt, Rechnung vorhanden“ | belegte Wartung, keine Kosten | hoch",
  ),
  R(
    "R03",
    "Welche Abkürzungen werden in deutschen Autoinseraten verwendet, und was bedeuten sie?",
    ["Abkürzung", "Bedeutung"],
    "ZR | Zahnriemen",
  ),

  /* S — models, generations, trims */
  V(
    "S01",
    "Welche Modellgenerationen und Facelifts gibt es je Modell, und wie groß ist der Preisunterschied zwischen den Generationen? Baujahre = Erstzulassungen in Deutschland (erstes bis letztes Jahr); Modell ohne Zusatz schreiben (z. B. „2“, „Golf“, „Octavia“).",
    ["Marke", "Modell", "Generation (Code)", "Baujahre", "Facelift ab", "Wertunterschied zur Vorgeneration"],
    "VW | Golf | VII (5G) | 2012–2019 | 2017 | Facelift +x % ggü. Vor-Facelift",
  ),
  V(
    "S02",
    "Welche Ausstattungslinien gibt es je Modell (von Basis bis Top), und welche Sportversionen bilden einen eigenen Markt?",
    ["Marke", "Modell", "Baujahre", "Linien von Basis bis Top (mit „>“)", "Sportversion (eigener Markt)"],
    "Skoda | Octavia III | 2013–2020 | Active > Ambition > Style > L&K | RS",
  ),

  /* P — selling as a dealer */
  R(
    "P01",
    "Welche rechtlichen Regeln gelten in Deutschland, wenn ein Händler einen Gebrauchtwagen an einen Privatkunden verkauft (Sachmängelhaftung, Beweislast, Verkürzung, Garantie)?",
    ["Regel", "Inhalt", "Folge für den Händler"],
    "Sachmängelhaftung | auf 1 Jahr verkürzbar, nicht ausschließbar | Rücklage für Reklamationen nötig",
  ),
  V(
    "P02",
    "Welche Bauteile und Modelle verursachen laut Garantieversicherern die meisten Garantie- und Gewährleistungsfälle im ersten Jahr nach dem Kauf?",
    ["Marke", "Modell / Motor", "Baujahre", "Bauteil", "Häufigkeit (hoch / mittel)", "Quelle/Jahr"],
    "Marke | Modell / Motor | 2015–2019 | Turbolader | hoch | Garantieversicherer, Jahr",
  ),
];

export const EXPERT_QUESTION_BY_ID = Object.fromEntries(EXPERT_QUESTIONS.map((q) => [q.id, q]));

export const RESEARCH_QUESTIONS = EXPERT_QUESTIONS.filter((q) => q.kind !== "setting");

/**
 * The research brief for an AI with web search: scope, answer rules and the
 * questions with their column order and an example line. The answers come
 * back under "### <Id>" headings, so they can be pasted in all at once.
 */
export function buildResearchPrompt(questions = RESEARCH_QUESTIONS) {
  const lines = [
    "Recherche-Auftrag: Fachwissen für die Ankaufsanalyse von Gebrauchtwagen",
    "",
    "Du recherchierst gründlich im Internet und beantwortest jede Frage mit belegten Fakten. Die Antworten werden von einem Analyseprogramm Zeile für Zeile gelesen – halte das Format exakt ein.",
    "",
    `Geltungsbereich: ${RESEARCH_SCOPE}`,
    "",
    "Antwortregeln:",
    ...ANSWER_RULES.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    "Ausgabe: Beginne jede Antwort mit einer eigenen Zeile „### <Id>“ (z. B. „### K01“), danach nur die Datenzeilen und die Quellenzeile. Nichts außerhalb dieser Blöcke.",
    "",
    "Fragen:",
  ];
  for (const q of questions) {
    lines.push(
      "",
      `### ${q.id}`,
      `Frage: ${q.question}`,
      `Spalten: ${q.columns.join(" | ")}`,
      `Beispielzeile: ${q.example}`,
    );
  }
  return lines.join("\n");
}

/**
 * Splits pasted AI output into answers per id: "### K01" … "### K02" …
 * Unknown ids are reported, not saved.
 */
export function parseResearchAnswers(text) {
  const found = {};
  const unknown = [];
  let current = null;
  for (const raw of String(text || "").split(/\r?\n/)) {
    const heading = raw.match(/^\s*#{2,4}\s*([A-Z]\d{2})\b/);
    if (heading) {
      current = heading[1];
      if (!EXPERT_QUESTION_BY_ID[current] || EXPERT_QUESTION_BY_ID[current].kind === "setting") {
        unknown.push(current);
        current = null;
      } else {
        found[current] = [];
      }
      continue;
    }
    if (current) found[current].push(raw.replace(/\s+$/, ""));
  }
  const answers = {};
  for (const [id, body] of Object.entries(found)) {
    const cleaned = body
      .filter((line) => !/^\s*(Frage|Spalten|Beispielzeile):/.test(line))
      .join("\n")
      .trim();
    if (cleaned) answers[id] = cleaned;
  }
  return { answers, unknown };
}
