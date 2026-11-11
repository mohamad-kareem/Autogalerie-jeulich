// "Arbeitsauftrag" – one A4 sheet per car with all tasks and the registration
// document, printed from the browser (hidden iframe, no pop-up needed).

import { COMPANY } from "@/lib/company";
import { monthDE, phaseLabel } from "@/lib/sales";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const dash = (v) => (v === "" || v == null ? "–" : esc(v));
const km = (n) => (n == null ? "" : `${new Intl.NumberFormat("de-DE").format(n)} km`);
const dayDE = (d) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.split("-").reverse().join(".") : "");

function sheetHtml({ vehicle: v, tasks, contracts, photoUrl }) {
  const now = new Date();
  const printed = `${now.toLocaleDateString("de-DE")} · ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const blankRows = 3;
  const contractNo = new Map(contracts.map((c) => [c._id, c.number]));
  // task titles carry the car as prefix ("Jeep Renegade: Ölwechsel") – the car is printed above already
  const cleanTitle = (title) => {
    const i = title.indexOf(": ");
    return i > 0 && String(v.name || "").toLowerCase().startsWith(title.slice(0, i).toLowerCase()) ? title.slice(i + 2) : title;
  };

  const facts = [
    ["Fahrzeug", v.name],
    ["FIN", v.vin, "mono"],
    ["Erstzulassung", v.firstRegistration],
    ["Kilometerstand", km(v.mileage)],
    ["Kraftstoff", [v.fuel, v.tankEmpty ? "Tank leer" : ""].filter(Boolean).join(" · ")],
    ["Leistung", v.power],
    ["Getriebe", v.gearbox],
    ["HU / TÜV bis", v.tuevStatus === "failed" ? "nicht bestanden" : monthDE(v.tuevUntil)],
    ["Vorbesitzer", v.owners ?? ""],
    ["Im Bestand seit", dayDE(v.inStockSince)],
  ];

  const taskRow = (t, i, isDone) => `
    <tr class="${isDone ? "done" : ""}">
      <td class="c-nr">${i}</td>
      <td class="c-box"><span class="box">${isDone ? "&#10003;" : ""}</span></td>
      <td>${esc(cleanTitle(t.title))}${t.contractId ? ` <span class="tag">Kaufvertrag${contractNo.get(t.contractId) ? ` ${esc(contractNo.get(t.contractId))}` : ""} · vor Übergabe</span>` : ""}${isDone ? ' <span class="tag">bereits erledigt</span>' : ""}</td>
      <td>${esc(t.assignee)}</td>
      <td>${isDone ? "" : esc(dayDE(t.day))}</td>
      <td></td>
    </tr>`;

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Arbeitsauftrag ${esc(v.name)}</title>
<style>
  @page { size: A4 portrait; margin: 11mm 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font: 9.5pt/1.35 "Helvetica Neue", Arial, sans-serif; color: #1d232a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .head { display: flex; justify-content: space-between; align-items: stretch; gap: 6mm; padding-bottom: 3mm; border-bottom: 1.6pt solid #2b3138; }
  .firm b { display: block; font-size: 13pt; letter-spacing: .2pt; }
  .firm span { display: block; color: #5b646f; font-size: 8pt; }
  .title { text-align: right; }
  .title h1 { margin: 0; font-size: 17pt; letter-spacing: 2.5pt; text-transform: uppercase; }
  .title p { margin: 1mm 0 0; color: #5b646f; font-size: 8pt; }
  .keybox { display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 28mm; padding: 1.5mm 3mm; border: 1.4pt solid #2b3138; border-radius: 1.5mm; background: #eceef1; }
  .keybox small { font-size: 6.5pt; font-weight: 700; letter-spacing: 1.2pt; text-transform: uppercase; color: #5b646f; }
  .keybox strong { font-size: 20pt; line-height: 1.1; }
  h2 { margin: 5mm 0 1.8mm; padding: 1.2mm 2.5mm; font-size: 7.5pt; font-weight: 700; letter-spacing: 1.6pt; text-transform: uppercase; color: #3e454e; background: #dfe2e6; border-left: 1.2mm solid #3e454e; }
  .facts { display: grid; grid-template-columns: repeat(4, 1fr); border: .6pt solid #b9bfc7; border-radius: 1mm; overflow: hidden; }
  .facts div { padding: 1.4mm 2.2mm; border-right: .6pt solid #d5d9de; border-bottom: .6pt solid #d5d9de; min-height: 10mm; }
  .facts div:nth-child(4n) { border-right: 0; }
  .facts div:nth-last-child(-n+4) { border-bottom: 0; }
  .facts div.wide { grid-column: span 2; }
  .facts small { display: block; font-size: 6.5pt; font-weight: 700; letter-spacing: .8pt; text-transform: uppercase; color: #6b7480; }
  .facts span { display: block; font-weight: 600; }
  .mono { font-family: "Courier New", monospace; letter-spacing: .6pt; }
  table { width: 100%; border-collapse: collapse; }
  .tasks th { padding: 1.3mm 2mm; font-size: 6.8pt; font-weight: 700; letter-spacing: .9pt; text-transform: uppercase; text-align: left; color: #3e454e; background: #eceef1; border: .6pt solid #b9bfc7; }
  .tasks td { padding: 0 2mm; height: 8.4mm; border: .6pt solid #c9ced5; vertical-align: middle; }
  .tasks tr.done td { color: #7d8691; }
  .tasks td.empty { color: #7d8691; font-style: italic; }
  .tasks tr.blank td { height: 7.6mm; }
  .c-nr { width: 8mm; text-align: center; color: #6b7480; }
  .c-box { width: 9mm; text-align: center; }
  .box { display: inline-flex; align-items: center; justify-content: center; width: 4.2mm; height: 4.2mm; border: 1pt solid #2b3138; border-radius: .6mm; font-size: 8pt; font-weight: 700; }
  .tag { white-space: nowrap; margin-left: 1.5mm; padding: .2mm 1.2mm; font-size: 6.5pt; border: .5pt solid #b9bfc7; border-radius: .6mm; color: #6b7480; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  .notes { height: 72mm; overflow: hidden; padding: 2mm 2.5mm; border: .6pt solid #b9bfc7; border-radius: 1mm; background: repeating-linear-gradient(transparent 0 6.8mm, #e1e4e8 6.8mm 7mm); white-space: pre-wrap; }
  .schein { display: flex; align-items: center; justify-content: center; height: 72mm; border: .6pt solid #b9bfc7; border-radius: 1mm; background: #f7f8f9; overflow: hidden; }
  .schein img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .schein em { color: #8a929c; font-size: 8.5pt; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; margin-top: 9mm; }
  .sign div { padding-top: 1.2mm; border-top: .8pt solid #2b3138; font-size: 7pt; color: #5b646f; }
  .foot { margin-top: 4mm; display: flex; justify-content: space-between; font-size: 6.8pt; color: #8a929c; }
</style></head>
<body>
  <div class="head">
    <div class="firm"><b>${esc(COMPANY.name)}</b><span>${esc(COMPANY.street)} · ${esc(COMPANY.zip)} ${esc(COMPANY.city)}</span><span>Tel. ${esc(COMPANY.phone)}</span></div>
    <div style="display:flex;gap:5mm;align-items:stretch">
      <div class="title"><h1>Arbeitsauftrag</h1><p>Fahrzeug-Laufzettel · Phase: ${esc(phaseLabel(v.phase))}</p><p>Gedruckt: ${printed}</p></div>
      <div class="keybox"><small>Schlüssel-Nr.</small><strong>${dash(v.keyNumber)}</strong><small>${v.keyCount ? `${esc(v.keyCount)} Stk.` : ""}</small></div>
    </div>
  </div>

  <h2>Fahrzeug</h2>
  <div class="facts">
    ${facts
      .map(([label, value, cls], i) => `<div class="${i === 0 || i === 1 ? "wide" : ""}"><small>${label}</small><span class="${cls || ""}">${dash(value)}</span></div>`)
      .join("")}
  </div>

  <h2>Aufgaben · ${open.length} offen${done.length ? ` · ${done.length} erledigt` : ""}</h2>
  <table class="tasks">
    <thead><tr><th class="c-nr">Nr.</th><th class="c-box">Erl.</th><th>Aufgabe</th><th style="width:28mm">Zuständig</th><th style="width:22mm">Geplant</th><th style="width:26mm">Kürzel / Datum</th></tr></thead>
    <tbody>
      ${open.map((t, i) => taskRow(t, i + 1, false)).join("")}
      ${done.map((t, i) => taskRow(t, open.length + i + 1, true)).join("")}
      ${tasks.length ? "" : '<tr><td class="c-nr"></td><td class="c-box"></td><td colspan="4" class="empty">Für dieses Fahrzeug sind keine Aufgaben gespeichert.</td></tr>'}
      ${Array.from({ length: blankRows }, () => '<tr class="blank"><td class="c-nr"></td><td class="c-box"><span class="box"></span></td><td></td><td></td><td></td><td></td></tr>').join("")}
    </tbody>
  </table>

  <div class="cols">
    <div><h2>Bemerkungen</h2><div class="notes"></div></div>
    <div><h2>Fahrzeugschein</h2><div class="schein">${photoUrl ? `<img src="${esc(photoUrl)}" alt="Fahrzeugschein">` : "<em>Kein Fahrzeugschein hinterlegt</em>"}</div></div>
  </div>

  <div class="sign"><div>Erledigt von (Name)</div><div>Datum</div><div>Kontrolliert / Unterschrift</div></div>
  <div class="foot"><span>${esc(COMPANY.name)} · Interner Arbeitsauftrag</span><span class="mono">${esc(v.vin)}</span></div>
</body></html>`;
}

/** Prints the sheet; resolves once the print dialog was opened. */
export function printWorkOrder({ vehicle, tasks = [], contracts = [] }) {
  return new Promise((resolve) => {
    // the registration photo is stored at Cloudinary (already turned upright)
    const photoUrl = vehicle.hasRegistrationPhoto ? vehicle.imageUrl || "" : "";
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow.document;
    doc.open();
    doc.write(sheetHtml({ vehicle, tasks, contracts, photoUrl }));
    doc.close();

    let fired = false;
    const go = () => {
      if (fired) return;
      fired = true;
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1500);
      resolve();
    };
    const img = doc.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", go);
      img.addEventListener("error", go);
      setTimeout(go, 5000);
    } else {
      setTimeout(go, 50);
    }
  });
}
