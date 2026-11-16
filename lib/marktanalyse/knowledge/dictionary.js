/**
 * Marktanalyse – Wörterbuch der Verkäufersprache.
 *
 * Jede Zeile beschreibt eine Formulierung aus Anzeigen und was sie für den
 * Händler bedeutet. Die Muster laufen über normalisierten Text
 * (Kleinbuchstaben, ä→ae, ö→oe, ü→ue, ß→ss), siehe text.js → norm().
 *
 *   id        eindeutiger Name
 *   label     so steht es im Bericht
 *   kind      body | mech | wear | vague | history | seller | positive
 *   severity  1 Hinweis · 2 Kosten · 3 ernst · 4 Ausschluss (Motor/Getriebe)
 *   cost      Position der Preisliste (defaults.js) oder null
 *   qty       feste Menge oder "parts" (zählt genannte Karosserieteile)
 *   fixable   true: "neu / gewechselt / erneuert" im selben Satz macht daraus ein Plus
 *   patterns  reguläre Ausdrücke (ohne Schrägstriche), beschreiben das Problem
 *   mention   bloße Nennung des Teils: zählt nur zusammen mit "neu / gewechselt" als Plus
 *
 * Neue Formulierungen hier ergänzen. Verneinungen ("kein Rost", "unfallfrei")
 * erkennt condition.js selbst, sie brauchen keinen eigenen Eintrag.
 */

export const DICTIONARY = [
  /* ---------------------------------------------------------- Ausschluss */
  { id: "motorschaden", label: "Motorschaden", kind: "mech", severity: 4, cost: null,
    patterns: ["motorschaden", "motor defekt", "motor kaputt", "motor ist (defekt|kaputt|hin)", "kolbenfresser", "pleuel", "lagerschaden", "kurbelwelle", "motor klopft", "motor (frisst|fest)", "kapitaler"] },
  { id: "kopfdichtung", label: "Zylinderkopfdichtung", kind: "mech", severity: 4, cost: null,
    patterns: ["zylinderkopfdichtung", "kopfdichtung", "zkd\\b", "wasser im oel", "oel im (kuehl)?wasser", "verliert kuehlwasser", "kuehlwasserverlust", "weisser rauch"] },
  { id: "getriebeschaden", label: "Getriebeschaden", kind: "mech", severity: 4, cost: null,
    patterns: ["getriebeschaden", "getriebe defekt", "getriebe kaputt", "getriebe (ruckelt|rutscht|schlaegt|macht geraeusche)", "automatik (ruckelt|schaltet nicht|defekt)", "gang (springt|geht nicht|laesst sich nicht)", "gaenge (springen|gehen nicht)", "mechatronik", "dsg (defekt|ruckelt|problem)", "notlauf"] },
  { id: "nichtFahrbereit", label: "Nicht fahrbereit", kind: "mech", severity: 4, cost: null,
    patterns: ["nicht fahrbereit", "springt nicht an", "startet nicht", "laeuft nicht", "nur mit haenger", "muss abgeschleppt", "nur auf (anhaenger|trailer|haenger)", "nicht fahrtuechtig"] },
  { id: "totalschaden", label: "Totalschaden / Brand / Wasser", kind: "body", severity: 4, cost: null,
    patterns: ["totalschaden", "wirtschaftlicher totalschaden", "brandschaden", "wasserschaden", "hochwasser", "ueberschwemm", "rahmenschaden", "rahmen verzogen"] },
  { id: "bastler", label: "Bastlerfahrzeug / Teileträger", kind: "seller", severity: 4, cost: null,
    patterns: ["bastler", "teiletraeger", "zum ausschlachten", "schlachtfest", "an bastler", "fuer bastler", "ersatzteilspender", "nur export", "nur fuer export", "nur an (haendler|gewerbe)", "export oder bastler"] },

  /* ---------------------------------------------------------- Unfall */
  { id: "unfall", label: "Unfallschaden", kind: "body", severity: 3, cost: "unfallMittel",
    patterns: ["unfallschaden", "unfallwagen", "unfallfahrzeug", "unfaller", "hatte (einen )?unfall", "nach unfall", "auffahrunfall", "frontschaden", "heckschaden", "seitenschaden", "airbag(s)? (ausgeloest|offen|defekt)"] },
  { id: "unfallLeicht", label: "Leichter Unfallschaden / Parkschaden", kind: "body", severity: 2, cost: "unfallKlein",
    patterns: ["leichter unfall", "kleiner unfall", "parkschaden", "parkrempler", "blechschaden", "streifschaden", "leichter (front|heck|seiten)schaden"] },
  { id: "vorschaden", label: "Reparierter Vorschaden", kind: "history", severity: 2, cost: null,
    patterns: ["vorschaden", "unfall(schaden)? (wurde |fachgerecht |fachmaennisch )*(repariert|behoben|instand)", "reparierter unfall", "instandgesetzter", "nachlackiert", "nachlackierung", "wurde (neu )?lackiert", "teillackiert"] },

  /* ---------------------------------------------------------- Karosserie und Lack */
  { id: "lack", label: "Lackschaden / Kratzer", kind: "body", severity: 2, cost: "lackTeil", qty: "parts",
    patterns: ["kratzer", "lackschaden", "lackschaeden", "lackplatzer", "lackabplatz", "klarlack", "steinschlaege?(?! in der (front)?scheibe)", "schramme", "zerkratzt", "lack (ist )?(matt|stumpf|verblasst|ausgeblichen)", "lackmaengel", "kampfspuren", "macke"] },
  { id: "delle", label: "Delle / Beule", kind: "body", severity: 2, cost: "delle", qty: "parts",
    patterns: ["delle", "dellen", "beule", "beulen", "eingedrueckt", "druckstelle"] },
  { id: "hagel", label: "Hagelschaden", kind: "body", severity: 3, cost: "hagel",
    patterns: ["hagelschaden", "hagel"] },
  { id: "rost", label: "Rost", kind: "body", severity: 2, cost: "rost", qty: "parts",
    patterns: ["rost", "durchrostung", "durchgerostet", "rostet", "rostig", "rostblasen", "rostansatz", "korrosion", "kantenrost", "unterbodenrost", "flugrost", "rostloch", "rostloecher"] },
  { id: "scheibe", label: "Windschutzscheibe", kind: "body", severity: 2, cost: "scheibe", fixable: true,
    patterns: ["steinschlag in der (front|windschutz)?scheibe", "(front|windschutz)scheibe (gerissen|riss|sprung|defekt|kaputt|steinschlag)", "riss in der (front|windschutz)?scheibe", "scheibe hat (einen )?(riss|sprung|steinschlag)"] },
  { id: "stossstange", label: "Stoßstange beschädigt", kind: "body", severity: 2, cost: "lackTeil",
    patterns: ["stossstange (gerissen|gebrochen|defekt|kaputt|beschaedigt|lose|haengt)", "stossfaenger (gerissen|gebrochen|defekt|beschaedigt)"] },

  /* ---------------------------------------------------------- Mechanik mit Kosten */
  { id: "kupplung", label: "Kupplung", kind: "mech", severity: 2, cost: "kupplung", fixable: true,
    patterns: ["kupplung (rutscht|kommt spaet|defekt|verschlissen|am ende|fertig|schleift|rupft|muss|sollte)", "zweimassenschwungrad (defekt|rasselt|klappert|muss)", "ausruecklager"],
    mention: ["kupplung", "zweimassenschwungrad", "zms"] },
  { id: "bremsen", label: "Bremsen", kind: "wear", severity: 2, cost: "bremsen", fixable: true,
    patterns: ["bremsen (muessen|sollten|sind (runter|fertig|verschlissen|am ende)|quietschen|rubbeln|schleifen)", "brems(scheiben|belaege) (muessen|sollten|sind (runter|fertig|verschlissen|am ende)|faellig)", "bremse (fest|haengt|zieht)", "handbremse (defekt|haelt nicht|ohne funktion)"],
    mention: ["bremsen", "bremsscheiben", "bremsbelaege"] },
  { id: "zahnriemen", label: "Zahnriemen / Steuerkette", kind: "wear", severity: 2, cost: "zahnriemen", fixable: true,
    patterns: ["zahnriemen (faellig|muss|sollte|ueberfaellig|nicht gemacht|alt)", "zahnriemenwechsel (faellig|steht an|noetig)", "steuerkette (rasselt|laengt|gelaengt|muss|faellig|defekt|klappert)", "kettenrasseln"],
    mention: ["zahnriemen", "zahnriem", "zahnriemenwechsel", "steuerkette"] },
  { id: "service", label: "Service / Inspektion fällig", kind: "wear", severity: 1, cost: "service", fixable: true,
    patterns: ["(service|inspektion|oelwechsel|kundendienst) (ist )?(faellig|ueberfaellig|steht an|noetig|muss gemacht)", "serviceintervall ueberschritten"],
    mention: ["service", "inspektion", "oelwechsel", "kundendienst"] },
  { id: "reifen", label: "Reifen", kind: "wear", severity: 1, cost: "reifen", fixable: true,
    patterns: ["reifen (sind )?(abgefahren|runter|alt|poroes|muessen|sollten|am ende|fertig)", "reifen muessen neu", "neue reifen (noetig|faellig|erforderlich)", "profil (unter|nur noch) \\d"],
    mention: ["reifen", "sommerreifen", "winterreifen", "allwetterreifen", "ganzjahresreifen"] },
  { id: "klima", label: "Klimaanlage", kind: "mech", severity: 2, cost: "klima", fixable: true,
    patterns: ["klima(anlage|automatik)? (defekt|ohne funktion|kuehlt nicht|geht nicht|funktioniert nicht|muss (befuellt|gefuellt|aufgefuellt)|kalt nicht|ausser funktion)", "klimakompressor (defekt|kaputt|laut|muss)", "klima ohne funktion"],
    mention: ["klimaanlage", "klimakompressor", "klimaservice"] },
  { id: "auspuff", label: "Auspuff / Abgasanlage", kind: "mech", severity: 2, cost: "auspuff", fixable: true,
    patterns: ["auspuff (defekt|durch|laut|undicht|rostig|kaputt|muss)", "endtopf", "kruemmer (gerissen|undicht|riss)", "katalysator (defekt|fehlt|kaputt)", "\\bkat (defekt|fehlt|kaputt)", "flexrohr"] },
  { id: "fahrwerk", label: "Fahrwerk / Achse / Lenkung", kind: "mech", severity: 2, cost: "fahrwerk", fixable: true,
    patterns: ["querlenker", "stossdaempfer", "feder(n)? gebrochen", "federbruch", "achsmanschette", "radlager", "spurstange", "koppelstange", "traggelenk", "achse (klappert|poltert|schlaegt)", "poltert", "klappert (vorne|hinten|beim)", "lenkung (schwer|spiel|knackt|undicht)", "lenkgetriebe", "servo(pumpe)? (defekt|undicht|geraeusch)", "luftfederung", "luftfahrwerk (defekt|problem|undicht)", "antriebswelle"] },
  { id: "elektrik", label: "Elektrik / Warnleuchte", kind: "mech", severity: 2, cost: "elektrik", fixable: true,
    patterns: ["motorkontrollleuchte", "motorkontrollampe", "motorleuchte", "\\bmkl\\b", "(abs|esp|airbag|oel|batterie)[ -]?(leuchte|lampe|kontrollleuchte) (an|leuchtet|brennt)", "warnleuchte", "kontrollleuchte (an|leuchtet|brennt)", "fehler(meldung|speicher)", "fehlermeldung", "steuergeraet", "elektrikproblem", "elektrik(fehler| spinnt| defekt)", "fensterheber (defekt|ohne funktion|geht nicht|funktioniert nicht)", "zentralverriegelung (defekt|ohne funktion|geht nicht|funktioniert nicht|spinnt)", "lichtmaschine", "anlasser", "sensor (defekt|kaputt)", "(navi|display|radio|tacho) (defekt|ohne funktion|ausgefallen|pixelfehler)", "batterie (defekt|schwach|leer|muss)", "abs sensor", "lambdasonde", "zuendspule"] },
  { id: "oelverlust", label: "Ölverlust / Undichtigkeit", kind: "mech", severity: 2, cost: "oelverlust", fixable: true,
    patterns: ["oelverlust", "verliert oel", "oel(t| undicht)", "schwitzt", "oelwanne (undicht|tropft)", "ventildeckeldichtung", "simmerring", "undicht", "tropft"] },
  { id: "oelverbrauch", label: "Erhöhter Ölverbrauch", kind: "mech", severity: 3, cost: null,
    patterns: ["oelverbrauch", "verbraucht oel", "braucht oel", "nimmt oel", "blauer rauch", "qualmt", "raucht"] },
  { id: "turbo", label: "Turbolader", kind: "mech", severity: 3, cost: "turbo", fixable: true,
    patterns: ["turbo(lader)? (defekt|pfeift|kaputt|undicht|geraeusch|muss)", "turboschaden", "ladedruck", "keine leistung", "leistungsverlust", "zieht nicht (mehr|richtig)", "zieht schlecht"],
    mention: ["turbolader", "turbo"] },
  { id: "dpf", label: "Partikelfilter / AGR / AdBlue", kind: "mech", severity: 2, cost: "dpf", fixable: true,
    patterns: ["partikelfilter", "\\bdpf\\b", "russpartikelfilter", "agr[ -]?(ventil|kuehler)", "adblue", "ad blue", "nox[ -]?sensor", "injektor(en)?", "einspritzduese(n)?", "hochdruckpumpe"],
    mention: ["partikelfilter", "dpf", "injektoren", "agr ventil", "agr-ventil"] },
  { id: "laufUnrund", label: "Motor läuft unrund", kind: "mech", severity: 3, cost: "elektrik",
    patterns: ["laeuft unrund", "unrunder lauf", "ruckelt", "stottert", "zuendaussetzer", "geht (manchmal |ab und zu )?aus", "motor (ruckelt|stottert|schuettelt|vibriert)", "laeuft auf \\d zylinder", "nimmt (kein|schlecht) gas", "standgas"] },
  { id: "geraeusch", label: "Ungeklärte Geräusche", kind: "mech", severity: 2, cost: "unklar",
    patterns: ["geraeusch", "klackert", "klackern", "rasselt", "rasseln", "tickert", "nagelt", "heult", "jault", "pfeift", "quietscht", "brummt", "macht komische"] },
  { id: "innenraum", label: "Innenraum", kind: "body", severity: 1, cost: "innenraum",
    patterns: ["sitz(e)? (gerissen|riss|verschlissen|durchgesessen|fleck|brandloch)", "brandloch", "brandloecher", "dachhimmel (haengt|loest|locker|durch)", "himmel haengt", "leder (rissig|gerissen|abgenutzt|speckig)", "riecht nach", "geruch", "hundehaare", "raucherfahrzeug", "raucherauto", "innenraum (verschmutzt|dreckig|ungepflegt)", "feucht(igkeit)? im innenraum", "wassereintritt", "nass im (fussraum|kofferraum)"] },
  { id: "aufbereitung", label: "Aufbereitung nötig", kind: "body", severity: 1, cost: "aufbereitung",
    patterns: ["ungepflegt", "muss (aufbereitet|gereinigt|geputzt)", "aufbereitung (noetig|faellig|erforderlich)", "nicht aufbereitet", "ungewaschen", "verdreckt", "stand lange", "standschaden", "standschaeden", "lange gestanden", "scheunenfund"] },

  /* ---------------------------------------------------------- TÜV */
  { id: "tuevFehlt", label: "TÜV abgelaufen / fehlt", kind: "wear", severity: 2, cost: "tuev",
    patterns: ["ohne tuev", "kein tuev", "keinen tuev", "tuev (ist )?(abgelaufen|faellig|ueberfaellig|laeuft ab|laeuft aus|fehlt|weg)", "tuev abgel", "hu (ist )?(abgelaufen|faellig|ueberfaellig)", "ohne hu", "tuev nicht bestanden", "durch(s)? den tuev (gefallen|nicht)", "tuev muss (neu|gemacht)", "maengelbericht", "erhebliche maengel"] },

  /* ---------------------------------------------------------- unklar */
  { id: "unklar", label: "Unklare Mängel", kind: "vague", severity: 2, cost: "unklar",
    patterns: ["kleine(re)? maengel", "leichte maengel", "paar maengel", "einige maengel", "kleinigkeiten", "kleine macken", "optische maengel", "technische maengel", "maengel vorhanden", "nicht perfekt", "kein neuwagen", "altersbedingt", "alters(entsprechend|gemaess)", "dem alter entsprechend", "gebrauchsspuren", "hat seine macken", "reparaturstau", "reparaturbedarf", "reparaturbeduerftig", "arbeit (noetig|erforderlich)", "muss (was|etwas) gemacht werden", "handwerkerauto", "handwerkerfahrzeug", "defekt", "kaputt", "funktioniert nicht", "ohne funktion", "geht nicht"] },

  /* ---------------------------------------------------------- Vorgeschichte und Verkäufer */
  { id: "flotte", label: "Mietwagen / Taxi / Fahrschule", kind: "history", severity: 2, cost: null,
    patterns: ["mietwagen", "ex[ -]?taxi", "taxi", "fahrschul", "ehemals? (miet|vermiet)", "vermietfahrzeug", "carsharing", "behoerdenfahrzeug", "polizei", "kurierfahrzeug", "lieferfahrzeug", "pflegedienst"] },
  { id: "import", label: "Import / Reimport", kind: "history", severity: 1, cost: null,
    patterns: ["reimport", "eu[ -]?import", "eu[ -]?fahrzeug", "eu[ -]?ausfuehrung", "importfahrzeug", "us[ -]?import", "us[ -]?modell", "re[ -]import", "aus (italien|frankreich|polen|belgien|spanien|daenemark|holland|niederlande|usa) importiert"] },
  { id: "tuning", label: "Tuning / Umbauten", kind: "history", severity: 1, cost: null,
    patterns: ["chiptuning", "gechipt", "leistungssteigerung", "stage ?[123]", "softwareoptimier", "gewindefahrwerk", "tiefergelegt", "tieferlegung", "sportauspuff", "downpipe", "umbau(ten)?", "folierung", "foliert", "nicht eingetragen", "ohne (abe|eintragung)"] },
  { id: "druck", label: "Verkäufer unter Zeitdruck", kind: "seller", severity: 1, cost: null,
    patterns: ["muss (schnell )?weg", "notverkauf", "schnell(st)?(moeglich)? (weg|verkaufen|abzugeben)", "dringend", "wegen umzug", "wegen auswanderung", "platzmangel", "muss raus", "bis ende der woche", "schnaeppchen"] },
  { id: "export", label: "Verkauf nur an Gewerbe / Export", kind: "seller", severity: 3, cost: null,
    patterns: ["haendler ?/? ?export", "gewerbe ?/? ?export", "export ?/? ?(gewerbe|haendler)", "fuer export", "exportpreis", "ohne (garantie|gewaehrleistung) (und|/) ?ohne ruecknahme (nur )?an (haendler|gewerbe)", "verkauf nur an gewerbetreibende"] },
  { id: "kundenauftrag", label: "Verkauf im Kundenauftrag", kind: "seller", severity: 1, cost: null,
    patterns: ["im kundenauftrag", "kundenauftrag", "kommissionsverkauf", "in kommission"] },
  { id: "tacho", label: "Kilometerstand unklar", kind: "history", severity: 3, cost: null,
    patterns: ["tacho(stand)? (nicht original|unbekannt|defekt|getauscht|unklar)", "km[ -]?stand (unbekannt|nicht original|unklar|nicht nachweisbar)", "abgelesen", "austauschmotor", "tauschmotor", "motor (wurde )?getauscht", "anderer motor", "tachotausch", "kombiinstrument getauscht", "laufleistung (unbekannt|unklar|nicht nachweisbar)"] },
  { id: "keinScheckheft", label: "Kein Scheckheft / keine Belege", kind: "history", severity: 1, cost: null,
    patterns: ["kein scheckheft", "ohne scheckheft", "scheckheft (fehlt|nicht vorhanden|verloren|unvollstaendig|lueckenhaft)", "nicht scheckheftgepflegt", "keine (service)?(belege|rechnungen|historie|nachweise)", "serviceheft (fehlt|nicht vorhanden)", "kein serviceheft"] },
  { id: "schluessel", label: "Nur ein Schlüssel", kind: "history", severity: 1, cost: null,
    patterns: ["nur (1|ein|einen) schluessel", "zweitschluessel fehlt", "ein schluessel vorhanden"] },
  { id: "papiere", label: "Papiere unvollständig", kind: "history", severity: 3, cost: null,
    patterns: ["ohne (brief|papiere|fahrzeugbrief)", "brief (fehlt|verloren|nicht vorhanden)", "papiere (fehlen|verloren|nicht vorhanden)", "zulassungsbescheinigung (teil (2|ii) )?(fehlt|verloren)", "(ist|noch|wird) (noch )?finanziert", "brief bei der bank", "sicherungsuebereignet"] },

  /* ---------------------------------------------------------- Pluspunkte */
  { id: "plusScheckheft", label: "Scheckheftgepflegt", kind: "positive", severity: 0, cost: null,
    patterns: ["scheckheft ?gepflegt", "checkheft ?gepflegt", "lueckenlos(es)? (scheckheft|serviceheft|gewartet)", "scheckheft (vorhanden|lueckenlos|komplett)", "serviceheft (gepflegt|lueckenlos|vorhanden)", "alle (inspektionen|services) (gemacht|bei)", "service(historie)? (lueckenlos|komplett)"] },
  { id: "plusErsteHand", label: "1. Hand", kind: "positive", severity: 0, cost: null,
    patterns: ["1\\.? ?hand", "erste(r)? hand", "aus erster hand", "erstbesitz", "1 vorbesitzer"] },
  { id: "plusGarage", label: "Garagenwagen / Rentnerfahrzeug", kind: "positive", severity: 0, cost: null,
    patterns: ["garagenwagen", "garagenfahrzeug", "garagen ?gepflegt", "rentnerfahrzeug", "rentner", "seniorenfahrzeug", "frauenfahrzeug", "liebhaber(fahrzeug|stueck)", "sehr gepflegt", "top gepflegt", "top zustand", "neuwertig"] },
  { id: "plusNichtraucher", label: "Nichtraucher", kind: "positive", severity: 0, cost: null,
    patterns: ["nichtraucher"] },
  { id: "plusReifen", label: "8-fach bereift", kind: "positive", severity: 0, cost: null,
    patterns: ["8[ -]?fach", "achtfach", "sommer[ -]? (und|\\+|&) ?winterreifen", "winterreifen (dabei|inklusive|inkl|vorhanden)", "zweiter satz", "2\\. satz"] },
  { id: "plusTuevNeu", label: "TÜV neu", kind: "positive", severity: 0, cost: null,
    patterns: ["tuev neu", "hu neu", "neuer tuev", "tuev (wird|kann) neu", "frischer tuev", "hu/au neu", "mit neuem tuev", "tuev bei kauf neu"] },
  { id: "plusGarantie", label: "Garantie vorhanden", kind: "positive", severity: 0, cost: null,
    patterns: ["herstellergarantie", "werksgarantie", "anschlussgarantie", "garantie bis", "junge sterne", "neuwagengarantie"] },
];

/** Karosserieteile – für "Kratzer an Tür und Stoßstange" = 2 Teile. */
export const BODY_PARTS = [
  "fahrertuer", "beifahrertuer", "tuer hinten", "tuer vorne", "tuer", "tueren",
  "stossstange vorne", "stossstange hinten", "stossstange", "stossfaenger", "frontschuerze", "heckschuerze",
  "kotfluegel", "motorhaube", "haube", "heckklappe", "kofferraumdeckel", "kofferraumklappe",
  "seitenwand", "seitenteil", "schweller", "radlauf", "radkasten", "dach", "spiegel", "aussenspiegel", "felge", "felgen",
];

/** Wörter, die auf einen Mangel hindeuten. Ein Satz mit so einem Wort, den das
 *  Wörterbuch nicht einordnen kann, landet unter "Unbekannte Hinweise". */
export const SIGNAL_WORDS = [
  "schaden", "schaeden", "defekt", "kaputt", "mangel", "maengel", "problem", "fehler", "leider",
  "muss", "muesste", "sollte", "undicht", "geraeusch", "leuchte", "leuchtet", "verliert", "riss",
  "gerissen", "gebrochen", "beschaedigt", "reparatur", "repariert", "werkstatt", "unfall",
  "ohne funktion", "funktioniert nicht", "geht nicht", "faellig", "abgelaufen", "verschlissen",
  "wechseln", "erneuern", "ersetzen", "macke", "achtung", "hinweis", "nachteil", "wermutstropfen",
];
