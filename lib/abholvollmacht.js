// "Vollmacht" for a pickup – one A4 sheet that allows the driver to collect a
// bought car and to sign its Kaufvertrag. Printed from the browser (hidden
// iframe, no pop-up needed), like the Arbeitsauftrag.

import { COMPANY, COMPANY_STAMP } from "./company";
import { berlinDay, dateDE, formatEuro } from "./sales";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const line = (v) => String(v ?? "").trim();

/** Where the driver's name and address are remembered between two prints. */
export const VOLLMACHT_GIVER_KEY = "abholvollmacht.vollmachtgeber.v1";

export function abholvollmachtDefaults(pickup = {}) {
  const vehicle = pickup.vehicle || {};
  let giver = { giverName: COMPANY.name, giverStreet: COMPANY.street, giverCity: `${COMPANY.zip} ${COMPANY.city}` };
  try {
    const saved = JSON.parse(window.localStorage.getItem(VOLLMACHT_GIVER_KEY) || "null");
    if (saved && typeof saved === "object") giver = { ...giver, ...saved };
  } catch {
    // storage blocked: the fields simply start with the company address
  }
  return {
    ...giver,
    driverName: line(pickup.driver),
    driverStreet: "",
    driverCity: "",
    vehicle: line(vehicle.name),
    firstRegistration: line(vehicle.firstRegistration),
    price: pickup.price ? formatEuro(pickup.price) : "",
    place: COMPANY.city,
    date: berlinDay(),
    stamp: false,
  };
}

function party(label, name, street, city) {
  const rows = [name, street, city].map(line).filter(Boolean);
  return `
    <div class="row">
      <span class="label">${esc(label)}</span>
      <span class="value">${rows.map((row) => esc(row)).join("<br>") || "&nbsp;"}</span>
    </div>`;
}

/** The company stamp, sitting on the signature line. */
function stampHtml() {
  const [head, ...rows] = COMPANY_STAMP;
  return `<div class="stamp"><b>${esc(head)}</b>${rows.map((row) => esc(row)).join("<br>")}</div>`;
}

function sheetHtml(v) {
  const car = [
    line(v.vehicle),
    line(v.firstRegistration) ? `EZ: ${line(v.firstRegistration)}` : "",
    line(v.price) ? `Preis: ${line(v.price)}` : "",
  ].filter(Boolean);

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Vollmacht ${esc(v.vehicle)}</title>
<style>
  @page { size: A4 portrait; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font: 11.5pt/1.6 "Courier New", Courier, monospace; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { margin: 0 0 14mm; font-size: 13pt; font-weight: 400; text-align: center; }
  .row { display: flex; gap: 6mm; margin-bottom: 8mm; }
  .label { width: 42mm; flex: none; }
  .text { margin: 16mm 0 0; }
  .sign { margin-top: 24mm; }
  .sign p { margin: 0; }
  .line { width: 70mm; margin-top: 1mm; border-bottom: 1pt solid #000; }
  .stamp { width: 70mm; margin: 4mm 0 -1mm; text-align: center; font: 10pt/1.15 "Times New Roman", Times, serif; }
  .stamp b { display: block; font: bold 11pt/1.15 Arial, Helvetica, sans-serif; }
</style></head>
<body>
  <h1>Vollmacht</h1>

  ${party("Vollmachtgeber:", v.giverName, v.giverStreet, v.giverCity)}
  ${party("Bevollmächtigter:", v.driverName, v.driverStreet, v.driverCity)}

  <div class="row" style="margin-top:12mm">
    <span class="label">Fahrzeug:</span>
    <span class="value">${car.map((row) => esc(row)).join("<br>") || "&nbsp;"}</span>
  </div>

  <p class="text">
    Ich bevollmächtige oben benannte Person, in meinem Namen und für mich das oben bezeichnete
    Fahrzeug abzuholen. Der dazugehörige Kaufvertrag wird von der oben benannten Person
    abgeschlossen.
  </p>

  <div class="sign">
    <p>${esc(line(v.place))} den ${esc(dateDE(v.date) || line(v.date))}</p>
    <p>${esc(line(v.giverName))}</p>
    ${v.stamp ? stampHtml() : ""}
    <div class="line"></div>
  </div>
</body></html>`;
}

/** Prints the sheet; resolves once the print dialog was opened. */
export function printAbholvollmacht(values) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(sheetHtml(values));
    doc.close();

    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1500);
      resolve();
    }, 60);
  });
}
