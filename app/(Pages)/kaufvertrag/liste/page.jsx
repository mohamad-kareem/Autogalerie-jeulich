import { Suspense } from "react";
import { redirect } from "next/navigation";
import { adminUser } from "@/lib/kaufvertragServer";
import ContractList from "../_components/ContractList";

export const metadata = { title: "Kaufverträge", robots: { index: false, follow: false } };

export default async function ContractsPage({ searchParams }) {
  const params = await searchParams;
  const scope = params?.scope === "archive" ? "archive" : "year";
  if (scope === "archive" && !(await adminUser())) redirect("/kaufvertrag/liste");

  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <ContractList key={scope} scope={scope} />
      </Suspense>
    </div>
  );
}
