export const runtime = "nodejs";

import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";
import { serializeMessage, statusFilter, unreadFilter, userObjectId } from "@/lib/anfragen";
import { staffUser } from "@/lib/kaufvertragServer";

const PAGE_SIZE = 25;

/** GET /api/messages?status=new&q=müller&skip=0 */
export async function GET(req) {
  const user = await staffUser();
  if (!user) {
    return Response.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const q = (searchParams.get("q") || "").trim().slice(0, 80);
    const skip = Math.max(0, Number(searchParams.get("skip") || 0));
    const uid = userObjectId(user.userId);

    const parts = [];
    if (status === "unread") parts.push(unreadFilter(uid));
    else parts.push(statusFilter(status));
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      parts.push({ $or: [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }, { carName: rx }, { phone: rx }] });
    }
    const filter = parts.filter((p) => Object.keys(p).length);
    const where = filter.length > 1 ? { $and: filter } : filter[0] || {};

    const [docs, total, counts] = await Promise.all([
      ContactSubmission.find(where).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
      ContactSubmission.countDocuments(where),
      buildCounts(uid),
    ]);

    return Response.json({
      messages: docs.map((d) => serializeMessage(d, user.userId)),
      total,
      skip,
      pageSize: PAGE_SIZE,
      counts,
    });
  } catch (err) {
    console.error("MESSAGES_GET_ERROR:", err?.message || err);
    return Response.json({ error: "Anfragen konnten nicht geladen werden." }, { status: 500 });
  }
}

async function buildCounts(uid) {
  const [all, unread, n, inProgress, done, archived] = await Promise.all([
    ContactSubmission.countDocuments({}),
    ContactSubmission.countDocuments(unreadFilter(uid)),
    ContactSubmission.countDocuments(statusFilter("new")),
    ContactSubmission.countDocuments(statusFilter("in_progress")),
    ContactSubmission.countDocuments(statusFilter("done")),
    ContactSubmission.countDocuments(statusFilter("archived")),
  ]);
  return { all, unread, new: n, in_progress: inProgress, done, archived };
}
