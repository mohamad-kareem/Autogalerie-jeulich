"use client";

/**
 * Gebrauchtwagen — the public stock (synced daily from mobile.de).
 *
 * Search, filters and sorting run in the browser on the list the server
 * already sent, so they react instantly. Up to three cars can be compared.
 * Signed-in employees also see: Aktualisieren (mobile.de sync), Verkauft /
 * Verfügbar and Kaufvertrag per car.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  Calendar,
  CarFront,
  Check,
  FileText,
  Fuel,
  Gauge,
  Plus,
  RefreshCw,
  Scale,
  Search,
  SlidersHorizontal,
  Tag,
  X,
  Zap,
} from "lucide-react";

import { euro, imagesOf, km, label, powerPs, priceOf, registration, registrationYear, sizedImage, subtitleOf, titleOf } from "@/lib/cars/format";

const WRAPPER = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";
const MAX_COMPARE = 3;

const SORTS = [
  { id: "new", label: "Neueste zuerst" },
  { id: "price-asc", label: "Preis aufsteigend" },
  { id: "price-desc", label: "Preis absteigend" },
  { id: "km-asc", label: "Kilometer aufsteigend" },
  { id: "year-desc", label: "Erstzulassung neueste" },
];

const PRICE_STEPS = [5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000];
const KM_STEPS = [25000, 50000, 75000, 100000, 125000, 150000, 200000];

const EMPTY_FILTERS = { make: "", fuel: "", gearbox: "", maxPrice: "", maxKm: "", minYear: "" };

/* ------------------------------------------------------------ small parts */

function FilterSelect({ value, onChange, label: text, children }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{text}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 w-full cursor-pointer appearance-none truncate rounded-lg border bg-white pl-3 pr-8 text-[13px] outline-none transition focus:border-[#146c2e] focus:ring-2 focus:ring-[#146c2e]/15 ${
          value ? "border-[#146c2e]/50 font-medium text-[#0f3d1c]" : "border-slate-200 text-slate-700"
        }`}
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
      </svg>
    </label>
  );
}

/** A photo that falls back to the original link if the sized copy fails. */
function CarPhoto({ url, alt, size = 640, className = "" }) {
  const [src, setSrc] = useState(sizedImage(url, size));
  useEffect(() => setSrc(sizedImage(url, size)), [url, size]);
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}>
        <CarFront className="size-10" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => src !== url && setSrc(url)}
      className={`object-cover ${className}`}
    />
  );
}

/** A red corner ribbon on sold cars. */
function SoldRibbon() {
  return (
    <div className="pointer-events-none absolute left-0 top-0 size-28 overflow-hidden" aria-label="Verkauft">
      <span className="absolute left-[-42px] top-[22px] block w-[170px] -rotate-45 bg-red-600 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        Verkauft
      </span>
    </div>
  );
}

function Fact({ icon: Icon, children }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-slate-600">
      <Icon className="size-3.5 shrink-0 text-slate-400" strokeWidth={2} />
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ------------------------------------------------------------ card */

function CarCard({ car, staff, comparing, onCompare, onToggleSold, onContract }) {
  const title = titleOf(car);
  const subtitle = subtitleOf(car);
  const price = priceOf(car);
  const ps = powerPs(car);
  const href = `/gebrauchtwagen/${car._id}`;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(15,23,42,0.25)] ${
        comparing ? "border-[#146c2e] ring-2 ring-[#146c2e]/20" : "border-slate-200"
      }`}
    >
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <CarPhoto
          url={imagesOf(car)[0]}
          alt={`${title} ${subtitle}`.trim()}
          className="size-full transition duration-500 group-hover:scale-[1.03]"
        />
        {car.sold ? <SoldRibbon /> : null}
      </Link>


      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="min-w-0">
          <h2 className="truncate text-[15.5px] font-semibold tracking-[-0.01em] text-slate-900 group-hover:text-[#146c2e]">{title}</h2>
          <p className="mt-0.5 h-[18px] truncate text-[12.5px] text-slate-500">{subtitle}</p>
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Fact icon={Calendar}>{registration(car.firstRegistration) ? `EZ ${registration(car.firstRegistration)}` : "EZ –"}</Fact>
          <Fact icon={Gauge}>{km(car.mileage) || "– km"}</Fact>
          <Fact icon={Fuel}>{label("fuel", car.fuel) || "–"}</Fact>
          <Fact icon={Zap}>{ps ? `${ps} PS` : "–"}</Fact>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[19px] font-bold leading-none tracking-[-0.02em] text-slate-900">{euro(price)}</p>
            <p className="mt-1 text-[11px] text-slate-500">{label("gearbox", car.gearbox) || " "}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onCompare(car._id)}
              title={comparing ? "Aus dem Vergleich entfernen" : "Vergleichen"}
              aria-label={comparing ? "Aus dem Vergleich entfernen" : "Zum Vergleich hinzufügen"}
              aria-pressed={comparing}
              className={`inline-flex size-8 items-center justify-center rounded-lg border transition ${
                comparing ? "border-[#146c2e] bg-[#146c2e] text-white" : "border-slate-200 text-slate-500 hover:border-[#146c2e]/40 hover:text-[#146c2e]"
              }`}
            >
              {comparing ? <Check className="size-4" /> : <Scale className="size-4" />}
            </button>
            <Link href={href} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-[#146c2e] hover:bg-[#146c2e]/5">
              Details <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {staff ? (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => onToggleSold(car)}
              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition ${
                car.sold ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <Tag className="size-3.5" /> {car.sold ? "Wieder verfügbar" : "Als verkauft"}
            </button>
            <button
              type="button"
              onClick={() => onContract(car)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FileText className="size-3.5" /> Kaufvertrag
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ page */

export default function GebrauchtwagenClient({ initialCars = [], failed = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const staff = Boolean(session?.user);

  const [cars, setCars] = useState(initialCars);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("new");
  const [showFilters, setShowFilters] = useState(false);
  const [compare, setCompare] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Links from the start page (?q=…&make=…&maxPrice=…) preset the filters.
  const searchKey = searchParams.toString();
  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    setQuery(params.get("q") || params.get("model") || "");
    setFilters({
      ...EMPTY_FILTERS,
      make: params.get("make") || "",
      maxPrice: params.get("maxPrice") || "",
      maxKm: params.get("maxMileage") || "",
      minYear: params.get("minYear") || "",
    });
  }, [searchKey]);

  useEffect(() => setCars(initialCars), [initialCars]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  /* ---------------------------------------------------------- options */

  const options = useMemo(() => {
    const makes = new Map();
    const fuels = new Set();
    const gearboxes = new Set();
    const years = new Set();
    for (const car of cars) {
      if (car.make) makes.set(car.make, (makes.get(car.make) || 0) + 1);
      if (car.fuel) fuels.add(car.fuel);
      if (car.gearbox) gearboxes.add(car.gearbox);
      const year = registrationYear(car.firstRegistration);
      if (year) years.add(year);
    }
    return {
      makes: [...makes.entries()].sort((a, b) => a[0].localeCompare(b[0], "de")),
      fuels: [...fuels].sort((a, b) => (label("fuel", a) || "").localeCompare(label("fuel", b) || "", "de")),
      gearboxes: [...gearboxes],
      years: [...years].sort((a, b) => b - a),
    };
  }, [cars]);

  /* ---------------------------------------------------------- results */

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = cars.filter((car) => {
      const price = priceOf(car);
      if (term && !`${car.make} ${car.model} ${car.modelDescription || ""}`.toLowerCase().includes(term)) return false;
      if (filters.make && car.make !== filters.make) return false;
      if (filters.fuel && car.fuel !== filters.fuel) return false;
      if (filters.gearbox && car.gearbox !== filters.gearbox) return false;
      if (filters.maxPrice && (!price || price > Number(filters.maxPrice))) return false;
      if (filters.maxKm && Number(car.mileage) > Number(filters.maxKm)) return false;
      if (filters.minYear && (registrationYear(car.firstRegistration) || 0) < Number(filters.minYear)) return false;
      return true;
    });

    const newest = (car) => new Date(car.mobileCreatedAt || car.createdAt || 0).getTime();
    const by = {
      new: (a, b) => newest(b) - newest(a),
      "price-asc": (a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity),
      "price-desc": (a, b) => (priceOf(b) ?? -1) - (priceOf(a) ?? -1),
      "km-asc": (a, b) => (Number(a.mileage) || Infinity) - (Number(b.mileage) || Infinity),
      "year-desc": (a, b) => String(b.firstRegistration || "").localeCompare(String(a.firstRegistration || "")),
    }[sort];
    return list.sort(by);
  }, [cars, query, filters, sort]);

  const available = cars.filter((car) => !car.sold).length;
  const activeFilters = Object.values(filters).filter(Boolean).length + (query.trim() ? 1 : 0);
  const reset = () => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  };

  /* ---------------------------------------------------------- actions */

  const toggleCompare = (id) =>
    setCompare((list) => {
      if (list.includes(id)) return list.filter((entry) => entry !== id);
      if (list.length >= MAX_COMPARE) {
        toast.error(`Maximal ${MAX_COMPARE} Fahrzeuge vergleichen.`);
        return list;
      }
      return [...list, id];
    });

  const openComparison = () => {
    if (compare.length < 2) return;
    try {
      localStorage.setItem("carComparison", JSON.stringify(compare));
    } catch {
      /* private mode */
    }
    router.push(`/vergleich?${compare.map((id) => `id=${id}`).join("&")}`);
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Abgleich fehlgeschlagen.");
      const fresh = await fetch("/api/cars", { cache: "no-store" }).then((r) => r.json());
      if (Array.isArray(fresh)) setCars(fresh);
      if (data.warning) toast.error(data.warning, { duration: 8000 });
      toast.success(data.skipped ? "mobile.de hat keine Anzeigen geliefert – nichts geändert." : `Aktualisiert: ${data.saved} Fahrzeuge, ${data.removed} entfernt, HU bei ${data.withInspection}.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSold = async (car) => {
    try {
      const res = await fetch(`/api/cars/${car._id}/sold`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold: !car.sold }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      setCars((list) => list.map((entry) => (entry._id === car._id ? { ...entry, sold: data.sold } : entry)));
      toast.success(data.sold ? "Als verkauft markiert" : "Wieder verfügbar");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openContract = (car) => router.push(`/kaufvertrag/auswahl?carId=${encodeURIComponent(car._id)}`);

  const compareCars = compare.map((id) => cars.find((car) => car._id === id)).filter(Boolean);

  /* ---------------------------------------------------------- render */

  return (
    <main className={`min-h-screen bg-[#f6f7f5] pb-16 pt-6 text-slate-900 sm:pt-8 ${compare.length ? "pb-32" : ""}`}>
      <div className={WRAPPER}>
        {/* header */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[30px]">Gebrauchtwagen</h1>
            <p className="mt-0.5 text-[13.5px] text-slate-500">
              {available} {available === 1 ? "Fahrzeug" : "Fahrzeuge"} sofort verfügbar · Finanzierung & Inzahlungnahme möglich
            </p>
          </div>
          {staff ? (
            <button
              type="button"
              onClick={sync}
              disabled={syncing}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:border-[#146c2e]/40 hover:text-[#146c2e] disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Wird abgeglichen …" : "mobile.de abgleichen"}
            </button>
          ) : null}
        </header>

        {/* search & filters */}
        <section aria-label="Suche und Filter" className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex gap-2">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 transition focus-within:border-[#146c2e] focus-within:ring-2 focus-within:ring-[#146c2e]/15">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Marke, Modell oder Ausstattung suchen …"
                aria-label="Fahrzeug suchen"
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Suche leeren" className="rounded p-0.5 text-slate-400 hover:text-slate-700">
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              aria-expanded={showFilters}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition lg:hidden ${
                showFilters || activeFilters ? "border-[#146c2e]/40 bg-[#146c2e]/5 text-[#146c2e]" : "border-slate-200 text-slate-700"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              Filter{activeFilters ? ` (${activeFilters})` : ""}
            </button>
            <div className="hidden w-52 shrink-0 lg:block">
              <FilterSelect value={sort} onChange={setSort} label="Sortierung">
                {SORTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>

          <div className={`${showFilters ? "grid" : "hidden"} mt-2 grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-3 lg:grid lg:grid-cols-6`}>
            <FilterSelect value={filters.make} onChange={(v) => setFilter("make", v)} label="Marke">
              <option value="">Alle Marken</option>
              {options.makes.map(([make, count]) => (
                <option key={make} value={make}>
                  {make} ({count})
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filters.fuel} onChange={(v) => setFilter("fuel", v)} label="Kraftstoff">
              <option value="">Kraftstoff</option>
              {options.fuels.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {label("fuel", fuel)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filters.gearbox} onChange={(v) => setFilter("gearbox", v)} label="Getriebe">
              <option value="">Getriebe</option>
              {options.gearboxes.map((gear) => (
                <option key={gear} value={gear}>
                  {label("gearbox", gear)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filters.maxPrice} onChange={(v) => setFilter("maxPrice", v)} label="Preis bis">
              <option value="">Preis bis</option>
              {PRICE_STEPS.map((step) => (
                <option key={step} value={step}>
                  bis {euro(step)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filters.maxKm} onChange={(v) => setFilter("maxKm", v)} label="Kilometer bis">
              <option value="">Kilometer bis</option>
              {KM_STEPS.map((step) => (
                <option key={step} value={step}>
                  bis {km(step)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filters.minYear} onChange={(v) => setFilter("minYear", v)} label="Erstzulassung ab">
              <option value="">Erstzulassung ab</option>
              {options.years.map((year) => (
                <option key={year} value={year}>
                  ab {year}
                </option>
              ))}
            </FilterSelect>
            <div className="col-span-2 sm:col-span-3 lg:hidden">
              <FilterSelect value={sort} onChange={setSort} label="Sortierung">
                {SORTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    Sortierung: {entry.label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>
        </section>

        {/* result line */}
        <div className="mb-3 flex items-center justify-between gap-3 text-[13px] text-slate-500">
          <p>
            <span className="font-semibold text-slate-900">{results.length}</span> {results.length === 1 ? "Ergebnis" : "Ergebnisse"}
          </p>
          {activeFilters ? (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 font-medium text-[#146c2e] hover:underline">
              <X className="size-3.5" /> Filter zurücksetzen
            </button>
          ) : null}
        </div>

        {/* list */}
        {failed ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-[15px] font-semibold">Fahrzeuge konnten nicht geladen werden</p>
            <p className="mt-1 text-[13px] text-slate-500">Bitte laden Sie die Seite in einem Moment neu.</p>
          </div>
        ) : results.length ? (
          <section aria-label="Fahrzeuge" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((car) => (
              <CarCard
                key={car._id}
                car={car}
                staff={staff}
                comparing={compare.includes(car._id)}
                onCompare={toggleCompare}
                onToggleSold={toggleSold}
                onContract={openContract}
              />
            ))}
          </section>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
            <CarFront className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 text-[15px] font-semibold">Keine passenden Fahrzeuge</p>
            <p className="mt-1 text-[13px] text-slate-500">Passen Sie die Suche oder die Filter an.</p>
            {activeFilters ? (
              <button type="button" onClick={reset} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#146c2e] px-4 text-[13px] font-semibold text-white hover:bg-[#0f5724]">
                Filter zurücksetzen
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* comparison bar */}
      {compare.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className={`${WRAPPER} flex flex-col gap-2 py-3 sm:flex-row sm:items-center`}>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#146c2e]/10 px-2.5 text-[12px] font-semibold text-[#146c2e]">
                <Scale className="size-3.5" /> {compare.length}/{MAX_COMPARE}
              </span>
              {compareCars.map((car) => (
                <span key={car._id} className="inline-flex h-8 max-w-[220px] items-center gap-1.5 rounded-md border border-slate-200 bg-white pl-2.5 pr-1 text-[12px]">
                  <span className="truncate font-medium">{titleOf(car)}</span>
                  <button type="button" onClick={() => toggleCompare(car._id)} aria-label="Entfernen" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {compare.length < 2 ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                  <Plus className="size-3.5" /> noch ein Fahrzeug wählen
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCompare([])} className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 sm:flex-none">
                Leeren
              </button>
              <button
                type="button"
                onClick={openComparison}
                disabled={compare.length < 2}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#146c2e] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0f5724] disabled:opacity-50 sm:flex-none"
              >
                <Scale className="size-4" /> Vergleichen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
