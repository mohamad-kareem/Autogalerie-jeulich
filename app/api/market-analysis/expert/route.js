import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { EXPERT_QUESTION_BY_ID } from "@/lib/market/expertQuestions";
import { connectDB } from "@/lib/mongodb";
import ExpertAnswer from "@/models/ExpertAnswer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** GET /api/market-analysis/expert → { answers: { A01: { answer, updatedAt, updatedBy } } } */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  try {
    await connectDB();
    const docs = await ExpertAnswer.find().lean();
    const answers = {};
    for (const doc of docs) {
      answers[doc.questionId] = {
        answer: doc.answer || "",
        updatedAt: doc.updatedAt || null,
        updatedBy: doc.updatedBy || "",
      };
    }
    return json({ answers });
  } catch (error) {
    console.error("expert GET", error);
    return json({ error: "Antworten konnten nicht geladen werden." }, 500);
  }
}

/** PUT { questionId, answer } — saves one answer (empty text removes it). */
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  const questionId = String(body?.questionId || "");
  if (!EXPERT_QUESTION_BY_ID[questionId]) return json({ error: "Unbekannte Frage." }, 400);
  const answer = String(body?.answer ?? "").trim().slice(0, 4000);

  try {
    await connectDB();
    if (!answer) {
      await ExpertAnswer.deleteOne({ questionId });
      return json({ questionId, answer: "", updatedAt: null, updatedBy: "" });
    }
    const updatedBy = String(session.user.name || session.user.email || "").slice(0, 120);
    const doc = await ExpertAnswer.findOneAndUpdate(
      { questionId },
      { $set: { answer, updatedBy } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return json({ questionId, answer: doc.answer, updatedAt: doc.updatedAt, updatedBy: doc.updatedBy });
  } catch (error) {
    console.error("expert PUT", error);
    return json({ error: "Antwort konnte nicht gespeichert werden." }, 500);
  }
}
