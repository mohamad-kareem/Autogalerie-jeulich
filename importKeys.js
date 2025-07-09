// scripts/importKeys.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Schlussel from "./models/Key.js";
import { connectDB } from "./lib/mongodb.js";

dotenv.config();

const keys = [
  {
    car: "X3 M40i 3.0 *Panorama*Adaptive LED*360°Kamera*",
    vinNumber: "WBATS31030LA45021",
  },
  {
    car: "207 CC Roland Garros 1.6 *wenig km*",
    vinNumber: "VF3WB5FS0AE015515",
  },
  { car: "Golf 1.4 FSI Trendline *1 Hand*wenig km*Tüv Neu*", vinNumber: "" },
  {
    car: "Polo V Comfortline 1.0 *wenig km*Klimaautomatik*",
    vinNumber: "WVWZZZ6RZFY283698",
  },
  {
    car: "500 Lounge 1.2 *1.Hand*wenig Km*Tüv Neu",
    vinNumber: "ZFA3120000J431143",
  },
  {
    car: "Micra Acenta 1.0 *2.Hand*wenig km*Tüv Neu*",
    vinNumber: "VNVK1400259061554",
  },
  {
    car: "Corsa D OPC-Line 1.4 *1.Hand*wenig km*Tüv Neu*",
    vinNumber: "W0L0SDL08C6036728",
  },
  {
    car: "Caddy Startline 1.2 TSI *2.Hand*Tüv Neu*wenig km",
    vinNumber: "WV2ZZZ2KZCX103231",
  },
  {
    car: "Golf Plus 6 1.6 *Automatik*wenig km*Tüv Neu*",
    vinNumber: "WVWZZZ1KZAW523287",
  },
  { car: "Corsa D Active 1.2 *wenig km", vinNumber: "W0L0SDL08D6031200" },
  {
    car: "Sandero III Stepway 1.0 *1.Hand*Viele Extras*",
    vinNumber: "UU1DJF00565801048",
  },
  { car: "Fusion Style 1.4 *wenig km*", vinNumber: "WF0UXXGAJU8R22734" },
  {
    car: "C4 Coupe VTR 1.6 HDI*nur 49tkm*Klima*2.Hand*",
    vinNumber: "VF7LA9HZC74216931",
  },
  {
    car: "Duster II Prestige 1.6 *1.Hand*wenig km*Tüv Neu*",
    vinNumber: "VF1HJD20560332298",
  },
  { car: "Clio III Night and Day 1.2 TCE", vinNumber: "VF1BRC40H45760748" },
  {
    car: "Fusion Style*Wenig km*Klima*Allwetterreifen",
    vinNumber: "WF0UXXGAJU8L56801",
  },
  {
    car: "Fiesta Connection 1.4*wenig Km*Klima*TÜV 27",
    vinNumber: "WF0HXXWPJH7C71477",
  },
  {
    car: "Polo IV Trendline 1.2 *BITTE BESCHREIBUNG LESEN*",
    vinNumber: "WVWZZZ9NZ6Y115007",
  },
  {
    car: "Altea Sport 1.4 TSI *Tüv Neu*wenig km*2.Hand*",
    vinNumber: "VSSZZZ5PZ9R505374",
  },
  {
    car: "Corsa D Satellite 1.4*wenig km*Automatik*Tüv Neu",
    vinNumber: "W0L0SDL08C6010507",
  },
  { car: "Corsa D 1.2 *2.Hand**wenig km*Tüv*", vinNumber: "W0L0SDL6894201163" },
  {
    car: "i10 Select*wenig km*Klima*Allwetterreifen*",
    vinNumber: "NLHDN51AALZ023848",
  },
  {
    car: "Touran Comfortline 1.4 TSI *Automatik*wenig km*",
    vinNumber: "WVGZZZ1TZDW013675",
  },
  { car: "Ka Titanium*wenig km*Klima", vinNumber: "WF0UXXLTRU9C05603" },
  { car: "Ka Titanium", vinNumber: "WF0UXXLTRU8E00026" },
  { car: "Picanto 1.1 Attract", vinNumber: "KNABA24329T763062" },
  {
    car: "Astra J Sports*Klimaautomatik*wenig km*Allwetter",
    vinNumber: "W0LPD8EU5D8063968",
  },
  {
    car: "Compact 316ti *Kundenauftrag*Bitte lesen*",
    vinNumber: "WBAAT51020FW59294",
  },
  { car: "C 180 Elegance *Kundenauftrag*Automatik*", vinNumber: "" },
  {
    car: "Roomster Comfort*Wenig Km*Klima*Allwetterreifen",
    vinNumber: "TMBMC65J475024005",
  },
  { car: "Golf VI Comfortline", vinNumber: "WVWZZZ1KZAW167332" },
  { car: "Fiesta 1.3 *wenig km*Tüv*Klima*", vinNumber: "WF0HXXGAJH7T80833" },
  {
    car: "B 200 1.6 *wenig km*Tüv*Viele Extras*",
    vinNumber: "WDD2462431J003935",
  },
  {
    car: "Adam Glam 1.4 *2.Hand*wenig km*Viele Extras*",
    vinNumber: "W0L0MAP08D6091581",
  },
  {
    car: "Roomster Style*Allwetterreifen*wenig km*klima",
    vinNumber: "TMBMC25J085019104",
  },
  {
    car: "Transit Connect Kasten*1 Hand*wenig km*Allwetter",
    vinNumber: "WF0RXXWPGRHJ11443",
  },
  {
    car: "i20 Classic*wenig km*Allwetterreifen*Klima",
    vinNumber: "NLHB251BAJZ352980",
  },
  {
    car: "C3 Shine*1.2*PDC*Sitzheizung*Spurhalteassis*TOUC",
    vinNumber: "VF7SXHMZ6HT589507",
  },
  { car: "Golf 4 1.8*wenig KM*Klimaautomatik*Sitzheizung*", vinNumber: "" },
  { car: "118 Baureihe 1 Lim. 118i", vinNumber: "WBAUF310X0PY25385" },
  {
    car: "6 Kombi 1.8 Comfort*wenig km*1 Hand",
    vinNumber: "JMZGH198211441236",
  },
  {
    car: "Golf Plus VI Comfortline*wenig km*2 Hand*Klima",
    vinNumber: "WVWZZZ1KZAW527128",
  },
  { car: "Fiesta Trend*wenig km*Klima*2 Hand", vinNumber: "WF0JXXGAJJAT77385" },
  {
    car: "Fabia Combi Cool Plus*wenig km*2Hand*Klima",
    vinNumber: "TMBJB6NJ6JZ096622",
  },
  {
    car: "Fabia Combi Cool Edition*wenig km*Klima*8fach",
    vinNumber: "TMBFC65J293161077",
  },
  {
    car: "3 Lim. 1.6 Sport Comfort*Automatik*Klima",
    vinNumber: "JMZBK14Z541112744",
  },
  {
    car: "Golf Plus V Tour*Automatik*wenig km*Klimaauto*",
    vinNumber: "WVWZZZ1KZ7W616627",
  },
  {
    car: "207 CC Cabrio Active*wenig km*Klima*2.Hand*PDC",
    vinNumber: "VF3WB5FS0DE022845",
  },
  { car: "Clio IV Dynamique 1.2", vinNumber: "VF15R0G0H48409252" },
  { car: "Micra Visia 1.2", vinNumber: "SJNEBAK12U3240000" },
  {
    car: "Ka Titanium *Kundenauftrag*Anzeige Lesen*",
    vinNumber: "WF0UXXLTRUAL34780",
  },
  { car: "Fiesta Ambiente *Kundenauftrag*", vinNumber: "WF0HXXGAJH6P77793" },
  {
    car: "Polo V Trendline*wenig km*Klima*Allwetterreifen",
    vinNumber: "WVWZZZ6RZAY035208",
  },
  {
    car: "Golf V Lim. Trendline*wenig km*Klima*Allwetter",
    vinNumber: "WVWZZZ1KZ4P009927",
  },
  { car: "Grand C4 SpaceTourer*Automatik*Pano*Kamera*Extra", vinNumber: "" },
  {
    car: "500 Lounge*Klima*wenig km*8fach bereifung",
    vinNumber: "ZFA3120000JA67138",
  },
  { car: "Golf 1.6 Basis*wenig km*Klima", vinNumber: "" },
  {
    car: "B 150 B -Klasse B 150*wenig km*Automatik",
    vinNumber: "WDD2452311J093818",
  },
  { car: "i30 blue 1.4 Classic*wenig km*Klima", vinNumber: "" },
  {
    car: "Beetle Lim. Basis BMT*wenig km*Klima*1 Hand*",
    vinNumber: "WVWZZZ16ZGM637527",
  },
  { car: "Fiesta Titanium*wenig km*Klima", vinNumber: "WF0GXXGAJG9C83658" },
  { car: "Meriva B Innovation", vinNumber: "W0LSH9EE2B4386196" },
  { car: "Sandero Eco", vinNumber: "UU1BSDBNH41323350" },
  {
    car: "Fiesta Trend*wenig km*Klima*Allwetterreifen",
    vinNumber: "WF0JXXGAJJCY17936",
  },
  {
    car: "Micra Visia Plus*Wenig km*Klima*Allwetterreifen",
    vinNumber: "VNVK1400162439714",
  },
  {
    car: "Golf VI Comfortline*wenig km*Klima*8-fach",
    vinNumber: "WVWZZZ1KZCW327676",
  },
  {
    car: "i10 Classic*wenig km*Klima*8-fach bereift",
    vinNumber: "MALAM51BBCM130391",
  },
];
async function importKeys() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    const inserted = await Schlussel.insertMany(
      keys.map((item) => ({
        car: item.car,
        vinNumber: item.vinNumber,
        schlusselNumber: "", // placeholder, to be updated later
        transmission: undefined,
        // placeholder, to be updated later
        doorNumber: "",
        color: "",
        notes: "",
        needsBenzine: false,
      }))
    );

    console.log(`✅ ${inserted.length} keys inserted successfully.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error inserting keys:", error);
    process.exit(1);
  }
}

importKeys();
