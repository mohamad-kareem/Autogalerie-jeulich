import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { staffUser } from "@/lib/kaufvertragServer";
import { DEFAULT_LOCATION, getCompanyLocation } from "@/lib/travel";
import EinstellungenClient from "./EinstellungenClient";

export const metadata = {
  title: "Einstellungen",
  robots: { index: false, follow: false },
};

/** never blocks the page when the database is slow */
async function safe(factory, fallback, ms = 3500) {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(fallback), ms));
  return Promise.race([Promise.resolve().then(factory).catch(() => fallback), timeout]);
}

export default async function EinstellungenPage() {
  const user = await staffUser();
  if (!user) redirect("/login");

  const [companyLocation, image] = await Promise.all([
    safe(() => getCompanyLocation(), DEFAULT_LOCATION),
    safe(async () => {
      await connectDB();
      const a = await Admin.findById(user.userId).select("image").lean();
      return a?.image || "";
    }, ""),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <EinstellungenClient
        isAdmin={user.role === "admin"}
        user={{ id: user.userId, name: user.name || "", email: user.email || "", role: user.role || "user", image, companyLocation }}
      />
    </div>
  );
}
