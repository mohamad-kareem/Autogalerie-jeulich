import CarDetailClient from "./CarDetailClient";

export default function CarDetailPage({ params }) {
  return <CarDetailClient carId={params.id} />;
}
