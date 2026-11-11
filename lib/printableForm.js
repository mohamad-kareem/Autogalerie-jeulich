export const pdfFormLine = (value) => String(value ?? "").replace(/\s+/g, " ").trim().normalize("NFC");

function fieldLines(field, value) {
  if (field.lineTops) return String(value ?? "").trim().split(/\r\n?|\n/).map(pdfFormLine);
  const text = pdfFormLine(value);
  return [field.format ? field.format(text) : text];
}

export function exceedsFormField(field, value) {
  if (field.lineTops) return fieldLines(field, value).length > field.lineTops.length;
  return Boolean(field.cells && Array.from(fieldLines(field, value)[0]).length > field.cells);
}

export function formTextRuns(field, rawValue) {
  const lines = fieldLines(field, rawValue);
  const [value] = lines;
  if (!value || exceedsFormField(field, rawValue)) return [];

  const { top, height, fontSize = 12 } = field;
  if (!field.cells) {
    const padding = field.padding ?? 5;
    const lineTops = field.lineTops ?? [top];
    return lines.flatMap((line, index) => line ? [{
      value: line,
      x: field.x + padding,
      top: lineTops[index],
      width: field.width - padding * 2,
      height,
      fontSize,
    }] : []);
  }

  const cellWidth = field.width / field.cells;
  return Array.from(value, (character, index) => ({
    value: character,
    x: field.x + cellWidth * index,
    top,
    width: cellWidth,
    height,
    fontSize,
    center: true,
  })).filter((run) => run.value !== " ");
}

// Helvetica covers common German names. Use the browser's font fallback for
// characters outside its encoding while keeping the underlying form intact.
function unicodeTextImage({ value, width, height, fontSize, center }) {
  const scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.font = `${fontSize}px Arial, sans-serif`;
  const size = Math.min(fontSize, (fontSize * width) / context.measureText(value).width);
  context.font = `${size}px Arial, sans-serif`;
  context.textAlign = center ? "center" : "left";
  context.textBaseline = "middle";
  context.fillStyle = "#17202e";
  context.fillText(value, center ? width / 2 : 0, height / 2, width);
  return canvas.toDataURL("image/png");
}

export async function fillPrintableForm(template, fields, values) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.load(template, { updateMetadata: false });
  const [page] = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const supported = new Set(font.getCharacterSet());
  const ink = rgb(0.09, 0.13, 0.18);

  for (const field of fields) {
    if (exceedsFormField(field, values[field.key])) throw new Error(`Value exceeds PDF field ${field.key}`);

    for (const run of formTextRuns(field, values[field.key])) {
      const { value, x, top, width, height, fontSize, center } = run;
      const bottom = page.getHeight() - top - height;
      if ([...value].every((character) => supported.has(character.codePointAt(0)))) {
        const size = Math.min(fontSize, (fontSize * width) / font.widthOfTextAtSize(value, fontSize));
        const y = bottom + (height - font.heightAtSize(size, { descender: false })) / 2;
        const textX = center ? x + (width - font.widthOfTextAtSize(value, size)) / 2 : x;
        page.drawText(value, { x: textX, y, size, font, color: ink });
      } else {
        const image = await pdf.embedPng(unicodeTextImage(run));
        page.drawImage(image, { x, y: bottom, width, height });
      }
    }
  }

  return pdf.save();
}
