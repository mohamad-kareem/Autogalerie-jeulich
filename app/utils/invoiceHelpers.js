// utils/invoiceHelpers.js
export function makeStarredNumber(invoiceNumber, issuer) {
  if (!invoiceNumber) return invoiceNumber;

  // ⭐ Alawie → insert slash + add "A" at end
  if (issuer === "alawie") {
    const match = invoiceNumber.match(/^RE-(\d{4})(\d+)$/);
    if (match) {
      return `RE-${match[1]}/${match[2]}A`; // e.g. RE-2025/109A
    }
  }

  // ⭐ Karim → insert "A" before slash
  if (issuer === "karim") {
    const match = invoiceNumber.match(/^(\d+)\/(\d+)$/);
    if (match) {
      return `${match[1]}A/${match[2]}`; // e.g. 103A/25
    }
  }

  return invoiceNumber; // fallback unchanged
}

// 🔧 Next invoice number generator
export function generateNextNumber(baseNumber, issuer) {
  const currentYearShort = new Date().getFullYear().toString().slice(-2); // "25"
  const currentYearFull = new Date().getFullYear().toString(); // "2025"

  if (issuer === "karim") {
    if (!baseNumber) return `1/${currentYearShort}`;

    const [prefix, year] = baseNumber.split("/");
    if (year !== currentYearShort) {
      return `1/${currentYearShort}`; // reset new year
    }
    return `${parseInt(prefix, 10) + 1}/${year}`;
  }

  if (issuer === "alawie") {
    if (!baseNumber) return `RE-${currentYearFull}1`;

    const match = baseNumber.match(/^RE-(\d{4})(\d+)$/);
    if (match) {
      const year = match[1];
      const seq = parseInt(match[2], 10) + 1;
      if (year !== currentYearFull) {
        return `RE-${currentYearFull}1`; // reset new year
      }
      return `RE-${year}${seq}`;
    }

    return `RE-${currentYearFull}1`; // fallback
  }

  // generic fallback
  if (!baseNumber) return "1";
  const match = baseNumber.match(/(\d+)$/);
  const num = match ? parseInt(match[1], 10) + 1 : 1;
  return baseNumber.replace(/\d+$/, String(num));
}
