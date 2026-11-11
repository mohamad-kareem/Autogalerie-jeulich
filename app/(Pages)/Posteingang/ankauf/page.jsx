import { Suspense } from "react";
import { redirect } from "next/navigation";
import { staffUser } from "@/lib/kaufvertragServer";
import AnkaufClient from "./AnkaufClient";

export const metadata = {
  title: "Ankauf",
  robots: { index: false, follow: false },
};

export default async function AnkaufPage() {
  const user = await staffUser();
  if (!user) redirect("/login");

  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <AnkaufClient canDelete={user.role === "admin"} />
      </Suspense>
    </div>
  );
}
