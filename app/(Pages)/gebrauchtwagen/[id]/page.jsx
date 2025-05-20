// app/gebrauchtwagen/[id]/page.js
export const dynamic = "force-dynamic"; // ← disable prerendering

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function CarPage({ params }) {
  await connectDB();
  const car = await Car.findById(params.id).lean();

  if (!car) {
    return <p className="p-8">🚫 Car not found</p>;
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl mb-4">
        {car.make} {car.model}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {car.images?.map((img, i) => (
            <img
              key={i}
              src={img.ref}
              alt={`Image ${i + 1}`}
              className="w-full mb-4 rounded"
            />
          ))}
        </div>
        <div className="space-y-2">
          <p>
            <strong>Description:</strong> {car.modelDescription}
          </p>
          <p>
            <strong>Price:</strong> {car.price.consumerPriceGross}{" "}
            {car.price.currency}
          </p>
          <p>
            <strong>VAT Rate:</strong> {car.price.vatRate}%
          </p>
          {/* add any additional fields here */}
        </div>
      </div>
    </main>
  );
}
