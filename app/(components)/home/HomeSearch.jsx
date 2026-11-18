"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const PRICES = [5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000];
const MILEAGES = [25000, 50000, 75000, 100000, 125000, 150000];
const fmt = (n) => n.toLocaleString("de-DE");

/** Quick search on the home page – one bar; opens /gebrauchtwagen with the same filters. */
export default function HomeSearch({ cars }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [minYear, setMinYear] = useState("");

  const makes = useMemo(() => [...new Set(cars.map((c) => c.make).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de")), [cars]);
  const years = useMemo(() => [...new Set(cars.map((c) => c.year).filter(Boolean))].sort((a, b) => b - a), [cars]);
  const count = useMemo(
    () =>
      cars.filter(
        (c) =>
          (!make || c.make === make) &&
          (!maxPrice || (c.price && c.price <= Number(maxPrice))) &&
          (!maxMileage || (Number.isFinite(c.km) && c.km <= Number(maxMileage))) &&
          (!minYear || (c.year && c.year >= Number(minYear))),
      ).length,
    [cars, make, maxPrice, maxMileage, minYear],
  );

  function submit(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (maxMileage) params.set("maxMileage", maxMileage);
    if (minYear) params.set("minYear", minYear);
    const query = params.toString();
    router.push(`/gebrauchtwagen${query ? `?${query}` : ""}`);
  }

  const cell = "relative min-w-0 border-[#e1e4e8] px-4 py-2.5 max-lg:border-b lg:border-r";
  const label = "block text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#8a929c]";
  const select = "mt-0.5 w-full cursor-pointer appearance-none bg-transparent pr-5 text-[15px] font-semibold text-[#14171b] outline-none";
  const chevron = (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-[#8a929c]" fill="currentColor">
      <path d="M5.2 7.5a.75.75 0 0 1 1.06 0L10 11.2l3.74-3.7a.75.75 0 1 1 1.06 1.06l-4.27 4.25a.75.75 0 0 1-1.06 0L5.2 8.56a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );

  return (
    <form
      onSubmit={submit}
      className="grid overflow-hidden rounded-xl border-2 border-[#14171b] bg-white shadow-[6px_6px_0_#14171b] sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
    >
      <label className={`${cell} sm:col-span-2 lg:col-span-1`}>
        <span className={label}>Marke</span>
        <select className={select} value={make} onChange={(e) => setMake(e.target.value)}>
          <option value="">Alle Marken</option>
          {makes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        {chevron}
      </label>
      <label className={cell}>
        <span className={label}>Preis bis</span>
        <select className={select} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Beliebig</option>
          {PRICES.map((p) => <option key={p} value={p}>{fmt(p)} €</option>)}
        </select>
        {chevron}
      </label>
      <label className={cell}>
        <span className={label}>Kilometer bis</span>
        <select className={select} value={maxMileage} onChange={(e) => setMaxMileage(e.target.value)}>
          <option value="">Beliebig</option>
          {MILEAGES.map((k) => <option key={k} value={k}>{fmt(k)} km</option>)}
        </select>
        {chevron}
      </label>
      <label className={`${cell} sm:col-span-2 lg:col-span-1`}>
        <span className={label}>Erstzulassung ab</span>
        <select className={select} value={minYear} onChange={(e) => setMinYear(e.target.value)}>
          <option value="">Beliebig</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {chevron}
      </label>
      <button
        type="submit"
        className="flex min-h-[64px] items-center justify-center gap-2 bg-[#FFD000] px-6 text-[15px] font-extrabold text-[#111] transition hover:bg-[#F2C200] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#111] sm:col-span-2 lg:col-span-1"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
        <span className="whitespace-nowrap">{count === 1 ? "1 Treffer" : `${count} Treffer`}</span>
      </button>
    </form>
  );
}
