/**
 * Marktanalyse – Modellgenerationen (Verbrenner und Hybride, keine reinen Elektroautos).
 *
 * Portale führen alle Generationen unter einem Modellnamen ("Golf"). Eine neue
 * Generation ist deutlich mehr wert – deshalb vergleicht die Marktanalyse nur
 * innerhalb einer Generation.
 *
 * Eintrag:  M(marken, modell, anzeigename, [ G(name, von, bis, ...kennungen) ])
 *   marken        Marke(n), wie search.js → makeName() sie liefert
 *   modell        regulärer Ausdruck auf den normalisierten Modellnamen des Portals
 *   anzeigename   so heißt das Modell im Bericht ("Golf", "3er")
 *   von / bis     Bauzeit (Jahre); bis = null: läuft noch
 *   kennungen     woran man die Generation im Titel erkennt:
 *                   "#7"   Zahl oder römische Zahl direkt hinter dem Modellnamen ("Golf 7", "Golf VII")
 *                   "@j"   Buchstabe direkt hinter dem Modellnamen ("Astra J")
 *                   "f30"  Werkscode mit Ziffer, steht irgendwo im Titel. Reine Buchstabencodes
 *                          ("CD", "SL", "GL") fehlen bewusst – sie sind auch Ausstattungen.
 *                   "ps:140,160"  Leistungen (PS), die es nur in dieser Generation gab
 *
 * Die Bauzeiten überlappen im Jahr des Modellwechsels. Dort entscheidet der
 * Titel oder die Generationsnummer von AutoScout24; sonst gilt "unklar".
 * Neue Modelle einfach ergänzen – Reihenfolge: speziellere Modelle zuerst.
 */

const ROMAN = { 1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v", 6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x", 11: "xi" };

const G = (name, from, to, ...tokens) => ({
  name, from, to,
  tokens: tokens.filter((token) => !token.startsWith("ps:")),
  // "ps:140,160": Leistungen, die es nur in dieser Generation gab – entscheidet im Jahr des Modellwechsels
  onlyPs: tokens.filter((token) => token.startsWith("ps:")).flatMap((token) => token.slice(3).split(",").map(Number)),
});
const M = (makes, model, label, gens, prefix = null) => ({ makes: [].concat(makes), model: new RegExp(model), label, prefix, gens });

const VAG = "volkswagen";
const MB = "mercedes-benz";

export const GENERATIONS = [
  /* ------------------------------------------------------------ Volkswagen */
  M(VAG, "^polo", "Polo", [G("Polo 9N", 2001, 2009, "9n", "#4"), G("Polo 6R/6C", 2009, 2017, "6r", "6c", "#5", "ps:90,110,192"), G("Polo AW", 2017, null, "#6", "ps:65,80,115,200")]),
  M(VAG, "^golf(?! ?(plus|sportsvan))", "Golf", [G("Golf 4", 1997, 2004, "#4", "ps:130,180,204,241"), G("Golf 5", 2003, 2009, "#5", "ps:200,230,250"), G("Golf 6", 2008, 2013, "#6", "ps:160,210,235,270"), G("Golf 7", 2012, 2020, "#7", "ps:125,184,220,230,290"), G("Golf 8", 2019, null, "#8", "ps:200,320,333")]),
  M(VAG, "^passat(?! ?cc)", "Passat", [G("Passat B5", 1996, 2005, "b5", "3bg"), G("Passat B6", 2005, 2010, "b6"), G("Passat B7", 2010, 2015, "b7", "ps:177,210"), G("Passat B8", 2014, 2023, "b8", "3g", "ps:120,125,190,220,240,280"), G("Passat B9", 2024, null, "b9")]),
  M(VAG, "^tiguan(?! ?allspace)", "Tiguan", [G("Tiguan I", 2007, 2016, "5n", "#1", "ps:110,140,160,177,184,210"), G("Tiguan II", 2016, 2024, "ad1", "#2", "ps:115,190,220,240"), G("Tiguan III", 2024, null, "#3")]),
  M(VAG, "^touran", "Touran", [G("Touran I", 2003, 2015, "1t", "#1", "ps:105,140"), G("Touran II", 2015, null, "5t", "#2", "ps:115,190")]),
  M(VAG, "^touareg", "Touareg", [G("Touareg I", 2002, 2010, "7l", "#1"), G("Touareg II", 2010, 2018, "7p", "#2"), G("Touareg III", 2018, null, "#3")]),
  M(VAG, "^sharan", "Sharan", [G("Sharan I", 1995, 2010, "7m", "#1"), G("Sharan II", 2010, 2022, "7n", "#2")]),
  M(VAG, "^caddy", "Caddy", [G("Caddy 3", 2003, 2015, "2k", "#3"), G("Caddy 4", 2015, 2020, "#4"), G("Caddy 5", 2020, null, "#5")]),
  M(VAG, "^t-?roc", "T-Roc", [G("T-Roc I", 2017, 2025), G("T-Roc II", 2025, null)]),

  /* ------------------------------------------------------------ Audi */
  M("audi", "^a1", "A1", [G("A1 8X", 2010, 2018, "8x"), G("A1 GB", 2018, null)]),
  M("audi", "^(a3|s3|rs ?3)", "A3", [G("A3 8L", 1996, 2003, "8l"), G("A3 8P", 2003, 2013, "8p", "8pa", "ps:160,170,200,211,265,340"), G("A3 8V", 2012, 2020, "8v", "8va", "ps:180,184,300"), G("A3 8Y", 2020, null, "8y", "ps:110,204,245")]),
  M("audi", "^(a4|s4|rs ?4)", "A4", [G("A4 B6", 2000, 2004, "b6"), G("A4 B7", 2004, 2008, "b7"), G("A4 B8", 2007, 2015, "b8", "8k", "ps:120,136,177,211,225,230,245"), G("A4 B9", 2015, 2024, "b9", "8w", "ps:122,218,252,272,354")]),
  M("audi", "^(a5|s5|rs ?5)", "A5", [G("A5 8T", 2007, 2016, "8t", "8f", "8ta"), G("A5 F5", 2016, 2024, "f5"), G("A5 B10", 2024, null, "b10")]),
  M("audi", "^(a6|s6|rs ?6)(?! ?e)", "A6", [G("A6 C5", 1997, 2005, "c5", "4b"), G("A6 C6", 2004, 2011, "c6", "4f"), G("A6 C7", 2011, 2018, "c7", "4g", "ps:150,218,272,320,333"), G("A6 C8", 2018, null, "c8", "4k", "ps:204,231,245,286,340")]),
  M("audi", "^(a7|s7|rs ?7)", "A7", [G("A7 4G", 2010, 2018, "4g", "c7"), G("A7 4K", 2018, null, "4k", "c8")]),
  M("audi", "^(a8|s8)", "A8", [G("A8 D3", 2002, 2010, "d3", "4e"), G("A8 D4", 2010, 2017, "d4", "4h"), G("A8 D5", 2017, null, "d5", "4n")]),
  M("audi", "^(q3|rs ?q3)", "Q3", [G("Q3 8U", 2011, 2018, "8u", "ps:125,180,184,220,340,367"), G("Q3 F3", 2018, 2025, "f3", "ps:190,230,400")]),
  M("audi", "^(q5|sq5)", "Q5", [G("Q5 8R", 2008, 2017, "8r", "ps:230,258"), G("Q5 FY", 2017, 2024, "ps:252,286,354"), G("Q5 GU", 2024, null)]),
  M("audi", "^(q7|sq7)", "Q7", [G("Q7 4L", 2005, 2015, "4l"), G("Q7 4M", 2015, null, "4m")]),
  M("audi", "^tt", "TT", [G("TT 8N", 1998, 2006, "8n"), G("TT 8J", 2006, 2014, "8j"), G("TT 8S", 2014, 2023, "8s")]),

  /* ------------------------------------------------------------ BMW */
  M("bmw", "^(1er|1(1[468]|2[0358]|3[05]|40)|m1[34]\\d)", "1er", [G("1er E87", 2004, 2013, "e87", "e81", "e82", "e88"), G("1er F20", 2011, 2019, "f20", "f21", "ps:109,184,224,340"), G("1er F40", 2019, 2024, "f40", "ps:140,178,265,306"), G("1er F70", 2024, null, "f70")]),
  M("bmw", "^(3er|3(1[568]|2[0358]|3[05]|40)|m3(?!\\d))", "3er", [G("3er E46", 1998, 2006, "e46"), G("3er E90", 2005, 2013, "e90", "e91", "e92", "e93"), G("3er F30", 2011, 2019, "f30", "f31", "f34", "ps:252,313,326"), G("3er G20", 2018, null, "g20", "g21", "ps:156,265,286,292,340,374")]),
  M("bmw", "^(4er|4(1[68]|2[0358]|3[05]|40)|m4(?!\\d))", "4er", [G("4er F32", 2013, 2021, "f32", "f33", "f36"), G("4er G22", 2020, null, "g22", "g23", "g26")]),
  M("bmw", "^(5er|5(18|2[0358]|3[05]|4[05]|50)|m5(?!\\d))", "5er", [G("5er E39", 1995, 2004, "e39"), G("5er E60", 2003, 2010, "e60", "e61"), G("5er F10", 2010, 2017, "f10", "f11", "f07", "ps:306,313,450"), G("5er G30", 2017, 2024, "g30", "g31", "ps:231,265,340,462"), G("5er G60", 2023, null, "g60", "g61")]),
  M("bmw", "^(7er|7(3[05]|4[05]|5[05]|60))", "7er", [G("7er E65", 2001, 2008, "e65", "e66"), G("7er F01", 2008, 2015, "f01", "f02"), G("7er G11", 2015, 2022, "g11", "g12"), G("7er G70", 2022, null, "g70")]),
  M("bmw", "^x1", "X1", [G("X1 E84", 2009, 2015, "e84", "ps:143,177,218"), G("X1 F48", 2015, 2022, "f48", "ps:190,192,231"), G("X1 U11", 2022, null, "u11")]),
  M("bmw", "^x2", "X2", [G("X2 F39", 2018, 2023, "f39"), G("X2 U10", 2023, null, "u10")]),
  M("bmw", "^x3", "X3", [G("X3 E83", 2003, 2010, "e83"), G("X3 F25", 2010, 2017, "f25", "ps:245,258,313"), G("X3 G01", 2017, 2024, "g01", "ps:252,265,326,360"), G("X3 G45", 2024, null, "g45")]),
  M("bmw", "^x4", "X4", [G("X4 F26", 2014, 2018, "f26"), G("X4 G02", 2018, null, "g02")]),
  M("bmw", "^x5", "X5", [G("X5 E53", 1999, 2006, "e53"), G("X5 E70", 2006, 2013, "e70"), G("X5 F15", 2013, 2018, "f15"), G("X5 G05", 2018, null, "g05")]),
  M("bmw", "^x6", "X6", [G("X6 E71", 2008, 2014, "e71"), G("X6 F16", 2014, 2019, "f16"), G("X6 G06", 2019, null, "g06")]),

  /* ------------------------------------------------------------ Mini */
  M("mini", "countryman", "Countryman", [G("Countryman R60", 2010, 2017, "r60"), G("Countryman F60", 2017, 2024, "f60"), G("Countryman U25", 2024, null, "u25")]),
  M("mini", "clubman", "Clubman", [G("Clubman R55", 2007, 2014, "r55"), G("Clubman F54", 2015, 2024, "f54")]),
  M("mini", "^(one|cooper|john cooper)(?!.*(cabrio|paceman|coupe|roadster))", "Mini", [G("Mini R50", 2001, 2006, "r50", "r53"), G("Mini R56", 2006, 2014, "r56"), G("Mini F56", 2014, 2024, "f56", "f55"), G("Mini F66", 2024, null, "f66", "f65")]),

  /* ------------------------------------------------------------ Mercedes-Benz */
  M(MB, "^(a ?(1[4-9]0|2[0-5]0|35|45)|a-?klasse)", "A-Klasse", [G("A-Klasse W168", 1997, 2004, "w168"), G("A-Klasse W169", 2004, 2012, "w169"), G("A-Klasse W176", 2012, 2018, "w176", "ps:102,122,156,177,211,218,381"), G("A-Klasse W177", 2018, null, "w177", "v177", "ps:116,163,190,224,306,421")]),
  M(MB, "^(b ?(1[5-9]0|2[0-5]0)|b-?klasse)", "B-Klasse", [G("B-Klasse W245", 2005, 2011, "w245"), G("B-Klasse W246", 2011, 2018, "w246"), G("B-Klasse W247", 2018, null, "w247")]),
  M(MB, "^(c ?(1[68]0|2[0-5]0|2[27]0|3[0-5]0|4[03]0|43|63)|c-?klasse)", "C-Klasse", [G("C-Klasse W203", 2000, 2007, "w203", "s203", "cl203"), G("C-Klasse W204", 2007, 2014, "w204", "s204", "c204", "ps:120,265"), G("C-Klasse W205", 2014, 2021, "w205", "s205", "c205", "a205", "ps:129,211,333"), G("C-Klasse W206", 2021, null, "w206", "s206")]),
  M(MB, "^(e ?(2[0-8]0|3[0-5]0|4[03]0|5[03]0|43|53|63)|e-?klasse)", "E-Klasse", [G("E-Klasse W211", 2002, 2009, "w211", "s211"), G("E-Klasse W212", 2009, 2016, "w212", "s212", "c207", "a207", "ps:204,211,252"), G("E-Klasse W213", 2016, 2023, "w213", "s213", "c238", "a238", "ps:194,245,333"), G("E-Klasse W214", 2023, null, "w214", "s214")]),
  M(MB, "^(s ?(3[0-5]0|4[05]0|5[06]0|6[0305]0?)|s-?klasse)", "S-Klasse", [G("S-Klasse W220", 1998, 2005, "w220"), G("S-Klasse W221", 2005, 2013, "w221"), G("S-Klasse W222", 2013, 2020, "w222"), G("S-Klasse W223", 2020, null, "w223")]),
  M(MB, "^cla", "CLA", [G("CLA C117", 2013, 2019, "c117", "x117"), G("CLA C118", 2019, null, "c118", "x118")]),
  M(MB, "^cls", "CLS", [G("CLS C219", 2004, 2010, "c219"), G("CLS C218", 2010, 2018, "c218", "x218"), G("CLS C257", 2018, 2023, "c257")]),
  M(MB, "^gla", "GLA", [G("GLA X156", 2013, 2020, "x156"), G("GLA H247", 2020, null, "h247")]),
  M(MB, "^glc", "GLC", [G("GLC X253", 2015, 2022, "x253", "c253"), G("GLC X254", 2022, null, "x254", "c254")]),
  M(MB, "^gle", "GLE", [G("GLE W166", 2015, 2019, "w166", "c292"), G("GLE V167", 2019, null, "v167", "c167")]),
  M(MB, "^ml", "M-Klasse", [G("M-Klasse W163", 1997, 2005, "w163"), G("M-Klasse W164", 2005, 2011, "w164"), G("M-Klasse W166", 2011, 2015, "w166")]),
  M(MB, "^slk", "SLK", [G("SLK R170", 1996, 2004, "r170"), G("SLK R171", 2004, 2011, "r171"), G("SLK R172", 2011, 2016, "r172")]),
  M(MB, "^vito", "Vito", [G("Vito W639", 2003, 2014, "w639", "639"), G("Vito W447", 2014, null, "w447", "447")]),
  M(MB, "^sprinter", "Sprinter", [G("Sprinter 906", 2006, 2018, "906", "w906"), G("Sprinter 907", 2018, null, "907", "910", "w907")]),
  M("smart", "fortwo", "fortwo", [G("fortwo 450", 1998, 2007, "450"), G("fortwo 451", 2007, 2014, "451"), G("fortwo 453", 2014, null, "453")]),
  M("smart", "forfour", "forfour", [G("forfour 454", 2004, 2006, "454"), G("forfour 453", 2014, null, "453")]),

  /* ------------------------------------------------------------ Opel */
  M("opel", "^corsa", "Corsa", [G("Corsa C", 2000, 2006, "@c"), G("Corsa D", 2006, 2014, "@d", "ps:65,85,87,192"), G("Corsa E", 2014, 2019, "@e", "ps:115,207"), G("Corsa F", 2019, null, "@f")]),
  M("opel", "^astra", "Astra", [G("Astra G", 1998, 2005, "@g"), G("Astra H", 2004, 2010, "@h"), G("Astra J", 2009, 2015, "@j", "ps:130,165,195"), G("Astra K", 2015, 2021, "@k", "ps:105,125,150,160"), G("Astra L", 2021, null, "@l")]),
  M("opel", "^insignia", "Insignia", [G("Insignia A", 2008, 2017, "@a", "ps:120,130,180,250,325"), G("Insignia B", 2017, 2022, "@b", "ps:165,210")]),
  M("opel", "^meriva", "Meriva", [G("Meriva A", 2003, 2010, "@a"), G("Meriva B", 2010, 2017, "@b")]),
  M("opel", "^zafira(?! ?(tourer|life))", "Zafira", [G("Zafira A", 1999, 2005, "@a"), G("Zafira B", 2005, 2014, "@b"), G("Zafira C", 2011, 2019, "@c")]),
  M("opel", "^mokka", "Mokka", [G("Mokka A", 2012, 2019, "@a", "mokka x"), G("Mokka B", 2020, null, "@b")]),
  M("opel", "^vivaro", "Vivaro", [G("Vivaro A", 2001, 2014, "@a"), G("Vivaro B", 2014, 2019, "@b"), G("Vivaro C", 2019, null, "@c")]),
  M("opel", "^combo", "Combo", [G("Combo C", 2001, 2011, "@c"), G("Combo D", 2011, 2018, "@d"), G("Combo E", 2018, null, "@e")]),

  /* ------------------------------------------------------------ Ford */
  M("ford", "^fiesta", "Fiesta", [G("Fiesta Mk6", 2001, 2008, "mk6", "mk 6"), G("Fiesta Mk7", 2008, 2017, "mk7", "mk 7", "ps:65,82,182"), G("Fiesta Mk8", 2017, 2023, "mk8", "mk 8", "ps:70,85,120")]),
  M("ford", "^focus", "Focus", [G("Focus Mk1", 1998, 2004, "mk1", "mk 1", "#1"), G("Focus Mk2", 2004, 2010, "mk2", "mk 2", "#2"), G("Focus Mk3", 2010, 2018, "mk3", "mk 3", "#3", "ps:105,140,185,250,350"), G("Focus Mk4", 2018, 2025, "mk4", "mk 4", "#4", "ps:190,280")]),
  M("ford", "^mondeo", "Mondeo", [G("Mondeo Mk3", 2000, 2007, "mk3", "mk 3", "#3"), G("Mondeo Mk4", 2007, 2014, "mk4", "mk 4", "#4"), G("Mondeo Mk5", 2014, 2022, "mk5", "mk 5", "#5")]),
  M("ford", "^kuga", "Kuga", [G("Kuga I", 2008, 2012, "#1"), G("Kuga II", 2012, 2019, "#2"), G("Kuga III", 2019, null, "#3")]),
  M("ford", "^c-?max", "C-Max", [G("C-Max I", 2003, 2010, "#1"), G("C-Max II", 2010, 2019, "#2")]),
  M("ford", "^s-?max", "S-Max", [G("S-Max I", 2006, 2015, "#1"), G("S-Max II", 2015, 2023, "#2")]),
  M("ford", "^galaxy", "Galaxy", [G("Galaxy II", 2006, 2015, "#2"), G("Galaxy III", 2015, 2023, "#3")]),
  M("ford", "^ka(?![a-z])", "Ka", [G("Ka I", 1996, 2008), G("Ka II", 2008, 2016), G("Ka+", 2016, 2020, "ka\\+", "ka plus")]),

  /* ------------------------------------------------------------ Skoda, Seat, Cupra */
  M("skoda", "^fabia", "Fabia", [G("Fabia I", 1999, 2007, "6y", "#1"), G("Fabia II", 2007, 2014, "5j", "#2", "ps:86,180"), G("Fabia III", 2014, 2021, "#3"), G("Fabia IV", 2021, null, "#4")]),
  M("skoda", "^octavia", "Octavia", [G("Octavia I", 1996, 2010, "1u", "#1"), G("Octavia II", 2004, 2013, "1z", "#2", "ps:122,160,170,200"), G("Octavia III", 2012, 2020, "5e", "#3", "ps:86,180,220"), G("Octavia IV", 2019, null, "#4", "ps:110,200,204")]),
  M("skoda", "^superb", "Superb", [G("Superb I", 2001, 2008, "3u", "#1"), G("Superb II", 2008, 2015, "3t", "#2", "ps:160,170,260"), G("Superb III", 2015, 2023, "3v", "#3", "ps:120,190,220,280"), G("Superb IV", 2023, null, "#4")]),
  M("skoda", "^kodiaq", "Kodiaq", [G("Kodiaq I", 2016, 2024, "#1"), G("Kodiaq II", 2024, null, "#2")]),
  M("seat", "^ibiza", "Ibiza", [G("Ibiza 6L", 2002, 2008, "6l", "#3"), G("Ibiza 6J", 2008, 2017, "6j", "6p", "#4", "ps:90,105,110,192"), G("Ibiza KJ", 2017, null, "#5", "ps:80,115")]),
  M(["seat", "cupra"], "^leon", "Leon", [G("Leon 1M", 1999, 2006, "1m", "#1"), G("Leon 1P", 2005, 2012, "1p", "#2"), G("Leon 5F", 2012, 2020, "5f", "#3", "ps:184,290"), G("Leon KL", 2020, null, "#4", "ps:110,204,245,310")]),
  M("seat", "^alhambra", "Alhambra", [G("Alhambra I", 1996, 2010, "7m", "#1"), G("Alhambra II", 2010, 2020, "7n", "#2")]),

  /* ------------------------------------------------------------ Renault, Dacia */
  M("renault", "^clio", "Clio", [G("Clio II", 1998, 2012, "#2"), G("Clio III", 2005, 2014, "#3"), G("Clio IV", 2012, 2019, "#4", "ps:110,120,220"), G("Clio V", 2019, null, "#5", "ps:85,115,130,140")]),
  M("renault", "^megane", "Megane", [G("Megane II", 2002, 2009, "#2"), G("Megane III", 2008, 2016, "#3", "ps:265,275"), G("Megane IV", 2016, 2023, "#4", "ps:100,165,205,280")]),
  M("renault", "^(grand )?scenic", "Scenic", [G("Scenic II", 2003, 2009, "#2"), G("Scenic III", 2009, 2016, "#3"), G("Scenic IV", 2016, 2022, "#4")]),
  M("renault", "^twingo", "Twingo", [G("Twingo I", 1993, 2007, "#1"), G("Twingo II", 2007, 2014, "#2"), G("Twingo III", 2014, 2024, "#3")]),
  M("renault", "^captur", "Captur", [G("Captur I", 2013, 2019, "#1"), G("Captur II", 2019, null, "#2")]),
  M("renault", "^kangoo", "Kangoo", [G("Kangoo I", 1997, 2008, "#1"), G("Kangoo II", 2008, 2021, "#2"), G("Kangoo III", 2021, null, "#3")]),
  M("renault", "^laguna", "Laguna", [G("Laguna II", 2001, 2007, "#2"), G("Laguna III", 2007, 2015, "#3")]),
  M("renault", "^trafic", "Trafic", [G("Trafic II", 2001, 2014, "#2"), G("Trafic III", 2014, null, "#3")]),
  M("dacia", "^sandero", "Sandero", [G("Sandero I", 2008, 2012, "#1"), G("Sandero II", 2012, 2020, "#2"), G("Sandero III", 2020, null, "#3")]),
  M("dacia", "^logan", "Logan", [G("Logan I", 2004, 2012, "#1"), G("Logan II", 2012, 2020, "#2")]),
  M("dacia", "^duster", "Duster", [G("Duster I", 2010, 2017, "#1"), G("Duster II", 2017, 2024, "#2"), G("Duster III", 2024, null, "#3")]),

  /* ------------------------------------------------------------ Peugeot, Citroën, Fiat */
  M("peugeot", "^208", "208", [G("208 I", 2012, 2019, "#1", "ps:68,82,110,208"), G("208 II", 2019, null, "#2", "ps:130")]),
  M("peugeot", "^2008", "2008", [G("2008 I", 2013, 2019, "#1"), G("2008 II", 2019, null, "#2")]),
  M("peugeot", "^308", "308", [G("308 I", 2007, 2013, "#1", "t7", "ps:92,112"), G("308 II", 2013, 2021, "#2", "t9"), G("308 III", 2021, null, "#3")]),
  M("peugeot", "^3008", "3008", [G("3008 I", 2009, 2016, "#1"), G("3008 II", 2016, 2024, "#2"), G("3008 III", 2024, null, "#3")]),
  M("peugeot", "^5008", "5008", [G("5008 I", 2009, 2017, "#1"), G("5008 II", 2017, 2024, "#2")]),
  M("peugeot", "^508", "508", [G("508 I", 2010, 2018, "#1"), G("508 II", 2018, null, "#2")]),
  M("peugeot", "^partner", "Partner", [G("Partner I", 1996, 2008), G("Partner II", 2008, 2018), G("Partner III", 2018, null)]),
  M("citroen", "^c1", "C1", [G("C1 I", 2005, 2014, "#1"), G("C1 II", 2014, 2022, "#2")]),
  M("citroen", "^c3(?! ?(picasso|aircross))", "C3", [G("C3 I", 2002, 2009, "#1"), G("C3 II", 2009, 2016, "#2"), G("C3 III", 2016, 2024, "#3")]),
  M("citroen", "^(grand )?c4 ?(grand )?(picasso|spacetourer)", "C4 Picasso", [G("C4 Picasso I", 2006, 2013, "#1"), G("C4 Picasso II", 2013, 2022, "#2")]),
  M("citroen", "^c4(?! ?(cactus|aircross|x))", "C4", [G("C4 I", 2004, 2010, "#1"), G("C4 II", 2010, 2018, "#2"), G("C4 III", 2020, null, "#3")]),
  M("citroen", "^c5(?! ?(aircross|x))", "C5", [G("C5 I", 2001, 2008, "#1"), G("C5 II", 2008, 2017, "#2")]),
  M("citroen", "^berlingo", "Berlingo", [G("Berlingo I", 1996, 2008, "#1"), G("Berlingo II", 2008, 2018, "#2"), G("Berlingo III", 2018, null, "#3")]),
  M("fiat", "^panda", "Panda", [G("Panda 169", 2003, 2012, "169"), G("Panda 312", 2012, null, "312", "319")]),
  M("fiat", "^doblo", "Doblo", [G("Doblo I", 2000, 2010, "#1"), G("Doblo II", 2010, 2022, "#2")]),

  /* ------------------------------------------------------------ Hyundai, Kia */
  M("hyundai", "^i10", "i10", [G("i10 I", 2008, 2013), G("i10 II", 2013, 2019), G("i10 III", 2019, null)]),
  M("hyundai", "^i20", "i20", [G("i20 I", 2008, 2014), G("i20 II", 2014, 2020), G("i20 III", 2020, null, "bc3")]),
  M("hyundai", "^i30", "i30", [G("i30 FD", 2007, 2012), G("i30 GD", 2012, 2017, "ps:135,186"), G("i30 PD", 2017, null, "ps:140,250,275")]),
  M("hyundai", "^tucson", "Tucson", [G("Tucson I", 2004, 2010), G("Tucson TL", 2015, 2020, "ps:132,177,185"), G("Tucson NX4", 2020, null, "nx4", "ps:150,180,230,265")]),
  M("hyundai", "^santa ?fe", "Santa Fe", [G("Santa Fe II", 2006, 2012), G("Santa Fe III", 2012, 2018), G("Santa Fe IV", 2018, 2023), G("Santa Fe V", 2023, null)]),
  M("hyundai", "^kona", "Kona", [G("Kona I", 2017, 2023), G("Kona II", 2023, null)]),
  M("kia", "^picanto", "Picanto", [G("Picanto I", 2004, 2011), G("Picanto II", 2011, 2017), G("Picanto III", 2017, null)]),
  M("kia", "^rio", "Rio", [G("Rio II", 2005, 2011), G("Rio III", 2011, 2017), G("Rio IV", 2017, 2023)]),
  M("kia", "^(pro[ _]?)?cee ?d", "Ceed", [G("Ceed ED", 2006, 2012), G("Ceed JD", 2012, 2018, "ps:110,135"), G("Ceed CD", 2018, null, "ps:115,140,141,160")]),
  M("kia", "^sportage", "Sportage", [G("Sportage II", 2004, 2010), G("Sportage III", 2010, 2015, "ps:116,135,163,184"), G("Sportage IV", 2015, 2021, "ps:115,132,177,185"), G("Sportage V", 2021, null, "nq5", "ps:150,180,230,265")]),
  M("kia", "^sorento", "Sorento", [G("Sorento I", 2002, 2009), G("Sorento II", 2009, 2014), G("Sorento III", 2014, 2020), G("Sorento IV", 2020, null)]),

  /* ------------------------------------------------------------ Toyota, Nissan, Mazda, Honda, Suzuki */
  M("toyota", "^yaris(?! ?cross)", "Yaris", [G("Yaris I", 1999, 2005), G("Yaris II", 2005, 2011), G("Yaris III", 2011, 2020, "ps:100,111"), G("Yaris IV", 2020, null, "ps:116,125,261")]),
  M("toyota", "^aygo(?! ?x)", "Aygo", [G("Aygo I", 2005, 2014), G("Aygo II", 2014, 2021)]),
  M("toyota", "^auris", "Auris", [G("Auris I", 2006, 2012), G("Auris II", 2012, 2018)]),
  M("toyota", "^corolla(?! ?(verso|cross))", "Corolla", [G("Corolla E12", 2001, 2007, "e12"), G("Corolla E15", 2007, 2013, "e15"), G("Corolla E21", 2018, null, "e21", "e210")]),
  M("toyota", "^rav ?4", "RAV4", [G("RAV4 III", 2005, 2012), G("RAV4 IV", 2012, 2018), G("RAV4 V", 2018, null)]),
  M("toyota", "^c-?hr", "C-HR", [G("C-HR I", 2016, 2023), G("C-HR II", 2023, null)]),
  M("toyota", "^avensis", "Avensis", [G("Avensis T25", 2003, 2008, "t25"), G("Avensis T27", 2008, 2018, "t27")]),
  M("nissan", "^micra", "Micra", [G("Micra K12", 2002, 2010, "k12"), G("Micra K13", 2010, 2017, "k13"), G("Micra K14", 2017, 2022, "k14")]),
  M("nissan", "^qashqai", "Qashqai", [G("Qashqai J10", 2006, 2013, "j10"), G("Qashqai J11", 2013, 2021, "j11", "ps:115,160"), G("Qashqai J12", 2021, null, "j12", "ps:190")]),
  M("nissan", "^juke", "Juke", [G("Juke F15", 2010, 2019, "f15"), G("Juke F16", 2019, null, "f16")]),
  M("nissan", "^x-?trail", "X-Trail", [G("X-Trail T31", 2007, 2014, "t31"), G("X-Trail T32", 2014, 2021, "t32"), G("X-Trail T33", 2022, null, "t33")]),
  M("mazda", "^(mazda ?)?2(?![0-9])", "Mazda2", [G("Mazda2 DE", 2007, 2014), G("Mazda2 DJ", 2014, null)]),
  M("mazda", "^(mazda ?)?3(?![0-9])", "Mazda3", [G("Mazda3 BK", 2003, 2009), G("Mazda3 BL", 2008, 2013), G("Mazda3 BM", 2013, 2019, "ps:100,120,165"), G("Mazda3 BP", 2019, null, "ps:116,122,180,186")]),
  M("mazda", "^(mazda ?)?6(?![0-9])", "Mazda6", [G("Mazda6 GG", 2002, 2007), G("Mazda6 GH", 2007, 2012), G("Mazda6 GJ", 2012, 2024)]),
  M("mazda", "^cx-?5", "CX-5", [G("CX-5 KE", 2012, 2017), G("CX-5 KF", 2017, null)]),
  M("honda", "^civic", "Civic", [G("Civic VIII", 2005, 2011, "#8"), G("Civic IX", 2011, 2016, "#9"), G("Civic X", 2016, 2021, "#10"), G("Civic XI", 2021, null, "#11")]),
  M("honda", "^jazz", "Jazz", [G("Jazz II", 2008, 2015), G("Jazz III", 2015, 2020), G("Jazz IV", 2020, null)]),
  M("honda", "^cr-?v", "CR-V", [G("CR-V III", 2006, 2012), G("CR-V IV", 2012, 2018), G("CR-V V", 2018, 2023)]),
  M("suzuki", "^swift", "Swift", [G("Swift 2005", 2005, 2010), G("Swift 2010", 2010, 2017), G("Swift 2017", 2017, 2024), G("Swift 2024", 2024, null)]),

  /* ------------------------------------------------------------ Volvo, Porsche */
  M("volvo", "^xc ?60", "XC60", [G("XC60 I", 2008, 2017, "#1"), G("XC60 II", 2017, null, "#2")]),
  M("volvo", "^xc ?90", "XC90", [G("XC90 I", 2002, 2014, "#1"), G("XC90 II", 2014, null, "#2")]),
  M("volvo", "^[sv] ?60", "S60 / V60", [G("V60 I", 2010, 2018), G("V60 II", 2018, null)]),
  M("volvo", "^v ?70", "V70", [G("V70 II", 2000, 2007, "#2"), G("V70 III", 2007, 2016, "#3")]),
  M("volvo", "^v ?40", "V40", [G("V40 I", 1995, 2004, "#1"), G("V40 II", 2012, 2019, "#2")]),
  M("porsche", "^cayenne", "Cayenne", [G("Cayenne 9PA", 2002, 2010, "9pa", "955", "957"), G("Cayenne 92A", 2010, 2017, "92a", "958"), G("Cayenne 9YA", 2017, null, "9ya", "9y0")]),
];

/** Aus den Kennungen eines Eintrags die Suchmuster für Titel bauen. */
function patterns(entry, gen) {
  const guard = "(?![a-z0-9.,]| ?-?(tuer|trg|sitz|gang|fach|zyl|ps|kw|l ))";
  const prefix = entry.prefix || entry.label.toLowerCase().replace(/[^a-z0-9]+/g, "[ -]?");
  return gen.tokens.map((token) => {
    if (token.startsWith("#")) {
      const n = Number(token.slice(1));
      return new RegExp(`(?<![a-z0-9])${prefix}[ -]?(${ROMAN[n]}|${n})${guard}`);
    }
    // "@j" = Buchstabe direkt hinter dem Modellnamen ("Astra J", "Corsa-E")
    if (token.startsWith("@")) return new RegExp(`(?<![a-z0-9])${prefix}[ -]?${token.slice(1)}(?![a-z0-9])`);
    // Werkscode; "1.6 8V" (Ventile) ist keiner
    return new RegExp(`(?<![a-z0-9])(?<!\\d[.,]\\d )${token}(?![a-z0-9])`);
  });
}

export const GENERATION_INDEX = GENERATIONS.map((entry) => ({
  ...entry,
  gens: entry.gens.map((gen) => ({ ...gen, patterns: patterns(entry, gen) })),
}));
