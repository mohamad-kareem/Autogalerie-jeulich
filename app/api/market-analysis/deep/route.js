import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { startDeepJob } from "@/lib/market/deep";
import { loadExpertAnswers } from "@/lib/market/expertAnswers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Only starts the job at OpenAI — answers within a few seconds.
export const maxDuration = 30;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/market-analysis/deep  body: { result }
 * Starts the AI review (gpt-5 with web search) as a background job and
 * returns { jobId } at once. The page then polls /deep/status.
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

  const result = body?.result;
  if (!result?.target || !Array.isArray(result?.comparables) || !result?.market) {
    return json({ error: "Keine Analyse zum Prüfen vorhanden." }, 400);
  }

  try {
    const answers = await loadExpertAnswers();
    const job = await startDeepJob(result, answers);
    return json(job);
  } catch (error) {
    console.error("deep analysis could not start", error);
    return json(
      { error: error?.message || "Die KI-Analyse konnte nicht gestartet werden. Bitte erneut versuchen." },
      error?.status && error.status >= 400 && error.status < 600 ? error.status : 502,
    );
  }
}
