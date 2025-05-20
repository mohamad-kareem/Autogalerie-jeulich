import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { syncCars } from "@/lib/syncCars";
export default async function Page() {
  // 1) fetch & upsert from mobile.de
  await syncCars();

  // 2) connect & get all cars
  await connectDB();
  const cars = await Car.find({}).lean();

  return (
    <main className="p-8">
      <h1 className="text-3xl mb-6">Gebrauchtwagen</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div
            key={car.mobileAdId}
            className="border rounded-lg overflow-hidden shadow-lg"
          >
            {car.images?.[0]?.ref && (
              <img
                src={car.images[0].ref}
                alt={car.modelDescription}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold">
                {car.make} {car.model}
              </h2>
              <p className="mt-2">
                {car.price.consumerPriceGross} {car.price.currency}
              </p>
              <Link href={`/gebrauchtwagen/${car._id}`}>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                  Details
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
