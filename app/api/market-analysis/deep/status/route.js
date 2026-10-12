import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkDeepJob } from "@/lib/market/deep";
import { loadExpertAnswers } from "@/lib/market/expertAnswers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// One look at the job — a few seconds at most.
export const maxDuration = 30;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/market-analysis/deep/status  body: { jobId, result }
 * { status: "running" } while the AI works; when it is done, the full review
 * with market value and limit recalculated in code (same shape as before).
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  const jobId = typeof body?.jobId === "string" ? body.jobId.trim() : "";
  const result = body?.result;
  if (!/^resp_[A-Za-z0-9]+$/.test(jobId) || !result?.target || !Array.isArray(result?.comparables)) {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  try {
    const answers = await loadExpertAnswers();
    return json(await checkDeepJob(jobId, result, answers));
  } catch (error) {
    console.error("deep analysis status failed", error);
    return json(
      { error: error?.message && error.status === 502 ? error.message : "Die KI-Analyse ist fehlgeschlagen. Bitte erneut versuchen." },
      error?.status && error.status >= 400 && error.status < 600 ? error.status : 502,
    );
  }
}
