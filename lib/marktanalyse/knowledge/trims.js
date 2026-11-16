/**
 * Marktanalyse – Ausstattungslinien.
 *
 * Dasselbe Modell gibt es in mehreren Linien (Golf: Trendline, Comfortline,
 * Highline). Der Preisunterschied ist groß, deshalb vergleicht die
 * Marktanalyse nach Stufe:
 *
 *   base   Basis        (Trendline, Attraction, Selection …)
 *   mid    Mittel       (Comfortline, Avantgarde, Edition … und übliche Sondermodelle)
 *   top    Top          (Highline, Exclusive, Titanium, Innovation …)
 *   sport  Sport        (R-Line, S line, AMG Line, M Sport, ST-Line, GTI …)
 *
 * Geschrieben wird der Name so, wie er im Bericht stehen soll. Leerzeichen
 * passen auch auf Bindestrich oder Zusammenschreibung ("S line" = "S-Line" = "Sline").
 * Gesucht wird in dieser Reihenfolge: sport → top → mid → base; der erste Treffer zählt.
 * Namen, die auch Pakete oder Motoren bezeichnen, stehen bewusst nicht drin.
 */

export const TRIMS = {
  volkswagen: {
    sport: ["R-Line", "GTI", "GTD", "GTE", "Sportline", "Black Style"],
    top: ["Highline", "Elegance", "Style", "Exclusive", "Edition 40", "Edition 35"],
    mid: ["Comfortline", "Life", "Join", "United", "Sound", "Allstar", "Lounge", "IQ.Drive", "IQ Drive", "Active", "Move", "Cup", "Team", "Match", "Business", "Beats", "Fresh", "Move up", "High up"],
    base: ["Trendline", "Conceptline", "Startline", "Take up", "Basis", "Trend"],
  },
  audi: {
    sport: ["S line", "Black Edition", "Competition", "Edition One"],
    top: ["Design Selection", "Exclusive", "Ambition Luxe"],
    mid: ["Ambition", "Ambiente", "Advanced", "Design", "Sport"],
    base: ["Attraction", "Basis"],
  },
  bmw: {
    sport: ["M Sport", "M Sportpaket", "M Paket", "M Performance", "M Technik"],
    top: ["Sport Line", "Luxury Line", "Modern Line", "Urban Line", "xLine"],
    mid: ["Advantage"],
    base: [],
  },
  mini: {
    sport: ["John Cooper Works", "JCW"],
    top: ["Chili", "Yours"],
    mid: ["Pepper"],
    base: ["Salt"],
  },
  "mercedes-benz": {
    sport: ["AMG Line", "AMG Paket", "AMG Sportpaket", "AMG Styling", "AMG"],
    top: ["Exclusive", "Edition 1"],
    mid: ["Avantgarde", "Elegance", "Progressive", "Urban", "Style"],
    base: ["Classic"],
  },
  smart: { sport: ["Brabus"], top: ["Prime"], mid: ["Passion", "Pulse"], base: ["Pure"] },
  opel: {
    sport: ["OPC", "OPC Line", "GS Line", "GSi", "GSe", "Sport"],
    top: ["Innovation", "Cosmo", "Elegance", "Ultimate", "Dynamic", "Business Innovation"],
    mid: ["Edition", "Enjoy", "Active", "120 Jahre", "150 Jahre", "Color Edition", "Drive", "Design Edition", "Business Edition"],
    base: ["Selection", "Essentia", "Basis"],
  },
  ford: {
    sport: ["ST-Line", "ST", "RS"],
    top: ["Titanium", "Vignale", "Ghia"],
    mid: ["Cool Connect", "Sync Edition", "Champions Edition", "Business", "Active", "Style"],
    base: ["Ambiente", "Trend"],
  },
  skoda: {
    sport: ["Sportline", "Monte Carlo", "RS", "vRS"],
    top: ["Style", "Elegance", "Laurin", "Premium Edition", "Scout"],
    mid: ["Ambition", "Ambiente", "Drive", "Clever", "Joy", "Cool Edition", "Soleil", "Tour"],
    base: ["Active", "Easy", "Classic"],
  },
  seat: { sport: ["FR", "Cupra"], top: ["Xcellence", "Xperience"], mid: ["Style", "I-Tech", "Connect"], base: ["Reference"] },
  cupra: { sport: ["VZ"], top: [], mid: [], base: [] },
  renault: {
    sport: ["GT Line", "RS Line", "RS"],
    top: ["Intens", "Bose", "Initiale", "Techno", "Iconic", "Privilege", "Luxe"],
    mid: ["Zen", "Dynamique", "Limited", "Experience", "Evolution", "Equilibre", "Collection", "Paris", "Expression"],
    base: ["Life", "Authentique", "Tonic"],
  },
  dacia: { sport: [], top: ["Prestige", "Stepway", "Journey", "Extreme"], mid: ["Laureate", "Comfort", "Expression", "Celebration"], base: ["Access", "Essential", "Ambiance"] },
  peugeot: { sport: ["GT Line", "GT", "GTi"], top: ["Allure", "Feline", "Premium"], mid: ["Active", "Style", "Signature"], base: ["Access", "Like"] },
  citroen: { sport: [], top: ["Shine", "Exclusive", "Intensive", "Max"], mid: ["Feel", "Selection", "Seduction", "Tendance", "You"], base: ["Attraction", "Start", "Live"] },
  fiat: { sport: ["Abarth", "Sport"], top: ["Star"], mid: ["Lounge", "Easy", "Dolcevita"], base: ["Pop"] },
  hyundai: { sport: ["N Line", "N Performance"], top: ["Style", "Premium", "Prime"], mid: ["Select", "Trend", "Yes", "Comfort", "Passion", "Intro"], base: ["Pure", "Classic", "Basis"] },
  kia: { sport: ["GT Line", "GT"], top: ["Spirit", "Platinum"], mid: ["Vision", "Dream Team", "Edition"], base: ["Attract", "Edition 7"] },
  toyota: { sport: ["GR Sport"], top: ["Executive", "Lounge", "Style", "Selection"], mid: ["Comfort", "Life", "Edition", "Team D", "Team Deutschland", "Club", "X-Play"], base: ["Cool", "Basis"] },
  nissan: { sport: ["Nismo", "N-Sport"], top: ["N-Connecta", "Tekna"], mid: ["Acenta", "N-Way"], base: ["Visia"] },
  mazda: { sport: [], top: ["Sports-Line", "Exclusive-Line", "Selection", "Homura"], mid: ["Center-Line"], base: ["Prime-Line"] },
  honda: { sport: ["Type R", "Sport"], top: ["Executive", "Lifestyle"], mid: ["Comfort", "Elegance"], base: ["Trend"] },
  suzuki: { sport: ["Sport"], top: ["Comfort+", "Comfort Plus"], mid: ["Comfort"], base: ["Club", "Basic"] },
  volvo: { sport: ["R-Design"], top: ["Summum", "Inscription"], mid: ["Momentum"], base: ["Kinetic"] },
};

export const TRIM_LEVELS = ["sport", "top", "mid", "base"];
export const TRIM_LABEL = { base: "Basis", mid: "Mittel", top: "Top", sport: "Sport" };
/** Stufe als Zahl: Basis gegen Top oder Sport (Abstand 2) wird nicht verglichen. */
export const TRIM_RANK = { base: 1, mid: 2, top: 3, sport: 3 };
