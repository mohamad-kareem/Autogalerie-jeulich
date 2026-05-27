"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  ChevronRight,
  Calendar,
  Gauge,
  Fuel,
  Zap,
  MapPin,
  BadgeCheck,
  CarFront,
  Scale,
  X,
  Plus,
  Tag,
  FileText,
} from "lucide-react";

import SearchAndFilter from "@/app/(components)/helpers/SearchAndFilter";

const fuelMap = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  petrol: "Benzin",
  diesel: "Diesel",
};

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

const btnBase =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export default function UsedCarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    fuelType: "",
    minPrice: 0,
    maxPrice: 100000,
    minYear: 1990,
    maxYear: new Date().getFullYear(),
    maxMileage: "",
    transmission: "",
  });

  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  const fetchCars = async () => {
    setLoading(true);

    try {
      const query = searchParams.toString();
      const res = await fetch(`/api/cars${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });

      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";
    const minYear = searchParams.get("minYear");
    const maxMileage = searchParams.get("maxMileage");
    const maxPrice = searchParams.get("maxPrice");

    setSearchTerm(q);

    setFilters((prev) => ({
      ...prev,
      make,
      model,
      minYear: minYear ? Number(minYear) : 1990,
      maxMileage: maxMileage || "",
      maxPrice: maxPrice ? Number(maxPrice) : 100000,
    }));

    fetchCars();
  }, [searchParams]);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const title = `${car.make || ""} ${car.model || ""} ${
        car.modelDescription || ""
      }`.toLowerCase();

      const price = Number(car.price?.consumerPriceGross || 0);
      const year = car.firstRegistration
        ? Number(String(car.firstRegistration).slice(0, 4))
        : 0;

      return (
        (!searchTerm || title.includes(searchTerm.toLowerCase())) &&
        (!filters.make || car.make === filters.make) &&
        (!filters.model || car.model === filters.model) &&
        (!filters.fuelType || car.fuel === filters.fuelType) &&
        (!filters.maxMileage ||
          Number(car.mileage || 0) <= Number(filters.maxMileage)) &&
        price >= filters.minPrice &&
        price <= filters.maxPrice &&
        year >= filters.minYear &&
        year <= filters.maxYear &&
        (!filters.transmission || car.gearbox === filters.transmission)
      );
    });
  }, [cars, searchTerm, filters]);

  const selectedCars = useMemo(
    () => cars.filter((car) => selectedForComparison.includes(car._id)),
    [cars, selectedForComparison],
  );

  const toggleComparisonMode = () => {
    setComparisonMode((prev) => {
      if (prev) setSelectedForComparison([]);
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

  const handleCompareNavigate = () => {
    if (selectedForComparison.length < 2) return;

    localStorage.setItem(
      "carComparison",
      JSON.stringify(selectedForComparison),
    );

    const query = selectedForComparison.map((id) => `id=${id}`).join("&");
    router.push(`/vergleich?${query}`);
  };

  const goToKaufvertrag = (carId) => {
    router.push(`/kaufvertrag/auswahl?carId=${encodeURIComponent(carId)}`);
  };

  const toggleSold = async (car) => {
    const res = await fetch(`/api/cars/${car._id}/sold`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sold: !car.sold }),
    });

    if (!res.ok) return;

    const updated = await res.json();

    setCars((prev) =>
      prev.map((item) => (item._id === updated._id ? updated : item)),
    );
  };

  return (
    <main className="relative min-h-screen bg-[#f5f5f2] pb-14 pt-5 text-[#101510] sm:pb-16 sm:pt-8">
      {comparisonMode && (
        <ComparisonBar
          selectedCars={selectedCars}
          selectedForComparison={selectedForComparison}
          toggleCarForComparison={toggleCarForComparison}
          toggleComparisonMode={toggleComparisonMode}
          handleCompareNavigate={handleCompareNavigate}
        />
      )}

      <div className={WRAPPER}>
        <header className="mb-4 rounded-[20px] border border-white/80 bg-white px-4 py-4 shadow-lg shadow-black/5 sm:mb-6 sm:rounded-[24px] sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#146c2e] sm:text-[10px] sm:tracking-[0.22em]">
                Autogalerie Jülich
              </p>

              <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.04em] text-[#07111f] sm:mt-2 sm:text-3xl">
                Unsere Fahrzeuge
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                onClick={syncCars}
                disabled={syncing}
                className={`${btnBase} w-full border border-black/10 bg-[#fafaf8] text-[#101510] hover:border-[#146c2e]/40 hover:bg-[#f1f6f2] sm:w-auto`}
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                Aktualisieren
              </button>

              <button
                onClick={toggleComparisonMode}
                className={`${btnBase} w-full sm:w-auto ${
                  comparisonMode
                    ? "bg-[#146c2e] text-white hover:bg-[#0f5724]"
                    : "border border-[#146c2e]/20 bg-[#e6f1e9] text-[#146c2e] hover:bg-[#dceee0]"
                }`}
              >
                <Scale className="h-4 w-4" />
                Vergleich
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="w-full lg:w-[290px] lg:shrink-0">
            <SearchAndFilter
              cars={cars}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 rounded-[18px] border border-white/80 bg-white px-4 py-3 shadow-md shadow-black/5 sm:mb-5 sm:rounded-[20px] sm:px-5 sm:py-4">
              <p className="text-sm text-[#101510]">
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-[#5f695f]">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#146c2e]" />
                    Fahrzeuge werden geladen...
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-[#146c2e]">
                      {filteredCars.length}
                    </span>{" "}
                    {filteredCars.length === 1 ? "Fahrzeug" : "Fahrzeuge"}{" "}
                    gefunden
                  </>
                )}
              </p>
            </div>

            <section
              aria-label="Fahrzeugliste"
              className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-2"
            >
              {filteredCars.map((car) => (
                <CarCard
                  key={car._id}
                  car={car}
                  session={session}
                  comparisonMode={comparisonMode}
                  isSelected={selectedForComparison.includes(car._id)}
                  toggleCarForComparison={toggleCarForComparison}
                  setComparisonMode={setComparisonMode}
                  goToKaufvertrag={goToKaufvertrag}
                  toggleSold={toggleSold}
                />
              ))}
            </section>

            {!loading && filteredCars.length === 0 && (
              <EmptyState
                setFilters={setFilters}
                setSearchTerm={setSearchTerm}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function CarCard({
  car,
  session,
  comparisonMode,
  isSelected,
  toggleCarForComparison,
  setComparisonMode,
  goToKaufvertrag,
  toggleSold,
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[20px] border bg-white shadow-lg shadow-black/5 transition-all duration-300 sm:rounded-[24px] ${
        comparisonMode && isSelected
          ? "border-[#146c2e] ring-2 ring-[#146c2e]/20"
          : "border-white/80 hover:border-[#146c2e]/30 hover:shadow-xl sm:hover:-translate-y-1"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f5f1]">
        {car.sold && (
          <div className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-[#146c2e]/95 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur sm:left-4 sm:top-4 sm:text-[12px]">
            <Tag className="h-3.5 w-3.5" />
            Verkauft
          </div>
        )}

        {car.certified && !car.sold && (
          <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#146c2e] shadow-md backdrop-blur sm:left-4 sm:top-4 sm:text-[12px]">
            <BadgeCheck className="h-4 w-4" />
            Zertifiziert
          </div>
        )}

        {car.images?.[0]?.ref ? (
          <img
            src={car.images[0].ref}
            alt={`${car.make} ${car.model}`}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              car.sold ? "opacity-80 grayscale-[15%]" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8b958b]">
            <CarFront className="h-12 w-12" />
          </div>
        )}

        {comparisonMode && (
          <button
            onClick={() => toggleCarForComparison(car._id)}
            className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition sm:bottom-4 sm:right-4 ${
              isSelected
                ? "bg-[#146c2e] text-white"
                : "bg-white text-[#101510] hover:bg-[#e6f1e9]"
            }`}
          >
            {isSelected ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="flex min-h-[300px] flex-col p-4 sm:min-h-[330px] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-[18px] font-semibold tracking-[-0.03em] text-[#07111f] sm:text-[20px]">
              {car.make} {car.model}
            </h3>

            {car.modelDescription && (
              <p className="mt-1 line-clamp-1 text-[13px] leading-5 text-[#5f695f] sm:text-sm">
                {car.modelDescription}
              </p>
            )}
          </div>

          {car.price?.consumerPriceGross && (
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b958b] sm:text-[10px]">
                Preis
              </p>

              <p className="whitespace-nowrap text-base font-semibold text-[#146c2e] sm:text-lg">
                {parseFloat(car.price.consumerPriceGross).toLocaleString(
                  "de-DE",
                  {
                    style: "currency",
                    currency: car.price.currency || "EUR",
                    maximumFractionDigits: 0,
                  },
                )}
              </p>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <SpecItem
            icon={<Calendar />}
            label="Erstzulassung"
            value={
              car.firstRegistration ? car.firstRegistration.slice(0, 4) : "-"
            }
          />

          <SpecItem
            icon={<Gauge />}
            label="Kilometerstand"
            value={
              car.mileage
                ? `${Number(car.mileage).toLocaleString("de-DE")} km`
                : "-"
            }
          />

          <SpecItem
            icon={<Fuel />}
            label="Kraftstoff"
            value={fuelMap[car.fuel] || car.fuel || "-"}
          />

          <SpecItem
            icon={<Zap />}
            label="Leistung"
            value={car.power ? `${car.power} kW` : "-"}
          />
        </dl>

        {car.location && (
          <div className="mt-4">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f1f6f2] px-3 py-1.5 text-[12px] font-medium text-[#5f695f]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#146c2e]" />
              <span className="truncate">{car.location}</span>
            </span>
          </div>
        )}

        <div className="mt-auto space-y-2.5 pt-5">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/gebrauchtwagen/${car._id}`}
              className={`${btnBase} bg-[#146c2e] text-white shadow-md shadow-green-900/10 hover:bg-[#0f5724]`}
            >
              Details
              <ChevronRight className="h-4 w-4" />
            </Link>

            {!comparisonMode && (
              <button
                onClick={() => {
                  setComparisonMode(true);
                  toggleCarForComparison(car._id);
                }}
                className={`${btnBase} border border-black/10 bg-white text-[#101510] hover:border-[#146c2e]/40 hover:bg-[#f1f6f2]`}
              >
                <Scale className="h-4 w-4" />
                Vergleich
              </button>
            )}
          </div>

          {session?.user && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleSold(car)}
                className={`${btnBase} ${
                  car.sold
                    ? "bg-[#e6f1e9] text-[#146c2e] hover:bg-[#dceee0]"
                    : "bg-[#fff3d8] text-[#9a5b00] hover:bg-[#ffe8ad]"
                }`}
              >
                <Tag className="h-4 w-4" />
                {car.sold ? "Verfügbar" : "Verkauft"}
              </button>

              <button
                onClick={() => goToKaufvertrag(car._id)}
                className={`${btnBase} border border-[#146c2e]/25 bg-white text-[#146c2e] hover:bg-[#f1f6f2]`}
              >
                <FileText className="h-4 w-4" />
                Vertrag
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function SpecItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#fafaf8] p-2 shadow-sm shadow-black/[0.03] sm:gap-2.5 sm:rounded-2xl sm:p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#146c2e] shadow-sm sm:h-8 sm:w-8 sm:rounded-xl">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5 sm:[&>svg]:h-4 sm:[&>svg]:w-4">
          {icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <dt className="truncate text-[9px] font-medium text-[#7b857b] sm:text-[10px]">
          {label}
        </dt>

        <dd className="truncate text-[11px] font-semibold leading-5 text-[#101510] sm:text-[12px]">
          {value}
        </dd>
      </div>
    </div>
  );
}

function ComparisonBar({
  selectedCars,
  selectedForComparison,
  toggleCarForComparison,
  toggleComparisonMode,
  handleCompareNavigate,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 shadow-[0_-10px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div
        className={`${WRAPPER} flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#146c2e]/20 bg-[#e6f1e9] px-3 text-xs font-medium text-[#146c2e]">
            <Scale className="h-4 w-4" />
            Vergleich {selectedForComparison.length}/3
          </div>

          {selectedCars.slice(0, 3).map((car) => (
            <div
              key={car._id}
              className="inline-flex h-9 max-w-full items-center gap-2 rounded-xl border border-black/10 bg-[#fafaf8] px-3 text-xs text-[#101510]"
            >
              <button
                onClick={() => toggleCarForComparison(car._id)}
                className="shrink-0 text-gray-400 hover:text-[#101510]"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <span className="truncate font-medium">
                {car.make} {car.model}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button
            onClick={toggleComparisonMode}
            className={`${btnBase} border border-black/10 bg-white text-[#101510] hover:bg-[#f1f6f2]`}
          >
            Abbrechen
          </button>

          <button
            onClick={handleCompareNavigate}
            disabled={selectedForComparison.length < 2}
            className={`${btnBase} bg-[#146c2e] text-white hover:bg-[#0f5724]`}
          >
            Vergleichen
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ setFilters, setSearchTerm }) {
  return (
    <div className="mt-6 rounded-[20px] border border-white/70 bg-white px-5 py-10 text-center shadow-lg shadow-black/5 sm:mt-8 sm:rounded-[24px] sm:px-6 sm:py-12">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f1e9] sm:h-16 sm:w-16">
        <CarFront className="h-7 w-7 text-[#146c2e] sm:h-8 sm:w-8" />
      </div>

      <h3 className="text-lg font-semibold text-[#07111f] sm:text-xl">
        Keine passenden Fahrzeuge gefunden
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f695f]">
        Passen Sie Ihre Suchbegriffe oder Filter an.
      </p>

      <button
        onClick={() => {
          setFilters({
            make: "",
            model: "",
            fuelType: "",
            minPrice: 0,
            maxPrice: 100000,
            minYear: 1990,
            maxYear: new Date().getFullYear(),
            maxMileage: "",
            transmission: "",
          });

          setSearchTerm("");
        }}
        className={`${btnBase} mt-5 bg-[#146c2e] text-white hover:bg-[#0f5724]`}
      >
        Filter zurücksetzen
      </button>
    </div>
  );
}
