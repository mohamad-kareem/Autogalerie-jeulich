import { Suspense } from "react";
import GebrauchtwagenClient from "./GebrauchtwagenClient";

export default function GebrauchtwagenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-500">Fahrzeuge werden geladen...</p>
        </div>
      }
    >
      <GebrauchtwagenClient />
    </Suspense>
  );
}
