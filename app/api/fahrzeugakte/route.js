export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import { errorResponse, staffUser } from "@/lib/kaufvertragServer";
import { POPULATE, STAGE_OF, extrasFor, toVehicle } from "@/lib/fahrzeugakte";
import { normVin } from "@/lib/sales";

const PHASES = ["werkstatt", "aufbereitung", "platz", "tuev", "verkauft"];

/** Connection hiccups (sleeping server, dropped socket) – worth one more try. */
const TRANSIENT = /Mongo(?:Network|ServerSelection|PoolCleared)|buffering timed out|ECONNRESET|ETIMEDOUT|Failed to connect|socket|topology/i;

async function loadAll() {
  await connectDB();
  const docs = await CarSchein.find({}).sort({ createdAt: -1 }).limit(3000).populate(...POPULATE).maxTimeMS(8000).lean();
  const extras = await extrasFor(docs);
  return docs.map((d) => toVehicle(d, extras));
}

/** GET /api/fahrzeugakte?phase=&q= → { vehicles, counts } */
export async function GET(req) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  try {
    let all;
    try {
      all = await loadAll();
    } catch (err) {
      if (!TRANSIENT.test(`${err?.name} ${err?.message}`)) throw err;
      console.warn("fahrzeugakte: retry after", err?.name, err?.message);
      all = await loadAll();
    }

    const q = String(sp.get("q") || "").trim().toLowerCase().slice(0, 80);
    if (q) {
      const qVin = normVin(q);
      all = all.filter(
        (v) =>
          [v.name, v.keyNumber, v.sale?.buyerName, v.sale?.contractNumber].some((x) => String(x || "").toLowerCase().includes(q)) ||
          (qVin.length >= 3 && v.vin.includes(qVin)),
      );
    }
    const counts = { all: all.length, ...Object.fromEntries(PHASES.map((p) => [p, all.filter((v) => v.phase === p).length])) };
    const phase = PHASES.includes(sp.get("phase")) ? sp.get("phase") : "";
    const vehicles = phase ? all.filter((v) => v.phase === phase) : all;
    return Response.json({ vehicles, counts });
  } catch (err) {
    return errorResponse(err, "Fahrzeuge konnten nicht geladen werden.");
  }
}

/** POST /api/fahrzeugakte – { name, vin, keyNumber, phase } → { vehicle } */
export async function POST(req) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = String(b?.name || "").trim().slice(0, 160);
  const vin = normVin(b?.vin);
  if (!name) return Response.json({ error: "Bitte eine Bezeichnung eingeben." }, { status: 400 });
  if (vin && vin.length !== 17) return Response.json({ error: "Die FIN muss 17 Zeichen haben." }, { status: 400 });
  try {
    await connectDB();
    if (vin && (await CarSchein.exists({ finNumber: vin }))) return Response.json({ error: "Diese FIN-Nummer existiert bereits." }, { status: 409 });
    const stage = STAGE_OF[b?.phase] && b.phase !== "verkauft" ? STAGE_OF[b.phase] : "WERKSTATT";
    const doc = await CarSchein.create({
      carName: name,
      finNumber: vin,
      owner: "Karim",
      keyNumber: String(b?.keyNumber || "").trim().slice(0, 20),
      keyCount: 2,
      stage,
      boughtAt: new Date(),
    });
    return Response.json({ vehicle: toVehicle(doc.toObject()) }, { status: 201 });
  } catch (err) {
    return errorResponse(err, "Fahrzeug konnte nicht angelegt werden.");
  }
}
