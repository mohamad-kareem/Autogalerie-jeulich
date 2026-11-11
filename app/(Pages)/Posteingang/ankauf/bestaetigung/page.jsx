import { redirect } from "next/navigation";
import { staffUser } from "@/lib/kaufvertragServer";
import BestaetigungClient from "./BestaetigungClient";

export const metadata = { title: "Ankauf bestätigen", robots: { index: false, follow: false } };

export default async function AnkaufBestaetigungPage() {
  const user = await staffUser();
  if (!user) redirect("/login");
  return (
    <div className="px-4 py-6 sm:px-6">
      <BestaetigungClient />
    </div>
  );
}
