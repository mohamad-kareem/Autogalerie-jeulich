// utils/invoiceHelpers.js
export function makeStarredNumber(invoiceNumber, issuer) {
  if (!invoiceNumber) return invoiceNumber;

  // ⭐ Alawie → insert slash + add "A" at end
  if (issuer === "alawie") {
    const match = invoiceNumber.match(/^RE-(\d{4})(\d+)$/);
    if (match) {
      return `RE-${match[1]}/${match[2]}A`; // ✅ example: RE-2025/109A
    }
  }

  // ⭐ Karim → insert "A" before slash
  if (issuer === "karim") {
    const match = invoiceNumber.match(/^(\d+)\/(\d+)$/);
    if (match) {
      return `${match[1]}A/${match[2]}`; // ✅ example: 103A/25
    }
  }

  // Fallback → unchanged
  return invoiceNumber;
}
