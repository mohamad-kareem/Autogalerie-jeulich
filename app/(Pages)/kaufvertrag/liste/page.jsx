"use client";

/**
 * Kaufverträge — every open (not archived) sales contract.
 *
 * Search, filter by month / status, sort by column, 25 per page.
 * A click on a contract opens it. Admins can select contracts and mark,
 * ignore or archive them (one by one via "⋯" or several at once).
 *
 * Uses the same building blocks as the Fahrzeugverwaltung, so both pages
 * look and behave the same.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  FiArchive,
  FiArrowDown,
  FiArrowUp,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEyeOff,
  FiMenu,
  FiPlus,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";

import { useSidebar } from "@/app/(components)/SidebarContext";
import PageLoader from "@/app/(components)/helpers/PageLoader";
import { theme } from "@/app/(Pages)/Fahrzeugverwaltung/_components/ui";

const PAGE_SIZE = 25;

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

const STATUS_TABS = [
  { id: "all", label: "Alle" },
  { id: "starred", label: "Markiert" },
  { id: "ignored", label: "Ignoriert" },
];

/* ------------------------------------------------------------ helpers */

const euro = (value) => {
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value ?? 0));
  } catch {
    return `${Number(value ?? 0).toFixed(2)} €`;
  }
};

const formatDate = (value) => {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatKm = (value) => (value || value === 0 ? `${Number(value).toLocaleString("de-DE")} km` : "");

/** 1 … 4 5 6 … 12 */
function pageItems(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p += 1) items.push(p);
  if (page < pages - 2) items.push("…");
  items.push(pages);
  return items;
}

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem("theme");
        setDark(saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches));
      } catch {
        setDark(document.documentElement.classList.contains("dark"));
      }
    };
    read();
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

/* ------------------------------------------------------------ small parts */

function Select({ icon: Icon, value, onChange, children, dark, label }) {
  const t = theme(dark);
  return (
    <label className={`relative flex h-8 items-center rounded-lg border ${t.input}`}>
      <Icon className={`pointer-events-none absolute left-2.5 size-3.5 ${t.faint}`} />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full cursor-pointer appearance-none rounded-lg bg-transparent pl-7 pr-7 text-[12.5px] outline-none"
      >
        {children}
      </select>
      <FiChevronDown className={`pointer-events-none absolute right-2 size-3.5 ${t.faint}`} />
    </label>
  );
}

function Checkbox({ checked, indeterminate, onChange, label }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(node) => {
        if (node) node.indeterminate = Boolean(indeterminate);
      }}
      onClick={(event) => event.stopPropagation()}
      onChange={onChange}
      className="size-4 cursor-pointer rounded accent-emerald-600"
    />
  );
}

function StatusBadges({ contract, dark }) {
  return (
    <>
      {contract.starred ? (
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${dark ? "bg-amber-400/10 text-amber-300 ring-amber-400/25" : "bg-amber-50 text-amber-800 ring-amber-600/20"}`}>
          <FiStar className="size-3" /> Markiert
        </span>
      ) : null}
      {contract.ignored ? (
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${dark ? "bg-red-400/10 text-red-300 ring-red-400/25" : "bg-red-50 text-red-700 ring-red-600/20"}`}>
          <FiEyeOff className="size-3" /> Ignoriert
        </span>
      ) : null}
    </>
  );
}

function SortHeader({ label, sortKey, sort, onSort, dark, align = "left", className = "" }) {
  const active = sort.key === sortKey;
  const Arrow = sort.direction === "asc" ? FiArrowUp : FiArrowDown;
  return (
    <th className={`px-3 py-2.5 font-medium ${className}`} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 rounded transition ${align === "right" ? "flex-row-reverse" : ""} ${
          active ? (dark ? "text-slate-100" : "text-slate-900") : dark ? "hover:text-slate-200" : "hover:text-slate-800"
        }`}
      >
        {label}
        {active ? <Arrow className="size-3" /> : <FiArrowDown className="size-3 opacity-0 transition group-hover:opacity-40" />}
      </button>
    </th>
  );
}

/* ------------------------------------------------------------ page */

export default function KaufvertragListe() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const dark = useDarkMode();
  const t = theme(dark);
  const isAdmin = session?.user?.role === "admin";

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [month, setMonth] = useState("all");
  const [sort, setSort] = useState({ key: "invoiceDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/kaufvertrag")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((data) => !cancelled && setContracts(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Verträge konnten nicht geladen werden"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // A new search, filter or page starts without a selection.
  const filterKey = `${query}|${tab}|${month}`;
  useEffect(() => setPage(1), [filterKey]);
  useEffect(() => setSelected([]), [filterKey, page]);

  /* ---------------------------------------------------------- data */

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const year = new Date().getFullYear();
    const list = contracts.filter((contract) => {
      if (tab === "starred" && !contract.starred) return false;
      if (tab === "ignored" && !contract.ignored) return false;
      if (month !== "all") {
        const date = contract.invoiceDate ? new Date(contract.invoiceDate) : null;
        if (!date || date.getFullYear() !== year || date.getMonth() + 1 !== Number(month)) return false;
      }
      if (term && !Object.values(contract).some((value) => value !== null && value !== undefined && String(value).toLowerCase().includes(term))) return false;
      return true;
    });

    const value = (contract) => {
      const raw = contract[sort.key];
      if (sort.key === "invoiceDate") return raw ? new Date(raw).getTime() : 0;
      if (sort.key === "total" || sort.key === "mileage") return Number(raw) || 0;
      return String(raw ?? "").toLowerCase();
    };
    return list.sort((a, b) => {
      const x = value(a);
      const y = value(b);
      if (x < y) return sort.direction === "asc" ? -1 : 1;
      if (x > y) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [contracts, query, tab, month, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSort = (key) =>
    setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));

  const filtersActive = query || month !== "all" || tab !== "all";
  const resetFilters = () => {
    setQuery("");
    setTab("all");
    setMonth("all");
  };

  /* ---------------------------------------------------------- actions */

  const updateContract = useCallback(async (id, updates) => {
    const res = await fetch(`/api/kaufvertrag/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Speichern fehlgeschlagen");
    // Archived contracts leave this list (they are in the Archiv).
    setContracts((list) =>
      data.archived ? list.filter((c) => c._id !== data._id) : list.map((c) => (c._id === data._id ? { ...c, ...data } : c)),
    );
    return data;
  }, []);

  const ACTIONS = {
    star: { updates: { toggleStar: true }, done: "Markierung geändert" },
    ignore: { updates: { toggleIgnore: true }, done: "Ignorieren geändert" },
    archive: { updates: { archived: true }, done: "archiviert", confirm: true },
  };

  const run = async (kind, ids) => {
    if (!ids.length || busy) return;
    const action = ACTIONS[kind];
    if (action.confirm && !window.confirm(ids.length === 1 ? "Diesen Vertrag archivieren?" : `${ids.length} Verträge archivieren?`)) return;
    setBusy(true);
    try {
      await Promise.all(ids.map((id) => updateContract(id, action.updates)));
      toast.success(kind === "archive" ? `${ids.length === 1 ? "Vertrag" : `${ids.length} Verträge`} ${action.done}` : action.done);
      setSelected([]);
    } catch (error) {
      toast.error(error.message || "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const open = (contract) => router.push(`/kaufvertrag/${contract._id}`);

  /* ---------------------------------------------------------- selection */

  const visibleIds = visible.map((c) => c._id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const someSelected = selected.length > 0;
  const toggleOne = (id) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const toggleAll = () => setSelected(allSelected ? [] : visibleIds);

  if (status === "loading") return <PageLoader />;

  const bulkButton = `inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition disabled:opacity-50 ${t.secondary}`;

  return (
    <main className={`min-h-screen ${t.page}`}>
      <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 sm:py-6">
        {/* header */}
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={openSidebar} aria-label="Menü öffnen" className={`rounded-lg p-2 md:hidden ${t.ghost}`}>
            <FiMenu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Kaufverträge</h1>
          </div>
          <Link
            href="/kaufvertrag/auswahl"
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold shadow-sm transition sm:px-4 ${t.primary}`}
          >
            <FiPlus className="size-4" />
            <span className="hidden sm:inline">Neuer Vertrag</span>
            <span className="sm:hidden">Neu</span>
          </Link>
        </header>

        <section className={`overflow-hidden rounded-xl border shadow-sm ${t.card}`}>
          {/* status tabs */}
          <nav aria-label="Status" className={`scrollbar-hide flex gap-1 overflow-x-auto border-b px-3 sm:px-4 ${t.divider}`}>
            {STATUS_TABS.map((entry) => {
              const active = tab === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTab(entry.id)}
                  aria-current={active ? "true" : undefined}
                  className={`relative flex h-11 shrink-0 items-center gap-2 px-2.5 text-[13px] font-medium transition ${
                    active ? t.title : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {entry.label}
                  {active ? <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-emerald-600" /> : null}
                </button>
              );
            })}
          </nav>

          {/* toolbar, or the bulk bar while contracts are selected */}
          {isAdmin && someSelected ? (
            <div className={`flex flex-wrap items-center gap-2 border-b px-3 py-2.5 sm:px-4 ${t.divider} ${dark ? "bg-emerald-500/5" : "bg-emerald-50/60"}`}>
              <span className={`mr-1 text-[13px] font-semibold ${t.title}`}>{selected.length} ausgewählt</span>
              <button type="button" disabled={busy} onClick={() => run("star", selected)} className={bulkButton}>
                <FiStar className="size-3.5" /> Markieren
              </button>
              <button type="button" disabled={busy} onClick={() => run("ignore", selected)} className={bulkButton}>
                <FiEyeOff className="size-3.5" /> Ignorieren
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run("archive", selected)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition disabled:opacity-50 ${
                  dark ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20" : "border-red-200 bg-white text-red-600 hover:bg-red-50"
                }`}
              >
                <FiArchive className="size-3.5" /> Archivieren
              </button>
              <button type="button" onClick={() => setSelected([])} className={`ml-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] ${t.ghost}`}>
                <FiX className="size-3.5" /> Auswahl aufheben
              </button>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 border-b px-3 py-2.5 sm:flex-row sm:items-center sm:px-4 ${t.divider}`}>
              <label className={`flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 sm:w-64 ${t.input}`}>
                <FiSearch className={`size-3.5 shrink-0 ${t.faint}`} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Suchen …"
                  aria-label="Verträge suchen"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")} aria-label="Suche leeren" className={`rounded p-0.5 ${t.ghost}`}>
                    <FiX className="size-3.5" />
                  </button>
                ) : null}
              </label>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 sm:w-40 sm:flex-none">
                  <Select icon={FiCalendar} value={month} onChange={setMonth} dark={dark} label="Monat">
                    <option value="all">Alle Monate</option>
                    {MONTHS.map((name, index) => (
                      <option key={name} value={String(index + 1)}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>
                {filtersActive ? (
                  <button type="button" onClick={resetFilters} title="Filter zurücksetzen" aria-label="Filter zurücksetzen" className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${t.ghost}`}>
                    <FiX className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* list */}
          {loading ? (
            <div className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-6 px-5 py-4">
                  <div className={`h-3.5 w-20 rounded ${t.skeleton}`} />
                  <div className="space-y-2">
                    <div className={`h-3.5 w-40 rounded ${t.skeleton}`} />
                    <div className={`h-3 w-24 rounded ${t.skeleton}`} />
                  </div>
                  <div className={`ml-auto h-3.5 w-24 rounded ${t.skeleton}`} />
                </div>
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="px-6 py-16 text-center">
              <p className={`text-[14px] font-medium ${t.title}`}>Keine Verträge gefunden</p>
              <p className={`mt-1 text-[13px] ${t.muted}`}>Suchbegriff oder Filter anpassen.</p>
              {filtersActive ? (
                <button type="button" onClick={resetFilters} className={`mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] ${t.secondary}`}>
                  <FiX className="size-4" /> Filter zurücksetzen
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* phone and tablet */}
              <ul className={`divide-y lg:hidden ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
                {visible.map((contract) => {
                  const isSelected = selected.includes(contract._id);
                  return (
                    <li
                      key={contract._id}
                      onClick={() => open(contract)}
                      className={`flex cursor-pointer gap-3 px-4 py-3 ${isSelected ? (dark ? "bg-emerald-500/5" : "bg-emerald-50/60") : ""}`}
                    >
                      {isAdmin ? (
                        <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
                          <Checkbox checked={isSelected} onChange={() => toggleOne(contract._id)} label="Vertrag auswählen" />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className={`truncate text-[14px] font-normal ${t.title}`}>{contract.buyerName || "–"}</p>
                          <p className={`shrink-0 text-[14px] font-normal tabular-nums ${t.title}`}>{euro(contract.total)}</p>
                        </div>
                        <p className={`truncate text-[13px] ${t.text}`}>{contract.carType || "–"}</p>
                        <p className={`text-[12px] tabular-nums ${t.muted}`}>{formatKm(contract.mileage) || "– km"}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`font-mono text-[12px] tracking-wide ${t.muted}`}>{contract.vin || "Keine FIN"}</span>
                          <StatusBadges contract={contract} dark={dark} />
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`min-w-0 flex-1 truncate text-[12px] tabular-nums ${t.muted}`}>
                            <span className={`font-mono text-[13px] font-bold ${t.title}`}>{contract.invoiceNumber || "–"}</span>
                            {" · "}
                            {formatDate(contract.invoiceDate)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* computer */}
              <table className="hidden w-full text-left lg:table">
                <thead className={`border-b text-[12px] ${t.divider} ${t.muted}`}>
                  <tr>
                    {isAdmin ? (
                      <th className="w-10 py-2.5 pl-5 pr-1">
                        <Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} label="Alle auf dieser Seite auswählen" />
                      </th>
                    ) : null}
                    <SortHeader label="Datum" sortKey="invoiceDate" sort={sort} onSort={onSort} dark={dark} className={isAdmin ? "" : "pl-5"} />
                    <SortHeader label="Käufer" sortKey="buyerName" sort={sort} onSort={onSort} dark={dark} />
                    <SortHeader label="Fahrzeug" sortKey="carType" sort={sort} onSort={onSort} dark={dark} />
                    <SortHeader label="Kilometer" sortKey="mileage" sort={sort} onSort={onSort} dark={dark} />
                    <th className="py-2.5 pl-8 pr-3 font-medium">FIN</th>
                    <SortHeader label="Re-Nr." sortKey="invoiceNumber" sort={sort} onSort={onSort} dark={dark} />
                    <SortHeader label="Betrag" sortKey="total" sort={sort} onSort={onSort} dark={dark} align="right" className="pr-5 text-right" />
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
                  {visible.map((contract) => {
                    const isSelected = selected.includes(contract._id);
                    return (
                      <tr
                        key={contract._id}
                        onClick={() => open(contract)}
                        className={`cursor-pointer transition-colors ${isSelected ? (dark ? "bg-emerald-500/5" : "bg-emerald-50/60") : t.rowHover}`}
                      >
                        {isAdmin ? (
                          <td className="py-3 pl-5 pr-1" onClick={(event) => event.stopPropagation()}>
                            <Checkbox checked={isSelected} onChange={() => toggleOne(contract._id)} label="Vertrag auswählen" />
                          </td>
                        ) : null}
                        <td className={`whitespace-nowrap px-3 py-3 text-[13px] tabular-nums ${t.text} ${isAdmin ? "" : "pl-5"}`}>{formatDate(contract.invoiceDate)}</td>
                        <td className="max-w-[14rem] px-3 py-3">
                          <p className={`truncate text-[14px] font-normal ${t.title}`}>{contract.buyerName || "–"}</p>
                        </td>
                        <td className="max-w-[16rem] px-3 py-3">
                          <p className={`truncate text-[13px] ${t.text}`}>{contract.carType || "–"}</p>
                        </td>
                        <td className={`whitespace-nowrap px-3 py-3 text-[13px] tabular-nums ${t.text}`}>{formatKm(contract.mileage) || "–"}</td>
                        <td className={`whitespace-nowrap py-3 pl-8 pr-3 font-mono text-[12.5px] tracking-wide ${t.muted}`}>{contract.vin || "–"}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`font-mono text-[13.5px] font-bold ${t.title}`}>{contract.invoiceNumber || "–"}</span>
                            <StatusBadges contract={contract} dark={dark} />
                          </div>
                        </td>
                        <td className={`whitespace-nowrap py-3 pl-3 pr-5 text-right text-[14px] font-normal tabular-nums ${t.title}`}>{euro(contract.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* pages */}
              <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[12px] sm:px-5 ${t.divider} ${t.muted}`}>
                <span className="tabular-nums">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} von {filtered.length}
                </span>
                {pages > 1 ? (
                  <nav aria-label="Seiten" className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Vorherige Seite"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`inline-flex size-8 items-center justify-center rounded-lg transition disabled:opacity-30 ${t.ghost}`}
                    >
                      <FiChevronLeft className="size-4" />
                    </button>
                    {pageItems(page, pages).map((item, index) =>
                      item === "…" ? (
                        <span key={`gap-${index}`} className="hidden px-1 sm:inline">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          aria-current={item === page ? "page" : undefined}
                          className={`hidden size-8 items-center justify-center rounded-lg text-[12px] tabular-nums transition sm:inline-flex ${
                            item === page
                              ? dark
                                ? "bg-emerald-500/15 font-semibold text-emerald-300"
                                : "bg-emerald-50 font-semibold text-emerald-700"
                              : t.ghost
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <span className="px-1 tabular-nums sm:hidden">
                      Seite {page} von {pages}
                    </span>
                    <button
                      type="button"
                      aria-label="Nächste Seite"
                      disabled={page === pages}
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      className={`inline-flex size-8 items-center justify-center rounded-lg transition disabled:opacity-30 ${t.ghost}`}
                    >
                      <FiChevronRight className="size-4" />
                    </button>
                  </nav>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
