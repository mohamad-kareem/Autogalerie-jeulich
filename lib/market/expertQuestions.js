/**
 * Expertenwissen: 100 questions for an experienced used-car dealer.
 *
 * The answers are saved in the database and given to the deep analysis
 * ("Tief") as the dealer's own rules and experience, so the AI judges a car
 * the way this business does — its margins, its customers, its region, the
 * engines it avoids and what repairs really cost here.
 *
 * Ids are stable ("B03"); never renumber them, the saved answers hang on them.
 * `hint` shows the expected form of the answer.
 */

export const EXPERT_CATEGORIES = [
  { id: "A", title: "Einkauf & Kalkulation" },
  { id: "B", title: "Verkauf & Standzeit" },
  { id: "C", title: "Marktwert & Preisfindung" },
  { id: "D", title: "Motoren & bekannte Schwachstellen" },
  { id: "E", title: "Zahnriemen, Steuerkette & Wartung" },
  { id: "F", title: "Getriebe, Antrieb & Fahrwerk" },
  { id: "G", title: "Besichtigung & Zustand" },
  { id: "H", title: "Papiere, Historie & Gewährleistung" },
  { id: "I", title: "Verhandlung & Verkäufer" },
  { id: "J", title: "Region & Betrieb" },
];

const Q = (id, question, hint = "") => ({ id, category: id[0], question, hint });

export const EXPERT_QUESTIONS = [
  /* A — Einkauf & Kalkulation */
  Q("A01", "Welchen Gewinn brauchst du mindestens pro Fahrzeug – je nach Verkaufspreis (VK) des Autos?", "z. B. VK unter 5.000 €: 800 € · VK 5–10.000 €: 1.200 € · VK 10–20.000 €: 1.800 € · VK über 20.000 €: 9 %"),
  Q("A02", "In welcher Preisklasse kaufst du am liebsten ein – und warum?", "z. B. 6.000–15.000 €, weil …"),
  Q("A03", "Welche Fahrzeuge kaufst du grundsätzlich nicht an? Bitte mit Grund.", "Marke / Modell / Motor / Alter / km – Grund"),
  Q("A04", "Ab welchem Kilometerstand wird ein Auto für dich schwer verkäuflich – je nach Fahrzeugklasse?", "Kleinwagen: … km · Kompakt: … km · Diesel-Kombi: … km · Oberklasse: … km"),
  Q("A05", "Ab welchem Alter (Erstzulassung) wird es schwierig – und gibt es Ausnahmen?", "z. B. älter als 12 Jahre nur Toyota/Honda …"),
  Q("A06", "Wie viel Abschlag rechnest du, wenn die HU in weniger als 6 Monaten fällig ist?", "in € oder was du gedanklich für HU + Mängel abziehst"),
  Q("A07", "Wie viel weniger zahlst du für ein Auto mit fachgerecht repariertem Unfallschaden als für ein unfallfreies?", "in % – je nach Schwere"),
  Q("A08", "Wie bewertest du Re-Importe / EU-Fahrzeuge im Einkauf?", "Abschlag in %, worauf du achtest"),
  Q("A09", "Wie viele Vorbesitzer sind für dich noch in Ordnung – und wie viel Abschlag ab dem 3. / 4. Halter?", ""),
  Q("A10", "Wie stark drückt ein fehlendes oder lückenhaftes Scheckheft den Einkaufspreis?", "in € oder %"),

  /* B — Verkauf & Standzeit */
  Q("B01", "Welche Marken und Modelle verkaufen sich bei euch am schnellsten (unter 30 Tagen)?", "Modell – typische Standzeit"),
  Q("B02", "Welche Fahrzeuge stehen bei euch am längsten – und warum?", ""),
  Q("B03", "Nach wie vielen Tagen senkst du den Preis, und um wie viel?", "z. B. nach 30 Tagen −300 €, nach 60 Tagen −5 %"),
  Q("B04", "Wie viel Nachlass bekommen eure Kunden im Durchschnitt vom Inseratspreis?", "in % oder €"),
  Q("B05", "Wer sind eure typischen Käufer, und was suchen sie?", "Familien, Fahranfänger, Pendler, Handwerker, Export …"),
  Q("B06", "Welche Farben verkaufen sich schlecht – und wie viel ziehst du dafür ab?", ""),
  Q("B07", "Automatik oder Schaltgetriebe: Wie groß ist der Preisunterschied, und was verkauft sich schneller?", "je Fahrzeugklasse"),
  Q("B08", "Diesel oder Benzin: Was läuft bei euch aktuell besser? Gibt es Grenzen (Euro-Norm, Umweltzone, Kilometer)?", ""),
  Q("B09", "Welche Rolle spielt die Jahreszeit beim Verkauf?", "Cabrio, Allrad, Klima, SUV …"),
  Q("B10", "Welche Ausstattung erwarten eure Kunden unbedingt? Ohne was bleibt ein Auto stehen?", "Klima, Navi, Rückfahrkamera, AHK, Sitzheizung …"),

  /* C — Marktwert & Preisfindung */
  Q("C01", "Welche Plattformen nutzt du für die Preisfindung – und welchen Preisen traust du am meisten?", ""),
  Q("C02", "Wie weit unter dem Marktdurchschnitt muss ein Auto im Einkauf liegen, damit es sich lohnt?", "in % oder €"),
  Q("C03", "Wie viel mehr ist eine Topausstattung (Highline, AMG Line, M Sport, S line …) wert als die Basis?", "in % oder € – je Klasse"),
  Q("C04", "Wie viel Unterschied machen 10.000 km mehr oder weniger – Kleinwagen / Kompakt / Oberklasse?", ""),
  Q("C05", "Welche Ausstattungsmerkmale steigern den Wiederverkaufswert wirklich – mit ungefährem Betrag?", "Pano-Dach: … € · LED-Matrix: … € · AHK: … €"),
  Q("C06", "Welche Inserate ignorierst du bei der Preisfindung?", "Lockangebote, Exportpreise, Netto-Preise, Händler ohne Bewertung …"),
  Q("C07", "Wie weit liegen Privatangebote im Durchschnitt unter Händlerpreisen?", "in %"),
  Q("C08", "Welche Händler oder Plattformen haben in deiner Region die realistischsten Preise?", ""),
  Q("C09", "Woran erkennst du ein Inserat, das viel zu teuer ist und nicht verkauft wird?", ""),
  Q("C10", "Wie gehst du mit seltenen Fahrzeugen um, für die es kaum Vergleiche gibt?", ""),

  /* D — Motoren & bekannte Schwachstellen */
  Q("D01", "Welche Motoren meidest du wegen bekannter Probleme? Bitte Marke, Motor und Problem.", "z. B. VW 1.4 TSI (CAXA) – Steuerkette · Ford 1.0 EcoBoost – Zahnriemen im Ölbad"),
  Q("D02", "Welche Motoren sind für dich besonders zuverlässig und gut verkäuflich?", "Marke – Motor"),
  Q("D03", "Welche Diesel haben Probleme mit DPF, AGR oder AdBlue – und was kostet die Reparatur ungefähr?", "Motor – Problem – Kosten"),
  Q("D04", "Bei welchen Motoren ist die Steuerkette ein bekanntes Problem? Ab welchem Kilometerstand, und was kostet der Wechsel?", "Motor – ab … km – Kosten"),
  Q("D05", "Welche Turbobenziner haben bekannte Probleme (Ölverbrauch, Kolbenringe, Zündspulen, Turbo)?", "Motor – Problem – Kosten"),
  Q("D06", "Kaufst du Hybrid- oder Elektrofahrzeuge an? Worauf achtest du bei der Batterie?", "SoH-Test, Garantie, Ladeleistung …"),
  Q("D07", "Welche Motoren haben häufig Probleme mit Kopfdichtung, Wasserpumpe oder Kühlung?", ""),
  Q("D08", "Welche Modelle haben bekannte Rostprobleme – und wo genau?", "Modell – Stelle"),
  Q("D09", "Bei welchen Motoren fallen oft Injektoren aus – und was kostet das?", ""),
  Q("D10", "Welche Fahrzeuge haben teure Elektronikprobleme (Steuergeräte, Infotainment, Sensoren)?", "Modell – Problem – Kosten"),

  /* E — Zahnriemen, Steuerkette & Wartung */
  Q("E01", "Welche Motoren haben einen Zahnriemen, und nach wie vielen km / Jahren muss er gewechselt werden?", "Marke – Motor – Intervall (z. B. VW 2.0 TDI – 210.000 km / 10 Jahre)"),
  Q("E02", "Was kostet bei euch ein Zahnriemenwechsel inkl. Wasserpumpe?", "Kleinwagen: … € · Mittelklasse: … € · V6: … €"),
  Q("E03", "Welche Motoren haben einen Zahnriemen im Ölbad, und wie gehst du damit um?", "z. B. Peugeot 1.2 PureTech, Ford 1.0 EcoBoost"),
  Q("E04", "Wie prüfst du, ob der Zahnriemen wirklich gewechselt wurde?", "Rechnung, Aufkleber, Werkstattanruf …"),
  Q("E05", "Was kostet eine große Inspektion ungefähr – je Fahrzeugklasse?", ""),
  Q("E06", "Was kostet bei euch ein Ölwechsel mit Filter?", ""),
  Q("E07", "Welche Wartungsarbeiten machst du vor jedem Verkauf immer?", ""),
  Q("E08", "Wann ist ein Getriebeölwechsel (DSG, Wandler, CVT) fällig, und was kostet er?", ""),
  Q("E09", "Was kosten bei euch Bremsscheiben und -beläge vorne / hinten?", "je Fahrzeugklasse"),
  Q("E10", "Was kosten vier neue Reifen – Kleinwagen / Kompakt / SUV?", ""),

  /* F — Getriebe, Antrieb & Fahrwerk */
  Q("F01", "Welche Automatikgetriebe meidest du? Problem und Reparaturkosten?", "z. B. DSG DQ200, Ford Powershift, CVT …"),
  Q("F02", "Woran erkennst du bei der Probefahrt einen Getriebeschaden?", ""),
  Q("F03", "Was kostet eine Kupplung inkl. Zweimassenschwungrad – je Fahrzeugklasse?", ""),
  Q("F04", "Welche Modelle haben Probleme mit dem Allradsystem (Haldex, xDrive, 4MATIC …)?", ""),
  Q("F05", "Welche Fahrwerksprobleme sind typisch, und was kosten sie?", "Querlenker, Koppelstangen, Federn, Stoßdämpfer"),
  Q("F06", "Wie prüfst du eine Luftfederung, und was kostet ein Defekt?", ""),
  Q("F07", "Welche Lenkungsprobleme sind bekannt (z. B. elektrische Servolenkung)?", ""),
  Q("F08", "Welche Klimaanlagen-Probleme sind häufig, und was kostet die Reparatur?", ""),
  Q("F09", "Welche Geräusche beim Fahren sind für dich ein Ausschlussgrund?", ""),
  Q("F10", "Wie gehst du mit einer leuchtenden Motorkontrollleuchte um?", "kaufen / nicht kaufen / Abschlag"),

  /* G — Besichtigung & Zustand */
  Q("G01", "Was prüfst du bei einer Besichtigung immer zuerst? (Reihenfolge)", ""),
  Q("G02", "Wie misst du den Lack, und ab welchen Werten wird es kritisch?", "z. B. über 200 µm = nachlackiert"),
  Q("G03", "Woran erkennst du einen manipulierten Kilometerstand?", ""),
  Q("G04", "Worauf achtest du bei der Probefahrt (Strecke, Dauer, Kaltstart …)?", ""),
  Q("G05", "Welche Fehlerspeicher-Einträge sind für dich ein Ausschlussgrund?", ""),
  Q("G06", "Was kostet die Aufbereitung innen und außen – je Fahrzeugklasse?", ""),
  Q("G07", "Was kostet Smart Repair ungefähr (Kratzer, Delle, Felge)?", ""),
  Q("G08", "Was kosten Innenraumschäden (Brandloch, Sitz, Raucherauto)?", ""),
  Q("G09", "Wie gehst du mit Tierhaaren oder Geruch im Fahrzeug um – und was kostet das?", ""),
  Q("G10", "Woran erkennst du einen schlecht reparierten Unfallschaden?", ""),

  /* H — Papiere, Historie & Gewährleistung */
  Q("H01", "Welche Papiere müssen beim Ankauf vollständig sein?", "Brief, Schein, COC, Serviceheft, Rechnungen, Schlüssel …"),
  Q("H02", "Was machst du, wenn der Fahrzeugbrief fehlt oder der Verkäufer nicht im Brief steht?", ""),
  Q("H03", "Wie prüfst du, ob ein Fahrzeug finanziert, geleast oder gestohlen ist?", ""),
  Q("H04", "Wie wichtig ist dir die Historie aus Herstellerdaten (digitales Serviceheft)?", ""),
  Q("H05", "Wie bewertest du ehemalige Mietwagen, Taxis oder Firmenwagen?", "Abschlag, Risiken"),
  Q("H06", "Was ist dir bei Importfahrzeugen wichtig (Papiere, COC, Zulassung)?", ""),
  Q("H07", "Wie gehst du mit offenen Rückrufen um?", ""),
  Q("H08", "Was kostet bei euch eine neue HU/AU inklusive typischer Mängelbeseitigung?", ""),
  Q("H09", "Welche Garantie gibst du beim Verkauf, und was kostet sie dich?", ""),
  Q("H10", "Welche Reklamationen hattet ihr nach dem Verkauf am häufigsten – bei welchen Modellen?", "Modell – Problem – Kosten"),

  /* I — Verhandlung & Verkäufer */
  Q("I01", "Wie viel Nachlass vom Inseratspreis verlangst du im Ankauf normalerweise?", "in % – privat / Händler"),
  Q("I02", "Welche Argumente nutzt du in der Verhandlung am liebsten?", ""),
  Q("I03", "Wie verhandelst du mit Privatleuten anders als mit Händlern?", ""),
  Q("I04", "Ab wann brichst du eine Verhandlung ab?", ""),
  Q("I05", "Wann zahlst du bewusst etwas mehr, um ein gutes Auto zu bekommen?", ""),
  Q("I06", "Woran erkennst du einen unseriösen Verkäufer?", ""),
  Q("I07", "Ab wie vielen Tagen online erwartest du mehr Nachlass?", ""),
  Q("I08", "Wie wirkt sich eine Preissenkung im Inserat auf deine Verhandlung aus?", ""),
  Q("I09", "Was sagst du einem Verkäufer, dessen Preis deutlich über dem Markt liegt?", ""),
  Q("I10", "Kaufst du auch ohne Besichtigung (nur Fotos / Gutachten)? Unter welchen Bedingungen?", ""),

  /* J — Region & Betrieb */
  Q("J01", "In welchem Umkreis kaufst du ein, und wie holst du die Fahrzeuge ab?", "Zug, Fahrer, Transporter – bis … km"),
  Q("J02", "Was kostet euch eine Abholung ungefähr (Zeit und Geld)?", ""),
  Q("J03", "Welche Fahrzeuge verkaufen sich in eurer Region (Jülich / Düren / Aachen) besonders gut?", ""),
  Q("J04", "Wie viele Fahrzeuge habt ihr gleichzeitig im Bestand, und welche Preisklasse ist am wichtigsten?", ""),
  Q("J05", "Was kostet euch ein Standtag ungefähr (Platz, Kapital, Versicherung)?", "€ pro Tag"),
  Q("J06", "Verkauft ihr auch an Exporthändler? Welche Fahrzeuge, und zu welchem Preis?", ""),
  Q("J07", "Welche Fahrzeuge lohnen sich nur für den Export und nicht für eure Kunden?", ""),
  Q("J08", "Welche Fehler hast du beim Einkauf schon gemacht, die die Analyse verhindern soll?", ""),
  Q("J09", "Welches Fahrzeug war dein bester Einkauf – und warum?", ""),
  Q("J10", "Was soll die Analyse dir am Ende auf einen Blick sagen? Was fehlt dir heute am meisten?", ""),
];

export const EXPERT_QUESTION_BY_ID = Object.fromEntries(EXPERT_QUESTIONS.map((q) => [q.id, q]));
