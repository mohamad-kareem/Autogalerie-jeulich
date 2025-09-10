// utils/invoiceHelpers.js
export function makeStarredNumber(invoiceNumber, issuer) {
  if (!invoiceNumber) return invoiceNumber;

  if (issuer === "alawie") {
    const match = invoiceNumber.match(/^RE-(\d{4})(\d+)$/);
    if (match) {
      return `RE-${match[1]}/${match[2]}`;
    }
  }

  if (issuer === "karim") {
    const match = invoiceNumber.match(/^(\d+)\/(\d+)$/);
    if (match) {
      return `${match[1]}A/${match[2]}`;
    }
  }

  return invoiceNumber;
}
