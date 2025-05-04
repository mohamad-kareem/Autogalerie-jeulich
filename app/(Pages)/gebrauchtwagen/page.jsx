"use client";
import React, { useState, useEffect } from "react";
import CarCard from "@/app/(components)/CarCard";
import Filter from "@/app/(components)/Filter";
import { FiGrid, FiList, FiLayers } from "react-icons/fi";
import { useRouter } from "next/navigation";

const defaultFilters = {
  make: "",
  model: "",
  type: "",
  transmission: "",
  maxPrice: "",
  maxKilometers: "",
  fuel: "",
  minYear: "",
};

const CarsPage = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [comparedCars, setComparedCars] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState(defaultFilters);
  const router = useRouter();

  // Restore compare list from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("comparedCars");
      if (saved) setComparedCars(JSON.parse(saved));
    }
  }, []);

  // Save comparedCars to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("comparedCars", JSON.stringify(comparedCars));
    }
  }, [comparedCars]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams(filters);
        const res = await fetch(`/api/cars?${query}`);
        if (!res.ok) throw new Error(await res.text());
        const { cars } = await res.json();
        setCars(cars);
      } catch (error) {
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, [filters]);

  const toggleCompare = (carId) => {
    setComparedCars(
      (prev) =>
        prev.includes(carId)
          ? prev.filter((id) => id !== carId)
          : prev.length < 4
          ? [...prev, carId]
          : prev // max 4 cars
    );
  };

  // For controlled filter form (pending state until user submits)
  const handleFilterChange = (name, value) => {
    setPendingFilters((prev) => ({ ...prev, [name]: value }));
  };

  // On filter submit, copy pending to real filters (triggers fetch)
  const handleFilterSubmit = () => {
    setFilters(pendingFilters);
  };

  const handleResetFilters = () => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const handleStartCompare = () => {
    router.push(`/vergleich?ids=${comparedCars.join(",")}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-20 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Section */}
            <div className="w-full lg:w-80 space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
                <h2 className="text-xl font-bold mb-6">Fahrzeugsuche</h2>
                <Filter
                  filters={pendingFilters}
                  onChange={handleFilterChange}
                  onSubmit={handleFilterSubmit}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
            {/* Results Section */}
            <div className="flex-1">
              <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center">
                <h3 className="text-lg font-semibold mb-4 sm:mb-0">
                  {cars.length} Fahrzeuge gefunden
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg ${
                      viewMode === "grid"
                        ? "bg-blue-100 text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    <FiGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg ${
                      viewMode === "list"
                        ? "bg-blue-100 text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    <FiList className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {cars.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                  <p className="text-gray-500">Keine Fahrzeuge gefunden</p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-6"
                  }
                >
                  {cars.map((car) => (
                    <CarCard
                      key={car._id}
                      car={{
                        ...car,
                        id: car._id,
                        price: new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        }).format(car.price),
                        registration: car.registration || "N/A",
                        image: car.images?.[0] || "/default-car.jpg",
                        active: car.active, // <— include active flag
                      }}
                      viewMode={viewMode}
                      onCompareToggle={toggleCompare}
                      isComparing={comparedCars.includes(car._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Comparison Bar */}
        {comparedCars.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white shadow-xl rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200">
              <span className="font-medium text-gray-700">
                {comparedCars.length} Fahrzeuge zum Vergleich
              </span>
              <button
                onClick={handleStartCompare}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
              >
                <FiLayers className="w-4 h-4" />
                Vergleich starten
              </button>
              <button
                onClick={() => setComparedCars([])}
                className="text-gray-500 hover:text-gray-700 text-lg"
                aria-label="Vergleich zurücksetzen"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CarsPage;
