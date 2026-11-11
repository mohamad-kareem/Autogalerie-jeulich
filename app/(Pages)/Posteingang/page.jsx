import { redirect } from "next/navigation";
import { staffUser } from "@/lib/kaufvertragServer";
import AnfragenClient from "./AnfragenClient";

export const metadata = {
  title: "Anfragen",
  robots: { index: false, follow: false },
};

export default async function AnfragenPage() {
  const user = await staffUser();
  if (!user) redirect("/login");

  return (
    <div className="px-4 py-6 sm:px-6">
      <AnfragenClient canDelete={user.role === "admin"} />
    </div>
  );
}
