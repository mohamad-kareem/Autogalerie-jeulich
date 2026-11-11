import { pdfFormLine } from "./printableForm";

const bankCode = (value) => value.replace(/\s/g, "").toUpperCase();
const dateCells = (value) => {
  if (!/^\d{4,}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-");
  return day + month + year;
};

// Field positions and cell counts measured on the supplied A4 template.
export const SEPA_FORM = {
  title: "SEPA-Lastschriftmandat",
  label: "SEPA",
  template: "/forms/sepa-lastschriftmandat.pdf",
  preview: "/forms/sepa-lastschriftmandat.webp",
  page: { width: 595.304, height: 841.89 },
  fields: [
    { key: "authority", label: "An das", x: 21.25, lineTops: [54.9, 70.5, 86.05], width: 226.65, height: 13, padding: 1, fontSize: 10 },
    { key: "payee", label: "Zahlungsempfängerin", x: 93.8, top: 261.25, width: 382.5, height: 14.5, fontSize: 10 },
    { key: "accountName", label: "Kontoinhaber/in (Name oder Firma)", x: 93.8, top: 291, width: 481.65, height: 14.5, cells: 34, fontSize: 10 },
    { key: "street", label: "Straße und Hausnummer", x: 93.8, top: 319.3, width: 481.65, height: 14.5, cells: 34, fontSize: 10 },
    { key: "zip", label: "Postleitzahl", x: 93.8, top: 346.2, width: 127.5, height: 14.5, cells: 9, fontSize: 10, half: true },
    { key: "city", label: "Ort", x: 235.45, top: 346.2, width: 340, height: 14.5, cells: 24, fontSize: 10, half: true },
    { key: "country", label: "Land", x: 93.8, top: 374.55, width: 170, height: 14.5, fontSize: 10 },
    { key: "iban", label: "IBAN", x: 94.55, top: 402.4, width: 480.75, height: 14.15, cells: 34, fontSize: 10, format: bankCode },
    { key: "bic", label: "BIC", x: 93.8, top: 459.6, width: 155.85, height: 14.5, cells: 11, fontSize: 10, format: bankCode, half: true },
    { key: "bank", label: "Name der Bank", x: 263.8, top: 459.6, width: 311.65, height: 14.5, fontSize: 10, half: true },
    { key: "signPlace", label: "Ort der Unterschrift", x: 93.8, top: 516.25, width: 155.85, height: 14.5, fontSize: 10, half: true },
    { key: "signDate", label: "Datum der Unterschrift", x: 263.75, top: 516.2, width: 113.35, height: 14.5, cells: 8, fontSize: 10, type: "date", format: dateCells, half: true },
    { key: "holderName", label: "Halter/in (Name oder Firma)", x: 93.8, top: 544.55, width: 481.65, height: 14.5, cells: 34, fontSize: 10 },
    { key: "plate", label: "Amtliches Kennzeichen", x: 93.8, top: 574.35, width: 141.7, height: 14.5, cells: 10, fontSize: 10, half: true },
    { key: "registrationDate", label: "Datum der Zulassung", x: 263.75, top: 574.35, width: 113.35, height: 14.5, cells: 8, fontSize: 10, type: "date", format: dateCells, half: true },
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
