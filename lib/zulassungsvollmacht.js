import { COMPANY } from "./company";
import { pdfFormLine } from "./printableForm";
import { buyerAddress } from "./sales";

export const VOLLMACHT_FORM = {
  title: "Zulassungsvollmacht",
  label: "Vollmacht",
  template: "/forms/vollmacht-zur-fahrzeugzulassung.pdf",
  preview: "/forms/vollmacht-zur-fahrzeugzulassung.webp",
  page: { width: 595.22, height: 842 },
  // Blank boxes in the supplied template, in PDF points from the top left.
  fields: [
    { key: "holderName", label: "Name oder Firma des Halters", x: 71.67, top: 126.31, width: 452.32, height: 21.27 },
    { key: "holderAddress", label: "Anschrift des Halters", x: 71.67, top: 163.34, width: 452.32, height: 21.27 },
    { key: "representativeName", label: "Bevollmächtigte Person oder Firma", x: 71.67, top: 233.17, width: 452.32, height: 21.27 },
    { key: "representativeAddress", label: "Anschrift der bevollmächtigten Person", x: 71.67, top: 270.2, width: 452.32, height: 21.27 },
    { key: "vehicle", label: "Fahrzeug und FIN oder Kennzeichen", x: 71.67, top: 354.87, width: 452.32, height: 21.27 },
    { key: "evb", label: "eVB-Nummer", x: 70.88, top: 525.08, width: 452.32, height: 21.27 },
    { key: "placeDate", label: "Ort / Datum", x: 70.92, top: 608.95, width: 199.41, height: 21.27 },
  ],
};

export function vollmachtDefaults(buyer = {}, vehicle = {}) {
  return {
    holderName: pdfFormLine(buyer.name),
    holderAddress: buyerAddress(buyer),
    representativeName: COMPANY.name,
    representativeAddress: buyerAddress(COMPANY),
    vehicle: [vehicle.name, vehicle.vin || vehicle.plate].map(pdfFormLine).filter(Boolean).join(" · "),
    evb: "",
    placeDate: "",
  };
}
