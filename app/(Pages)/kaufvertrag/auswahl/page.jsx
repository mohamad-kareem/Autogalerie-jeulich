"use client";

import { use } from "react";
import { Suspense } from "react";
import KaufvertragAuswahlPage from "./KaufvertragAuswahlPage";

export default function Page({ searchParams }) {
  const unwrapped = use(searchParams); // ✅ unwraps the proxy
  const carId = unwrapped?.carId || "";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KaufvertragAuswahlPage carId={carId} />
    </Suspense>
  );
}
