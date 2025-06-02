export const formInitialData = {
  // personal info
  fullName: "",
  email: "",
  phone: "",
  // Step 1: Basic Information
  name: "",
  make: "",
  vin: "",
  price: 0,
  registration: "",
  kilometers: 0,
  power: 0,
  hp: 0,
  fuel: "",
  condition: "",
  status: "",
  accidentFree: false,
  operational: false,
  category: "",

  // Step 2: Technical Specifications
  modelSeries: "",
  model: "",
  equipmentLine: "",
  displacement: 0,
  seats: 0,
  doors: 0,
  emissionClass: "",
  environmentalBadge: "",
  previousOwners: "",
  inspectionDate: "",
  cylinders: 0,
  tankCapacity: 0,
  driveType: "",
  energyConsumption: 0,
  co2Emission: 0,
  fuelConsumption: 0,
  weight: 0,
  towCapacityBraked: 0,
  towCapacityUnbraked: 0,
  transmission: "",

  // Step 3: Features & Equipment
  features: [],
  specialFeatures: [],
  airConditioning: "",
  parkingAssistance: "",
  airbags: "",

  // Step 4: Appearance
  exteriorColor: "",
  exteriorColorSimple: "",
  interiorColor: "",
  interiorMaterial: "",
  interiorColorSimple: "",

  // Step 5: Description & Images
  description: "",
  hasEngineDamage: false,
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
