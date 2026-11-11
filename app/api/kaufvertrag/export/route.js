export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { adminUser, errorResponse, listContracts } from "@/lib/kaufvertragServer";
import { toContract } from "@/lib/kaufvertrag";
import { CONTRACT_STATUS, dateDE, paymentLabel, remaining } from "@/lib/sales";

const money = (n) => (Number(n) || 0).toFixed(2).replace(".", ",");
const cell = (v) => {
  const s = String(v ?? "");
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** GET /api/kaufvertrag/export?… – CSV (Excel, semicolon) of the filtered list. Admin only. */
export async function GET(req) {
  if (!(await adminUser())) return Response.json({ error: "Nur für Administratoren." }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  try {
    const { rows, year, scope } = await listContracts(sp);
    await connectDB();
    const docs = await Kaufvertrag.find({ _id: { $in: rows.map((r) => r._id) } }).lean();
    const list = docs.map(toContract).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const head = ["Datum", "Vertragsnummer", "Status", "Käufer", "Straße", "PLZ", "Ort", "Telefon", "Fahrzeug", "FIN", "Gesamtpreis", "Anzahlung", "Restbetrag", "Zahlungsart", "Bezahlt", "Bezahlt am"];
    const lines = list.map((c) =>
      [
        dateDE(c.date),
        c.number,
        CONTRACT_STATUS[c.status] || c.status,
        c.buyer.name,
        c.buyer.street,
        c.buyer.zip,
        c.buyer.city,
        c.buyer.phone,
        c.vehicle.name,
        c.vehicle.vin,
        money(c.total),
        money(c.deposit),
        money(remaining(c.total, c.deposit)),
        c.paymentMethod ? paymentLabel(c.paymentMethod) : c.paymentNote,
        c.status === "active" ? (c.paid ? "Ja" : "Nein") : "",
        c.paidAt ? dateDE(c.paidAt) : "",
      ]
        .map(cell)
        .join(";"),
    );
    const csv = `﻿${[head.join(";"), ...lines].join("\r\n")}\r\n`;
    const name = `Kaufvertraege_${scope === "archive" ? year || "Archiv" : year}${sp.get("month") ? `-${String(sp.get("month")).padStart(2, "0")}` : ""}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return errorResponse(err, "Export fehlgeschlagen.");
  }
}
