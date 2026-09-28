export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import PageVisit, { VISIT_RETENTION_DAYS } from "@/models/PageVisit";

const OWNER = "admin76546633";
const ROW_LIMIT = 500;

// Readable names for the paths people visit. Unknown paths show as they are.
const PAGE_NAMES = [
  ["/marktanalyse", "Marktanalyse"],
  ["/neue-angebote", "Neue Angebote"],
  ["/AdminDashboard", "Admin Dashboard"],
  ["/ai-chats", "AI-Chats"],
  ["/aufgabenboard", "Trello"],
  ["/schlussel", "Schlüssel"],
  ["/Toni-Werkstatt", "Lackieren"],
  ["/kaufvertrag/liste", "Verträge"],
  ["/kaufvertrag/archiv", "Vertragsarchiv"],
  ["/kaufvertrag/auswahl", "Neuer Vertrag"],
  ["/kaufvertrag/form", "Vertrag ausfüllen"],
  ["/kaufvertrag", "Vertrag"],
  ["/Fahrzeugverwaltung", "Fahrzeugverwaltung"],
  ["/Fotostudio", "Fotostudio"],
  ["/preisschild", "Preisschild"],
  ["/Rotkennzeichen", "Rotkennzeichen"],
  ["/Zeiterfassungsverwaltung", "Zeiterfassung"],
  ["/Kundenkontakte", "Kundenkontakte"],
  ["/Posteingang", "Posteingang"],
  ["/punsh", "Stempeluhr"],
  ["/Autoteil", "Teile-Reklamation"],
  ["/Reg", "Admin hinzufügen"],
  ["/excel", "Kassenbuch"],
  ["/PersonalData", "Personaldaten"],
  ["/translator", "Übersetzer"],
  ["/gebrauchtwagen/", "Fahrzeug-Detail"],
  ["/gebrauchtwagen", "Gebrauchtwagen"],
  ["/finanzierung", "Finanzierung"],
  ["/garantie", "Garantie"],
  ["/kontakt", "Kontakt"],
  ["/impressum", "Impressum"],
  ["/Datenschutz", "Datenschutz"],
  ["/Autoverkaufen", "Auto verkaufen"],
  ["/vergleich", "Vergleich"],
  ["/login", "Login"],
  ["/forgotpassword", "Passwort vergessen"],
  ["/reset-password", "Passwort zurücksetzen"],
];

function pageName(path) {
  if (!path) return "–";
  if (path === "/") return "Startseite";
  const hit = PAGE_NAMES.find(([prefix]) =>
    path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
  return hit ? hit[1] : path;
}

const berlinDay = (date) =>
  new Date(date).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });

const berlinTime = (date) =>
  new Date(date).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });

function dayTitle(day) {
  const today = berlinDay(Date.now());
  const yesterday = berlinDay(Date.now() - 24 * 60 * 60 * 1000);
  if (day === today) return "Heute";
  if (day === yesterday) return "Gestern";
  return day;
}

function roleLabel(visit) {
  if (!visit.userId) return "Gast";
  return (visit.userId.role || visit.role) === "admin" ? "Admin" : "Mitarbeiter";
}

export default async function TrackVisitorsPage() {
  const session = await getServerSession(authOptions);

  // Only the owner may see this page.
  if (session?.user?.name !== OWNER) {
    return <div className="p-6 text-center font-semibold text-red-600">Error.</div>;
  }

  await connectDB();

  const since = new Date(Date.now() - VISIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // MongoDB removes old visits by itself (see models/PageVisit.js); this makes
  // sure nothing older is ever kept, even before that index exists.
  await PageVisit.deleteMany({ createdAt: { $lt: since } }).catch(() => {});

  const owner = await Admin.findOne({ name: OWNER }).select("_id").lean();
  const match = { createdAt: { $gte: since } };
  // The owner's own visits are never listed.
  if (owner?._id) match.userId = { $ne: owner._id };

  const visits = (
    await PageVisit.find(match)
      .sort({ createdAt: -1 })
      .limit(ROW_LIMIT)
      .populate({ path: "userId", select: "name role" })
      .lean()
  ).filter((visit) => visit.userId?.name !== OWNER);

  // Grouped by day, newest first.
  const days = [];
  for (const visit of visits) {
    const day = berlinDay(visit.createdAt);
    if (days[days.length - 1]?.day !== day) days.push({ day, visits: [] });
    days[days.length - 1].visits.push(visit);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Seitenaufrufe</h1>
          <p className="mt-1 text-sm text-slate-500">
            Die letzten {VISIT_RETENTION_DAYS} Tage · ältere Einträge werden automatisch gelöscht.
          </p>
        </header>

        {days.length ? (
          <div className="space-y-5">
            {days.map(({ day, visits: dayVisits }) => (
              <section key={day} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <h2 className="flex items-baseline justify-between border-b border-slate-100 px-4 py-2.5 text-sm font-semibold">
                  {dayTitle(day)}
                  <span className="text-[12px] font-normal text-slate-500">{dayVisits.length} Aufrufe</span>
                </h2>
                <ul className="divide-y divide-slate-100">
                  {dayVisits.map((visit) => {
                    const name = pageName(visit.path);
                    const isAdmin = roleLabel(visit) === "Admin";
                    return (
                      <li key={String(visit._id)} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="w-11 shrink-0 text-[13px] tabular-nums text-slate-500">
                          {berlinTime(visit.createdAt)}
                        </span>
                        <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-4">
                          <p className={`truncate text-[14px] font-medium sm:w-44 sm:shrink-0 ${isAdmin ? "text-green-600" : ""}`}>
                            {visit.userId?.name || "Gast"}
                            <span className={`ml-1.5 text-[11px] font-normal ${isAdmin ? "text-green-500" : "text-slate-400"}`}>
                              {roleLabel(visit)}
                            </span>
                          </p>
                          <p className="truncate text-[13px] text-slate-600">
                            {name}
                            {name !== visit.path ? <span className="ml-1.5 text-[12px] text-slate-400">{visit.path}</span> : null}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {visits.length >= ROW_LIMIT ? (
              <p className="text-center text-[12px] text-slate-500">Die neuesten {ROW_LIMIT} Aufrufe.</p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Keine Aufrufe in den letzten {VISIT_RETENTION_DAYS} Tagen.
          </p>
        )}
      </div>
    </main>
  );
}
