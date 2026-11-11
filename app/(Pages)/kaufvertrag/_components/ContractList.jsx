"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { Download, FileText, Hash, Loader2, Plus, Search } from "lucide-react";
import { ErrorNote, Modal, Pill, Tabs, api, cx } from "@/app/(components)/sales/ui";
import { dateDE, formatEuro, remaining } from "@/lib/sales";

const TABS = [
  { key: "all", label: "Alle" },
  { key: "open", label: "Offen" },
  { key: "cancelled", label: "Storniert" },
  { key: "privat", label: "Privat" },
];

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function statusPill(r) {
  if (r.status === "cancelled") return <Pill tone="red">Storniert</Pill>;
  if (r.status === "draft") return <Pill>Entwurf</Pill>;
  if (r.paid) return <Pill tone="green">Bezahlt</Pill>;
  return <Pill tone="amber">Offen</Pill>;
}

/** Kaufverträge (current year) and Archiv (past years, admin) */
export default function ContractList({ scope = "year" }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { openSidebar } = useSidebar();
  const year = new Date().getFullYear();
  const sp = useSearchParams();
  const archive = scope === "archive";
  const [tab, setTab] = useState(() => TABS.find(({ key }) => key === sp.get("tab"))?.key || "all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [month, setMonth] = useState("");
  const [archiveYear, setArchiveYear] = useState("");
  const [years, setYears] = useState([]);
  const [data, setData] = useState({ rows: [], privateRows: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [next, setNext] = useState("");
  const [numberOpen, setNumberOpen] = useState(false);
  const [numberInput, setNumberInput] = useState("");
  const [numberBusy, setNumberBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 280);
    return () => clearTimeout(t);
  }, [q]);

  const query = useCallback(() => {
    const p = new URLSearchParams({ scope, tab });
    if (debounced) p.set("q", debounced);
    if (month) p.set("month", month);
    if (archive && archiveYear) p.set("year", archiveYear);
    return p;
  }, [scope, tab, debounced, month, archive, archiveYear]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api(`/api/kaufvertrag/liste?${query()}`);
    setLoading(false);
    if (!res.ok) return setError(res.data.error || "Verträge konnten nicht geladen werden.");
    setError("");
    setData({ privateRows: [], ...res.data });
    if (archive && res.data.years?.length) {
      setYears(res.data.years);
      if (!archiveYear) setArchiveYear(String(res.data.years[0]));
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (archive) return;
    const t = setTimeout(async () => {
      const res = await api("/api/kaufvertrag/nummer");
      if (res.ok) setNext(res.data.next);
    }, 0);
    return () => clearTimeout(t);
  }, [archive]);

  function changeTab(key) {
    setTab(key);
    router.replace(`${archive ? "/kaufvertrag/archiv" : "/kaufvertrag/liste"}${key !== "all" ? `?tab=${key}` : ""}`, { scroll: false });
  }

  async function saveNumber() {
    setNumberBusy(true);
    const res = await api("/api/kaufvertrag/nummer", { method: "PUT", body: { next: Number(numberInput) } });
    setNumberBusy(false);
    if (!res.ok) return setError(res.data.error || "Nummer konnte nicht gespeichert werden.");
    setNext(res.data.next);
    setNumberOpen(false);
  }

  const exportHref = `/api/kaufvertrag/export?${query()}`;
  const open = (r) => router.push(`/kaufvertrag/${r._id}`);
  const openPrivate = (r) => router.push(`/kaufvertrag/privat/${r._id}`);
  const isPrivate = tab === "privat";
  const rows = isPrivate ? data.privateRows || [] : data.rows;
  const shownYear = archive ? archiveYear : year;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="ind-plate flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="mr-auto">
          <h1 className="ind-title">{archive ? "Archiv" : "Kaufverträge"}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span>{archive ? `Verträge aus ${archiveYear || "früheren Jahren"}` : `Alle Verträge ${year}`}</span>
            {!archive && next ? (
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" /> Nächste Nummer <span className="font-semibold text-ink">{next}</span>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNumberInput(String(Number(String(next).split("/")[0].replace(/\D/g, "")) || 1));
                      setNumberOpen(true);
                    }}
                    className="link ml-1"
                  >
                    ändern
                  </button>
                ) : null}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <a href={exportHref} className="btn btn-secondary">
              <Download /> Export
            </a>
          ) : null}
          {!archive ? (
            <>
              <Link href="/kaufvertrag/privat" className="btn btn-secondary" title="Privater Kaufvertrag (TÜV-SÜD-Formular)">
                <FileText /> Privatvertrag
              </Link>
              <Link href="/kaufvertrag/form" className="btn btn-primary">
                <Plus /> Neuer Vertrag
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="sys-band flex flex-col gap-3 border-b border-line px-4 pt-3 lg:flex-row lg:items-end lg:justify-between">
          <Tabs tabs={TABS} value={tab} onChange={changeTab} counts={data.counts} />
          <div className="flex flex-wrap gap-2 pb-2.5">
            <div className="relative min-w-[200px] flex-1 lg:w-64 lg:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, Nr., FIN, Fahrzeug …" className="field pl-8" />
            </div>
            {archive ? (
              <select value={archiveYear} onChange={(e) => setArchiveYear(e.target.value)} className="field w-[96px]" aria-label="Jahr">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            ) : null}
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="field w-[130px]" aria-label="Monat">
              <option value="">Alle Monate</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="p-4">
            <ErrorNote onClose={() => setError("")}>{error}</ErrorNote>
          </div>
        ) : null}

        {isPrivate ? <PrivateTable rows={rows} onOpen={openPrivate} /> : null}

        {/* Desktop table */}
        <div className={cx("hidden overflow-x-auto", !isPrivate && "md:block")}>
          <table className="w-full text-[13px]">
            <thead className="sys-thead">
              <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-2">Datum</th>
                <th className="py-2 pr-3">Nummer</th>
                <th className="py-2 pr-3">Käufer</th>
                <th className="py-2 pr-3">Fahrzeug</th>
                <th className="py-2 pr-3">FIN</th>
                <th className="py-2 pr-3 text-right">Betrag</th>
                <th className="py-2 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.rows.map((r) => (
                <tr
                  key={r._id}
                  onClick={() => open(r)}
                  className={cx("sys-row cursor-pointer transition-colors hover:bg-slate-100/75", r.status === "cancelled" && "text-muted")}
                >
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">{dateDE(r.date)}</td>
                  <td
                    className={cx(
                      "whitespace-nowrap py-2.5 pr-3 font-semibold tabular-nums",
                      r.status === "cancelled" ? "line-through" : "text-ink",
                    )}
                  >
                    {r.number || r.formerNumber || "–"}
                    {!r.number && r.formerNumber ? (
                      <span className="ml-1 text-[10.5px] font-medium normal-case text-muted no-underline">(frei)</span>
                    ) : null}
                  </td>
                  <td className="max-w-[200px] truncate py-2.5 pr-3 text-ink">{r.buyerName || "–"}</td>
                  <td className="max-w-[220px] truncate py-2.5 pr-3">{r.vehicleName || "–"}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-[11.5px] text-muted">{r.vin || "–"}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums">
                    <span className="font-medium text-ink">{formatEuro(r.total)}</span>
                    {r.status === "active" && !r.paid && r.deposit > 0 ? (
                      <span className="block text-[11px] text-amber-700">offen {formatEuro(remaining(r.total, r.deposit))}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4 text-right">{statusPill(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phone cards */}
        <ul className={cx("divide-y divide-line md:hidden", isPrivate && "hidden")}>
          {data.rows.map((r) => (
            <li key={r._id}>
              <button type="button" onClick={() => open(r)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cx("text-[13px] font-semibold text-ink", r.status === "cancelled" && "line-through")}>
                      {r.number || r.formerNumber || "–"}
                    </span>
                    <span className="text-[11.5px] text-muted">{dateDE(r.date)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink">{r.buyerName || "–"}</span>
                  <span className="block truncate text-[12px] text-muted">{r.vehicleName}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[13px] font-semibold tabular-nums text-ink">{formatEuro(r.total)}</span>
                  {statusPill(r)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {!rows.length ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center text-[13px] text-muted">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-6 w-6 text-line-strong" />}
            {loading ? "Verträge werden geladen …" : debounced || month ? "Keine Verträge für diese Suche." : "Noch keine Verträge."}
          </div>
        ) : null}

        {rows.length ? (
          <div className="sys-band flex flex-wrap items-center gap-2 border-t border-line px-4 py-2.5 text-[12px] text-muted">
            <span>
              {rows.length} {isPrivate ? (rows.length === 1 ? "Privatvertrag" : "Privatverträge") : rows.length === 1 ? "Vertrag" : "Verträge"}
              {shownYear ? ` · ${month ? `${MONTHS[Number(month) - 1]} ` : ""}${shownYear}` : ""}
            </span>
          </div>
        ) : null}
      </div>

      <Modal
        open={numberOpen}
        onClose={() => setNumberOpen(false)}
        title="Nummernkreis fortsetzen"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNumberOpen(false)}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={saveNumber} disabled={numberBusy}>
              {numberBusy ? <Loader2 className="animate-spin" /> : null} Speichern
            </button>
          </>
        }
      >
        <p className="text-[13px] text-body">
          Legen Sie die Nummer für den nächsten Vertrag fest.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input type="number" min={1} value={numberInput} onChange={(e) => setNumberInput(e.target.value)} className="field w-28" />
          <span className="text-[13px] font-semibold text-muted">/{String(year).slice(-2)}</span>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">Die Nummer muss größer sein als die des letzten gespeicherten Vertrags.</p>
      </Modal>
    </div>
  );
}

/** Privat tab: contracts on the TÜV-SÜD form */
function PrivateTable({ rows, onOpen }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-[13px]">
          <thead className="sys-thead">
            <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              <th className="px-4 py-2">Datum</th>
              <th className="py-2 pr-3">Verkäufer</th>
              <th className="py-2 pr-3">Käufer</th>
              <th className="py-2 pr-3">Fahrzeug</th>
              <th className="py-2 pr-3">FIN</th>
              <th className="py-2 pr-3 text-right">Preis</th>
              <th className="py-2 pr-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r._id} onClick={() => onOpen(r)} className="sys-row cursor-pointer transition-colors hover:bg-slate-100/75">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">{dateDE(r.date)}</td>
                <td className="max-w-[200px] truncate py-2.5 pr-3 text-ink">{r.sellerName || "–"}</td>
                <td className="max-w-[200px] truncate py-2.5 pr-3 text-ink">{r.buyerName || "–"}</td>
                <td className="max-w-[220px] truncate py-2.5 pr-3">{r.vehicleName || "–"}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 font-mono text-[11.5px] text-muted">{r.vin || "–"}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-right font-medium tabular-nums text-ink">{r.price ? formatEuro(r.price) : "–"}</td>
                <td className="py-2.5 pr-4 text-right">{r.paid ? <Pill tone="green">Bezahlt</Pill> : <Pill tone="amber">Offen</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r._id}>
            <button type="button" onClick={() => onOpen(r)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{r.vehicleName || "–"}</span>
                <span className="block truncate text-[12px] text-muted">
                  {r.sellerName || "–"} → {r.buyerName || "–"} · {dateDE(r.date)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[13px] font-semibold tabular-nums text-ink">{r.price ? formatEuro(r.price) : ""}</span>
                {r.paid ? <Pill tone="green">Bezahlt</Pill> : <Pill tone="amber">Offen</Pill>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
