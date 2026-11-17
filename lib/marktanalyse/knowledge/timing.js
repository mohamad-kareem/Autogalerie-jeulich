/**
 * Marktanalyse – Zahnriemen oder Steuerkette.
 *
 * Jede Zeile beschreibt eine Motorfamilie:
 *   T(Marken, Kraftstoff, Hubraum [von, bis] in ccm oder null, Erstzulassung [von, bis], Antrieb, Name, Optionen)
 *
 *   Antrieb   belt    Zahnriemen
 *             wet     Zahnriemen im Ölbad
 *             chain   Steuerkette
 *   Optionen  km, years   Wechselintervall (nur Zahnriemen). Fehlt es, fragt der Bericht nur nach.
 *             est: true   Intervall ist nur ein Richtwert → es werden keine Kosten eingerechnet, nur gefragt.
 *             unsure: true  Antrieb nicht sicher → im Bericht als unsicher markiert, keine Kosten.
 *             ps: [von, bis]  nur für diese Leistung
 *             model / identity  Muster für Modell bzw. Motorcode in den Fahrzeugdaten
 *             sources / checkedAt / scopeNote  Beleg und Geltungsgrenze
 *
 * Eine Zeile mit Hubraum geht einer Zeile ohne Hubraum vor (z. B. "Mercedes: Kette" gegen
 * "Mercedes mit Renault-Diesel 1461 ccm: Riemen"). Passen Zeilen mit verschiedenem Antrieb
 * (Jahr des Motorwechsels), sagt der Bericht "unklar" und fragt nach.
 *
 * Der Altbestand beruht auf Erfahrungswissen. Unbelegte Intervalle sind immer
 * Richtwerte, breite Markenzeilen immer unsicher. Belegte Ergänzungen nennen
 * ihre Quelle und deren Geltungsbereich; EZ ersetzt weder Modelljahr noch FIN.
 * Bekannte Schwächen einzelner Motoren (Kette längt sich …) stehen in models.js.
 */

const T = (makes, fuel, ccm, years, drive, name, { years: interval = null, ...options } = {}) => ({
  makes, fuel, ccm, years, drive, name, interval,
  est: Boolean(options.km || interval),
  unsure: !ccm,
  ...options,
});

const CHECKED_AT = "2026-11-17";
const FORD_SCHEDULE = { label: "Ford: Zahnriemen/Steuerkette und fahrzeugspezifischer Wartungsplan", url: "https://www.ford.de/hilfe/anleitungen/ressourcen-des-eigentuemers/fahrzeugwartung/wann-sollten-die-zahnriemen-von-ford-fahrzeugen-ausgetauscht-werden" };
const FORD_TRANSIT = { label: "Ford Service Bulletin 24-7044, 11.06.2024 (Archivkopie)", url: "https://www.tsbsearch.com/Ford/24-7044" };
const OPEL_COMBO = { label: "Opel Combo Betriebsanleitung 2010, S. 167/169", url: "https://www.opel.ie/content/dam/opel/master/owners/manuals/pdf/Manual_Combo_2010_en.pdf" };
const FIAT_CROMA = { label: "Fiat Croma Betriebsanleitung 09/2007, S. 196", url: "https://aftersales.fiat.com/eLumData/EN/00/194_NUOVACROMA/00_194_NUOVACROMA_603.81.275_EN_01_09.07_L_LG/00_194_NUOVACROMA_603.81.275_EN_01_09.07_L_LG.pdf" };
const RENAULT_SCHEDULE = { label: "Renault Deutschland: Zahnriemen und individueller Wartungsplan", url: "https://www.renault.de/wartung/zahnriemen.html" };

const VAG = ["volkswagen", "audi", "skoda", "seat", "cupra"];
const REN = ["renault", "dacia", "nissan"];
const FIAT = ["fiat", "lancia", "alfa romeo"];
const HK = ["hyundai", "kia"];
const P = "PETROL";
const D = "DIESEL";

export const TIMING = [
  /* Belegte, eng begrenzte Wartungshinweise. Der eigene aktuelle FIN-Plan hat Vorrang. */
  T(["ford"], D, [1995, 1996], [2016, 2023], "wet", "Transit / Transit Custom / Tourneo Custom 2.0 EcoBlue", {
    model: "\\b(?:transit|tourneo)\\b", exclude: "\\b(?:connect|courier)\\b", km: 160000, years: 6,
    sources: [FORD_TRANSIT, FORD_SCHEDULE], checkedAt: CHECKED_AT,
    scopeNote: "Ford-Bulletin für Transit-Familie 2016–2023 mit 2.0 EcoBlue: 160.000 km oder 6 Jahre, was zuerst eintritt. Nicht auf Focus, Kuga oder andere Pkw übertragen. Modelljahr, Motor und aktuellen FIN-Wartungsplan bestätigen.",
  }),
  T(["opel"], D, [1686, 1686], [2009, 2011], "belt", "Combo C 1.7 CDTI (Z17DTH)", {
    model: "\\bcombo\\b", identity: "\\bz\\s*17\\s*dth\\b", km: 90000, years: 10,
    sources: [OPEL_COMBO], checkedAt: CHECKED_AT,
    scopeNote: "Betriebsanleitung Combo 2010: Z17DTH 90.000 km oder 10 Jahre, was zuerst eintritt. EZ-Fenster ist nur Vorauswahl; Gültigkeit der Anleitung und aktuelle Vorgaben anhand FIN prüfen.",
  }),
  T(["opel"], P, [1598, 1598], [2009, 2011], "belt", "Combo C 1.6 Twinport (Z16XEP)", {
    model: "\\bcombo\\b", identity: "\\bz\\s*16\\s*xep\\b", km: 150000, years: 10,
    sources: [OPEL_COMBO], checkedAt: CHECKED_AT,
    scopeNote: "Betriebsanleitung Combo 2010: Z16XEP 150.000 km oder 10 Jahre, was zuerst eintritt. Nicht auf andere 1.6-Motoren übertragen; aktuellen FIN-Wartungsplan prüfen.",
  }),
  T(["fiat"], D, [1910, 1910], [2007, 2008], "belt", "Croma 1.9 Multijet (Wartungsplan 09/2007)", {
    model: "\\bcroma\\b", years: 5,
    sources: [FIAT_CROMA], checkedAt: CHECKED_AT,
    scopeNote: "Fiat-Anleitung 09/2007: spätestens nach 5 Jahren, bei erschwertem Einsatz (z. B. Stadtverkehr/langer Leerlauf) nach 4 Jahren. Kilometergrenze und Gültigkeit des Plans für dieses Fahrzeug zusätzlich prüfen; EZ ist nicht das Modelljahr.",
  }),
  /* ---- VW, Audi, Skoda, Seat, Cupra ---- */
  T(VAG, P, [999, 999], [2011, 2026], "belt", "1.0 MPI / TSI (EA211)", { km: 240000, est: true }),
  T(VAG, P, [1198, 1198], [2001, 2015], "chain", "1.2 Dreizylinder"),
  T(VAG, P, [1197, 1197], [2009, 2015], "chain", "1.2 TSI (EA111)"),
  T(VAG, P, [1197, 1197], [2012, 2026], "belt", "1.2 TSI (EA211)", { km: 240000, est: true }),
  T(VAG, P, [1390, 1390], [1996, 2014], "belt", "1.4 16V", { ps: [60, 101], km: 120000, est: true }),
  T(VAG, P, [1390, 1390], [2006, 2015], "chain", "1.4 TSI (EA111)", { ps: [120, 185] }),
  T(VAG, P, [1395, 1395], [2012, 2026], "belt", "1.4 TSI (EA211)", { km: 240000, est: true }),
  T(VAG, P, [1498, 1498], [2017, 2026], "belt", "1.5 TSI", { km: 240000, est: true }),
  T(VAG, P, [1595, 1595], [1996, 2014], "belt", "1.6 8V", { ps: [100, 102], km: 120000, est: true }),
  T(VAG, P, [1781, 1781], [1995, 2007], "belt", "1.8 / 1.8 T 20V", { km: 120000, est: true }),
  T(VAG, P, [1798, 1798], [2007, 2026], "chain", "1.8 TFSI / TSI (EA888)"),
  T(VAG, P, [1984, 1984], [1995, 2009], "belt", "2.0 / 2.0 FSI / 2.0 TFSI (EA113)", { km: 180000, est: true }),
  T(VAG, P, [1984, 1984], [2008, 2026], "chain", "2.0 TFSI / TSI (EA888)"),
  T(VAG, P, [1984, 1984], [2010, 2013], "belt", "2.0 TFSI (EA113: Golf R, S3, Cupra R)", { ps: [255, 272] }),
  T(VAG, D, [1422, 1422], [1999, 2026], "belt", "1.4 TDI"),
  T(VAG, D, [1896, 1896], [1991, 2010], "belt", "1.9 TDI", { km: 120000, est: true }),
  T(VAG, D, [1598, 1598], [2009, 2014], "belt", "1.6 TDI (EA189)", { km: 180000 }),
  T(VAG, D, [1598, 1598], [2015, 2026], "belt", "1.6 TDI (EA288)", { km: 210000 }),
  T(VAG, D, [1968, 1968], [2003, 2008], "belt", "2.0 TDI Pumpe-Düse", { km: 150000, est: true }),
  T(VAG, D, [1968, 1968], [2009, 2014], "belt", "2.0 TDI (EA189)", { km: 180000 }),
  T(VAG, D, [1968, 1968], [2015, 2026], "belt", "2.0 TDI (EA288)", { km: 210000 }),
  T(VAG, D, [2496, 2496], [1997, 2006], "belt", "2.5 TDI V6", { km: 120000, est: true }),
  T(VAG, D, [2698, 2967], [2004, 2026], "chain", "2.7 / 3.0 TDI V6"),

  /* ---- BMW, Mini, Mercedes, Smart ---- */
  T(["bmw"], null, null, [1995, 2026], "chain", "alle BMW-Motoren"),
  T(["mini"], P, null, [2001, 2026], "chain", "Mini Benziner"),
  T(["mini"], D, [1560, 1560], [2007, 2010], "belt", "Cooper D 1.6 (PSA)", { km: 180000, years: 10, est: true }),
  T(["mini"], D, [1364, 1364], [2003, 2006], "chain", "One D 1.4 (Toyota)"),
  T(["mini"], D, [1496, 1995], [2010, 2026], "chain", "Diesel von BMW", { ps: [90, 190] }),
  T(["mercedes-benz"], null, null, [1990, 2026], "chain", "alle Mercedes-Motoren"),
  T(["mercedes-benz"], D, [1461, 1461], [2012, 2026], "belt", "1.5 Diesel von Renault (160 d / 180 d)", { km: 150000, est: true }),
  T(["smart"], null, null, [1998, 2026], "chain", "alle Smart-Motoren"),

  /* ---- Opel ---- */
  T(["opel"], P, [973, 999], [1997, 2019], "chain", "1.0 Dreizylinder"),
  T(["opel"], P, [1199, 1199], [1998, 2005], "chain", "1.2 16V (bis 2004)"),
  T(["opel"], P, [1229, 1229], [2004, 2014], "chain", "1.2 Twinport / ecoFlex"),
  T(["opel"], P, [1229, 1229], [2015, 2019], "chain", "1.2 (Corsa E, Adam)", { ps: [60, 71] }),
  T(["opel"], P, [1364, 1364], [2003, 2019], "chain", "1.4 Twinport / Turbo"),
  T(["opel"], P, [1399, 1399], [2015, 2022], "chain", "1.4 Turbo (Astra K)"),
  T(["opel"], P, [1389, 1389], [1992, 2005], "belt", "1.4 16V (alt)"),
  T(["opel"], P, [1598, 1598], [1994, 2005], "belt", "1.6 16V (alt)", { ps: [75, 116] }),
  T(["opel"], P, [1598, 1598], [2006, 2015], "belt", "1.6 Twinport", { ps: [100, 116], km: 150000, years: 10 }),
  T(["opel"], P, [1598, 1598], [2006, 2013], "belt", "1.6 Turbo", { ps: [180, 192], km: 150000, years: 10 }),
  T(["opel"], P, [1598, 1598], [2013, 2020], "chain", "1.6 SIDI Turbo", { ps: [136, 200], unsure: true }),
  T(["opel"], P, [1796, 1796], [1995, 2005], "belt", "1.8 16V (alt)"),
  T(["opel"], P, [1796, 1796], [2006, 2015], "belt", "1.8 16V", { km: 150000, years: 10 }),
  T(["opel", ...FIAT, "suzuki", "ford"], D, [1248, 1248], [2003, 2026], "chain", "1.3 CDTI / Multijet / DDiS"),
  T(["opel"], D, [1598, 1598], [2013, 2020], "chain", "1.6 CDTI", { ps: [90, 165] }),
  T(["opel"], D, [1686, 1686], [2000, 2015], "belt", "1.7 CDTI", { km: 150000, years: 10, est: true }),
  T(["opel"], D, [1910, 1910], [2004, 2010], "belt", "1.9 CDTI", { km: 150000, years: 10 }),
  T(["opel"], D, [1956, 1956], [2008, 2014], "belt", "2.0 CDTI", { km: 150000, years: 10 }),

  /* ---- Ford ---- */
  T(["ford"], P, [998, 999], [2012, 2019], "wet", "1.0 EcoBoost (frühe Riemenversion)", {
    unsure: true, sources: [FORD_SCHEDULE], checkedAt: CHECKED_AT,
    scopeNote: "Modell und Motorversion über FIN prüfen: Ford nennt keinen einheitlichen Wechseltermin für alle 1.0 EcoBoost. Der frühere pauschale Wert 240.000 km/10 Jahre wird daher nicht als Fahrzeugvorgabe übernommen.",
  }),
  T(["ford"], P, [1242, 1242], [1996, 2018], "belt", "1.25", { km: 160000, years: 10, est: true }),
  T(["ford"], P, [1388, 1388], [1996, 2014], "belt", "1.4", { km: 160000, years: 10, est: true }),
  T(["ford"], P, [1596, 1596], [1998, 2018], "belt", "1.6 / 1.6 Ti-VCT / 1.6 EcoBoost", { km: 160000, years: 10, est: true }),
  T(["ford"], P, [1798, 1798], [2001, 2012], "chain", "1.8 Duratec"),
  T(["ford"], P, [1999, 1999], [2001, 2022], "chain", "2.0 Duratec / EcoBoost"),
  T(["ford"], D, [1399, 1399], [2002, 2012], "belt", "1.4 TDCi", { km: 160000, years: 10, est: true }),
  T(["ford"], D, [1560, 1560], [2003, 2007], "belt", "1.6 TDCi", { km: 160000, years: 10, est: true }),
  T(["ford"], D, [1560, 1560], [2008, 2018], "belt", "1.6 TDCi", { km: 200000, years: 10 }),
  T(["ford"], D, [1498, 1499], [2012, 2026], "belt", "1.5 TDCi / EcoBlue", { km: 200000, years: 10, est: true }),
  T(["ford"], D, [1753, 1753], [1998, 2012], "belt", "1.8 TDCi"),
  T(["ford"], D, [1998, 1998], [2000, 2007], "chain", "2.0 TDCi (Mondeo bis 2007)"),
  T(["ford"], D, [1997, 1997], [2004, 2019], "belt", "2.0 TDCi", { km: 200000, years: 10 }),
  T(["ford"], D, [1995, 1996], [2016, 2026], "wet", "2.0 EcoBlue", { unsure: true }),

  /* ---- Renault, Dacia, Nissan ---- */
  T(REN, P, [898, 999], [2012, 2026], "chain", "0.9 TCe / 1.0 SCe / 1.0 TCe"),
  T(["renault", "dacia"], P, [1149, 1149], [1996, 2019], "belt", "1.2 / 1.2 16V / TCe 100", { km: 120000, years: 6,
    sources: [RENAULT_SCHEDULE], checkedAt: CHECKED_AT,
    scopeNote: "120.000 km/6 Jahre bleibt ein Erfahrungsrichtwert. Renault verweist auf den individuellen Wartungsplan und unterschiedliche Motor-/Modellintervalle; die Quelle bestätigt keine einheitliche Frist für diese gesamte Familie.",
  }),
  T(REN, P, [1197, 1198], [2010, 2022], "chain", "1.2 TCe / DIG-T / 1.2 Dreizylinder"),
  T(REN, P, [1330, 1333], [2017, 2026], "chain", "1.3 TCe / DIG-T"),
  T(["renault", "dacia"], P, [1390, 1390], [1998, 2013], "belt", "1.4 / 1.4 16V", { km: 120000, years: 6 }),
  T(["renault", "dacia"], P, [1598, 1598], [1998, 2014], "belt", "1.6 / 1.6 16V", { km: 120000, years: 6 }),
  T(["renault", "dacia"], P, [1598, 1598], [2015, 2026], "chain", "1.6 SCe", { unsure: true }),
  T(["renault"], P, [1998, 1998], [1999, 2016], "belt", "2.0 16V", { km: 120000, years: 6 }),
  T(REN, D, [1461, 1461], [2001, 2009], "belt", "1.5 dCi", { km: 120000, years: 6, est: true }),
  T(REN, D, [1461, 1461], [2010, 2026], "belt", "1.5 dCi", { km: 150000, years: 6, est: true }),
  T(REN, D, [1598, 1598], [2011, 2026], "chain", "1.6 dCi"),
  T(["renault"], D, [1870, 1870], [1999, 2012], "belt", "1.9 dCi", { km: 120000, years: 6, est: true }),
  T(REN, D, [1995, 1995], [2006, 2026], "chain", "2.0 dCi"),
  T(["nissan"], P, null, [2003, 2026], "chain", "Nissan Benziner"),

  /* ---- Peugeot, Citroën, DS, Opel ab 2017 ---- */
  T(["peugeot", "citroen", "toyota"], P, [998, 998], [2005, 2026], "chain", "1.0 Dreizylinder (Toyota)"),
  T(["peugeot", "citroen", "ds automobiles"], P, [999, 999], [2012, 2022], "wet", "1.0 VTi / PureTech", { km: 100000, years: 6, est: true }),
  T(["peugeot", "citroen", "ds automobiles"], P, [1199, 1199], [2012, 2022], "wet", "1.2 VTi / PureTech", { km: 100000, years: 6, est: true }),
  T(["opel"], P, [1199, 1199], [2017, 2022], "wet", "1.2 / 1.2 Turbo (PureTech)", { km: 100000, years: 6, est: true }),
  T(["peugeot", "citroen"], P, [1124, 1124], [1996, 2012], "belt", "1.1"),
  T(["peugeot", "citroen"], P, [1360, 1361], [1996, 2012], "belt", "1.4 / 1.4 16V"),
  T(["peugeot", "citroen"], P, [1587, 1587], [1996, 2012], "belt", "1.6 16V"),
  T(["peugeot", "citroen", "ds automobiles"], P, [1397, 1397], [2007, 2015], "chain", "1.4 VTi"),
  T(["peugeot", "citroen", "ds automobiles"], P, [1598, 1598], [2006, 2022], "chain", "1.6 VTi / THP / PureTech 180"),
  T(["opel"], P, [1598, 1598], [2018, 2022], "chain", "1.6 Turbo (PSA)", { unsure: true }),
  T(["peugeot", "citroen"], D, [1398, 1399], [2001, 2015], "belt", "1.4 HDi", { km: 180000, years: 10, est: true }),
  T(["peugeot", "citroen", "ds automobiles"], D, [1560, 1560], [2003, 2019], "belt", "1.6 HDi / BlueHDi", { km: 180000, years: 10, est: true }),
  T(["opel"], D, [1560, 1560], [2017, 2019], "belt", "1.6 Diesel (PSA)", { km: 180000, years: 10, est: true }),
  T(["peugeot", "citroen", "ds automobiles", "opel"], D, [1499, 1499], [2017, 2026], "belt", "1.5 BlueHDi"),
  T(["peugeot", "citroen", "ds automobiles"], D, [1997, 1997], [1999, 2026], "belt", "2.0 HDi / BlueHDi", { km: 180000, years: 10, est: true }),
  T(["opel"], D, [1997, 1997], [2017, 2026], "belt", "2.0 Diesel (PSA)", { km: 180000, years: 10, est: true }),
  T(["volvo", "mazda", "suzuki"], D, [1560, 1560], [2004, 2015], "belt", "1.6 Diesel (PSA)", { km: 180000, years: 10, est: true }),

  /* ---- Fiat, Lancia, Alfa Romeo ---- */
  T(FIAT, P, [875, 875], [2010, 2026], "chain", "0.9 TwinAir"),
  T(FIAT, P, [999, 999], [2020, 2026], "chain", "1.0 Hybrid (FireFly)", { unsure: true }),
  T(FIAT, P, [1108, 1108], [1994, 2012], "belt", "1.1 8V", { km: 120000, years: 6, est: true }),
  T([...FIAT, "ford"], P, [1242, 1242], [1994, 2022], "belt", "1.2 8V", { km: 120000, years: 6, est: true }),
  T(FIAT, P, [1368, 1368], [2003, 2022], "belt", "1.4 8V / 16V / T-Jet", { km: 120000, years: 6, est: true }),
  T(FIAT, D, [1598, 1598], [2008, 2022], "belt", "1.6 Multijet", { km: 140000, years: 6, est: true }),
  T(FIAT, D, [1910, 1910], [1998, 2010], "belt", "1.9 JTD / Multijet", { km: 120000, years: 6, est: true }),
  T(FIAT, D, [1956, 1956], [2008, 2022], "belt", "2.0 Multijet", { km: 140000, years: 6, est: true }),

  /* ---- Hyundai, Kia ---- */
  T(HK, P, [998, 998], [2011, 2026], "chain", "1.0"),
  T(HK, P, [999, 999], [2004, 2011], "belt", "1.0 (Picanto bis 2011)"),
  T(HK, P, [1086, 1086], [2004, 2013], "belt", "1.1"),
  T(HK, P, [1197, 1248], [2008, 2026], "chain", "1.2 / 1.25"),
  T(HK, P, [1353, 1368], [2015, 2026], "chain", "1.4 / 1.4 T-GDI"),
  T(HK, P, [1396, 1396], [2007, 2019], "chain", "1.4 CVVT"),
  T(HK, P, [1399, 1399], [2002, 2011], "belt", "1.4 (alt)"),
  T(HK, P, [1591, 1591], [2007, 2026], "chain", "1.6 CVVT / GDI / T-GDI"),
  T(HK, P, [1599, 1599], [2000, 2010], "belt", "1.6 (alt)"),
  T(HK, D, [1120, 1120], [2011, 2018], "chain", "1.1 CRDi"),
  T(HK, D, [1396, 1396], [2010, 2019], "chain", "1.4 CRDi"),
  T(HK, D, [1582, 1582], [2006, 2019], "chain", "1.6 CRDi"),
  T(HK, D, [1598, 1598], [2018, 2026], "belt", "1.6 CRDi (ab 2018)", { unsure: true }),
  T(HK, D, [1685, 1685], [2010, 2019], "chain", "1.7 CRDi"),
  T(HK, D, [1991, 1991], [2001, 2010], "belt", "2.0 CRDi (alt)"),
  T(HK, D, [1995, 1995], [2009, 2026], "chain", "2.0 CRDi"),
  T(HK, D, [2199, 2199], [2009, 2026], "chain", "2.2 CRDi"),

  /* ---- Toyota, Mazda, Honda, Suzuki, Volvo ---- */
  T(["toyota"], null, null, [2001, 2026], "chain", "Toyota-Motoren ab 2001"),
  T(["toyota"], D, [1995, 1995], [1999, 2006], "belt", "2.0 D-4D (bis 2006)"),
  T(["mazda"], P, null, [2003, 2026], "chain", "Mazda Benziner ab 2003"),
  T(["mazda"], P, [1242, 1388], [2003, 2007], "belt", "1.25 / 1.4 (Mazda 2 bis 2007, Ford-Motor)", { unsure: true }),
  T(["mazda"], D, [1399, 1399], [2003, 2010], "belt", "1.4 MZ-CD"),
  T(["mazda"], D, [1998, 1998], [2002, 2010], "belt", "2.0 MZR-CD"),
  T(["mazda"], D, [1499, 1499], [2014, 2026], "chain", "1.5 Skyactiv-D"),
  T(["mazda"], D, [1759, 1759], [2018, 2026], "chain", "1.8 Skyactiv-D"),
  T(["mazda"], D, [2184, 2191], [2008, 2026], "chain", "2.2 MZR-CD / Skyactiv-D"),
  T(["honda"], null, null, [2006, 2026], "chain", "Honda-Motoren ab 2006"),
  T(["honda"], P, [988, 988], [2017, 2022], "wet", "1.0 VTEC Turbo", { unsure: true }),
  T(["suzuki"], P, null, [2003, 2026], "chain", "Suzuki Benziner ab 2003"),
  T(["suzuki"], D, [1598, 1598], [2013, 2020], "belt", "1.6 DDiS (Fiat)", { unsure: true }),
  T(["suzuki"], D, [1870, 1870], [2005, 2010], "belt", "1.9 DDiS (Renault)"),
  T(["suzuki"], D, [1956, 1956], [2009, 2014], "belt", "2.0 DDiS (Fiat)"),
  T(["volvo"], null, null, [1996, 2026], "belt", "Volvo-Motoren (meist Zahnriemen)", { unsure: true }),
  T(["volvo"], P, [1798, 1798], [2004, 2012], "chain", "1.8 (Ford)"),
  T(["volvo"], P, [1999, 1999], [2004, 2012], "chain", "2.0 (Ford)"),
  T(["volvo"], D, [1997, 1998], [2004, 2012], "belt", "2.0 D (PSA)", { km: 180000, years: 10, est: true }),
];

export const DRIVE_LABEL = { belt: "Zahnriemen", wet: "Zahnriemen im Ölbad", chain: "Steuerkette" };
