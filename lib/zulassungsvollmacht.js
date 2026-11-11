import { COMPANY } from "./company";
import { buyerAddress } from "./sales";

export const VOLLMACHT_TEMPLATE = "/forms/vollmacht-zur-fahrzeugzulassung.pdf";
export const VOLLMACHT_PREVIEW = "/forms/vollmacht-zur-fahrzeugzulassung.webp";
export const VOLLMACHT_PAGE = { width: 595.22, height: 842 };

// The blank boxes in the supplied template, in PDF points from the top left.
export const VOLLMACHT_FIELDS = [
  { key: "holderName", x: 71.67, top: 126.31, width: 452.32, height: 21.27 },
  { key: "holderAddress", x: 71.67, top: 163.34, width: 452.32, height: 21.27 },
  { key: "representativeName", x: 71.67, top: 233.17, width: 452.32, height: 21.27 },
  { key: "representativeAddress", x: 71.67, top: 270.2, width: 452.32, height: 21.27 },
  { key: "vehicle", x: 71.67, top: 354.87, width: 452.32, height: 21.27 },
  { key: "evb", x: 70.88, top: 525.08, width: 452.32, height: 21.27 },
  { key: "placeDate", x: 70.92, top: 608.95, width: 199.41, height: 21.27 },
];

export const vollmachtLine = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

export function vollmachtDefaults(buyer = {}, vehicle = {}) {
  return {
    holderName: vollmachtLine(buyer.name),
    holderAddress: buyerAddress(buyer),
    representativeName: COMPANY.name,
    representativeAddress: buyerAddress(COMPANY),
    vehicle: [vehicle.name, vehicle.vin || vehicle.plate].map(vollmachtLine).filter(Boolean).join(" · "),
    evb: "",
    placeDate: "",
  };
}

// PDF's standard Helvetica font covers common German names. Use the browser's
// font fallback for characters outside its encoding while preserving the page.
function unicodeTextImage(value, width, height) {
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.font = "12px Arial, sans-serif";
  const size = Math.min(12, (12 * width) / context.measureText(value).width);
  context.font = `${size}px Arial, sans-serif`;
  context.textBaseline = "middle";
  context.fillStyle = "#17202e";
  context.fillText(value, 0, height / 2, width);
  return canvas.toDataURL("image/png");
}

export async function fillVollmachtPdf(template, values) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.load(template);
  const [page] = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const supported = new Set(font.getCharacterSet());
  const ink = rgb(0.09, 0.13, 0.18);

  for (const field of VOLLMACHT_FIELDS) {
    const value = vollmachtLine(values[field.key]);
    if (!value) continue;
    const x = field.x + 5;
    const width = field.width - 10;
    const bottom = page.getHeight() - field.top - field.height;

    if ([...value].every((character) => supported.has(character.codePointAt(0)))) {
      const size = Math.min(12, (12 * width) / font.widthOfTextAtSize(value, 12));
      const y = bottom + (field.height - font.heightAtSize(size, { descender: false })) / 2;
      page.drawText(value, { x, y, size, font, color: ink });
    } else {
      const image = await pdf.embedPng(unicodeTextImage(value, width, field.height));
      page.drawImage(image, { x, y: bottom, width, height: field.height });
    }
  }

  return pdf.save();
}
