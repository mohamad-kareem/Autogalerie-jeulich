export const formInitialData = {
  // Step 1: Basic Information
  name: "",
  subtitle: "",
  vin: "",
  price: 0,
  registration: "",
  kilometers: 104000,
  power: 100,
  hp: 136,
  fuel: "Benzin",
  condition: "Gebrauchtfahrzeug",
  status: "Beschädigt",
  accidentFree: true,
  operational: false,
  category: "Limousine",

  // Step 2: Technical Specifications
  modelSeries: "2",
  model: "",
  equipmentLine: "218 i",
  displacement: 1.5,
  seats: 5,
  doors: 5,
  emissionClass: "Euro6",
  environmentalBadge: "4 (Grün)",
  previousOwners: "1",
  inspectionDate: "05/2026",
  cylinders: 3,
  tankCapacity: 51,
  driveType: "Verbrennungsmotor",
  energyConsumption: 5.3,
  co2Emission: 126,
  fuelConsumption: 5.3,
  weight: 1395,
  towCapacityBraked: 1300,
  towCapacityUnbraked: 695,
  transmission: "Schaltgetriebe",

  // Step 3: Features & Equipment
  features: [
    "ABS",
    "Elektr. Wegfahrsperre",
    "Multifunktionslenkrad",
    "Start/Stopp-Automatik",
    "Armlehne",
    "ESP",
    "Nebelscheinwerfer",
    "Tagfahrlicht",
    "CD-Spieler",
    "Freisprecherinrichtung",
    "Regensensor",
    "Traktionskontrolle",
    "Dachreling",
    "Frontantrieb",
    "Servolenkung",
    "Tuner/Radio",
    "Elektr. Seitenspiegel",
    "Isofix",
    "Sitzheizung",
    "Zentralverriegelung",
  ],
  specialFeatures: [
    "CD-Laufwerk",
    "Dachreling schwarz",
    "Innenspiegel mit Abblendautomatik",
    "Klimaautomatik 2-Zonen mit autom. Umluft-Control",
    "Metallic-Lackierung",
    "Multifunktion für Lenkrad",
    "Park-Distance-Control (PDC) vorne und hinten",
    "Scheinwerfer LED (erweiterter Umfang)",
    "Sitzheizung vorne",
  ],
  airConditioning: "Klimaautomatik",
  parkingAssistance: "Vorne und hinten",
  airbags: "Front-, Seiten- und weitere Airbags",

  // Step 4: Appearance
  exteriorColor: "FLAMENCOROT BRILLANTEFFEKT METAL",
  exteriorColorSimple: "Rot Metallic",
  interiorColor: "Vollleder, Schwarz",
  interiorMaterial: "Vollleder",
  interiorColorSimple: "Schwarz",

  // Step 5: Description & Images
  description:
    "Zum Verkauf steht ein BMW 218 Baureihe 2 Active Tourer 218!\n\n- 104.000 km gefahren\n- 1.Hand\n- TÜV AU bis 05.2026\n- Scheckheft diverse Rechnungen und Nachweise der Wartungen\n\n---\n\n",
  hasEngineDamage: true,
};

export const fuelOptions = [
  { value: "Benzin", label: "Benzin" },
  { value: "Diesel", label: "Diesel" },
  { value: "Elektro", label: "Elektro" },
  { value: "Hybrid", label: "Hybrid" },
];

export const conditionOptions = [
  { value: "Neu", label: "Neu" },
  { value: "Gebrauchtfahrzeug", label: "Gebraucht" },
  { value: "Vorführfahrzeug", label: "Vorführfahrzeug" },
];

export const statusOptions = [
  { value: "Beschädigt", label: "Beschädigt" },
  { value: "Unfallfrei", label: "Unfallfrei" },
  { value: "Restauriert", label: "Restauriert" },
];

export const categoryOptions = [
  { value: "Limousine", label: "Limousine" },
  { value: "Kombi", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "Cabrio", label: "Cabrio" },
  { value: "Coupe", label: "Coupe" },
];

export const emissionClassOptions = [
  { value: "Euro6", label: "Euro6" },
  { value: "Euro5", label: "Euro5" },
  { value: "Euro4", label: "Euro4" },
];

export const environmentalBadgeOptions = [
  { value: "4 (Grün)", label: "4 (Grün)" },
  { value: "3 (Gelb)", label: "3 (Gelb)" },
  { value: "2 (Rot)", label: "2 (Rot)" },
];

export const airConditioningOptions = [
  { value: "Klimaautomatik", label: "Klimaautomatik" },
  { value: "Manuelle Klimaanlage", label: "Manuelle Klimaanlage" },
  { value: "Keine Klimaanlage", label: "Keine Klimaanlage" },
];

export const parkingAssistanceOptions = [
  { value: "Hinten", label: "Hinten" },
  { value: "Vorne und hinten", label: "Vorne und hinten" },
  { value: "Keine", label: "Keine" },
];

export const driveTypeOptions = [
  { value: "Verbrennungsmotor", label: "Verbrennungsmotor" },
  { value: "Elektromotor", label: "Elektromotor" },
  { value: "Hybrid", label: "Hybrid" },
];

export const transmissionOptions = [
  { value: "Schaltgetriebe", label: "Schaltgetriebe" },
  { value: "Automatikgetriebe", label: "Automatikgetriebe" },
];

export const interiorMaterialOptions = [
  { value: "Stoff", label: "Stoff" },
  { value: "Teilleder", label: "Teilleder" },
  { value: "Vollleder", label: "Vollleder" },
  { value: "Kunstleder", label: "Kunstleder" },
];
