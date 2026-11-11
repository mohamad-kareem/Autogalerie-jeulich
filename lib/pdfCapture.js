"use client";

// PDF of a printed document (Kaufvertrag) straight from the page – looks like
// the print: the page's @media print rules are applied to the copy that is
// captured, at the printable width of an A4 page, and it is fitted on one page.

import html2canvas from "html2canvas";
import generatePDF from "react-to-pdf";

const PRINT_WIDTH = 718; // px – A4 minus the browser's default print margins
const PAGE_MM = { w: 210, h: 297, margin: 10 };

/** html2canvas cannot read modern colour functions (oklch, oklab, color-mix …) → plain rgb */
function makeColorFixer() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const one = (c) => {
    if (cache.has(c)) return cache.get(c);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    cache.set(c, out);
    return out;
  };
  const FN = /\b(?:oklch|oklab|lab|lch|color|color-mix)\((?:[^()]|\([^()]*\))*\)/g;
  const HAS = /\b(?:oklch|oklab|lab|lch|color|color-mix)\(/;
  return (value) => (value && HAS.test(value) ? value.replace(FN, (m) => one(m)) : value);
}

const COLOR_PROPS = [
  "color",
  "background-color",
  "background-image",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "box-shadow",
  "text-shadow",
  "fill",
  "stroke",
];

/** Copy every @media print rule of the page into the clone as a normal rule (also nested ones). */
function applyPrintRules(doc) {
  const css = [];
  const isPrint = (rule) => {
    const m = rule.media?.mediaText || rule.conditionText || "";
    return /\bprint\b/.test(m) && !/\bscreen\b/.test(m);
  };
  // the clone lives in an iframe → no instanceof (other realm)
  const kind = (rule) => rule?.constructor?.name || "";
  const walk = (list, selector) => {
    for (const rule of Array.from(list || [])) {
      if (kind(rule) === "CSSMediaRule" && isPrint(rule)) {
        for (const inner of Array.from(rule.cssRules)) {
          if (kind(inner) === "CSSStyleRule") css.push(selector ? `${selector} { ${inner.cssText} }` : inner.cssText);
          else if (selector) css.push(`${selector} { ${inner.cssText} }`);
          else css.push(inner.cssText);
        }
      } else if (kind(rule) === "CSSStyleRule") {
        if (rule.cssRules?.length) walk(rule.cssRules, rule.selectorText);
      } else if (rule.cssRules) {
        walk(rule.cssRules, selector); // @layer, @supports …
      }
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      walk(sheet.cssRules, "");
    } catch {
      /* cross-origin sheet */
    }
  }
  // Tailwind's preflight sets img{display:block}; html2canvas measures the text
  // baseline with an inline image → without this every text is drawn too low.
  css.push("img { display: inline-block !important; }");
  const style = doc.createElement("style");
  style.textContent = css.join("\n");
  doc.head.appendChild(style);
}

/** Inputs as plain text – html2canvas draws input values badly. */
function inputsToText(doc, el) {
  for (const input of Array.from(el.querySelectorAll("input"))) {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    if (type === "checkbox" || type === "radio") {
      const box = doc.createElement("span");
      box.textContent = input.checked ? (type === "radio" ? "◉" : "☑\uFE0E") : type === "radio" ? "○" : "☐";
      box.style.cssText = "display:inline-block;width:14px;font-size:13px;line-height:1;margin-right:4px";
      input.replaceWith(box);
      continue;
    }
    const cs = doc.defaultView.getComputedStyle(input);
    const div = doc.createElement("div");
    div.textContent = input.value;
    div.className = input.className;
    const own = input.getAttribute("style") || ""; // keeps absolute positions (TÜV form)
    const justify = cs.textAlign === "right" || cs.textAlign === "end" ? "flex-end" : cs.textAlign === "center" ? "center" : "flex-start";
    div.style.cssText = [
      `display:${cs.display === "inline-block" || cs.display === "inline" ? "inline-flex" : "flex"}`,
      "align-items:center",
      `justify-content:${justify}`,
      `width:${cs.width}`,
      `min-height:${cs.height}`,
      `padding:0 ${cs.paddingRight} 0 ${cs.paddingLeft}`,
      `font:${cs.font}`,
      "line-height:1.25",
      `color:${cs.color}`,
      "white-space:nowrap",
      "overflow:visible",
      "border:none",
      "box-sizing:border-box",
    ].join(";");
    if (own) div.style.cssText = `${own};${div.style.cssText}`;
    if (cs.position === "absolute") {
      div.style.position = "absolute";
      div.style.height = cs.height;
    }
    input.replaceWith(div);
  }
}

const prepareClone = (width) => (doc, el) => {
  applyPrintRules(doc);
  el.style.width = `${width}px`;
  el.style.maxWidth = `${width}px`;
  el.style.minWidth = "0";
  el.style.margin = "0";
  inputsToText(doc, el);
  const fix = makeColorFixer();
  const win = doc.defaultView;
  for (const node of [el, ...el.querySelectorAll("*")]) {
    const cs = win.getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const v = cs.getPropertyValue(prop);
      const fixed = fix(v);
      if (fixed !== v) node.style.setProperty(prop, fixed, "important");
    }
  }
};

/** Captures the document and fits it on one A4 page → jsPDF instance */
async function buildPdf(element, method, filename, { margin = PAGE_MM.margin, width = PRINT_WIDTH } = {}) {
  // html2canvas measures fonts in this page: Tailwind's img{display:block} shifts every text down
  const fix = document.createElement("style");
  fix.textContent = "img { display: inline-block !important; }";
  document.head.appendChild(fix);
  let shot;
  try {
    shot = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: width,
      onclone: prepareClone(width),
    });
  } finally {
    fix.remove();
  }

  // jsPDF comes with react-to-pdf: build a tiny PDF and reuse it with a fresh A4 page.
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;background:#fff;z-index:-1";
  document.body.appendChild(probe);
  let pdf;
  try {
    pdf = await generatePDF(() => probe, { method: "build", resolution: 1, page: { margin: 0, format: "A4", orientation: "portrait" } });
  } finally {
    probe.remove();
  }
  pdf.addPage("a4", "portrait");
  pdf.deletePage(1);

  // one A4 page, the picture fitted inside the margins (never split)
  const innerW = PAGE_MM.w - 2 * margin;
  const innerH = PAGE_MM.h - 2 * margin;
  const scale = Math.min(innerW / shot.width, innerH / shot.height);
  const w = shot.width * scale;
  const h = shot.height * scale;
  pdf.addImage(shot.toDataURL("image/jpeg", 0.95), "JPEG", margin + (innerW - w) / 2, margin, w, h);
  if (method === "save") await pdf.save(filename || "Kaufvertrag.pdf", { returnPromise: true });
  return pdf;
}

/** downloads the PDF */
export async function downloadPdf(element, filename, { margin } = {}) {
  await buildPdf(element, "save", filename, margin === 0 ? { margin: 0, width: 794 } : {});
}

/** → "data:application/pdf;base64,…" (for e-mails) */
export async function pdfDataUri(element, { margin } = {}) {
  const pdf = await buildPdf(element, "build", "", margin === 0 ? { margin: 0, width: 794 } : {});
  return pdf.output("datauristring");
}
