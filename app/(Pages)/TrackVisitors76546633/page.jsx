export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import PageVisit from "@/models/PageVisit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function TrackVisitorsPage() {
  const session = await getServerSession(authOptions);

  // 1️⃣ Only the “super-admin” may view the page
  if (session?.user?.name !== "admin76546633") {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">Error.</div>
    );
  }

  await connectDB();

  const visits = await PageVisit.find()
    .sort({ createdAt: -1 })
    .populate({ path: "userId", select: "name role" })
    .lean();

  // 2️⃣ Hide this admin’s own visits
  const filteredVisits = visits.filter(
    (v) => v.userId?.name !== "admin76546633"
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Page Visit Tracker</h1>

      <table className="w-full border text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">User</th>
            <th className="border px-2 py-1">Role</th>
            <th className="border px-2 py-1">Path</th>
            <th className="border px-2 py-1">Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredVisits.map((v, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{v.userId?.name || "Guest"}</td>
              <td className="border px-2 py-1">
                {v.userId?.role || v.role || "guest"}
              </td>
              <td className="border px-2 py-1">{v.path}</td>
              <td className="border px-2 py-1">
                {new Date(v.createdAt).toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin", // ⬅️ force CEST/CET
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
