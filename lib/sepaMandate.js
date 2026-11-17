import { pdfFormLine } from "./printableForm";

const bankCode = (value) => value.replace(/\s/g, "").toUpperCase();
const dateCells = (value) => {
  if (!/^\d{4,}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-");
  return day + month + year;
};

// Field positions and cell counts measured on the supplied A4 template (Kfz-Steuer, 02/2014).
// "An das" (Hauptzollamt Münster) and the Zahlungsempfängerin (Bundeskasse Trier) are printed on it.
const COMB = 449.5 / 35; // width of one box in the comb rows (≈ 12.84 pt)
export const SEPA_FORM = {
  title: "SEPA-Lastschriftmandat",
  label: "SEPA",
  template: "/forms/sepa-lastschriftmandat.pdf",
  preview: "/forms/sepa-lastschriftmandat.webp",
  page: { width: 595, height: 842 },
  fields: [
    { key: "accountName", label: "Kontoinhaber/in (Name oder Firma)", x: 123.1, top: 279, width: COMB * 35, height: 13, cells: 35, fontSize: 10 },
    { key: "street", label: "Straße und Hausnummer", x: 123.1, top: 306, width: COMB * 35, height: 13, cells: 35, fontSize: 10 },
    { key: "zip", label: "Postleitzahl", x: 123.1, top: 332, width: COMB * 9, height: 13, cells: 9, fontSize: 10, half: true },
    { key: "city", label: "Ort", x: 250.8, top: 332, width: COMB * 25, height: 13, cells: 25, fontSize: 10, half: true },
    { key: "country", label: "Land", x: 123.1, top: 364, width: 166.2, height: 12, padding: 3, fontSize: 10 },
    { key: "iban", label: "IBAN", x: 123.1, top: 400, width: COMB * 34, height: 13, cells: 34, fontSize: 10, format: bankCode },
    { key: "bic", label: "BIC", x: 123.1, top: 451, width: COMB * 11, height: 13, cells: 11, fontSize: 10, format: bankCode, half: true },
    { key: "bank", label: "Name der Bank", x: 276.5, top: 451, width: 296.1, height: 13, padding: 3, fontSize: 10, half: true },
    { key: "signPlace", label: "Ort der Unterschrift", x: 123.1, top: 503, width: 140.5, height: 12, padding: 3, fontSize: 10, half: true },
    { key: "signDate", label: "Datum der Unterschrift", x: 276.5, top: 503, width: COMB * 8, height: 13, cells: 8, fontSize: 10, type: "date", format: dateCells, half: true },
    { key: "holderName", label: "Halter/in (Name oder Firma)", x: 123.1, top: 530, width: COMB * 35, height: 13, cells: 35, fontSize: 10 },
    { key: "plate", label: "Amtliches Kennzeichen", x: 123.1, top: 567, width: COMB * 10, height: 13, cells: 10, fontSize: 10, half: true },
    { key: "registrationDate", label: "Datum der Zulassung", x: 276.5, top: 567, width: COMB * 8, height: 13, cells: 8, fontSize: 10, type: "date", format: dateCells, half: true },
  ],
};

export function sepaDefaults(buyer = {}, plate) {
  const name = pdfFormLine(buyer.name);
  return {
    accountName: name,
    street: pdfFormLine(buyer.street),
    zip: pdfFormLine(buyer.zip),
    city: pdfFormLine(buyer.city),
    holderName: name,
    plate: pdfFormLine(plate),
  };
}
