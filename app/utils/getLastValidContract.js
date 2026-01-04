// utils/getLastValidContract.js
import Kaufvertrag from "@/models/Kaufvertrag";

export async function getLastValidContract(issuer) {
  const all = await Kaufvertrag.find({
    issuer,
    ignored: { $ne: true }, // ignore ignored contracts
  }).lean();

  if (!all.length) return null;

  const normalize = (c) => c.originalInvoiceNumber || c.invoiceNumber;

  /* ────────────────────────────
     KARIM LOGIC (fix applied)
  ──────────────────────────── */
  if (issuer === "karim") {
    const list = all
      .map((c) => ({ ...c, base: normalize(c) }))
      .filter((c) => /^\d+\/\d{2}$/.test(c.base))
      .map((c) => {
        const [seq, year] = c.base.split("/");
        return {
          ...c,
          seq: parseInt(seq, 10),
          year: parseInt(year, 10),
        };
      })
      // SORT BY YEAR DESC, THEN SEQUENCE DESC
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.seq - a.seq;
      });

    return list[0] || null;
  }

  /* ────────────────────────────
     ALAWIE LOGIC (works but improved)
  ──────────────────────────── */
  if (issuer === "alawie") {
    const list = all
      .map((c) => ({ ...c, base: normalize(c) }))
      .filter((c) => /^RE-\d{4}\d+$/.test(c.base))
      .map((c) => {
        const year = parseInt(c.base.slice(3, 7), 10);
        const seq = parseInt(c.base.slice(7), 10);
        return { ...c, year, seq };
      })
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.seq - a.seq;
      });

    return list[0] || null;
  }

  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}
