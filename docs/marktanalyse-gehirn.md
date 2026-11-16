# Marktanalyse – Aufbau und Pflege des „Gehirns“

Stand: November 2026. Diese Datei erklärt, wie die Marktanalyse gebaut ist und wie
sie gepflegt wird. Wer (Mensch oder Claude) in einem neuen Gespräch weiterarbeitet,
liest zuerst diese Datei.

## Was die Seite tut

Der Händler fügt den Link einer Anzeige ein (mobile.de, AutoScout24, Kleinanzeigen).
Die Marktanalyse liest das Fahrzeug, sucht vergleichbare Händlerangebote auf allen
drei Portalen, bildet daraus den Marktwert und sagt: **Kaufen / Kaufen, knapp /
Verhandeln bis X € / Finger weg** – gerechnet mit 2.300 bis 3.000 € Gewinn je Fahrzeug.

Vereinbart mit dem Auftraggeber:

- Jeder Link ist erlaubt (Privat und Händler). Nur am PC, mit Browser-Erweiterung.
- Keine mobile.de-API. Alle Portale werden über die Erweiterung im eigenen Browser gelesen.
- Vergleichsfahrzeuge deutschlandweit. Marktwert nur aus unbeschädigten Händlerangeboten.
- Verkaufspreis = Marktwert − 3 %.
- Zielpreis = Verkaufspreis − 3.000 € − nötige Arbeiten. Einkaufslimit = Verkaufspreis − 2.300 € − nötige Arbeiten.
- Normale Kosten (Aufbereitung, TÜV, Transport, Standzeit) stecken in der Gewinnspanne.
  Eine Position der Preisliste wird nur gerechnet, wenn die Anzeige einen Grund nennt.
- Keine Steuerrechnung. Der Bericht ist fest, es gibt keine Korrektur je Fahrzeug.
- „Verhandeln“: Angebotspreis bis 10 % über dem Einkaufslimit, sonst „Finger weg“.
- Kein KI-Dienst: das Gehirn ist ein eigenes Regelwerk. KI kann später als zweiter Leser dazukommen.

## Ablauf einer Analyse

1. **Browser** (`lib/marktanalyse/run.js`): holt über die Erweiterung die Anzeige, dann
   Suchseiten der drei Portale – in bis zu drei Schritten von eng nach weit
   (`TUNING.steps`), bis 10 gute Händlerangebote da sind.
2. **Server liest die Seiten** (`/api/marktanalyse/parse`): `subject.js` (Anzeige),
   `portalPages.js` (mobile.de, AutoScout24), `lib/neue-angebote/sources.js` (Kleinanzeigen-Trefferliste).
3. **Server bewertet** (`/api/marktanalyse/analyse`): `brain.js` → Bericht, `store.js` speichert
   Verlauf, Gedächtnis, unbekannte Hinweise und Regelzähler.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `lib/marktanalyse/knowledge/defaults.js` | Preisliste (Startwerte), Gewinn, alle Stellschrauben (`TUNING`) |
| `lib/marktanalyse/knowledge/dictionary.js` | Wörterbuch der Verkäufersprache (Schäden, Vorgeschichte, Pluspunkte) |
| `lib/marktanalyse/knowledge/rules.js` | Regeln „wenn … dann …“ mit Klartext |
| `lib/marktanalyse/knowledge/models.js` | Modellwissen: bekannte Schwachstellen (Hinweise, keine Diagnosen) |
| `lib/marktanalyse/knowledge/generations.js` | Modellgenerationen mit Bauzeit und Titelkennungen (Verbrenner, rund 130 Modelle) |
| `lib/marktanalyse/generation.js` | Generation bestimmen: Titel → AutoScout24-Nummer (`as24Gen`) → Erstzulassung; andere Generation wird ausgeschlossen |
| `lib/marktanalyse/search.js` | Suchfilter und Suchadressen der Portale, Link-Erkennung |
| `lib/marktanalyse/portalPages.js` | Portalseiten lesen (mobile.de Flight-Daten, AutoScout24 `__NEXT_DATA__`) |
| `lib/marktanalyse/subject.js` | Anzeige → einheitliches Fahrzeug |
| `lib/marktanalyse/comparables.js` | Auswahl, Bereinigung, Angleichen, Gewichten, Marktwert |
| `lib/marktanalyse/condition.js` | Zustand aus dem Anzeigentext (Verneinungen, „neu gemacht“, Teile zählen) |
| `lib/marktanalyse/brain.js` | Regeln anwenden, Preise, Urteil, Berichtstext |
| `lib/marktanalyse/store.js` | Datenbank: Einstellungen, Verlauf, Gedächtnis, Lernen, Wissensansicht |
| `lib/marktanalyse/run.js` | Ablauf im Browser |
| `lib/marktanalyse/sanitize.js` | Prüfung der Eingaben aus dem Browser |
| `app/(Pages)/marktanalyse/` | Seite, Bericht, Wissensansicht („Gehirn“), eigenes Stylesheet `marktanalyse.css` |
| `app/(Pages)/einstellungen/MarktanalyseSettings.jsx` | Preisliste und Gewinn |
| `app/api/marktanalyse/` | Schnittstellen |
| `models/MarktAnalyse.js`, `MarktOffer.js`, `MarktHinweis.js` | Verlauf, Marktgedächtnis, unbekannte Hinweise |
| `extensions/autogalerie-helper/` | Browser-Erweiterung Version 3 (ZIP: `public/downloads/autogalerie-helper.zip`) |
| `tests/marktanalyse.test.mjs` | Tests |

Tests: `node --experimental-default-type=module --test tests/marktanalyse.test.mjs`

## Daten der Portale, die das Gehirn nutzt

- **Generation** (`as24Gen`): AutoScout24 liefert sie bei jedem Treffer (`tracking.modelTaxonomy`) und im Anzeigenlink (`…ge8va…`).
- **Preissenkung** (`oldPrice`): mobile.de (durchgestrichener Preis), AutoScout24 (`superDeal`). Regeln `preisGesenkt`, `marktReduziert`.
- **Preisbewertung des Portals** (`rating`, 1 = sehr gut … 5 = hoch): nur Zweitmeinung, ändert keine Zahl. Regeln `portalGuenstig`, `portalTeuer`.
- **Schadstoffklasse** (`emission`, Euro 1–7): Regel `dieselEuro`; Diesel Euro 6 wird nicht mit Euro 5 und älter verglichen.
- Bewusst noch nicht genutzt: Halterzahl und HU der Vergleichsfahrzeuge.

## Was von selbst lernt

- **Marktgedächtnis** (`MarktOffer`): jedes gesehene Angebot (nur Fahrzeugdaten und Preise).
  Daraus: Wertverlust je km und Monat pro Modell (ab 25 Angeboten statt der Standardwerte),
  Standzeit (Angebot verschwindet aus einer vollständig gelesenen Suche), Preissenkungen.
- **Käufe**: Im Bericht meldet der Händler mit dem Knopf „Gekauft“ den Kauf und den Kaufpreis
  (`PATCH /api/marktanalyse/:id`, gespeichert in `feedback.boughtPrice`). Es gibt **keine automatische
  Zuordnung** zum Bestand – gekauft ist nur, was er selbst einträgt. Der Bericht zeigt danach den
  Abstand zum Einkaufslimit und den erwarteten Gewinn; die Wissensansicht und der Export („kaeufe“)
  zeigen, wie er im Schnitt zum Limit gekauft hat. Der Verkaufsabschlag bleibt fest (3 %), solange
  keine echten Verkaufspreise erfasst werden.
- **Unbekannte Hinweise** (`MarktHinweis`): Sätze, die nach Mangel klingen, aber nicht im
  Wörterbuch stehen. Sie zählen nicht ins Urteil und stehen im Bericht zum Selbstlesen.

Regeln, Wörterbuch und Modellwissen ändern sich **nie von selbst** – nur über die Dateien.

## Regelmäßige Pflege („schau ins Gehirn“)

1. Auf der Seite **Marktanalyse → Wissen anzeigen → Export für Claude** klicken.
   Die Datei `marktanalyse-export-JJJJ-MM-TT.json` landet im Download-Ordner.
2. Die Datei im Gespräch anhängen oder in den Projektordner legen und sagen: „Schau ins Gehirn“.
3. Zu tun:
   - `unbekannteHinweise` nach Häufigkeit durchgehen. Echte Mängel-Formulierungen in
     `dictionary.js` beim passenden Eintrag unter `patterns` ergänzen (normalisierte Schreibweise:
     klein, ä→ae, ö→oe, ü→ue, ß→ss) oder einen neuen Eintrag anlegen. Belanglose Sätze übergehen.
   - `regelZaehler` und `marktdaten` ansehen: Feuert eine Regel nie oder ständig? Passen die Grenzen?
   - Für neue Modelle mit bekannten Schwächen `models.js` ergänzen – immer mit Quelle.
   - Für jede Änderung einen Test in `tests/marktanalyse.test.mjs` ergänzen und die Tests laufen lassen.
4. Kurze Zusammenfassung an den Auftraggeber: was geändert wurde und warum; offene Fragen
   (z. B. „Stimmen 400 € für diese Reparatur?“). Live geht es mit dem nächsten Deployment.

## Wenn ein Portal seine Seite ändert

Zeichen: Im Fortschritt steht „nicht verfügbar“ oder „keine Trefferliste gefunden“.
Die Erweiterung muss dann meist nicht geändert werden – nur der Leser:

- mobile.de: `portalPages.js` → `parseMobileSearch` (sucht `"searchResults":{…"listings":[…]}`),
  `parseMobileListing` (`"listing":{"attributes":…}`), `parseMobileMs` (`"filterParams":{"ms":…}`).
- AutoScout24: `parseAutoScoutSearch` (`props.pageProps.listings`).
- Kleinanzeigen: `lib/neue-angebote/sources.js` → `parseKleinanzeigenPage`.
- Wann eine Seite „fertig geladen“ ist, entscheidet `readPage` in `extensions/autogalerie-helper/background.js`.

## Später geplant

- Tabelle Zahnriemen / Steuerkette mit Wechselintervallen (Marke, Motor, Baujahre, Antrieb, Intervall).
- Echter Verkaufspreis je gekauftem Fahrzeug („Verkauft für“), um Gewinn und Verkaufsabschlag zu prüfen.
- KI als zweiter Leser für Beschreibung und Fotos.

## Ausstattungslinien

- Tabelle: `lib/marktanalyse/knowledge/trims.js` (je Marke: base / mid / top / sport). Lesen: `lib/marktanalyse/trim.js` (`trimOf(make, titel)`).
- Vergleich: Basis gegen Top/Sport fliegt raus ("andere Ausstattungslinie"). Nachbarstufe wird über `TUNING.trimValuePct` umgerechnet und zählt mit `trimNeighbourWeight`; Vergleich ohne erkennbare Linie zählt mit `trimUnknownWeight`.
- Nennt das analysierte Auto keine Linie, gibt es keine Linien-Logik (Regel `linieUnklar` fragt nach).

## Zahnriemen / Steuerkette

- Tabelle: `lib/marktanalyse/knowledge/timing.js` (Motorfamilie: Marken, Kraftstoff, ccm, EZ-Jahre, Antrieb, Intervall; `est` = Richtwert, `unsure` = Antrieb unsicher). Lesen: `lib/marktanalyse/timing.js` (`timingOf(subject)`).
- Kosten (Preisliste `zahnriemen`) nur bei state "cost": Antrieb sicher, Intervall fest, Hubraum aus dem Portal, Wechsel nahe/überfällig (0,9–1,35 × Intervall bzw. nahe am nächsten Vielfachen), Anzeige nennt keinen Wechsel. Sonst Regel `zahnriemenFaellig` nur als Frage.
