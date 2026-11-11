import { Suspense } from "react";
import ContractList from "../_components/ContractList";

export const metadata = { title: "Archiv", robots: { index: false, follow: false } };

export default function ArchivePage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <ContractList scope="archive" />
      </Suspense>
    </div>
  );
}
