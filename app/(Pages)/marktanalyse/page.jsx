import { redirect } from "next/navigation";
import { FiBarChart2 } from "react-icons/fi";
import { staffUser } from "@/lib/kaufvertragServer";

export const metadata = {
  title: "Marktanalyse",
  robots: { index: false, follow: false },
};

/** Placeholder until the new Marktanalyse is built. */
export default async function MarktanalysePage() {
  const user = await staffUser();
  if (!user) redirect("/login");

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="card mx-auto mt-10 flex max-w-xl flex-col items-center gap-3 px-6 py-12 text-center">
        <FiBarChart2 className="size-9 text-muted" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-ink">Neue Marktanalyse kommt bald</h1>
        <p className="text-sm text-muted">Die Marktanalyse wird gerade neu aufgebaut.</p>
      </div>
    </div>
  );
}
