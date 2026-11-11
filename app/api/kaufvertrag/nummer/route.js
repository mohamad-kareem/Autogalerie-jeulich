export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { adminUser, errorResponse, nextNumber, setNextNumber, staffUser } from "@/lib/kaufvertragServer";

const issuerOf = (req) => (new URL(req.url).searchParams.get("issuer") === "alawie" ? "alawie" : "karim");

/** GET – next contract number (preview) */
export async function GET(req) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    return Response.json({ next: await nextNumber(issuerOf(req)) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** PUT { next } – admin: continue the sequence (e.g. after paper contracts) */
export async function PUT(req) {
  if (!(await adminUser())) return Response.json({ error: "Nur für Administratoren." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  try {
    return Response.json({ next: await setNextNumber(issuerOf(req), body?.next) });
  } catch (err) {
    return errorResponse(err);
  }
}
