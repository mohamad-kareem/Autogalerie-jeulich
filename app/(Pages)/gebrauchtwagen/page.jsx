"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, Car, Star, Heart, ChevronRight } from "lucide-react";
import Button from "@/app/(components)/helpers/Button";
import SearchAndFilter from "@/app/(components)/helpers/SearchAndFilter";

export default function UsedCarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    make: "",
    fuelType: "",
    minPrice: 0,
    maxPrice: 100000,
    minYear: 1990,
    maxYear: new Date().getFullYear(),
    transmission: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [favorites, setFavorites] = useState(new Set());

  const toggleFavorite = (carId) => {
    const newFavorites = new Set(favorites);
    newFavorites.has(carId)
      ? newFavorites.delete(carId)
      : newFavorites.add(carId);
    setFavorites(newFavorites);
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cars");
      const data = await res.json();
      setCars(data);
    } catch (error) {
      console.error("Failed to fetch cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncCars = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
        },
      });
      if (res.ok) await fetchCars();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesSearch =
        searchTerm === "" ||
        `${car.make} ${car.model}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (car.modelDescription &&
          car.modelDescription
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesMake = filters.make === "" || car.make === filters.make;
      const matchesFuel =
        filters.fuelType === "" || car.fuel === filters.fuelType;

      const price = car.price?.consumerPriceGross || 0;
      const matchesPrice =
        price >= filters.minPrice && price <= filters.maxPrice;

      const year = car.firstRegistration
        ? parseInt(car.firstRegistration.slice(0, 4))
        : 0;
      const matchesYear = year >= filters.minYear && year <= filters.maxYear;

      const matchesTransmission =
        filters.transmission === "" || car.gearbox === filters.transmission;

      return (
        matchesSearch &&
        matchesMake &&
        matchesFuel &&
        matchesPrice &&
        matchesYear &&
        matchesTransmission
      );
    });
  }, [cars, searchTerm, filters]);

  useEffect(() => {
    fetchCars();
  }, []);

  const maxPrice = useMemo(() => {
    return (
      Math.ceil(
        Math.max(...cars.map((car) => car.price?.consumerPriceGross || 0)) /
          10000
      ) * 10000 || 100000
    );
  }, [cars]);

  return (
    <div className="min-h-screen bg-neutral-50 mt-15">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Premium Gebrauchtwagen
          </h1>
          <p className="text-gray-800 mt-2">
            Entdecken Sie unsere sorgfältig ausgewählten Fahrzeuge
          </p>
          <h2 className="text-lg font-semibold text-gray-900">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Lade Fahrzeuge...
              </span>
            ) : (
              `${filteredCars.length} ${
                filteredCars.length === 1 ? "Fahrzeug" : "Fahrzeuge"
              } verfügbar`
            )}
          </h2>
        </div>

        {/* Search and Filter Component */}
        <SearchAndFilter
          cars={cars}
          loading={loading}
          syncing={syncing}
          syncCars={syncCars}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          maxPrice={maxPrice}
        />

        {/* Results Header */}
        <div className="flex justify-end items-center mb-6 border-b border-gray-200 pb-2 mt-8">
          <div className="flex items-center gap-3 text-sm text-gray-800">
            <span className="font-medium">Ansicht:</span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
              <Button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === "grid"
                    ? "bg-white shadow text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Raster
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === "list"
                    ? "bg-white shadow text-gray-900 font-semibold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Liste
              </Button>
            </div>
          </div>
        </div>

        {/* Cars Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car) => (
              <div
                key={car._id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-gray-50">
                  {car.images?.[0]?.ref ? (
                    <img
                      src={car.images[0].ref}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Car className="h-12 w-12" />
                    </div>
                  )}

                  {/* Favorite Button */}
                  <Button
                    onClick={() => toggleFavorite(car._id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                    aria-label={
                      favorites.has(car._id)
                        ? "Von Merkliste entfernen"
                        : "Zur Merkliste hinzufügen"
                    }
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        favorites.has(car._id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400 hover:text-red-500"
                      }`}
                    />
                  </Button>

                  {/* Price Badge */}
                  {car.price?.consumerPriceGross && (
                    <div className="absolute bottom-3 left-3 bg-gradient-to-r from-red-800 to-red-800 text-white px-3 py-1.5 rounded-md font-semibold text-sm shadow-md">
                      {parseFloat(car.price.consumerPriceGross).toLocaleString(
                        "de-DE",
                        {
                          style: "currency",
                          currency: car.price.currency || "EUR",
                          maximumFractionDigits: 0,
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                  {/* Title */}
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                      {car.make} {car.model}
                    </h3>
                    {car.modelDescription && (
                      <p className="text-gray-500 text-sm line-clamp-1">
                        {car.modelDescription}
                      </p>
                    )}
                  </div>

                  {/* Key Specs */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="space-y-1">
                      <p className="text-gray-500">Erstzulassung</p>
                      <p className="font-medium">
                        {car.firstRegistration
                          ? car.firstRegistration.slice(0, 4)
                          : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Kilometer</p>
                      <p className="font-medium">
                        {car.mileage
                          ? `${car.mileage.toLocaleString()} km`
                          : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Kraftstoff</p>
                      <p className="font-medium">{car.fuel || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Leistung</p>
                      <p className="font-medium">
                        {car.power ? `${car.power} PS` : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/gebrauchtwagen/${car._id}`}>
                    <Button className="w-full bg-gradient-to-r from-red-800 to-red-800 hover:from-red-800 hover:to-red-800 text-white py-2.5 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                      Fahrzeugdetails
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cars List View */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredCars.map((car) => (
              <div
                key={car._id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="md:w-1/3 relative">
                    <div className="aspect-[16/9] md:aspect-auto md:h-full bg-gray-50">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Car className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Favorite Button */}
                    <Button
                      onClick={() => toggleFavorite(car._id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                      aria-label={
                        favorites.has(car._id)
                          ? "Von Merkliste entfernen"
                          : "Zur Merkliste hinzufügen"
                      }
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          favorites.has(car._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400 hover:text-red-500"
                        }`}
                      />
                    </Button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 md:w-2/3 flex flex-col">
                    <div className="flex flex-col md:flex-row md:justify-between">
                      {/* Title and Price */}
                      <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-gray-900">
                          {car.make} {car.model}
                        </h3>
                        {car.modelDescription && (
                          <p className="text-gray-500 mt-1">
                            {car.modelDescription}
                          </p>
                        )}
                      </div>

                      {car.price?.consumerPriceGross && (
                        <div className="text-xl font-bold text-red-800 whitespace-nowrap">
                          {parseFloat(
                            car.price.consumerPriceGross
                          ).toLocaleString("de-DE", {
                            style: "currency",
                            currency: car.price.currency || "EUR",
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      )}
                    </div>

                    {/* Specifications */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-gray-500 text-sm">Erstzulassung</p>
                        <p className="font-medium">
                          {car.firstRegistration
                            ? car.firstRegistration.slice(0, 4)
                            : "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 text-sm">Kilometerstand</p>
                        <p className="font-medium">
                          {car.mileage
                            ? `${car.mileage.toLocaleString()} km`
                            : "-"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 text-sm">Kraftstoff</p>
                        <p className="font-medium">{car.fuel || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 text-sm">Leistung</p>
                        <p className="font-medium">
                          {car.power ? `${car.power} PS` : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <Button
                        className="flex items-center gap-2 text-gray-800 hover:text-gray-900 text-sm"
                        onClick={() => toggleFavorite(car._id)}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            favorites.has(car._id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span>
                          {favorites.has(car._id) ? "Gespeichert" : "Merkliste"}
                        </span>
                      </Button>

                      <Link href={`/gebrauchtwagen/${car._id}`}>
                        <Button className="bg-gradient-to-r from-red-800 to-red-800 hover:from-red-800 hover:to-red-800 text-white py-2.5 px-6 rounded-md font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md w-full md:w-auto justify-center">
                          Details ansehen
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="mx-auto h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
              <Car className="h-10 w-10 text-red-800" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine passenden Fahrzeuge gefunden
            </h3>
            <p className="text-gray-800 max-w-md mx-auto mb-6">
              Entweder haben wir gerade keine Fahrzeuge die Ihren Kriterien
              entsprechen, oder Sie müssen Ihre Filter anpassen.
            </p>
            <Button
              onClick={() => {
                setFilters({
                  make: "",
                  fuelType: "",
                  minPrice: 0,
                  maxPrice: 100000,
                  minYear: 1990,
                  maxYear: new Date().getFullYear(),
                  transmission: "",
                });
                setSearchTerm("");
              }}
              className="text-red-800 hover:text-red-800 font-medium text-sm flex items-center justify-center gap-1 mx-auto"
            >
              Filter zurücksetzen
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
