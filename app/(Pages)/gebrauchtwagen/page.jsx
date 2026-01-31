"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  RefreshCw,
  ChevronRight,
  Calendar,
  Gauge,
  Fuel,
  Zap,
  MapPin,
  ShieldCheck,
  BadgeCheck,
  CarFront,
  Scale,
  X,
  Plus,
} from "lucide-react";
import SearchAndFilter from "@/app/(components)/helpers/SearchAndFilter";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Maps
const fuelMap = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  petrol: "Benzin",
  diesel: "Diesel",
};

const doors = {
  TWO: "2 Türen",
  THREE: "3 Türen",
  FOUR: "4 Türen",
  FIVE: "5 Türen",
  FOUR_OR_FIVE: "4/5 Türen",
  "four or five": "4/5 Türen",
  TWO_OR_THREE: "2/3 Türen",
};

const gearbox = {
  MANUAL_GEAR: "Schaltgetriebe",
  AUTOMATIC_GEAR: "Automatik",
  SEMI_AUTOMATIC_GEAR: "Halbautomatik",
  NO_GEARS: "Ohne Getriebe",
};

export default function UsedCarsPage() {
  const router = useRouter();
  const { data: session } = useSession();

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

  // ONE base button style – same height for ALL buttons
  const baseBtn =
    "inline-flex h-9 items-center justify-center px-3 text-[11px] sm:text-xs font-medium rounded-md cursor-pointer transition-colors";

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

  const goToKaufvertrag = (carId) => {
    router.push(`/kaufvertrag/auswahl?carId=${encodeURIComponent(carId)}`);
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
          10000,
      ) * 10000 || 100000
    );
  }, [cars]);

  const toggleComparisonMode = () => {
    setComparisonMode((prev) => {
      if (prev) {
        setSelectedForComparison([]);
      }
      return !prev;
    });
  };

  const toggleCarForComparison = (carId) => {
    setSelectedForComparison((prev) =>
      prev.includes(carId)
        ? prev.filter((id) => id !== carId)
        : prev.length < 3
          ? [...prev, carId]
          : prev,
    );
  };

  const selectedCars = useMemo(
    () => cars.filter((car) => selectedForComparison.includes(car._id)),
    [cars, selectedForComparison],
  );

  const handleCompareNavigate = () => {
    if (selectedForComparison.length >= 2) {
      localStorage.setItem(
        "carComparison",
        JSON.stringify(selectedForComparison),
      );
      const query = selectedForComparison.map((id) => `id=${id}`).join("&");
      router.push(`/vergleich?${query}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 pt-8">
      {/* FIXED COMPARISON BAR */}
      {comparisonMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div
                className={`${baseBtn} border border-slate-700 bg-slate-900 text-slate-100`}
              >
                <Scale className="mr-1 h-4 w-4 text-sky-400" />
                <span className="font-semibold">
                  Vergleichsmodus{" "}
                  <span className="text-sky-300">
                    ({selectedForComparison.length}/3)
                  </span>
                </span>
              </div>

              {selectedCars.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCars.slice(0, 3).map((car) => (
                    <div
                      key={car._id}
                      className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-100"
                    >
                      <button
                        onClick={() => toggleCarForComparison(car._id)}
                        className="cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <span className="line-clamp-1 font-medium">
                        {car.make} {car.model}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={toggleComparisonMode}
                className={`${baseBtn} border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCompareNavigate}
                disabled={selectedForComparison.length < 2}
                className={`${baseBtn} ${
                  selectedForComparison.length >= 2
                    ? "bg-sky-600 text-white hover:bg-sky-500"
                    : "cursor-not-allowed bg-slate-800 text-slate-400"
                }`}
              >
                Fahrzeuge vergleichen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="mx-auto w-full max-w-[1500px] px-4  sm:px-6 lg:px-8">
        {/* PAGE HEADER: title left, buttons right on same line */}
        <header className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h1 className="text-base font-semibold text-white sm:text-3xl lg:text-4xl">
                  Unsere Fahrzeuge
                </h1>
              </div>
            </div>

            {/* Right: header actions (ALWAYS same line together ab sm) */}
            <div className="flex flex-wrap items-center justify-start gap-2 text-[11px] sm:justify-end sm:text-xs">
              <button
                onClick={syncCars}
                disabled={syncing}
                className={`${baseBtn} border border-slate-700 bg-slate-900/80 text-slate-100 hover:border-sky-400 hover:bg-slate-900 disabled:opacity-60`}
              >
                {syncing ? (
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Bestand aktualisieren</span>
                <span className="sm:hidden">Aktualisieren</span>
              </button>

              <button
                onClick={toggleComparisonMode}
                className={`${baseBtn} border ${
                  comparisonMode
                    ? "border-sky-500 bg-sky-950/60 text-sky-100"
                    : "border-slate-700 bg-slate-900/80 text-slate-100 hover:border-sky-400"
                }`}
              >
                <Scale className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">
                  {comparisonMode ? "Vergleich aktiv" : "Fahrzeuge vergleichen"}
                </span>
                <span className="sm:hidden">Vergleich</span>
              </button>
            </div>
          </div>
        </header>

        {/* SEARCH + FILTER: neatly aligned below header in a card */}
        <section className="mb-5  bg-slate-950/80 pt-1 pb-2 shadow-sm shadow-black/30 sm:mb-6 ">
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
        </section>

        {/* RESULT HEADER */}
        <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                Fahrzeuge werden geladen...
              </span>
            ) : (
              <>
                <span className="text-white">
                  {filteredCars.length}{" "}
                  {filteredCars.length === 1 ? "Fahrzeug" : "Fahrzeuge"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* GRID VIEW */}
        <section
          aria-label="Fahrzeugliste"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4"
        >
          {filteredCars.map((car) => {
            const isSelected = selectedForComparison.includes(car._id);

            return (
              <article
                key={car._id}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-slate-950/95 p-[1px] shadow-sm shadow-black/40 backdrop-blur-sm transition-all duration-300 ${
                  comparisonMode && isSelected
                    ? "border-sky-500 ring-1 ring-sky-500/70"
                    : "border-slate-800 hover:-translate-y-1 hover:border-sky-400/70 hover:shadow-lg"
                }`}
              >
                <div className="flex h-full flex-col rounded-2xl bg-slate-950">
                  {/* IMAGE / BADGES */}
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-slate-900">
                    {/* VERKAUFT ribbon */}
                    {car.sold && (
                      <div className="absolute top-0 right-0 z-30 animate-fade-in">
                        <div className="relative">
                          <div className="absolute top-6 right-[-44px] transform rotate-45 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white text-[13px] font-extrabold px-12 py-1 shadow-xl ring-1 ring-white drop-shadow-sm backdrop-blur-md tracking-widest rounded-sm">
                            VERKAUFT
                          </div>
                        </div>
                      </div>
                    )}

                    {/* certified badge */}
                    {car.certified && (
                      <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-emerald-900/80 px-2.5 py-1 text-[11px] font-medium text-emerald-100 shadow-sm">
                        <BadgeCheck className="h-3 w-3" />
                        Zertifiziert
                      </div>
                    )}

                    {car.images?.[0]?.ref ? (
                      <img
                        src={car.images[0].ref}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full p-4 object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <CarFront className="h-10 w-10" />
                      </div>
                    )}

                    {/* comparison toggle in comparisonMode */}
                    {comparisonMode && (
                      <button
                        onClick={() => toggleCarForComparison(car._id)}
                        className={`${baseBtn} absolute bottom-3 right-3 border text-[11px] ${
                          isSelected
                            ? "border-sky-500 bg-sky-600 text-white"
                            : "border-slate-300 bg-slate-100 text-slate-900 hover:bg-white"
                        }`}
                        aria-label={
                          isSelected
                            ? "Aus Vergleich entfernen"
                            : "Zum Vergleich hinzufügen"
                        }
                      >
                        {isSelected ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    {/* title + price row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-semibold text-white">
                          {car.make} {car.model}
                        </h3>
                        {car.modelDescription && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-slate-400">
                            {car.modelDescription}
                          </p>
                        )}
                      </div>

                      {car.price?.consumerPriceGross && (
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Preis
                          </p>
                          <p className="whitespace-nowrap text-sm font-semibold text-slate-50">
                            {parseFloat(
                              car.price.consumerPriceGross,
                            ).toLocaleString("de-DE", {
                              style: "currency",
                              currency: car.price.currency || "EUR",
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* SPECS */}
                    <dl className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <dt className="text-[11px] text-slate-500">
                            Erstzulassung
                          </dt>
                          <dd className="font-medium">
                            {car.firstRegistration
                              ? car.firstRegistration.slice(0, 4)
                              : "-"}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-slate-400" />
                        <div>
                          <dt className="text-[11px] text-slate-500">
                            Kilometer
                          </dt>
                          <dd className="font-medium">
                            {car.mileage
                              ? `${car.mileage.toLocaleString()} km`
                              : "-"}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-slate-400" />
                        <div>
                          <dt className="text-[11px] text-slate-500">
                            Kraftstoff
                          </dt>
                          <dd className="font-medium">
                            {fuelMap[car.fuel] || car.fuel || "-"}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-slate-400" />
                        <div>
                          <dt className="text-[11px] text-slate-500">
                            Leistung
                          </dt>
                          <dd className="font-medium">
                            {car.power ? `${car.power} kW` : "-"}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    {/* location + warranty chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                      {car.location && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5">
                          <MapPin className="h-3 w-3" />
                          {car.location}
                        </span>
                      )}
                      {car.warranty && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-emerald-300">
                          <ShieldCheck className="h-3 w-3" />
                          Garantie
                        </span>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-auto space-y-2 pt-1">
                      {/* Row 1: Details + Compare */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/gebrauchtwagen/${car._id}`}
                          className={`${baseBtn} flex-1 bg-sky-600 text-white hover:bg-sky-500`}
                        >
                          Details anzeigen
                          <ChevronRight className="h-4 w-4" />
                        </Link>

                        {!comparisonMode && (
                          <button
                            onClick={() => {
                              setComparisonMode(true);
                              toggleCarForComparison(car._id);
                            }}
                            className={`${baseBtn} flex-1 border border-slate-600 bg-slate-950 text-slate-200 hover:border-sky-400 hover:text-sky-100`}
                            title="Zum Vergleich hinzufügen"
                          >
                            <Scale className="mr-1 h-4 w-4" />
                            Vergleichen
                          </button>
                        )}
                      </div>

                      {/* Row 2: Admin actions */}
                      {session?.user && (
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                          <button
                            onClick={async () => {
                              const res = await fetch(
                                `/api/cars/${car._id}/sold`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ sold: !car.sold }),
                                },
                              );

                              if (res.ok) {
                                const updated = await res.json();
                                setCars((prev) =>
                                  prev.map((c) =>
                                    c._id === updated._id ? updated : c,
                                  ),
                                );
                              }
                            }}
                            className={`${baseBtn} flex-1 ${
                              car.sold
                                ? "bg-emerald-700 text-emerald-50 hover:bg-emerald-600"
                                : "bg-amber-500 text-amber-950 hover:bg-amber-400"
                            }`}
                          >
                            {car.sold
                              ? "Als verfügbar markieren"
                              : "Als verkauft markieren"}
                          </button>

                          <button
                            onClick={() => goToKaufvertrag(car._id)}
                            className={`${baseBtn} flex-1 border border-sky-500 bg-slate-950 text-sky-100 hover:bg-sky-950/60`}
                          >
                            📄 Vertrag
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* EMPTY STATE */}
        {!loading && filteredCars.length === 0 && (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/90 px-6 py-12 text-center shadow-sm shadow-black/40 backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900">
              <CarFront className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-white">
              Keine passenden Fahrzeuge gefunden
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-slate-300">
              Passen Sie Ihre Suchbegriffe oder Filter an – eventuell ist Ihr
              Wunschfahrzeug bereits im Bestand, wird aber aktuell ausgefiltert.
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
              className={`${baseBtn} bg-slate-50 text-slate-900 hover:bg-white`}
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
