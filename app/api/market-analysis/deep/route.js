import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { runDeepAnalysis } from "@/lib/market/deep";
import { connectDB } from "@/lib/mongodb";
import ExpertAnswer from "@/models/ExpertAnswer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/market-analysis/deep  body: { result }
 * The "Tief" second pass on an analysis the page already has. Costs one call
 * to the stronger AI model; numbers are recalculated in code.
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
    return json({ error: "Zuerst eine normale Analyse durchführen." }, 400);
  }

  // The dealer's answers are a help, never a requirement.
  let answers = [];
  try {
    await connectDB();
    answers = await ExpertAnswer.find({ answer: { $ne: "" } }, { questionId: 1, answer: 1 }).lean();
  } catch (error) {
    console.error("deep: expert answers unavailable", error);
  }

  try {
    const deep = await runDeepAnalysis(result, answers, { timeoutMs: 50_000 });
    return json(deep);
  } catch (error) {
    console.error("deep analysis failed", error);
    const timeout = /timeout|timed out|abort/i.test(String(error?.message));
    return json(
      {
        error: timeout
          ? "Die Tiefe Analyse hat zu lange gedauert. Bitte erneut versuchen."
          : error?.status === 503
            ? error.message
            : "Die Tiefe Analyse ist fehlgeschlagen. Bitte erneut versuchen.",
      },
      error?.status && error.status >= 400 && error.status < 600 ? error.status : 502,
    );
  }
}
