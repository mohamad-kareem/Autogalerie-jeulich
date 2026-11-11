// Text of the purchase confirmation e-mail (Ankaufbestätigung). Client-safe.

import { COMPANY } from "@/lib/company";
import { dateDE, formatEuro, monthDE, parseMonth } from "@/lib/sales";

export const ANKAUF_PAYMENT = [
  { key: "transfer", label: "Überweisung" },
  { key: "cash", label: "Bar bei Übergabe" },
];

export const ANKAUF_ACCIDENT_OPTIONS = [
  { key: "", label: "Nicht angegeben" },
  { key: "free", label: "Unfallfrei" },
  { key: "accident", label: "Nicht unfallfrei" },
];

export const ankaufAccidentLabel = (status) => status ? ANKAUF_ACCIDENT_OPTIONS.find((option) => option.key === status)?.label || "" : "";

export const ANKAUF_MAIL_TITLE = "Ankaufbestätigung";
export const ANKAUF_DEFECTS_LABEL = "Mängel";
// Leave room for the label and colon in the 2,000-character pickup note.
export const ANKAUF_DEFECTS_MAX = 2000 - `${ANKAUF_DEFECTS_LABEL}: `.length;
export const ANKAUF_MAIL_SECTIONS = {
  vehicle: "Fahrzeugdaten",
  terms: "Kaufpreis und Übergabe",
  buyer: "Käufer",
  seller: "Verkäufer",
};

const oneLine = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const month = (value) => monthDE(parseMonth(value)) || oneLine(value);
const km = (value) => {
  const number = Number(value);
  return oneLine(value) && Number.isFinite(number) && number >= 0
    ? `${new Intl.NumberFormat("de-DE").format(number)} km`
    : "";
};

function address({ street, zip, city }) {
  const town = [zip, city].map(oneLine).filter(Boolean).join(" ");
  return [oneLine(street), town].filter(Boolean).join(", ");
}

function section(title, fields) {
  const rows = fields
    .map(([label, value]) => [label, oneLine(value)])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}:  ${value}`);
  return rows.length ? [title, ...rows].join("\n") : "";
}

/** { subject, body } – plain text, the staff member can still edit it */
export function buildAnkaufMail({ vehicle = {}, seller = {}, price, payment = "transfer", handoverDate = "", handoverTime = "", mode = "pickup" }) {
  const name = oneLine(seller.name);
  const car = oneLine(vehicle.name) || [vehicle.brand, vehicle.model].map(oneLine).filter(Boolean).join(" ") || "Ihr Fahrzeug";
  const pickup = mode === "pickup";
  const date = dateDE(handoverDate);
  const when = date ? [date, handoverTime && `${handoverTime} Uhr`].filter(Boolean).join(", ") : "Nach telefonischer Absprache";
  const sellerAddress = address(seller);
  const companyAddress = address(COMPANY);
  const vehicleReference = vehicle.url || vehicle.source ? "des von Ihnen inserierten Fahrzeugs" : "des unten aufgeführten Fahrzeugs";
  const defects = String(vehicle.defects ?? "").split(/\r\n?|\n/).map(oneLine).filter(Boolean).join(" · ");

  const body = [
    `Guten Tag,\n\nhiermit bestätigen wir den Ankauf ${vehicleReference} zu den vereinbarten Konditionen.`,
    section(ANKAUF_MAIL_SECTIONS.vehicle, [
      ["Fahrzeug", car],
      ["Erstzulassung", month(vehicle.firstRegistration)],
      ["Kilometerstand", km(vehicle.mileage)],
      ["HU bis", month(vehicle.tuevUntil)],
      ["Unfallhistorie", ankaufAccidentLabel(vehicle.accidentStatus)],
      [ANKAUF_DEFECTS_LABEL, defects],
    ]),
    section(ANKAUF_MAIL_SECTIONS.terms, [
      ["Kaufpreis", price > 0 ? formatEuro(price) : ""],
      ["Zahlungsart", ANKAUF_PAYMENT.find((option) => option.key === payment)?.label],
      [pickup ? "Abholtermin" : "Übergabetermin", when],
      [pickup ? "Abholort" : "Übergabeort", pickup ? sellerAddress : companyAddress],
    ]),
    section(ANKAUF_MAIL_SECTIONS.buyer, [["Name", COMPANY.name], ["Anschrift", companyAddress], ["Telefon", COMPANY.phone]]),
    section(ANKAUF_MAIL_SECTIONS.seller, [["Name", name], ["Anschrift", sellerAddress], ["Telefon", seller.phone]]),
    "Mit freundlichen Grüßen",
  ].filter(Boolean).join("\n\n");

  return { subject: `${ANKAUF_MAIL_TITLE} – ${car} – ${COMPANY.name}`, body };
}
