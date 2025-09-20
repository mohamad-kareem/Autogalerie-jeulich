// utils/getLastValidContract.js
import Kaufvertrag from "@/models/Kaufvertrag";

export async function getLastValidContract(issuer) {
  const all = await Kaufvertrag.find({
    issuer,
    ignored: { $ne: true },
  }).lean();

  if (!all.length) return null;

  if (issuer === "karim") {
    return all
      .filter((c) => /^\d+\/\d+$/.test(c.invoiceNumber))
      .sort((a, b) => {
        const aNum = parseInt(a.invoiceNumber.split("/")[0], 10);
        const bNum = parseInt(b.invoiceNumber.split("/")[0], 10);
        return bNum - aNum;
      })[0];
  }

  if (issuer === "alawie") {
    return all
      .filter((c) => /^RE-\d{4}\d+$/.test(c.invoiceNumber))
      .sort((a, b) => {
        const aNum = parseInt(a.invoiceNumber.replace(/^RE-\d{4}/, ""), 10);
        const bNum = parseInt(b.invoiceNumber.replace(/^RE-\d{4}/, ""), 10);
        return bNum - aNum;
      })[0];
  }

  // fallback: latest created
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}
