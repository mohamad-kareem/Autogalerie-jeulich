"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/app/(components)/helpers/Button";
export default function UsedCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchCars = async () => {
    setLoading(true);
    const res = await fetch("/api/cars");
    const data = await res.json();
    setCars(data);
    setLoading(false);
  };

  const syncCars = async () => {
    setSyncing(true);
    const res = await fetch("/api/sync", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
      },
    });

    if (res.ok) {
      alert("✅ Autos aktualisiert!");
      await fetchCars();
    } else {
      alert("❌ Fehler beim Aktualisieren!");
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return (
    <main className="p-8 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gebrauchtwagen</h1>
        <Button
          onClick={syncCars}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={syncing}
        >
          {syncing ? "Aktualisiere..." : "🔄 Jetzt aktualisieren"}
        </Button>
      </div>

      {loading ? (
        <p>Lade Fahrzeuge...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car._id}
              className="border rounded-lg shadow-lg overflow-hidden"
            >
              {car.images[0]?.ref && (
                <img
                  src={car.images[0].ref}
                  alt={car.modelDescription || ""}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold">
                  {car.make} {car.model}{" "}
                  {car.firstRegistration
                    ? `(${new Date(car.firstRegistration).getFullYear()})`
                    : ""}
                </h2>
                <p className="text-sm text-gray-600">
                  {car.mileage?.toLocaleString()} km • {car.fuel} •{" "}
                  {car.gearbox}
                </p>
                <p className="mt-2 font-bold">
                  {car.priceGross?.toLocaleString()} {car.currency}
                </p>
                <Link href={`/gebrauchtwagen/${car._id}`}>
                  <Button className="mt-4 w-full bg-blue-600 text-white py-2 rounded">
                    Details ansehen
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
