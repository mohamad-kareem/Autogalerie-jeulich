import { redirect } from "next/navigation";

/** Old entry point (website „Kaufvertrag“ button, bookmarks) → the new contract form. */
export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const qp = new URLSearchParams();
  if (sp.carId) qp.set("carId", String(sp.carId));
  if (sp.issuer) qp.set("issuer", String(sp.issuer));
  redirect(`/kaufvertrag/form${qp.size ? `?${qp}` : ""}`);
}
