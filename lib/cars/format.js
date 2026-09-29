/**
 * Gebrauchtwagen — how a mobile.de ad is shown on the website.
 *
 * Shared by the list, the detail page, the comparison and the SEO data, so a
 * value reads the same everywhere ("Diesel", "05/2019", "110 kW (150 PS)").
 */

export const DEALER = {
  name: "Autogalerie Jülich",
  street: "Alte Dürenerstraße 4",
  zip: "52428",
  city: "Jülich",
  phone: "+492461916006613",
  phoneLabel: "02461 916006613",
  email: "info@autogalerie-juelich.de",
  mapsUrl: "https://maps.google.com/?q=Alte+D%C3%BCrenerstra%C3%9Fe+4+52428+J%C3%BClich",
};

const LABELS = {
  fuel: {
    PETROL: "Benzin",
    DIESEL: "Diesel",
    ELECTRICITY: "Elektro",
    ELECTRIC: "Elektro",
    HYBRID: "Hybrid",
    HYBRID_DIESEL: "Diesel-Hybrid",
    PLUGIN_HYBRID: "Plug-in-Hybrid",
    LPG: "Autogas (LPG)",
    CNG: "Erdgas (CNG)",
    HYDROGENIUM: "Wasserstoff",
    HYDROGEN: "Wasserstoff",
    ETHANOL: "Ethanol",
    OTHER: "Andere",
  },
  gearbox: {
    MANUAL_GEAR: "Schaltgetriebe",
    AUTOMATIC_GEAR: "Automatik",
    SEMIAUTOMATIC_GEAR: "Halbautomatik",
    SEMI_AUTOMATIC_GEAR: "Halbautomatik",
    NO_GEARS: "Ohne Getriebe",
  },
  category: {
    Cabrio: "Cabrio / Roadster",
    CONVERTIBLE: "Cabrio / Roadster",
    EstateCar: "Kombi",
    WAGON: "Kombi",
    Limousine: "Limousine",
    OffRoad: "SUV / Geländewagen",
    SmallCar: "Kleinwagen",
    SportsCar: "Sportwagen / Coupé",
    SPORTS_CAR: "Sportwagen / Coupé",
    COUPE: "Coupé",
    Van: "Van / Minibus",
    VAN: "Van / Minibus",
    PICKUP: "Pick-up",
    OtherCar: "Andere",
  },
  color: {
    BLACK: "Schwarz",
    WHITE: "Weiß",
    SILVER: "Silber",
    GREY: "Grau",
    RED: "Rot",
    BLUE: "Blau",
    GREEN: "Grün",
    YELLOW: "Gelb",
    BROWN: "Braun",
    ORANGE: "Orange",
    PURPLE: "Lila",
    VIOLET: "Violett",
    BEIGE: "Beige",
    GOLD: "Gold",
    PINK: "Rosa",
    MULTICOLOUR: "Mehrfarbig",
  },
  climatisation: {
    NO_CLIMATISATION: null,
    MANUAL_CLIMATISATION: "Klimaanlage",
    AUTOMATIC_CLIMATISATION: "Klimaautomatik",
    AUTOMATIC_CLIMATISATION_2_ZONES: "2-Zonen-Klimaautomatik",
    AUTOMATIC_CLIMATISATION_3_ZONES: "3-Zonen-Klimaautomatik",
    AUTOMATIC_CLIMATISATION_4_ZONES: "4-Zonen-Klimaautomatik",
  },
  airbag: {
    DRIVER_AIRBAG: "Fahrerairbag",
    FRONT_AIRBAGS: "Front-Airbags",
    FRONT_AND_SIDE_AIRBAGS: "Front- und Seitenairbags",
    FRONT_AND_SIDE_AND_MORE_AIRBAGS: "Front-, Seiten- und weitere Airbags",
  },
  driveType: {
    FRONT: "Frontantrieb",
    REAR: "Heckantrieb",
    ALL_WHEEL: "Allrad",
    FOUR_WHEEL: "Allrad",
  },
  interiorType: {
    LEATHER: "Vollleder",
    PARTIAL_LEATHER: "Teilleder",
    FABRIC: "Stoff",
    VELOUR: "Velours",
    ALCANTARA: "Alcantara",
    OTHER: "Andere",
  },
  doors: {
    TWO_OR_THREE: "2/3",
    FOUR_OR_FIVE: "4/5",
    SIX_OR_SEVEN: "6/7",
  },
  emissionClass: {
    EURO1: "Euro 1",
    EURO2: "Euro 2",
    EURO3: "Euro 3",
    EURO4: "Euro 4",
    EURO5: "Euro 5",
    EURO6: "Euro 6",
    EURO6C: "Euro 6c",
    EURO6D: "Euro 6d",
    EURO6D_TEMP: "Euro 6d-TEMP",
  },
  headlightType: {
    XENON_HEADLIGHTS: "Xenon",
    BI_XENON_HEADLIGHTS: "Bi-Xenon",
    LED_HEADLIGHTS: "LED-Scheinwerfer",
    LASER_HEADLIGHTS: "Laserlicht",
  },
  parkingAssistants: {
    FRONT_SENSORS: "Parksensoren vorne",
    REAR_SENSORS: "Parksensoren hinten",
    REAR_VIEW_CAM: "Rückfahrkamera",
    REAR_CAMERA: "Rückfahrkamera",
    CAM_360_DEGREES: "360°-Kamera",
    AUTOMATIC_PARKING: "Selbstlenkender Parkassistent",
    PARKING_ASSISTANT: "Parkassistent",
  },
};

/** "AUTOMATIC_GEAR" → "Automatik"; unknown codes become readable words. */
export function label(kind, value) {
  if (value === null || value === undefined || value === "") return null;
  const map = LABELS[kind] || {};
  if (Object.prototype.hasOwnProperty.call(map, value)) return map[value];
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------ numbers */

export function priceOf(car) {
  const value = Number(String(car?.price?.consumerPriceGross ?? "").replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function euro(value) {
  if (!Number.isFinite(value)) return "Preis auf Anfrage";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function km(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? `${n.toLocaleString("de-DE")} km` : null;
}

/** mobile.de sends "201905" (or "2019-05"); shown as "05/2019". */
export function registration(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 6) return digits.length === 4 ? digits : null;
  return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
}

export function registrationYear(value) {
  const year = Number(String(value || "").replace(/\D/g, "").slice(0, 4));
  return year > 1900 ? year : null;
}

export function powerPs(car) {
  const kw = Number(car?.power);
  return Number.isFinite(kw) && kw > 0 ? Math.round(kw * 1.35962) : null;
}

export function power(car) {
  const kw = Number(car?.power);
  return Number.isFinite(kw) && kw > 0 ? `${kw} kW (${powerPs(car)} PS)` : null;
}

export function displacement(car) {
  const ccm = Number(car?.cubicCapacity);
  return Number.isFinite(ccm) && ccm > 0 ? `${ccm.toLocaleString("de-DE")} cm³` : null;
}

/* ------------------------------------------------------------ HU / TÜV */

const MONTHS_DE = ["jan", "feb", "mär", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "dez"];

/** "05/27", "5.2027", "2027-05", "202705" → "2027-05" (or null). */
export function monthYear(raw) {
  const text = String(raw ?? "").trim();
  let m = text.match(/^((?:19|20)\d{2})\s*[-/.]?\s*(0?[1-9]|1[0-2])(?!\d)/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = text.match(/^(0?[1-9]|1[0-2])\s*[./-]\s*((?:19|20)?\d{2})(?!\d)/);
  if (m) return `${m[2].length === 2 ? `20${m[2]}` : m[2]}-${m[1].padStart(2, "0")}`;
  return null;
}

// "TÜV/AU bis 05/2027", "TÜV/ AU Neu", "HU/AU: 05.27", "Tüv 11/26", "HU 2027-05".
// Written without /i so "NeuScheckheft" (glued text) still reads as "Neu".
const HU_TEXT =
  /(?:T[ÜüU][Vv]|TUEV|(?<![A-Za-zÄÖÜäöüß])HU)(?:\s*\/\s*AU)?(?:\s+(?:[Nn]eu\s+)?(?:bis zum|gültig bis|bis))?\s*[:.-]?\s*([Nn][Ee][Uu](?![a-zäöü])|(?:0?[1-9]|1[0-2])\s*[./-]\s*(?:20)?\d{2}(?!\d)|20\d{2}\s*[-/]\s*(?:0?[1-9]|1[0-2])(?!\d))/;
const HU_MONTH_NAME =
  /(?:T[ÜüU][Vv]|TUEV|(?<![A-Za-zÄÖÜäöüß])HU)(?:\s*\/\s*AU)?(?:\s+bis)?\s*[:.-]?\s*(Jan|Feb|Mär|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)[a-zä]*\.?\s*((?:20)?\d{2})(?!\d)/i;

/**
 * The HU date as "2027-05" or "Neu": mobile.de's own fields first, then what
 * the seller wrote in the text.
 */
export function inspectionFrom(ad, description) {
  for (const key of ["generalInspection", "nextGeneralInspection", "nextInspection", "inspectionDate", "huAu", "hu", "tuv", "newHuAu"]) {
    const value = ad?.[key];
    if (typeof value === "string" && value.trim()) {
      if (/^neu$/i.test(value.trim())) return "Neu";
      const date = monthYear(value);
      if (date) return date;
    }
  }
  const text = String(description || "");
  const match = text.match(HU_TEXT);
  if (match) {
    if (/^neu$/i.test(match[1])) return "Neu";
    const date = monthYear(match[1].replace(/\s+/g, ""));
    if (date) return date;
  }
  const named = text.match(HU_MONTH_NAME);
  if (named) {
    const month = MONTHS_DE.indexOf(named[1].toLowerCase().replace(/^mar$/, "mär")) + 1;
    if (month) return `${named[2].length === 2 ? `20${named[2]}` : named[2]}-${String(month).padStart(2, "0")}`;
  }
  if (ad?.newHuAu === true) return "Neu";
  return null;
}

/** For the page: "05/2027", "HU/AU neu", or nothing. */
export function inspection(car) {
  const value = inspectionFrom({ newHuAu: car?.newHuAu }, car?.description);
  if (!value) return null;
  if (value === "Neu") return "HU/AU neu";
  return `${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

export function consumption(car) {
  const combined = car?.consumptions?.fuel?.combined ?? car?.consumptions?.combined;
  return combined ? `${String(combined).replace(".", ",")} l/100 km` : null;
}

export function co2(car) {
  const value = car?.emissions?.combined?.co2 ?? car?.emissions?.co2;
  return value ? `${value} g/km` : null;
}

/* ------------------------------------------------------------ text */

export function titleOf(car) {
  return [car?.make, car?.model].filter(Boolean).join(" ").trim() || "Fahrzeug";
}

/** Variant line without the make/model repeated ("320d Touring M Sport"). */
export function subtitleOf(car) {
  let text = String(car?.modelDescription || "").trim();
  if (!text) return "";
  for (const word of [car?.make, car?.model]) {
    // Only whole words: "320" must not be cut out of "320d Touring".
    if (word) text = text.replace(new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)\\s*`, "i"), "");
  }
  return text.trim();
}

/** The four facts every card and summary leads with. */
export function keyFacts(car) {
  return [
    { key: "reg", label: "Erstzulassung", value: registration(car?.firstRegistration) },
    { key: "km", label: "Kilometerstand", value: km(car?.mileage) },
    { key: "power", label: "Leistung", value: power(car) },
    { key: "fuel", label: "Kraftstoff", value: label("fuel", car?.fuel) },
    { key: "gear", label: "Getriebe", value: label("gearbox", car?.gearbox) },
  ].filter((fact) => fact.value);
}

/* ------------------------------------------------------------ images */

const MOBILE_IMAGE = /img\.classistatic\.de/i;

/** All photo URLs in order (the ad stores { ref }). */
export function imagesOf(car) {
  return (Array.isArray(car?.images) ? car.images : [])
    .map((image) => (typeof image === "string" ? image : image?.ref))
    .filter(Boolean);
}

/**
 * A smaller copy of a mobile.de photo for lists and thumbnails. Pages fall
 * back to the original link if a sized copy does not load.
 */
export function sizedImage(url, size = 640) {
  if (!url || !MOBILE_IMAGE.test(url)) return url;
  // Stored links already ask for a size ("?rule=mo-640.jpg"); swap it.
  if (/[?&]rule=mo-\d+/.test(url)) return url.replace(/([?&]rule=mo-)\d+/, `$1${size}`);
  return `${url}${url.includes("?") ? "&" : "?"}rule=mo-${size}.jpg`;
}

/* ------------------------------------------------------------ equipment */

const FEATURE_GROUPS = [
  {
    title: "Komfort",
    items: [
      ["keylessEntry", "Keyless Entry"],
      ["centralLocking", "Zentralverriegelung"],
      ["electricWindows", "Elektrische Fensterheber"],
      ["electricExteriorMirrors", "Elektrische Außenspiegel"],
      ["foldingExteriorMirrors", "Elektrisch anklappbare Spiegel"],
      ["electricTailgate", "Elektrische Heckklappe"],
      ["automaticRainSensor", "Regensensor"],
      ["lightSensor", "Lichtsensor"],
      ["powerAssistedSteering", "Servolenkung"],
      ["multifunctionalWheel", "Multifunktionslenkrad"],
      ["leatherSteeringWheel", "Lederlenkrad"],
      ["paddleShifters", "Schaltwippen"],
      ["heatedWindshield", "Beheizbare Frontscheibe"],
      ["armRest", "Mittelarmlehne"],
      ["tintedWindows", "Getönte Scheiben"],
      ["ambientLighting", "Ambientebeleuchtung"],
      ["onBoardComputer", "Bordcomputer"],
      ["startStopSystem", "Start-Stopp-Automatik"],
      ["speedLimiter", "Geschwindigkeitsbegrenzer"],
    ],
  },
  {
    title: "Sitze & Innenraum",
    items: [
      ["electricHeatedSeats", "Sitzheizung"],
      ["electricAdjustableSeats", "Elektrisch verstellbare Sitze"],
      ["memorySeats", "Sitze mit Memory"],
      ["sportSeats", "Sportsitze"],
    ],
  },
  {
    title: "Multimedia",
    items: [
      ["navigationSystem", "Navigationssystem"],
      ["touchscreen", "Touchscreen"],
      ["bluetooth", "Bluetooth"],
      ["handsFreePhoneSystem", "Freisprecheinrichtung"],
      ["wirelessCharging", "Induktionsladen"],
      ["voiceControl", "Sprachsteuerung"],
      ["usb", "USB"],
      ["headUpDisplay", "Head-up-Display"],
      ["cdPlayer", "CD-Spieler"],
    ],
  },
  {
    title: "Sicherheit & Assistenz",
    items: [
      ["abs", "ABS"],
      ["esp", "ESP"],
      ["tractionControlSystem", "Traktionskontrolle"],
      ["isofix", "Isofix"],
      ["immobilizer", "Wegfahrsperre"],
      ["alarmSystem", "Alarmanlage"],
      ["tirePressureMonitoring", "Reifendruckkontrolle"],
      ["laneDepartureWarning", "Spurhalteassistent"],
      ["distanceWarningSystem", "Abstandswarner"],
      ["collisionAvoidance", "Notbremsassistent"],
      ["trafficSignRecognition", "Verkehrszeichenerkennung"],
      ["emergencyCallSystem", "Notrufsystem"],
      ["highBeamAssist", "Fernlichtassistent"],
      ["glareFreeHighBeam", "Blendfreies Fernlicht"],
    ],
  },
  {
    title: "Außen & Licht",
    items: [
      ["panoramicGlassRoof", "Panoramadach"],
      ["sunroof", "Schiebedach"],
      ["alloyWheels", "Leichtmetallfelgen"],
      ["sportPackage", "Sportpaket"],
      ["frontFogLights", "Nebelscheinwerfer"],
      ["headlightWasherSystem", "Scheinwerferreinigung"],
      ["summerTires", "Sommerreifen"],
      ["winterTires", "Winterreifen"],
      ["hasAllSeasonTires", "Ganzjahresreifen"],
    ],
  },
];

/** Only what the car has, grouped; values like climate or headlights included. */
export function equipmentOf(car) {
  if (!car) return [];
  const extra = {
    Komfort: [label("climatisation", car.climatisation)],
    "Sitze & Innenraum": [car.interiorType ? `${label("interiorType", car.interiorType)}-Ausstattung` : null],
    "Sicherheit & Assistenz": [
      label("airbag", car.airbag),
      ...(Array.isArray(car.parkingAssistants) ? car.parkingAssistants.map((entry) => label("parkingAssistants", entry)) : []),
    ],
    "Außen & Licht": [
      label("headlightType", car.headlightType),
      car.daytimeRunningLamps ? "Tagfahrlicht" : null,
      car.bendingLightsType ? "Kurvenlicht" : null,
    ],
  };
  return FEATURE_GROUPS.map((group) => {
    const items = [
      ...(extra[group.title] || []),
      ...group.items.filter(([key]) => car[key] === true).map(([, text]) => text),
    ].filter(Boolean);
    return { title: group.title, items: [...new Set(items)] };
  }).filter((group) => group.items.length);
}

/** Up to six things worth a badge ("Scheckheftgepflegt", "Navi", …). */
export function highlightsOf(car) {
  if (!car) return [];
  return [
    car.fullServiceHistory && "Scheckheftgepflegt",
    inspection(car) && `HU ${inspection(car).replace(/^HU\/AU /, "")}`,
    car.panoramicGlassRoof && "Panoramadach",
    car.navigationSystem && "Navigation",
    (car.parkingAssistants || []).some((p) => /CAM/.test(p)) && "Kamera",
    car.electricHeatedSeats && "Sitzheizung",
    car.headUpDisplay && "Head-up-Display",
    car.keylessEntry && "Keyless",
  ]
    .filter(Boolean)
    .slice(0, 6);
}

/** Technical data as label/value rows (only rows with a value). */
export function specRows(car) {
  return [
    ["Fahrzeugtyp", label("category", car?.category)],
    ["Erstzulassung", registration(car?.firstRegistration)],
    ["Kilometerstand", km(car?.mileage)],
    ["Leistung", power(car)],
    ["Hubraum", displacement(car)],
    ["Kraftstoff", label("fuel", car?.fuel)],
    ["Getriebe", label("gearbox", car?.gearbox)],
    ["Antrieb", label("driveType", car?.driveType)],
    ["Vorbesitzer", Number.isFinite(Number(car?.numberOfPreviousOwners)) && car?.numberOfPreviousOwners !== null && car?.numberOfPreviousOwners !== undefined ? String(car.numberOfPreviousOwners) : null],
    ["HU", inspection(car)],
    ["Türen", label("doors", car?.doors)],
    ["Sitzplätze", car?.seats ? String(car.seats) : null],
    ["Farbe", car?.manufacturerColorName || label("color", car?.exteriorColor)],
    ["Innenausstattung", [label("interiorType", car?.interiorType), label("color", car?.interiorColor)].filter(Boolean).join(", ") || null],
    ["Schadstoffklasse", label("emissionClass", car?.emissionClass)],
    ["Verbrauch (komb.)", consumption(car)],
    ["CO₂-Emission (komb.)", co2(car)],
    ["FIN", car?.vin || null],
  ].filter(([, value]) => value);
}

/* ------------------------------------------------------------ description */

// Section names the ads use ("Ausstattung:", "Sicherheit:", …), longest first.
const SECTIONS = [
  "WIR BIETEN IHNEN FOLGENDEN SERVICE AN", "Farbe der Innenausstattung", "Geschwindigkeitsregulierung",
  "Weitere Fahrzeugdaten", "Weitere Ausstattung", "Sonderausstattung", "Technische Daten", "Tagfahrlicht (Art)",
  "Innenausstattung", "Motor/Fahrwerk", "Klimatisierung", "Ausstattung", "Multimedia", "Sicherheit",
  "Außenfarbe", "Airbags", "Komfort", "Extras", "E-Mail", "Mail",
];
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const SECTION_START = new RegExp(`\\s*(?<!der\\s)(?=(?:${SECTIONS.map(escape).join("|")})\\s?:)`, "g");

// Sections that introduce a list, never a single "Label: value" fact.
const LIST_SECTIONS = new Set([
  "WIR BIETEN IHNEN FOLGENDEN SERVICE AN", "Weitere Fahrzeugdaten", "Weitere Ausstattung", "Sonderausstattung",
  "Technische Daten", "Motor/Fahrwerk", "Ausstattung", "Multimedia", "Sicherheit", "Komfort", "Extras",
]);

const HEADING_NAMES = { "WIR BIETEN IHNEN FOLGENDEN SERVICE AN": "Unser Service", "WIR BIETEN IHNEN AN": "Unser Service" };

/**
 * Older syncs deleted mobile.de's line breaks, so those texts arrive glued
 * together ("…gefahren2.HandTÜV/AU bis 07.2027Öl und Filter NEUAusstattung:").
 * This puts the breaks back where a new line obviously starts.
 */
function unglue(text) {
  return text
    .replace(/∗/g, "\n")
    .replace(/WIR BIETEN IHNEN FOLGENDEN SERVICE AN(?!\s?:)/g, "WIR BIETEN IHNEN FOLGENDEN SERVICE AN:")
    .replace(SECTION_START, "\n")
    .replace(/([a-zäöüß)]|[^\d\s]\.)(?=[A-ZÄÖÜ][a-zäöüß]{2,})/g, "$1\n")
    .replace(/([a-zäöüß])(?=\d\.\s?Hand)/g, "$1\n")
    .replace(/(\d\.\s?Hand)(?=\S)/g, "$1\n")
    .replace(/([a-zäöüß])(?=TÜV|HU\/)/g, "$1\n")
    .replace(/(\d)(?=[A-ZÄÖÜ][a-zäöü])/g, "$1\n")
    .replace(/\b(NEU|Neu)(?=[A-ZÄÖÜ][a-zäöü])/g, "$1\n")
    .replace(/(vorbehalten\.?)(?=\S)/g, "$1\n");
}

/**
 * The seller's text as headings, paragraphs, lists and "Label: value" facts.
 * mobile.de writes line breaks as "\\", bold as **…** and list items as "* ".
 */
export function descriptionBlocks(text) {
  let source = String(text || "")
    .replace(/\r/g, "")
    .replace(/\\\\|\\/g, "\n")
    .replace(/•/g, "\n* ");
  if (!/\n/.test(source.trim()) && source.length > 160) source = unglue(source);

  const blocks = [];
  const add = (block) => {
    const last = blocks[blocks.length - 1];
    if (block.type === "list" && last?.type === "list") last.items.push(...block.items);
    else blocks.push(block);
  };
  const heading = (name) => add({ type: "heading", text: HEADING_NAMES[name.trim()] || name.trim() });

  for (const raw of source.split("\n")) {
    let line = raw.replace(/\s{2,}/g, " ").trim();
    if (!line || /^[-_=*]{3,}$/.test(line)) continue;
    const bold = /^\*\*(.+)\*\*:?$/.test(line);
    line = line.replace(/\*\*/g, "").trim();

    // "Ausstattung: A, B, C" / "Farbe: Grau" / "Sicherheit: ABS ESP …"
    const labelled = line.match(/^([A-ZÄÖÜ][A-Za-zÄÖÜäöüß /()-]{1,45}?)\s?:\s*(.+)$/);
    if (labelled && !/^\d/.test(labelled[2])) {
      const [, name, value] = labelled;
      if (LIST_SECTIONS.has(name.trim())) {
        heading(name);
        add(value.includes(",") && value.length > 40
          ? { type: "list", items: value.split(/,\s*/).map((item) => item.replace(/\.$/, "").trim()).filter(Boolean) }
          : value.length > 70 ? { type: "text", text: value } : { type: "list", items: [value] });
        continue;
      }
      if (value.includes(",") && value.length > 40) {
        heading(name);
        add({ type: "list", items: value.split(/,\s*/).map((item) => item.replace(/\.$/, "").trim()).filter(Boolean) });
      } else if (value.length > 70) {
        heading(name);
        add({ type: "text", text: value });
      } else {
        add({ type: "fact", label: name.trim(), value: value.trim() });
      }
      continue;
    }
    if (bold || (/:$/.test(line) && line.length <= 60)) {
      heading(line.replace(/:$/, ""));
      continue;
    }
    if (/^[*\-–]\s+/.test(line)) {
      add({ type: "list", items: [line.replace(/^[*\-–]\s+/, "")] });
      continue;
    }
    const short = line.length <= 60 && !/[.!?]$/.test(line) && !/vorbehalten/i.test(line);
    add(short ? { type: "list", items: [line] } : { type: "text", text: line });
  }
  return blocks;
}
