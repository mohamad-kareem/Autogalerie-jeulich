import { Suspense } from "react";
import KaufvertragAuswahlPage from "./KaufvertragAuswahlPage";

export default function Page({ searchParams }) {
  const carId = searchParams?.carId || "";

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KaufvertragAuswahlPage carId={carId} />
    </Suspense>
  );
}
