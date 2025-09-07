// app/kaufvertrag/auswahl/page.jsx
import KaufvertragAuswahlPage from "./KaufvertragAuswahlPage";

export default function Page({ searchParams }) {
  const carId = searchParams.carId || "";
  return <KaufvertragAuswahlPage carId={carId} />;
}
