/**
 * Prints one vehicle as a single A4 data sheet: header, the vehicle's facts,
 * its phase, the task checklist and the photo of the registration document
 * (turned upright, filling the rest of the page).
 */

import { toast } from "react-hot-toast";

import { addressOf, computeWarranty, formatDate, normalizeStage, notesOf, soldContactOf, stageLabel } from "./constants";

const COMPANY = "Autogalerie Jülich";

const esc = (value = "") =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

const STYLES = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    font-size: 11.5px; line-height: 1.45; color: #0f172a; background: #e2e8f0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .paper {
    width: 210mm; height: 297mm; margin: 24px auto; padding: 14mm 15mm 12mm;
    background: #fff; box-shadow: 0 10px 40px rgba(15, 23, 42, .18);
    display: flex; flex-direction: column; overflow: hidden;
  }
  .top { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 2px solid #0f172a; }
  .brand { font-size: 15px; font-weight: 700; letter-spacing: .02em; }
  .brand small { display: block; font-size: 10px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #64748b; margin-top: 2px; }
  .meta { text-align: right; font-size: 10px; color: #64748b; }
  .meta b { display: block; font-size: 11px; color: #0f172a; font-weight: 600; }

  .title { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin: 16px 0 14px; }
  h1 { font-size: 22px; line-height: 1.2; font-weight: 700; margin: 0; letter-spacing: -.01em; }
  .fin { font-family: "Consolas", "SFMono-Regular", Menlo, monospace; font-size: 12.5px; color: #334155; margin-top: 4px; letter-spacing: .04em; }
  .badge { display: inline-block; white-space: nowrap; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: #0f172a; }
  .badge.red { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
  .badge.green { border-color: #a7f3d0; background: #ecfdf5; color: #047857; }

  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .cell { padding: 8px 10px; background: #fff; min-height: 44px; }
  .cell.span2 { grid-column: span 2; }
  .cell.span4 { grid-column: span 4; }
  .label { font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #64748b; }
  .value { font-size: 12px; font-weight: 600; margin-top: 2px; word-break: break-word; }
  .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(0,0,0,.2); vertical-align: -1px; margin-right: 5px; }

  h2 { font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #64748b; margin: 16px 0 6px; }
  .note { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; font-size: 11.5px; }
  .note ul { margin: 0; padding-left: 16px; }

  .tasks { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
  .task { display: flex; gap: 8px; align-items: flex-start; font-size: 11.5px; }
  .box { flex: none; width: 12px; height: 12px; margin-top: 2px; border: 1.3px solid #475569; border-radius: 3px; font-size: 9px; line-height: 10px; text-align: center; font-weight: 700; }
  .done .box { background: #0f172a; border-color: #0f172a; color: #fff; }
  .done .text { color: #64748b; text-decoration: line-through; }
  .empty { color: #94a3b8; font-style: italic; }

  .photo-block { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .photo { flex: 1; min-height: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
  .photo img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }

  .foot { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #94a3b8; }
  .spacer { flex: 1; }

  .loading { font-family: system-ui, sans-serif; color: #475569; text-align: center; padding-top: 30vh; font-size: 14px; }

  @media print {
    body { background: #fff; }
    .paper { margin: 0; box-shadow: none; }
  }
`;

function rotPlateText(schein) {
  if (!schein.rotKennzeichen) return "Nein";
  if (schein.rotPlateNumber === "BEIDE") return "DN-06919 + DN-06921";
  return schein.rotPlateNumber || "Ja";
}

function sheet(schein, imageUrl) {
  const notes = notesOf(schein);
  const done = Array.isArray(schein.completedTasks) ? schein.completedTasks : [];
  const stage = normalizeStage(schein.stage);
  const meta = schein.stageMeta || {};
  const failedTuev = stage === "TUEV" && !meta.tuev?.passed;
  const badgeTone = failedTuev ? "red" : stage === "SOLD" ? "green" : "";

  // [label, value, columns]; every row adds up to 4 columns.
  const cells = [
    ["Schlüssel-Nr.", schein.keyNumber ? esc(schein.keyNumber) : "–"],
    ["Schlüssel", `<span class="swatch" style="background:${esc(schein.keyColor || "#000000")}"></span>${esc(schein.keyCount ?? 2)} Stück`],
    ["Hinzugefügt", esc(formatDate(schein.createdAt))],
    ["Ankauf", esc(schein.boughtAt ? formatDate(schein.boughtAt) : "–")],
    ["Tank", schein.fuelNeeded ? "Leer – auffüllen" : "In Ordnung"],
    ["Rotkennzeichen", esc(rotPlateText(schein))],
    ["Schlüssel-Notiz", esc(schein.keyNote || "–"), 2],
  ];

  if (schein.keySold) {
    const warranty = computeWarranty(schein);
    const buyer = soldContactOf(schein);
    cells.push(
      ["Verkauft am", esc(formatDate(schein.soldAt))],
      ["Käufer", esc(buyer?.customerName || "–")],
      ["Telefon", esc(buyer?.phone || "–")],
      ["Garantie bis", esc(warranty.end ? formatDate(warranty.end) : "–")],
    );
    if (addressOf(buyer)) cells.push(["Adresse", esc(addressOf(buyer)), 4]);
  }

  const grid = cells
    .map(([label, value, span]) => `<div class="cell${span ? ` span${span}` : ""}"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>`)
    .join("");

  // What the current phase says in detail.
  let phaseNote = "";
  if (stage === "WERKSTATT" && (meta.werkstatt?.where || meta.werkstatt?.what)) {
    phaseNote = [meta.werkstatt?.where && `<b>Werkstatt:</b> ${esc(meta.werkstatt.where)}`, meta.werkstatt?.what && `<b>Arbeiten:</b> ${esc(meta.werkstatt.what)}`].filter(Boolean).join(" &nbsp;·&nbsp; ");
  } else if (stage === "PLATZ" && meta.platz?.note) {
    phaseNote = `<b>Stellplatz:</b> ${esc(meta.platz.note)}`;
  } else if (failedTuev && Array.isArray(meta.tuev?.issues) && meta.tuev.issues.length) {
    phaseNote = `<b>TÜV-Mängel</b><ul>${meta.tuev.issues.map((issue) => `<li>${esc(issue)}</li>`).join("")}</ul>`;
  }

  const tasks = notes.length
    ? `<div class="tasks">${notes
        .map((note) => {
          const isDone = done.includes(note);
          return `<div class="task${isDone ? " done" : ""}"><span class="box">${isDone ? "✓" : ""}</span><span class="text">${esc(note)}</span></div>`;
        })
        .join("")}</div>`
    : `<div class="note empty">Keine Aufgaben hinterlegt.</div>`;

  const today = new Date().toLocaleDateString("de-DE");

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8" />
    <title>${esc(schein.carName || "Fahrzeug")} – Fahrzeugdatenblatt</title><style>${STYLES}</style></head>
    <body>
      <div class="paper">
        <div class="top">
          <div class="brand">${esc(COMPANY)}<small>Fahrzeugdatenblatt</small></div>
          <div class="meta"><b>${esc(today)}</b>Gedruckt am</div>
        </div>

        <div class="title">
          <div>
            <h1>${esc(schein.carName || "Unbekanntes Fahrzeug")}</h1>
            <div class="fin">FIN: ${esc(schein.finNumber || "–")}</div>
          </div>
          <span class="badge ${badgeTone}">${esc(stageLabel(schein.stage, schein.stageMeta))}</span>
        </div>

        <div class="grid">${grid}</div>

        ${phaseNote ? `<h2>Phase</h2><div class="note">${phaseNote}</div>` : ""}

        <h2>Aufgaben${notes.length ? ` · ${notes.filter((note) => done.includes(note)).length}/${notes.length} erledigt` : ""}</h2>
        ${tasks}

        ${
          imageUrl
            ? `<div class="photo-block"><h2>Fahrzeugschein</h2><div class="photo"><img src="${esc(imageUrl)}" alt="Fahrzeugschein" /></div></div>`
            : `<div class="spacer"></div>`
        }

        <div class="foot"><span>${esc(COMPANY)} · Interne Unterlage – nicht zur Weitergabe bestimmt</span><span>${esc(today)}</span></div>
      </div>
    </body></html>`;
}

/**
 * Turns the photo by -90° on a canvas so it prints upright (and keeps it at a
 * sensible size for printing).
 */
function uprightImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = Math.min(1, 2400 / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = h;
        canvas.height = w;
        const ctx = canvas.getContext("2d");
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export async function printSchein(schein) {
  if (!schein) return;

  // Open the window right away (inside the click), otherwise the browser
  // blocks it as a popup while the photo is being prepared.
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) {
    toast.error("Popup wurde vom Browser blockiert. Bitte Popups für diese Seite erlauben.");
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><title>Wird vorbereitet …</title><style>${STYLES}</style></head><body><p class="loading">Druckansicht wird vorbereitet …</p></body></html>`);
  win.document.close();

  const image = schein.imageUrl ? await uprightImage(schein.imageUrl) : null;
  if (win.closed) return;

  win.document.open();
  win.document.write(sheet(schein, image));
  win.document.close();

  const print = () => {
    win.focus();
    win.print();
  };
  const img = win.document.querySelector(".photo img");
  if (img && !img.complete) {
    img.addEventListener("load", print, { once: true });
    img.addEventListener("error", print, { once: true });
  } else {
    setTimeout(print, 150);
  }
  win.onafterprint = () => win.close();
}
