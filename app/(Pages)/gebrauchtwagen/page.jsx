import { Suspense } from "react";

import { listCars } from "@/lib/cars/queries";

import GebrauchtwagenClient from "./GebrauchtwagenClient";

// The stock changes with the daily mobile.de sync (which also refreshes this
// page right away); in between it is rebuilt at most every 10 minutes.
export const revalidate = 600;

export const metadata = {
  title: "Gebrauchtwagen kaufen in Jülich | Autogalerie Jülich",
  description:
    "Geprüfte Gebrauchtwagen bei der Autogalerie Jülich – Finanzierung, Inzahlungnahme und Zulassungsservice. Alte Dürenerstraße 4, 52428 Jülich.",
  alternates: { canonical: "/gebrauchtwagen" },
};

export default async function GebrauchtwagenPage() {
  let cars = [];
  let failed = false;
  try {
    cars = await listCars();
  } catch (error) {
    console.error("Gebrauchtwagen: stock could not be loaded:", error?.message);
    failed = true;
  }

  return (
    <Suspense fallback={null}>
      <GebrauchtwagenClient initialCars={cars} failed={failed} />
    </Suspense>
  );
}
