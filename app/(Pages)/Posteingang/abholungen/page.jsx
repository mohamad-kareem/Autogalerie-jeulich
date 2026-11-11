import { redirect } from "next/navigation";
import { staffUser } from "@/lib/kaufvertragServer";
import AbholungenClient from "./AbholungenClient";

export const metadata = { title: "Abholungen", robots: { index: false, follow: false } };

export default async function AbholungenPage() {
  if (!(await staffUser())) redirect("/login");
  return (
    <div className="px-4 py-6 sm:px-6">
      <AbholungenClient />
    </div>
  );
}
