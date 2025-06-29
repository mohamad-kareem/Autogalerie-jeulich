// app/kaufvertrag/form/page.js
import { Suspense } from "react";
import KaufvertragClientForm from "./KaufvertragClientForm";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Lade Vertrag...</div>}>
      <KaufvertragClientForm />
    </Suspense>
  );
}
