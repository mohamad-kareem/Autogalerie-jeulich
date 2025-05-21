"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ChevronRight,
  Grid,
  List,
  Calendar,
  Gauge,
  Fuel,
  Zap,
  MapPin,
  ShieldCheck,
  BadgeCheck,
  CarFront,
  Clock,
  Sparkles,
  Scale,
  X,
  Plus,
} from "lucide-react";
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
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

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

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode) {
      setSelectedForComparison([]);
    }
  };

  const toggleCarForComparison = (carId) => {
    setSelectedForComparison((prev) =>
      prev.includes(carId)
        ? prev.filter((id) => id !== carId)
        : [...prev, carId]
    );
  };

  const selectedCars = useMemo(() => {
    return cars.filter((car) => selectedForComparison.includes(car._id));
  }, [cars, selectedForComparison]);

  return (
    <div className="min-h-screen mt-20 relative">
      {/* Comparison Bar */}
      {comparisonMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50 p-4">
          <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-red-800" />
              <h3 className="font-semibold text-gray-900">
                Vergleichsmodus ({selectedForComparison.length}/3 ausgewählt)
              </h3>
              {selectedCars.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectedCars.slice(0, 3).map((car) => (
                    <div
                      key={car._id}
                      className="flex items-center gap-2 bg-gray-50 rounded-full pl-2 pr-3 py-1 border border-gray-200"
                    >
                      <button
                        onClick={() => toggleCarForComparison(car._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium">
                        {car.make} {car.model}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleComparisonMode}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <Link
                href="/vergleich"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedForComparison.length >= 2
                    ? "bg-red-800 text-white hover:bg-red-900"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Fahrzeuge vergleichen
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CarFront className="h-8 w-8 text-red-800" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Gebrauchtwagen
                </h1>
              </div>
              <p className="text-gray-600 mt-2">
                Entdecken Sie unsere Auswahl an qualitätsgeprüften
                Gebrauchtwagen
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleComparisonMode}
                className={`px-4 py-2 rounded-lg font-medium border transition-all flex items-center gap-2 ${
                  comparisonMode
                    ? "bg-red-800 text-white border-red-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Scale className="h-4 w-4" />
                {comparisonMode ? "Vergleich aktiv" : "Vergleichen"}
              </button>
              <button
                onClick={syncCars}
                disabled={syncing}
                className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 border border-gray-200 hover:border-gray-300 transition-all"
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                aktualisieren
              </button>
            </div>
          </div>
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
          maxPrice={maxPrice}
        />

        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center my-6 gap-4">
          <div className="flex items-center gap-2">
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
            {!loading && filteredCars.length > 0 && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleDateString("de-DE")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-800">Ansicht:</span>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${
                  viewMode === "grid"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Rasteransicht"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${
                  viewMode === "list"
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-label="Listenansicht"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cars Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car) => (
              <div
                key={car._id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border ${
                  comparisonMode && selectedForComparison.includes(car._id)
                    ? "border-red-600 ring-2 ring-red-200"
                    : "border-gray-100 hover:border-gray-200"
                } group relative`}
              >
                {comparisonMode && (
                  <button
                    onClick={() => toggleCarForComparison(car._id)}
                    className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      selectedForComparison.includes(car._id)
                        ? "bg-red-800 text-white"
                        : "bg-white text-gray-700 shadow-md hover:bg-gray-50"
                    }`}
                    aria-label={
                      selectedForComparison.includes(car._id)
                        ? "Aus Vergleich entfernen"
                        : "Zum Vergleich hinzufügen"
                    }
                  >
                    {selectedForComparison.includes(car._id) ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {car.images?.[0]?.ref ? (
                    <img
                      src={car.images[0].ref}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <CarFront className="h-12 w-12" />
                    </div>
                  )}

                  {/* Certification Badge */}
                  {car.certified && (
                    <div className="absolute top-3 left-3 bg-red-800 text-white px-2 py-1 rounded-md font-medium text-xs flex items-center gap-1 shadow">
                      <BadgeCheck className="h-3 w-3" />
                      Zertifiziert
                    </div>
                  )}

                  {/* Price Badge */}
                  {car.price?.consumerPriceGross && (
                    <div className="absolute bottom-3 left-3 bg-gradient-to-r from-black to-red-900 text-white px-3 py-1 rounded-md font-medium text-sm shadow-lg">
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
                <div className="p-5">
                  {/* Title */}
                  <div className="mb-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                        {car.make} {car.model}
                      </h3>
                      {car.warranty && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Garantie
                        </span>
                      )}
                    </div>
                    {car.modelDescription && (
                      <p className="text-gray-500 text-sm line-clamp-1 mt-1">
                        {car.modelDescription}
                      </p>
                    )}
                  </div>

                  {/* Key Specs */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Erstzulassung</p>
                        <p className="font-medium">
                          {car.firstRegistration
                            ? car.firstRegistration.slice(0, 4)
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kilometer</p>
                        <p className="font-medium">
                          {car.mileage
                            ? `${car.mileage.toLocaleString()} km`
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kraftstoff</p>
                        <p className="font-medium">{car.fuel || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Leistung</p>
                        <p className="font-medium">
                          {car.power ? `${car.power} PS` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {car.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{car.location}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/gebrauchtwagen/${car._id}`}
                      className="flex-1"
                    >
                      <Button className="w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                        <span>Details anzeigen</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    {!comparisonMode && (
                      <button
                        onClick={() => {
                          setComparisonMode(true);
                          toggleCarForComparison(car._id);
                        }}
                        className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Zum Vergleich hinzufügen"
                      >
                        <Scale className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
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
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border ${
                  comparisonMode && selectedForComparison.includes(car._id)
                    ? "border-red-600 ring-2 ring-red-200"
                    : "border-gray-100 hover:border-gray-200"
                } group relative`}
              >
                {comparisonMode && (
                  <button
                    onClick={() => toggleCarForComparison(car._id)}
                    className={`absolute top-3 right-3 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                      selectedForComparison.includes(car._id)
                        ? "bg-red-800 text-white"
                        : "bg-white text-gray-700 shadow-md hover:bg-gray-50"
                    }`}
                    aria-label={
                      selectedForComparison.includes(car._id)
                        ? "Aus Vergleich entfernen"
                        : "Zum Vergleich hinzufügen"
                    }
                  >
                    {selectedForComparison.includes(car._id) ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                )}

                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="md:w-1/3 lg:w-1/4 relative">
                    <div className="aspect-[16/9] md:aspect-auto md:h-full bg-gray-100">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <CarFront className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 md:w-2/3 lg:w-3/4 flex flex-col md:flex-row">
                    <div className="md:w-2/3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {car.make} {car.model}
                            </h3>
                            {car.certified && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Zertifiziert
                              </span>
                            )}
                          </div>
                          {car.modelDescription && (
                            <p className="text-gray-500 text-sm">
                              {car.modelDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Specifications */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Erstzulassung
                            </p>
                            <p className="font-medium">
                              {car.firstRegistration
                                ? car.firstRegistration.slice(0, 4)
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Kilometerstand
                            </p>
                            <p className="font-medium">
                              {car.mileage
                                ? `${car.mileage.toLocaleString()} km`
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Kraftstoff</p>
                            <p className="font-medium">{car.fuel || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Leistung</p>
                            <p className="font-medium">
                              {car.power ? `${car.power} PS` : "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {car.warranty && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Garantie inklusive
                          </span>
                        )}
                        {car.location && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {car.location}
                          </span>
                        )}
                        {car.serviceHistory && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Vollständige Servicehistorie
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="md:w-1/3 mt-4 md:mt-0 md:pl-4 flex flex-col items-end justify-between">
                      {/* Price */}
                      {car.price?.consumerPriceGross && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Preis ab</p>
                          <div className="text-2xl font-bold text-gray-900 mb-2">
                            {parseFloat(
                              car.price.consumerPriceGross
                            ).toLocaleString("de-DE", {
                              style: "currency",
                              currency: car.price.currency || "EUR",
                              maximumFractionDigits: 0,
                            })}
                          </div>
                          <p className="text-xs text-gray-500">
                            inkl. MwSt. und Zulassung
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 w-full justify-end">
                        {!comparisonMode && (
                          <button
                            onClick={() => {
                              setComparisonMode(true);
                              toggleCarForComparison(car._id);
                            }}
                            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                            title="Zum Vergleich hinzufügen"
                          >
                            <Scale className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                        <Link
                          href={`/gebrauchtwagen/${car._id}`}
                          className="flex-1 max-w-[200px]"
                        >
                          <Button className="w-full text-white py-2.5 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                            <span>Details</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CarFront className="h-10 w-10 text-red-800" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Keine passenden Fahrzeuge gefunden
            </h3>
            <p className="text-gray-800 max-w-md mx-auto mb-6">
              Entweder haben wir gerade keine Fahrzeuge die Ihren Kriterien
              entsprechen, oder Sie müssen Ihre Filter anpassen.
            </p>
            <button
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
              className="px-4 py-2 bg-red-800 text-white rounded-lg font-medium hover:bg-red-900 transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
