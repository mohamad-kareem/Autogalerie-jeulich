/**
 * Ausstattung — what the car is fitted with, and what that means for a dealer.
 *
 * Every portal names the same feature differently. AutoScout24 says
 * "Einparkhilfe Sensoren hinten", Kleinanzeigen says "Einparkhilfe", mobile.de
 * says "Parksensoren hinten", and the seller's description says "PDC h.". This
 * module maps all of them onto one catalogue, so the rest of the analysis can
 * reason about features instead of strings.
 *
 * Each catalogue entry carries a weight — how much the feature matters when the
 * car is sold on:
 *
 *   3  sells the car: navigation, leather, panoramic roof, tow bar, auxiliary
 *      heating, matrix light, adaptive cruise, 360° camera, all-wheel drive …
 *   2  expected in a good car: heated seats, climate control, parking sensors,
 *      cruise control, alloys, CarPlay …
 *   1  nice to have: Bluetooth, multifunction wheel, rain sensor …
 *   0  standard on every car: ABS, ESP, airbags. Shown, never counted.
 *
 * The weights feed an equipment level (Basis / Gut / Sehr gut / Premium). They
 * are deliberately NOT turned into euros: the comparables rarely carry a full
 * equipment list, so an equipment surcharge would be a one-sided guess.
 */

import { cleanText } from "./utils";

export const EQUIPMENT_GROUPS = {
  ASSIST: "Assistenz",
  COMFORT: "Komfort",
  CLIMATE: "Klima & Heizung",
  MEDIA: "Multimedia",
  LIGHT: "Licht & Sicht",
  INTERIOR: "Innenraum",
  EXTERIOR: "Exterieur & Fahrwerk",
  SAFETY: "Sicherheit",
};

/**
 * Normalised for matching: lower case, umlauts spelled out, punctuation gone.
 * "Rückfahrkamera" and "Rueckfahrkamera" both become "rueckfahrkamera".
 */
export function equipmentKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The catalogue. Order matters: the first entry that matches an item claims it,
 * so specific entries ("Matrix-LED", "Head-up-Display") sit above the general
 * ones they would otherwise be swallowed by ("LED", "Display").
 *
 * `not` excludes look-alikes — "Navigationsvorbereitung" is not a navigation
 * system, "Lederlenkrad" is not a leather interior.
 */
export const FEATURES = [
  /* ---------------------------------------------------------- premium first */
  { id: "MATRIX_LIGHT", label: "Matrix-/Laser-Licht", group: "LIGHT", weight: 3,
    match: /(matrix|laserlicht|laser licht|pixel led|digital light|multibeam|iq light)/ },
  { id: "HEAD_UP", label: "Head-up-Display", group: "MEDIA", weight: 3,
    match: /(head ?up|hud\b)/ },
  { id: "PANORAMA", label: "Panorama-Glasdach", group: "EXTERIOR", weight: 3,
    match: /(panoramic|panorama roof|panorama|glasdach|pano\b|panoramadach)/ },
  { id: "SUNROOF", label: "Schiebedach", group: "EXTERIOR", weight: 3,
    match: /(schiebedach|schiebe hebedach|sonnendach|sunroof|hubdach)/ },
  { id: "TOW_BAR", label: "Anhängerkupplung", group: "EXTERIOR", weight: 3,
    match: /(trailer coupling|trailer hitch|anhaengerkupplung|anhaenger kupplung|\bahk\b|towbar|tow bar)/,
    not: /(vorbereitung|vorruestung)/ },
  { id: "AUX_HEATER", label: "Standheizung", group: "CLIMATE", weight: 3,
    match: /(auxiliary heating|parking heater|standheizung|standhz|standklima|webasto|eberspaecher)/ },
  { id: "ACC", label: "Abstandstempomat (ACC)", group: "ASSIST", weight: 3,
    match: /(adaptive cruise|abstandstempomat|abstandsregel|adaptive geschwindigkeit|adaptiver tempomat|\bacc\b|distronic|active cruise|abstandsradar|tempomat mit abstand|travel assist|stau ?assistent|pilot assist)/ },
  { id: "CAMERA_360", label: "360°-Kamera", group: "ASSIST", weight: 3,
    match: /(360 camera|camera 360|surround camera|360 grad|360 kamera|kamera 360|rundumsicht|area view|surround view|umgebungskamera|top view|birds? eye|bird s eye)/ },
  { id: "CAMERA", label: "Rückfahrkamera", group: "ASSIST", weight: 3,
    match: /(rear camera|reversing camera|rueckfahrkamera|rueckfahr kamera|kamera|rear view|backup camera)/ },
  { id: "NAVIGATION", label: "Navigationssystem", group: "MEDIA", weight: 3,
    match: /(navi|navigation|\bgps\b|\bmmi plus\b|comand|discover pro|discover media)/,
    not: /(vorbereitung|vorruestung|vorber\b|ready|per app|ueber app|via app|handy)/ },
  { id: "LEATHER", label: "Lederausstattung", group: "INTERIOR", weight: 3,
    match: /(leather seats|leather interior|full leather|vollleder|voll leder|lederausstattung|ledersitze|leder sitze|lederpolster|nappa|alcantara leder|\bleder\b)/,
    not: /(lenkrad|schaltknauf|schalthebel|kunstleder|teilleder|lederoptik|kunst leder|imitat|handbremse)/ },
  { id: "PART_LEATHER", label: "Teilleder / Alcantara", group: "INTERIOR", weight: 2,
    match: /(partial leather|part leather|teilleder|teil leder|alcantara|kunstleder|lederoptik|artico|sensatec|leder stoff)/ },
  { id: "AWD", label: "Allradantrieb", group: "EXTERIOR", weight: 3,
    match: /(allrad|4x4|4motion|quattro|xdrive|4matic|awd|all wheel|4wd|q4\b|intelligent awd)/ },
  { id: "AIR_SUSPENSION", label: "Luftfederung", group: "EXTERIOR", weight: 3,
    match: /(luftfederung|luft federung|airmatic|air suspension|niveauregulierung)/ },
  { id: "PREMIUM_SOUND", label: "Premium-Soundsystem", group: "MEDIA", weight: 3,
    match: /(harman|kardon|bose|bang|olufsen|b o\b|burmester|meridian|beats audio|dynaudio|jbl|sound system|soundsystem|premium sound|canton|focal)/ },
  { id: "SPORT_PACKAGE", label: "Sportpaket (M/AMG/S/R-Line …)", group: "EXTERIOR", weight: 3,
    match: /(sport package|sports package|\bm sportpaket|\bm paket|amg line|amg paket|\bs line\b|\br line\b|\brs paket|\bst line\b|\bgt line\b|\bfr paket|sportpaket|sport paket|\bn line\b|\bm sport\b|\br design\b|black edition)/ },
  { id: "POWER_TAILGATE", label: "Elektrische Heckklappe", group: "COMFORT", weight: 3,
    match: /(electric tailgate|elektrische heckklappe|heckklappe elektrisch|el heckklappe|easy open|virtuelles pedal|power tailgate|heckklappe automatisch|automatische heckklappe)/ },
  { id: "KEYLESS", label: "Keyless Entry / Go", group: "COMFORT", weight: 3,
    match: /(keyless|kessy|komfortzugang|smart key|schluessellos|comfort access|advanced key)/ },
  { id: "SEAT_VENTILATION", label: "Sitzbelüftung / Massage", group: "INTERIOR", weight: 3,
    match: /(seat ventilation|ventilated seats|sitzbelueftung|belueftete sitze|klimatisierte sitze|massage)/ },
  { id: "THIRD_ROW", label: "7 Sitze", group: "INTERIOR", weight: 3,
    match: /(third row|7 sitze|7 sitzer|siebensitzer|dritte sitzreihe|3 sitzreihe)/ },

  /* ----------------------------------------------------------- expected */
  { id: "LED_LIGHT", label: "LED-/Xenon-Scheinwerfer", group: "LIGHT", weight: 2,
    match: /(led headlight|xenon headlight|led scheinwerfer|led hauptscheinwerfer|voll led|full led|xenon|bi xenon|led licht|\bled\b)/,
    not: /(tagfahrlicht|rueckleuchte|heckleuchte|innen|ambiente|nebel)/ },
  { id: "CLIMATE_AUTO", label: "Klimaautomatik", group: "CLIMATE", weight: 2,
    match: /(automatic climat|climate control|climatisation|klimaautomatik|klima automatik|climatronic|klimaanlage automatisch|automatische klima|2 zonen|3 zonen|4 zonen|zonen klima)/ },
  { id: "SEAT_HEATING", label: "Sitzheizung", group: "CLIMATE", weight: 2,
    match: /(sitzheizung|sitzhz|beheizbare sitze|heated seats|sitze beheizbar)/ },
  { id: "STEERING_HEATING", label: "Lenkradheizung", group: "CLIMATE", weight: 2,
    match: /(steering wheel heat|lenkradheizung|beheizbares lenkrad|lenkrad beheizbar|heated steering)/ },
  { id: "WINDSCREEN_HEATING", label: "Beheizbare Frontscheibe", group: "CLIMATE", weight: 2,
    match: /(heated windshield|heated windscreen|frontscheibenheizung|beheizbare frontscheibe|frontscheibe beheizbar|heizbare frontscheibe)/ },
  { id: "WINTER_PACKAGE", label: "Winterpaket", group: "CLIMATE", weight: 2,
    match: /(winterpaket|winter paket)/ },
  { id: "PARKING_SENSORS", label: "Einparkhilfe", group: "ASSIST", weight: 2,
    match: /(parking sensor|parking assist|park distance|einparkhilfe|parksensor|park sensor|parkdistanz|\bpdc\b|parkpilot|park pilot|abstandswarner|einparkassistent|park assist|parkassistent)/ },
  { id: "CRUISE", label: "Tempomat", group: "ASSIST", weight: 2,
    match: /(tempomat|geschwindigkeitsregel|cruise control|speed control|limiter)/ },
  { id: "LANE_ASSIST", label: "Spurhalteassistent", group: "ASSIST", weight: 2,
    match: /(lane departure|lane change|spurhalte|spurwechsel|lane assist|lane keep|spurassist|spurverlassen)/ },
  { id: "BLIND_SPOT", label: "Totwinkel-Assistent", group: "ASSIST", weight: 2,
    match: /(totwinkel|toter winkel|blind spot|side assist|spurwechselwarn)/ },
  { id: "EMERGENCY_BRAKE", label: "Notbremsassistent", group: "ASSIST", weight: 2,
    match: /(emergency brak|notbrems|front assist|city safety|kollisionswarn|auffahrwarn|collision|pre sense|pre crash)/ },
  { id: "SIGN_RECOGNITION", label: "Verkehrszeichenerkennung", group: "ASSIST", weight: 2,
    match: /(verkehrszeichen|verkehrsschild|schilderkennung|traffic sign)/ },
  { id: "SMARTPHONE", label: "Apple CarPlay / Android Auto", group: "MEDIA", weight: 2,
    match: /(carplay|car play|android auto|app connect|smartphone integration|smartlink|mirror ?link)/ },
  { id: "DIGITAL_COCKPIT", label: "Digitales Cockpit", group: "MEDIA", weight: 2,
    match: /(digital cockpit|digitales cockpit|virtual cockpit|volldigital|digitaler tacho|active info display|digitale instrumente)/ },
  { id: "ALLOYS", label: "Leichtmetallfelgen", group: "EXTERIOR", weight: 2,
    match: /(alloy wheel|leichtmetall|alufelge|alu felge|alu raeder|alloy|\balu\b)/,
    not: /(pedal|optik|zierleist|dekor|einlage|leiste|blende)/ },
  { id: "SPORT_SUSPENSION", label: "Sportfahrwerk / adaptives Fahrwerk", group: "EXTERIOR", weight: 2,
    match: /(sport suspension|sports suspension|sportfahrwerk|sport fahrwerk|adaptives fahrwerk|dcc|adaptive daempfer|tieferlegung|dynamic chassis)/ },
  { id: "TINTED", label: "Getönte Scheiben hinten", group: "EXTERIOR", weight: 1,
    match: /(tinted|getoent|privacy|abgedunkelt|dunkel getoent|sonnenschutzverglasung)/ },
  { id: "ELECTRIC_SEATS", label: "Elektrische Sitze", group: "INTERIOR", weight: 2,
    match: /(electric seat|power seat|electric adjustable seat|elektrisch verstellbare sitze|el verstellbare sitze|sitze elektrisch|elektrische sitze|elektr sitz|memory)/ },
  { id: "SPORT_SEATS", label: "Sportsitze", group: "INTERIOR", weight: 2,
    match: /(sport seats|sports seats|sportsitze|sport sitze|schalensitz|ergo active|agr sitz)/ },
  { id: "AMBIENT", label: "Ambientebeleuchtung", group: "INTERIOR", weight: 2,
    match: /(ambiente|ambient)/ },
  { id: "DAB", label: "DAB-Radio", group: "MEDIA", weight: 1,
    match: /(\bdab\b|digitalradio|digital radio)/ },
  { id: "WIRELESS_CHARGING", label: "Induktives Laden", group: "MEDIA", weight: 1,
    match: /(induction charg|induktiv|wireless charg|kabelloses laden|qi\b)/ },

  /* -------------------------------------------------------- nice to have */
  { id: "CLIMATE", label: "Klimaanlage", group: "CLIMATE", weight: 1,
    match: /(klimaanlage|klima\b|air condition|\bac\b)/ },
  { id: "BLUETOOTH", label: "Bluetooth", group: "MEDIA", weight: 1,
    match: /(bluetooth)/ },
  { id: "HANDS_FREE", label: "Freisprecheinrichtung", group: "MEDIA", weight: 1,
    match: /(freisprech|hands ?free phone|telefon)/,
    not: /(vorbereitung|vorruestung)/ },
  { id: "MULTIFUNCTION_WHEEL", label: "Multifunktionslenkrad", group: "COMFORT", weight: 1,
    match: /(multifunctional wheel|multifunction steering|multifunktionslenkrad|multifunktions lenkrad|multifunktion lenkrad|\bmfl\b|lenkrad multifunktion)/ },
  { id: "LEATHER_WHEEL", label: "Lederlenkrad", group: "INTERIOR", weight: 1,
    match: /(leather steering|lederlenkrad|leder lenkrad|lenkrad leder|lederschaltknauf|leder schaltknauf)/ },
  { id: "RAIN_SENSOR", label: "Regensensor", group: "LIGHT", weight: 1,
    match: /(regensensor|regen sensor)/ },
  { id: "LIGHT_SENSOR", label: "Lichtsensor / Fahrlichtautomatik", group: "LIGHT", weight: 1,
    match: /(light sensor|lichtsensor|fahrlichtschaltung|lichtautomatik|licht sensor|fahrlichtautomatik|coming home)/ },
  { id: "CORNERING_LIGHT", label: "Kurvenlicht", group: "LIGHT", weight: 1,
    match: /(kurvenlicht|abbiegelicht|dynamisches licht)/ },
  { id: "HIGH_BEAM_ASSIST", label: "Fernlichtassistent", group: "LIGHT", weight: 1,
    match: /(high beam|fernlicht)/ },
  { id: "AUTO_DIM_MIRROR", label: "Abblendender Innenspiegel", group: "LIGHT", weight: 1,
    match: /(abblend|autom abblend)/ },
  { id: "HEADLIGHT_WASHER", label: "Scheinwerferreinigung", group: "LIGHT", weight: 1,
    match: /(headlight wash|scheinwerferreinigung|scheinwerfer reinigung|scheinwerferwasch)/ },
  { id: "FOG_LIGHTS", label: "Nebelscheinwerfer", group: "LIGHT", weight: 1,
    match: /(fog lamp|fog light|nebelscheinwerfer|nebellicht|nsw\b)/ },
  { id: "ELECTRIC_MIRRORS", label: "Elektrische Außenspiegel", group: "COMFORT", weight: 1,
    match: /(exterior mirror|electric mirror|aussenspiegel|seitenspiegel|spiegel elektr|spiegel anklappbar|spiegel paket)/ },
  { id: "ELECTRIC_WINDOWS", label: "Elektrische Fensterheber", group: "COMFORT", weight: 1,
    match: /(electric window|power window|fensterheber)/ },
  { id: "HILL_START", label: "Berganfahrassistent", group: "ASSIST", weight: 1,
    match: /(berganfahr|hill hold|hill start|auto hold)/ },
  { id: "ONBOARD_COMPUTER", label: "Bordcomputer", group: "MEDIA", weight: 1,
    match: /(on board computer|onboard computer|trip computer|bordcomputer|multifunktionsanzeige|fahrerinformation)/ },
  { id: "USB", label: "USB / AUX", group: "MEDIA", weight: 1,
    match: /(\busb\b|\baux\b)/ },
  { id: "ARMREST", label: "Mittelarmlehne", group: "INTERIOR", weight: 1,
    match: /(armrest|arm rest|armlehne)/ },
  { id: "START_STOP", label: "Start-Stopp-Automatik", group: "COMFORT", weight: 1,
    match: /(start stopp|start stop)/ },
  { id: "SKI_BAG", label: "Durchlade / Skisack", group: "INTERIOR", weight: 1,
    match: /(ski bag|skisack|durchlade)/ },
  { id: "SPLIT_SEATS", label: "Umklappbare Rücksitze", group: "INTERIOR", weight: 1,
    match: /(umklappbar|klappbare ruecksitz|ruecksitzbank geteilt|geteilte ruecksitz)/ },
  { id: "ROOF_RAILS", label: "Dachreling", group: "EXTERIOR", weight: 1,
    match: /(dachreling|dach reling|roof rail)/ },
  { id: "METALLIC", label: "Metallic-Lackierung", group: "EXTERIOR", weight: 1,
    match: /(metallic|perleffekt|perlmutt|mineral)/ },
  { id: "WINTER_TYRES", label: "Winter-/Allwetterreifen", group: "EXTERIOR", weight: 1,
    match: /(winter tyre|winter tire|all season|winterreifen|winterraeder|allwetter|ganzjahres|m s reifen|8 fach|8fach|zweiter radsatz|2 radsatz)/ },
  { id: "TYRE_PRESSURE", label: "Reifendruckkontrolle", group: "SAFETY", weight: 0,
    match: /(tire pressure|tyre pressure|reifendruck|rdk\b|rdks)/ },

  /* ------------------------------------------------ standard on every car */
  { id: "DAYTIME_LIGHTS", label: "Tagfahrlicht", group: "LIGHT", weight: 0,
    match: /(daytime running|tagfahrlicht)/ },
  { id: "CENTRAL_LOCKING", label: "Zentralverriegelung", group: "COMFORT", weight: 0,
    match: /(central locking|zentralverriegelung|funkfernbedienung)/ },
  { id: "POWER_STEERING", label: "Servolenkung", group: "COMFORT", weight: 0,
    match: /(power assisted steering|power steering|servolenkung|servotronic)/ },
  { id: "ISOFIX", label: "Isofix", group: "SAFETY", weight: 0,
    match: /(isofix)/ },
  { id: "ABS", label: "ABS", group: "SAFETY", weight: 0,
    match: /(\babs\b|antiblockier)/ },
  { id: "ESP", label: "ESP / Traktionskontrolle", group: "SAFETY", weight: 0,
    match: /(traction control|stability control|\besp\b|\basr\b|traktionskontrolle|stabilitaetskontrolle|\bdsc\b|\bvsc\b)/ },
  { id: "AIRBAGS", label: "Airbags", group: "SAFETY", weight: 0,
    match: /(airbag)/ },
  { id: "IMMOBILISER", label: "Wegfahrsperre / Alarm", group: "SAFETY", weight: 0,
    match: /(immobili|alarm|wegfahrsperre|alarmanlage|diebstahl)/ },
  { id: "RADIO", label: "Radio", group: "MEDIA", weight: 0,
    match: /(radio|tuner|\bcd\b|\bmp3\b|soundanlage|lautsprecher)/ },
];

const FEATURE_BY_ID = new Map(FEATURES.map((feature) => [feature.id, feature]));

/**
 * Entries in a portal's list that are not equipment at all: condition,
 * history and paperwork. They are real information, just not about what the
 * car is fitted with, so they go elsewhere.
 */
const NOT_EQUIPMENT =
  /(scheckheft|nichtraucher|garantie|unfallfrei|hu neu|tuev neu|servicegepflegt|jahreswagen|vorfuehr|taxi|mietwagen|behindertengerecht|e10|biodiesel|euro ?[456]|umweltplakette|partikelfilter|katalysator|service history|non smok|warranty|particulate|catalytic|rental|handicap|disabled|damage|export)/;

/** Matches one portal entry against the catalogue. First match wins. */
export function matchFeature(rawItem) {
  const key = equipmentKey(rawItem);
  if (!key || key.length < 2) return null;

  for (const feature of FEATURES) {
    if (!feature.match.test(key)) continue;
    if (feature.not && feature.not.test(key)) continue;
    return feature;
  }
  return null;
}

/**
 * Finds features mentioned in free text — the description or the headline.
 *
 * Less trustworthy than a portal's list: a description may say "ohne Navi" or
 * "Klima defekt". Each hit is checked for a negation just before it, and only
 * features worth at least `minWeight` are taken from prose at all — nobody
 * needs "Airbag" pulled out of a sentence.
 */
export function featuresInText(text, { minWeight = 1 } = {}) {
  const key = ` ${equipmentKey(text)} `;
  if (key.trim().length < 3) return [];

  const found = [];

  for (const feature of FEATURES) {
    if (feature.weight < minWeight) continue;

    const pattern = new RegExp(feature.match.source, "g");
    let hit;

    while ((hit = pattern.exec(key)) !== null) {
      const before = key.slice(Math.max(0, hit.index - 18), hit.index);
      const after = key.slice(hit.index, hit.index + hit[0].length + 22);

      // "ohne Navi", "kein Leder", "Navi defekt", "Klima geht nicht"
      if (/\b(ohne|kein|keine|nicht|fehlt|leider)\s+(\w+\s+)?$/.test(before)) continue;
      if (/\b(defekt|kaputt|ohne funktion|funktioniert nicht|geht nicht)\b/.test(after)) continue;
      if (feature.not && feature.not.test(after)) continue;

      found.push(feature);
      break;
    }
  }

  return found;
}

/** Features that "Teilleder", "Vollleder" and the like in an upholstery field imply. */
function featuresFromUpholstery(upholstery) {
  const key = equipmentKey(upholstery);
  if (!key) return [];
  if (/(vollleder|voll leder|^leder$|nappa)/.test(key)) return [FEATURE_BY_ID.get("LEATHER")];
  if (/(teilleder|alcantara|kunstleder|velours leder)/.test(key)) {
    return [FEATURE_BY_ID.get("PART_LEATHER")];
  }
  return [];
}

/**
 * The features a buyer of a used car in this class tends to look for first.
 * When a portal list is long enough to be taken as complete and one of these
 * is not in it, that is worth knowing — and worth saying on the phone.
 */
const COMMONLY_EXPECTED = [
  "NAVIGATION",
  "CLIMATE_AUTO",
  "SEAT_HEATING",
  "PARKING_SENSORS",
  "CRUISE",
  "ALLOYS",
  "SMARTPHONE",
];

/** Features that make each other redundant for the "not listed" check. */
const COVERED_BY = {
  CLIMATE_AUTO: ["CLIMATE_AUTO"],
  PARKING_SENSORS: ["PARKING_SENSORS", "CAMERA", "CAMERA_360"],
  CRUISE: ["CRUISE", "ACC"],
  NAVIGATION: ["NAVIGATION"],
  SMARTPHONE: ["SMARTPHONE", "NAVIGATION"],
};

export const EQUIPMENT_LEVELS = {
  PREMIUM: "Premium",
  HIGH: "Sehr gut",
  GOOD: "Gut",
  BASIC: "Basis",
  UNKNOWN: "Unbekannt",
};

/**
 * Reads a vehicle's full equipment picture.
 *
 * @param {object} vehicle  canonical vehicle (equipment list, upholstery,
 *                          title, description)
 * @returns {object} recognised features by group, the level, highlights, what
 *   is not listed, and the portal entries the catalogue does not know — those
 *   are shown too, because the portal's own wording is still information.
 */
export function analyzeEquipment(vehicle) {
  const rawList = Array.isArray(vehicle?.equipment) ? vehicle.equipment : [];

  const found = new Map();
  const unmatched = [];
  const record = (feature, from) => {
    if (!feature) return;
    if (!found.has(feature.id)) found.set(feature.id, { ...feature, from });
  };

  for (const raw of rawList) {
    const text = cleanText(raw);
    if (!text) continue;
    if (NOT_EQUIPMENT.test(equipmentKey(text))) continue;

    const feature = matchFeature(text);
    if (feature) record(feature, "Anzeige");
    else if (text.length <= 60) unmatched.push(text);
  }

  for (const feature of featuresFromUpholstery(vehicle?.upholstery)) {
    record(feature, "Anzeige");
  }

  // The headline is the seller's own summary; "… Navi LED AHK" is common.
  for (const feature of featuresInText(vehicle?.title, { minWeight: 2 })) {
    record(feature, "Titel");
  }

  // Descriptions are long and chatty; only take what matters from them.
  for (const feature of featuresInText(vehicle?.description, { minWeight: 2 })) {
    record(feature, "Beschreibung");
  }

  // Leather trumps part-leather when both turn up.
  if (found.has("LEATHER")) found.delete("PART_LEATHER");
  // A 360° camera includes the reversing camera.
  if (found.has("CAMERA_360")) found.delete("CAMERA");
  // Climate control includes air conditioning.
  if (found.has("CLIMATE_AUTO")) found.delete("CLIMATE");

  const items = [...found.values()].sort(
    (a, b) => b.weight - a.weight || a.label.localeCompare(b.label, "de"),
  );

  const strong = items.filter((item) => item.weight === 3);
  const good = items.filter((item) => item.weight === 2);
  const basic = items.filter((item) => item.weight === 1);

  const groups = Object.entries(EQUIPMENT_GROUPS)
    .map(([id, label]) => ({
      id,
      label,
      items: items.filter((item) => item.group === id).map((item) => item.label),
    }))
    .filter((group) => group.items.length);

  // A portal list of eight or more entries is taken as the seller's full
  // declaration. Shorter lists are too thin to conclude anything is missing.
  const listIsComplete = rawList.length >= 8;
  const notListed = listIsComplete
    ? COMMONLY_EXPECTED.filter((id) => {
        const coveredBy = COVERED_BY[id] || [id];
        return !coveredBy.some((covering) => found.has(covering));
      }).map((id) => FEATURE_BY_ID.get(id).label)
    : [];

  const level = equipmentLevel({ strong, good, known: items.length });

  return {
    level,
    levelLabel: EQUIPMENT_LEVELS[level],
    // 0–100, for a bar. Standard items (weight 0) never move it.
    score: Math.min(
      100,
      Math.round(strong.length * 12 + good.length * 5 + basic.length * 1.5),
    ),

    count: items.length,
    listedCount: rawList.length,
    listIsComplete,

    highlights: strong.map((item) => item.label),
    items: items.map(({ id, label, group, weight, from }) => ({
      id,
      label,
      group,
      weight,
      from,
    })),
    groups,
    notListed,
    // What the portal lists that the catalogue does not recognise — kept, not dropped.
    other: [...new Set(unmatched)].slice(0, 30),
  };
}

function equipmentLevel({ strong, good, known }) {
  if (known === 0) return "UNKNOWN";
  if (strong.length >= 5) return "PREMIUM";
  if (strong.length >= 3 || (strong.length >= 2 && good.length >= 5)) return "HIGH";
  if (strong.length >= 1 || good.length >= 4) return "GOOD";
  return "BASIC";
}

/** Canonical ids present on a vehicle — cheap, for comparables. */
export function featureIds(vehicle) {
  return new Set(analyzeEquipment(vehicle).items.map((item) => item.id));
}
