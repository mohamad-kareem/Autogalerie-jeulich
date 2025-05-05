// app/(Pages)/kontakt/page.jsx (Server Component)

import ContactPage from "./ContactPage";

export default function KontaktPage({ searchParams }) {
  const carId = searchParams.carId || "";
  const carName = searchParams.carName || "";
  const carLink = searchParams.carLink || "";

  return <ContactPage carId={carId} carName={carName} carLink={carLink} />;
}
