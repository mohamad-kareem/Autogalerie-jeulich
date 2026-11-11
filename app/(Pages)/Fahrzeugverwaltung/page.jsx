import { Suspense } from "react";
import FahrzeugverwaltungClient from "./_components/FahrzeugverwaltungClient";

export const metadata = { title: "Fahrzeugverwaltung", robots: { index: false, follow: false } };

export default function FahrzeugverwaltungPage() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <FahrzeugverwaltungClient />
      </Suspense>
    </div>
  );
}
