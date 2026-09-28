// app/kaufvertrag/form/page.js
import { Suspense } from "react";
import KaufvertragClientForm from "./KaufvertragClientForm";
import PageLoader from "@/app/(components)/helpers/PageLoader";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <KaufvertragClientForm />
    </Suspense>
  );
}
