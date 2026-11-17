/**
 * Marktanalyse – Regeln ("wenn … dann …").
 *
 * Jede Regel schaut auf den Kontext einer Analyse und liefert null oder eine
 * Wirkung. Der Text `rule` beschreibt die Regel in einfachen Worten; er steht
 * so in der Wissensansicht.
 *
 * Kontext: { subject, market, condition, ask, ageYears, kmPerYear, daysOnline, totals, knowledge }
 * Wirkung: {
 *   level     plus | info | warn | serious | killer
 *   text      Satz für den Bericht
 *   ask       Frage an den Verkäufer (optional)
 *   deductPct Abschlag auf den Verkaufspreis in Prozent (optional)
 *   zonePct   Verhandlungszone verbreitern (+) oder verengen (−), in Prozentpunkten (optional)
 * }
 */

import { TUNING } from "./defaults.js";
import { RATING_LABEL, euro } from "../text.js";
import { trimExamples } from "../trim.js";

const has = (ctx, id) => ctx.condition.findings.some((finding) => finding.id === id);
const plus = (ctx, id) => ctx.condition.positives.some((positive) => positive.id === id);
const D = TUNING.deductions;

export const RULES = [
  { id: "ausschluss", rule: "Motorschaden, nicht fahrbereit oder Totalschaden → Finger weg. Getriebeschaden, Zylinderkopfdichtung oder Bastlerfahrzeug → deutlicher Hinweis; das Urteil richtet sich dann nach dem Preis.",
    test: (ctx) => {
      const exclude = ctx.condition.killer.filter((f) => ["motorschaden", "nichtFahrbereit", "totalschaden"].includes(f.id));
      if (exclude.length) return { level: "killer", text: `Ausschlussgrund laut Anzeige: ${ctx.condition.killer.map((f) => f.label).join(", ")}.` };
      return ctx.condition.killer.length
        ? { level: "warn", text: `Schwerer Schaden laut Anzeige: ${ctx.condition.killer.map((f) => f.label).join(", ")}. Reparaturaufwand vor dem Kauf klären.` } : null;
    } },

  { id: "unfallUnklar", rule: "Unfallschaden ohne klare Beschreibung → Hinweis, Schaden besichtigen.",
    test: (ctx) => has(ctx, "unfall")
      ? { level: "warn", text: "Unfallschaden: Umfang aus der Anzeige nicht sicher erkennbar – vor Ort besichtigen.", ask: "Was genau wurde beschädigt? Gibt es ein Gutachten oder Fotos vom Schaden?" } : null },

  { id: "portalBeschaedigt", rule: "Im Portal als Unfall-/Defektfahrzeug gekennzeichnet, die Anzeige beschreibt den Schaden selbst (z. B. Hagel) → Warnung, damit die Kennzeichnung sichtbar bleibt. Keine zusätzlichen Kosten.",
    test: (ctx) => {
      if (ctx.subject.accident !== "DAMAGED" || has(ctx, "unfall")) return null;
      const named = ctx.condition.findings.filter((f) => f.severity < 4 && f.cost).map((f) => f.label).slice(0, 3);
      return { level: "warn", text: `Im Portal als Unfall-/Defektfahrzeug gekennzeichnet.${named.length ? ` Die Anzeige nennt: ${named.join(", ")}.` : ""} Weitere Schäden vor Ort prüfen.` };
    } },

  { id: "vorschaden", rule: `Reparierter Vorschaden → Verkaufspreis ${D.repairedAccident} % niedriger, Rechnung verlangen.`,
    test: (ctx) => has(ctx, "vorschaden")
      ? { level: "warn", text: `Reparierter Vorschaden: lässt sich nur mit Abschlag weiterverkaufen.`, deductPct: D.repairedAccident, ask: "Welcher Schaden war es und wer hat repariert? Rechnung vorhanden?" } : null },

  { id: "portalSchadenUnklar", rule: "Portal meldet „beschädigt“ und „unfallfrei“, der Schaden wird nicht beschrieben → Pauschale für unklare Mängel.",
    test: (ctx) => ctx.condition.portalDamageUnclear
      ? { level: "serious", text: "Das Portal meldet „beschädigt“ und „unfallfrei“. Art und Umfang des Schadens sind unklar.", ask: "Was genau ist beschädigt? Gibt es Fotos vom Schaden?" } : null },

  { id: "widerspruch", rule: "Portal sagt „unfallfrei“, der Text nennt aber einen Unfall oder Vorschaden → ernstes Risiko.",
    test: (ctx) => (ctx.subject.accident === "NONE" || ctx.condition.portalDamageAccidentFree)
      && (has(ctx, "unfall") || has(ctx, "unfallLeicht") || has(ctx, "vorschaden"))
      ? { level: "serious", text: "Widerspruch: als unfallfrei eingestellt, im Text steht aber ein Unfall- oder Vorschaden." } : null },

  { id: "ernsteMaengel", rule: "Unklarer Kilometerstand oder fehlende Papiere → ernstes Risiko. Schäden (Ölverbrauch, Turbolader, unrunder Motorlauf, Hagel) → deutlicher Hinweis, ohne das Urteil zu verschieben.",
    test: (ctx) => {
      const found = ctx.condition.serious.filter((f) => !["unfall", "export"].includes(f.id));
      const legal = found.filter((f) => ["tacho", "papiere"].includes(f.id));
      const damage = found.filter((f) => !["tacho", "papiere"].includes(f.id));
      if (legal.length) return { level: "serious", text: `Ernstes Risiko laut Anzeige: ${legal.map((f) => f.label).join(", ")}.${damage.length ? ` Außerdem: ${damage.map((f) => f.label).join(", ")}.` : ""}` };
      return damage.length ? { level: "warn", text: `Schaden laut Anzeige: ${damage.map((f) => f.label).join(", ")}.` } : null;
    } },

  { id: "export", rule: "Verkauf nur an Gewerbe / Export → meist bekannte Mängel, ernstes Risiko.",
    test: (ctx) => has(ctx, "export")
      ? { level: "serious", text: "Als Gewerbe- / Exportfahrzeug angeboten: meist mit bekannten Mängeln und ohne jede Zusage." } : null },

  { id: "preisAuffaellig", rule: `Preis mehr als ${TUNING.suspiciousBelowPct} % unter Marktwert und kein Mangel genannt → Verdacht auf versteckten Mangel oder Betrug.`,
    test: (ctx) => ctx.market.value && ctx.ask < ctx.market.value * (1 - TUNING.suspiciousBelowPct / 100) && !ctx.condition.costs.length && !ctx.condition.killer.length && !ctx.condition.serious.length
      ? { level: "warn", text: `Preis liegt ${Math.round((1 - ctx.ask / ctx.market.value) * 100)} % unter dem Marktwert, ohne dass die Anzeige einen Grund nennt – auf versteckte Mängel und Betrug achten.`, ask: "Warum ist der Preis so niedrig? Fahrzeug vor Ort prüfen, keine Anzahlung." } : null },

  { id: "vieleHalter", rule: `Viele Halter für das Alter (ab 4, oder ab 3 bei unter 6 Jahren) → Verkaufspreis ${D.manyOwners} % niedriger.`,
    test: (ctx) => ctx.subject.owners >= 4 || (ctx.subject.owners >= 3 && ctx.ageYears < 6)
      ? { level: "warn", text: `${ctx.subject.owners} Halter in ${Math.max(1, Math.round(ctx.ageYears))} Jahren: schwerer zu verkaufen.`, deductPct: D.manyOwners } : null },

  { id: "keinScheckheft", rule: "Kein Scheckheft bei einem Auto unter 10 Jahren → Warnung.",
    test: (ctx) => has(ctx, "keinScheckheft") && ctx.ageYears < 10
      ? { level: "warn", text: "Kein Scheckheft / keine Belege: Käufer fragen danach, der Verkauf wird schwerer." } : null },

  { id: "scheckheftFragen", rule: "Scheckheft in der Anzeige nicht erwähnt → beim Verkäufer nachfragen.",
    test: (ctx) => !has(ctx, "keinScheckheft") && !plus(ctx, "plusScheckheft") && ctx.subject.serviceHistory !== "YES"
      ? { level: "info", text: "Scheckheft wird in der Anzeige nicht erwähnt.", ask: "Ist das Fahrzeug scheckheftgepflegt? Letzter Service wann und bei welchem km-Stand?" } : null },

  { id: "flotte", rule: `Mietwagen, Taxi oder Fahrschule → Verkaufspreis ${D.fleetHistory} % niedriger.`,
    test: (ctx) => has(ctx, "flotte")
      ? { level: "warn", text: `Vornutzung als Mietwagen / Taxi / Fahrschule: muss beim Verkauf genannt werden.`, deductPct: D.fleetHistory } : null },

  { id: "import", rule: `EU-Import / Reimport → Verkaufspreis ${D.importCar} % niedriger.`,
    test: (ctx) => has(ctx, "import") || /eu[ -]?ausf|import/i.test(ctx.subject.countryVersion || "")
      ? { level: "info", text: `EU-Fahrzeug / Import: Ausstattung und Garantie weichen ab.`, deductPct: D.importCar } : null },

  { id: "tuning", rule: "Tuning oder Umbauten → kleinerer Käuferkreis, Eintragungen prüfen.",
    test: (ctx) => has(ctx, "tuning")
      ? { level: "warn", text: "Tuning / Umbauten: kleinerer Käuferkreis.", ask: "Sind alle Umbauten eingetragen? Originalteile vorhanden?" } : null },

  { id: "zeitdruck", rule: "Verkäufer unter Zeitdruck → mehr Verhandlungsspielraum (+5 Punkte).",
    test: (ctx) => has(ctx, "druck") ? { level: "info", text: "Verkäufer hat es eilig: Verhandlungsspielraum.", zonePct: 5 } : null },

  { id: "langeOnline", rule: "Anzeige länger als 60 Tage online → Verkäufer ist verhandlungsbereit (+5 Punkte).",
    test: (ctx) => ctx.daysOnline !== null && ctx.daysOnline > 60
      ? { level: "info", text: `Anzeige seit ${ctx.daysOnline} Tagen online: Verkäufer dürfte verhandlungsbereit sein.`, zonePct: 5 } : null },

  { id: "frisch", rule: "Anzeige jünger als 3 Tage und Preis im Limit → schnell handeln.",
    test: (ctx) => ctx.daysOnline !== null && ctx.daysOnline <= 3 && ctx.limit && ctx.ask <= ctx.limit
      ? { level: "plus", text: "Anzeige ist ganz neu und der Preis passt: schnell anrufen, bevor es ein anderer tut." } : null },

  { id: "vb", rule: "Preis ist Verhandlungsbasis → etwas mehr Spielraum (+2 Punkte).",
    test: (ctx) => ctx.subject.negotiable ? { level: "info", text: "Preis ist als Verhandlungsbasis angegeben.", zonePct: 3 } : null },

  { id: "haendler", rule: "Anbieter ist selbst Händler → wenig Spielraum (−4 Punkte).",
    test: (ctx) => ctx.subject.sellerType === "DEALER"
      ? { level: "info", text: "Angebot eines Händlers: seine Marge ist im Preis schon enthalten, wenig Spielraum.", zonePct: -4 } : null },

  { id: "kmHoch", rule: "Kilometerstand ab der Grenze aus den Einstellungen (Standard 150.000 km) → Warnung: kleiner Käuferkreis, höheres Gewährleistungsrisiko.",
    test: (ctx) => {
      const km = ctx.subject.mileageKm;
      const warn = ctx.settings?.kmWarn ?? 150000;
      if (km >= warn) return { level: "warn", text: `${km.toLocaleString("de-DE")} km: kleiner Käuferkreis, höheres Gewährleistungsrisiko.` };
      return null;
    } },

  { id: "kmWenig", rule: "Sehr wenig km für das Alter (unter 3.000 km pro Jahr bei über 8 Jahren) → Kilometerstand belegen lassen.",
    test: (ctx) => ctx.ageYears > 8 && ctx.kmPerYear < 3000
      ? { level: "info", text: "Sehr wenig Kilometer für das Alter.", ask: "Lässt sich der Kilometerstand belegen (HU-Berichte, Rechnungen)?" } : null },

  { id: "kmViel", rule: "Über 35.000 km pro Jahr → Vielfahrer, Verschleiß prüfen.",
    test: (ctx) => ctx.ageYears >= 1 && ctx.kmPerYear > 35000
      ? { level: "info", text: `Vielfahrer (rund ${Math.round(ctx.kmPerYear / 1000) * 1000} km pro Jahr): Verschleißteile genau prüfen.` } : null },

  { id: "alt", rule: "Älter als 15 Jahre → Rost, Standzeit und TÜV-Risiko steigen.",
    test: (ctx) => ctx.ageYears > 15 ? { level: "info", text: `${Math.round(ctx.ageYears)} Jahre alt: Rost und TÜV-Risiko steigen, Standzeit oft lang.` } : null },

  { id: "wenigVergleich", rule: "Weniger als 6 Vergleichsfahrzeuge → Marktwert unsicher.",
    test: (ctx) => ctx.market.value && ctx.market.n < 6
      ? { level: "info", text: `Nur ${ctx.market.n} vergleichbare Händlerangebote: Marktwert ist unsicher.` } : null },

  { id: "streuung", rule: "Preise der Vergleichsfahrzeuge streuen stark (über 20 %) → Marktwert unsicher.",
    test: (ctx) => ctx.market.spreadPct !== null && ctx.market.spreadPct >= 20
      ? { level: "info", text: `Die Preise vergleichbarer Autos streuen stark (${ctx.market.spreadPct} %).` } : null },

  { id: "konkurrenz", rule: "Sehr viele gleiche Angebote am Markt (über 150) → längere Standzeit, strenger verhandeln (−2 Punkte).",
    test: (ctx) => ctx.totals.max > 150
      ? { level: "info", text: `Viel Konkurrenz: über ${ctx.totals.max} ähnliche Angebote auf einem Portal – mit längerer Standzeit rechnen.`, zonePct: -2 } : null },

  { id: "selten", rule: "Sehr wenige gleiche Angebote (unter 8 auf allen Portalen) → seltenes Auto, verkauft sich über den Preis schwer vergleichbar.",
    test: (ctx) => ctx.totals.known && ctx.totals.sum < 8 && ctx.market.step >= 2
      ? { level: "info", text: "Seltenes Auto: kaum direkte Vergleichsangebote am Markt." } : null },

  { id: "standzeit", rule: "Gedächtnis: dieses Modell steht bei Händlern im Schnitt über 60 Tage → Hinweis.",
    test: (ctx) => ctx.knowledge.daysToSell && ctx.knowledge.daysToSell.n >= 8 && ctx.knowledge.daysToSell.median > 60
      ? { level: "info", text: `Aus früheren Analysen: vergleichbare Angebote stehen im Mittel rund ${Math.round(ctx.knowledge.daysToSell.median)} Tage.` } : null },

  { id: "vertrauen", rule: "1. Hand und Scheckheft (und Garage / Rentner) → Pluspunkt, verkauft sich leichter.",
    test: (ctx) => (plus(ctx, "plusErsteHand") || ctx.subject.owners === 1) && (plus(ctx, "plusScheckheft") || ctx.subject.serviceHistory === "YES")
      ? { level: "plus", text: `1. Hand und scheckheftgepflegt${plus(ctx, "plusGarage") ? ", gepflegtes Garagen- / Rentnerfahrzeug" : ""}: verkauft sich gut.` } : null },

  { id: "erneuert", rule: "Teure Teile laut Anzeige erneuert (Kupplung, Zahnriemen, Bremsen …) → Pluspunkt, Rechnung verlangen.",
    test: (ctx) => {
      const done = ctx.condition.positives.filter((p) => p.id.startsWith("neu-"));
      return done.length ? { level: "plus", text: `Laut Anzeige erneuert: ${done.map((p) => p.label.replace(": erneuert", "")).join(", ")}.`, ask: "Gibt es Rechnungen für die erneuerten Teile?" } : null;
    } },

  { id: "tuevNeu", rule: "TÜV neu → Pluspunkt.",
    test: (ctx) => plus(ctx, "plusTuevNeu") || /neu/i.test(ctx.subject.tuv || "") ? { level: "plus", text: "TÜV neu." } : null },

  { id: "extras", rule: "8-fach bereift, Nichtraucher, Garantie → Pluspunkt.",
    test: (ctx) => {
      const found = ["plusReifen", "plusNichtraucher", "plusGarantie"].filter((id) => plus(ctx, id)).map((id) => ctx.condition.positives.find((p) => p.id === id).label);
      return found.length ? { level: "plus", text: `${found.join(", ")}.` } : null;
    } },

  { id: "elektro", rule: "Elektroauto → Batteriezustand (SoH) erfragen.",
    test: (ctx) => ctx.subject.fuel === "ELECTRIC"
      ? { level: "info", text: "Elektroauto: der Batteriezustand bestimmt den Wert.", ask: "Gibt es ein Batteriezertifikat (SoH)? Ist die Batterie gekauft oder gemietet?" } : null },

  { id: "dieselEuro", rule: `Diesel mit Euro 5 → Verkaufspreis ${D.dieselEuro5} % niedriger; Euro 4 oder älter → ${D.dieselEuro4} % niedriger (Fahrverbote, kleiner Käuferkreis).`,
    test: (ctx) => ctx.subject.fuel === "DIESEL" && ctx.subject.emission && ctx.subject.emission <= 5
      ? { level: "warn", text: `Diesel mit Euro ${ctx.subject.emission}: wegen Fahrverboten schwer zu verkaufen.`, deductPct: ctx.subject.emission === 5 ? D.dieselEuro5 : D.dieselEuro4 } : null },

  { id: "preisGesenkt", rule: "Verkäufer hat den Preis schon gesenkt → er wird das Auto nicht los, mehr Verhandlungsspielraum (+3 Punkte).",
    test: (ctx) => ctx.subject.oldPrice > ctx.ask
      ? { level: "info", text: `Der Preis wurde schon um ${euro(ctx.subject.oldPrice - ctx.ask)} gesenkt (vorher ${euro(ctx.subject.oldPrice)}): Verhandlungsspielraum.`, zonePct: 3 } : null },

  { id: "marktReduziert", rule: `Mindestens ${Math.round(TUNING.reducedShare * 100)} % der vergleichbaren Händler haben den Preis schon gesenkt → die Angebotspreise liegen über dem, was Käufer zahlen; Verkaufspreis ${D.reducedMarket} % niedriger.`,
    test: (ctx) => ctx.market.reduced && ctx.market.reduced.of >= 5 && ctx.market.reduced.share >= TUNING.reducedShare
      ? { level: "info", text: `${ctx.market.reduced.n} von ${ctx.market.reduced.of} vergleichbaren Händlern haben den Preis schon gesenkt: Der Markt gibt die Angebotspreise nicht her.`, deductPct: D.reducedMarket } : null },

  { id: "generationUnklar", rule: "Generation des Fahrzeugs nicht eindeutig (Jahr des Modellwechsels, kein Hinweis im Titel) → Marktwert kann zwei Generationen mischen.",
    test: (ctx) => ctx.market.generation?.note ? { level: "warn", text: ctx.market.generation.note, ask: "Welche Modellgeneration ist es genau (Typ laut Fahrzeugschein)?" } : null },

  { id: "zahnriemenFaellig", rule: "Zahnriemen-Motor nahe am oder über dem Wechselintervall und die Anzeige nennt keinen Wechsel → Warnung und Frage an den Verkäufer. Kosten werden nicht eingerechnet.",
    test: (ctx) => {
      const t = ctx.timing;
      if (!t || !t.state) return null;
      const question = "Wann wurde der Zahnriemen zuletzt gewechselt (Datum, km-Stand)? Rechnung vorhanden?";
      if (t.drive === "unclear") return { level: "info", text: `Zahnriemen oder Steuerkette: aus der Anzeige nicht sicher zu erkennen (${t.engine}).`, ask: `Hat der Motor Zahnriemen oder Steuerkette? ${question}` };
      if (t.state === "cost") return { level: "warn", text: `${t.label} (${t.engine}): Wechsel etwa alle ${t.interval} fällig, die Anzeige nennt keinen Wechsel. Kosten sind nicht eingerechnet.`, ask: question };
      return { level: "info", text: t.interval
        ? `${t.label} (${t.engine}): ${t.estimated ? "Richtwert" : "Wechsel etwa alle"} ${t.interval}${t.sure ? "" : " – Angabe nicht sicher"}. Wartungsplan und letzten Wechsel prüfen; die Anzeige nennt keinen Wechsel. Kosten sind nicht eingerechnet.`
        : `${t.label} (${t.engine}): Die Anzeige nennt keinen Wechsel; das Intervall kenne ich für diesen Motor nicht.`, ask: question };
    } },

  { id: "linieUnklar", rule: "Ausstattungslinie des Fahrzeugs nicht erkannt, obwohl die Vergleichsfahrzeuge meist eine nennen → Marktwert mischt alle Linien.",
    test: (ctx) => ctx.market.value && !ctx.market.trim && ctx.market.trimKnown && ctx.market.trimKnown.of >= 5 && ctx.market.trimKnown.n / ctx.market.trimKnown.of >= 0.5
      ? { level: "info", text: "Die Anzeige nennt keine Ausstattungslinie: Der Marktwert ist ein Mittel über alle Linien.", ask: trimExamples(ctx.subject.make) ? `Welche Ausstattungslinie ist es (z. B. ${trimExamples(ctx.subject.make)})?` : "Welche Ausstattungslinie ist es?" } : null },

  { id: "portalGuenstig", rule: "Portal bewertet den Preis als gut oder sehr gut, unsere Rechnung sagt zu teuer → Hinweis, warum beides stimmen kann.",
    test: (ctx) => ctx.subject.rating && ctx.subject.rating <= 2 && ctx.limit !== null && ctx.ask > ctx.limit * (1 + TUNING.negotiationZonePct / 100)
      ? { level: "info", text: `Das Portal nennt den Preis „${RATING_LABEL[ctx.subject.rating]}“. Das gilt für Endkunden: Es vergleicht mit allen Angeboten und kennt weder die Gewinnspanne noch die nötigen Arbeiten.` } : null },

  { id: "portalTeuer", rule: "Portal bewertet den Preis als erhöht oder hoch, unsere Rechnung sagt kaufen → Vergleichsfahrzeuge prüfen.",
    test: (ctx) => ctx.subject.rating && ctx.subject.rating >= 4 && ctx.limit !== null && ctx.ask <= ctx.limit
      ? { level: "warn", text: `Das Portal nennt den Preis „${RATING_LABEL[ctx.subject.rating]}“, unsere Rechnung hält ihn für günstig. Bitte die Vergleichsfahrzeuge prüfen – vielleicht passen Ausstattung oder Motor nicht.` } : null },

  { id: "schluessel", rule: "Nur ein Schlüssel oder fehlende Papiere → nachfragen.",
    test: (ctx) => has(ctx, "schluessel") ? { level: "info", text: "Nur ein Schlüssel vorhanden: Zweitschlüssel kostet extra." } : null },
];
