import { Suspense } from "react";
import ContractList from "../_components/ContractList";

export const metadata = { title: "Kaufverträge", robots: { index: false, follow: false } };

export default function ContractsPage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <ContractList scope="year" />
      </Suspense>
    </div>
  );
}
