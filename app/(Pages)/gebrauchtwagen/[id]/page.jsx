import { connectDB } from "../../../../lib/mongodb";
import Car from "../../../../models/Car";
import CarDetailContent from "./CarDetailContent";

export default async function CarPage({ params }) {
  await connectDB();
  const car = await Car.findById(params.id).lean();

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-red-600">🚫 Car not found</h1>
      </div>
    );
  }

  return <CarDetailContent car={JSON.parse(JSON.stringify(car))} />;
}
