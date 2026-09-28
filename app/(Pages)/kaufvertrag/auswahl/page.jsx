"use client";

import { use } from "react";
import { Suspense } from "react";
import KaufvertragAuswahlPage from "./KaufvertragAuswahlPage";
import PageLoader from "@/app/(components)/helpers/PageLoader";

export default function Page({ searchParams }) {
  const unwrapped = use(searchParams); // ✅ unwraps the proxy
  const carId = unwrapped?.carId || "";

  return (
    <Suspense fallback={<PageLoader />}>
      <KaufvertragAuswahlPage carId={carId} />
    </Suspense>
  );
}
