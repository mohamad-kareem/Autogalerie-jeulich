"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarPlus,
  CarFront,
  Check,
  CheckCircle2,
  Copy,
  FilePlus2,
  IdCard,
  FileText,
  ImageUp,
  KeyRound,
  Loader2,
  MapPin,
  Maximize2,
  Pencil,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  RotateCw,
  Search,
  Trash2,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { Drawer, ErrorNote, Field, Modal, Pill, Section, api, cx } from "@/app/(components)/sales/ui";
import {
  TUEV_STATUS,
  berlinDay,
  dateDE,
  daysBetween,
  formatEuro,
  mapsHref,
  monthDE,
  telHref,
  tuevExpired,
  warrantyInfo,
} from "@/lib/sales";
import { confirmDialog } from "@/app/(components)/ConfirmHost";
import { printWorkOrder } from "@/lib/workOrderPrint";
import { uploadImage } from "./api";
import PlateBadge from "./PlateBadge";

/** Autogalerie's phases (Fahrzeugverwaltung, Dashboard, Schlüssel use the same) */
const PHASES = [
  { key: "werkstatt", label: "Werkstatt" },
  { key: "aufbereitung", label: "Aufbereitung" },
  { key: "platz", label: "In Boora" },
  { key: "tuev", label: "TÜV" },
  { key: "verkauft", label: "Verkauft" },
];
const phaseLabel = (k) => PHASES.find((p) => p.key === k)?.label || "–";
const PHASE_STYLES = {
  werkstatt: "bg-slate-100 text-slate-700",
  aufbereitung: "bg-amber-50 text-amber-700",
  platz: "bg-emerald-50 text-emerald-700",
  tuev: "bg-blue-50 text-blue-700",
  verkauft: "bg-rose-50 text-rose-700",
};
const BASE = "/Fahrzeugverwaltung";

const TABS = [{ key: "", label: "Alle" }, ...PHASES];
const EMPTY_ROWS = [];
const kmFmt = (n) => (n == null ? "" : new Intl.NumberFormat("de-DE").format(n));

function toEdit(v) {
  return {
    name: v.name,
    vin: v.vin,
    internalNumber: v.internalNumber,
    firstRegistration: v.firstRegistration,
    mileage: kmFmt(v.mileage),
    fuel: v.fuel,
    power: v.power,
    gearbox: v.gearbox,
    price: v.price != null ? String(v.price).replace(".", ",") : "",
    keyNumber: v.keyNumber,
    keyCount: v.keyCount,
    keyNote: v.keyNote || "",
    keyColor: v.keyColor || "#000000",
    werkstattWhere: v.werkstatt?.where || "",
    werkstattWhat: v.werkstatt?.what || "",
    tuevIssues: (v.tuevIssues || []).join("\n"),
    owners: v.owners == null ? "" : String(v.owners),
    phase: v.phase,
    tuevStatus: v.tuevStatus,
    tuevUntil: monthDE(v.tuevUntil),
    tankEmpty: v.tankEmpty,
    redPlate: v.redPlate,
    inStockSince: v.inStockSince,
    purchaseDate: v.purchaseDate || "",
    notes: v.notes,
  };
}

export default function FahrzeugverwaltungClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { openSidebar } = useSidebar();
  const finParam = (sp.get("fin") || "").replace(/\s+/g, "").toUpperCase();
  const [tab, setTab] = useState(sp.get("phase") || "");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [list, setList] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(sp.get("id") || "");
  const [createOpen, setCreateOpen] = useState(false);
  const [scheinFor, setScheinFor] = useState(null);
  const [printing, setPrinting] = useState("");

  const params = new URLSearchParams();
  if (tab) params.set("phase", tab);
  if (debounced) params.set("q", debounced);
  const query = params.toString();
  const currentList = list?.query === query ? list : null;
  const rows = currentList?.rows ?? EMPTY_ROWS;
  const counts = currentList?.counts;
  const loading = currentList?.refresh !== refresh;
  const listError = loading ? "" : currentList.error;
  const reload = () => setRefresh((value) => value + 1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    async function load() {
      const url = `/api/fahrzeugakte?${query}`;
      let res = await api(url);
      if (active && !res.ok && (res.status === 0 || res.status === 429 || res.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        if (active) res = await api(url);
      }
      if (!active) return;
      if (!res.ok || !Array.isArray(res.data?.vehicles)) {
        setList((previous) => ({
          ...(previous?.query === query ? previous : {}),
          query,
          refresh,
          error: res.data?.error || "Fahrzeuge konnten nicht geladen werden.",
        }));
        return;
      }
      setList({
        query,
        refresh,
        rows: res.data.vehicles,
        counts: { ...res.data.counts, "": res.data.counts?.all },
        error: "",
      });
    }
    const t = setTimeout(load, 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, refresh]);

  // opened from a Kaufvertrag / the dashboard (?fin=…): open that car's file
  const finOpened = useRef(false);
  useEffect(() => {
    if (!finParam || finOpened.current || !rows.length) return;
    const hit = rows.find((r) => r.vin === finParam);
    finOpened.current = true;
    if (hit) {
      const t = setTimeout(() => setSelected(hit._id), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [finParam, rows]);

  function openVehicle(id) {
    setSelected(id);
    router.replace(id ? `${BASE}?id=${id}` : BASE, { scroll: false });
  }

  /** loads the car with its tasks and prints the Arbeitsauftrag */
  async function printSheet(v) {
    setPrinting(v._id);
    const res = await api(`/api/fahrzeugakte/${v._id}`);
    if (!res.ok) {
      setPrinting("");
      return setError(res.data.error || "Arbeitsauftrag konnte nicht erstellt werden.");
    }
    await printWorkOrder({ vehicle: res.data.vehicle || v, tasks: res.data.tasks || [], contracts: res.data.contracts || [] });
    setPrinting("");
  }

  const soldTab = tab === "verkauft";

  return (
    <div className="ind mx-auto max-w-[1400px] space-y-3">
      {/* Title plate */}
      <div className="ind-plate flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-[17px] font-semibold tracking-[0.01em] text-[#1f252c]">Fahrzeugverwaltung</h1>
          <p className="hidden text-[11.5px] text-[#5d6671] sm:block">Fahrzeugakten – verbunden über die FIN.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setCreateOpen(true)} className="ind-btn ind-btn-dark">
            <Plus className="h-4 w-4" /> Fahrzeug<span className="hidden sm:inline"> anlegen</span>
          </button>
        </div>
      </div>

      {listError ? (
        <ErrorNote>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span role="alert">{listError}</span>
            <button type="button" className="ind-btn" onClick={reload}>Erneut laden</button>
          </span>
        </ErrorNote>
      ) : null}
      {error ? <ErrorNote onClose={() => setError("")}>{error}</ErrorNote> : null}
      {notice ? (
        <div className="flex items-center gap-2 rounded-[4px] border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {notice}
          <button type="button" onClick={() => setNotice("")} className="ml-auto text-emerald-600">
            ×
          </button>
        </div>
      ) : null}

      <div className="ind-panel">
        {/* Toolbar: phase switch + search */}
        <div className="ind-toolbar flex flex-col gap-2.5 p-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="ind-seg no-scrollbar flex overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cx("ind-seg-btn", tab === t.key && "ind-seg-on")}>
                {t.label}
                {counts?.[t.key] != null ? <span className="ind-count">{counts[t.key]}</span> : null}
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7480]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, FIN, Schlüssel-Nr., Käufer …" className="ind-input h-8 w-full pl-8 pr-3" />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="ind-thead text-left">
                <th className="w-[40%] pl-4 pr-3">Fahrzeug</th>
                <th className="w-[24%] px-3 text-center">FIN</th>
                <th className={cx("px-3", !soldTab && "w-[22%] text-center")}>Phase</th>
                {soldTab ? (
                  <>
                    <th className="pr-3">Käufer</th>
                    <th className="pr-3">Verkauft</th>
                    <th className="pr-3">Übergeben</th>
                    <th className="pr-3">Gewährleistung</th>
                    <th className="pr-4">Vertrag</th>
                  </>
                ) : null}
                <th className="w-[96px] pr-4 text-right">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const w = v.sale?.warrantyUntil ? warrantyInfo(v.sale.warrantyUntil) : null;
                return (
                  <tr key={v._id} onClick={() => openVehicle(v._id)} className={cx("ind-row cursor-pointer", selected === v._id && "ind-row-sel")}>
                    <td className="py-2.5 pl-4 pr-3">
                      <span className="block max-w-[400px] truncate font-medium text-[#1f252c]">{v.name || "–"}</span>
                      <KeyLine v={v} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <CopyVin vin={v.vin} />
                    </td>
                    <td className={cx("px-3 py-2.5", !soldTab && "text-center")}>
                      <PhaseTag phase={v.phase} />
                    </td>
                    {soldTab ? (
                      <>
                        <td className="max-w-[180px] truncate py-2.5 pr-3 text-[#1f252c]">{v.sale?.buyerName || "–"}</td>
                        <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums">{dateDE(v.sale?.soldAt) || "–"}</td>
                        <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums">
                          {v.sale?.handedOverAt ? dateDE(v.sale.handedOverAt) : <Pill tone="amber">offen</Pill>}
                        </td>
                        <td className="py-2.5 pr-3">{w ? <Pill tone={w.active ? "green" : "slate"}>{w.active ? `noch ${w.days} Tage` : "abgelaufen"}</Pill> : "–"}</td>
                        <td className="py-2.5 pr-4">
                          {hasContract(v.sale) ? (
                            <Link href={contractHref(v)} onClick={(e) => e.stopPropagation()} className="link tabular-nums">
                              {v.sale.contractNumber}
                            </Link>
                          ) : (
                            <span className="text-muted">ohne Vertrag</span>
                          )}
                        </td>
                      </>
                    ) : null}
                    <td className="py-2.5 pr-4 text-right">
                      <RowActions v={v} onSchein={setScheinFor} onPrint={printSheet} printing={printing === v._id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="md:hidden">
          {rows.map((v) => (
            <li key={v._id} className="ind-row">
              <div role="button" tabIndex={0} onClick={() => openVehicle(v._id)} onKeyDown={(e) => e.key === "Enter" && openVehicle(v._id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#1f252c]">{v.name}</span>
                  <KeyLine v={v} />
                  <span className="mt-1 block">
                    <CopyVin vin={v.vin} />
                  </span>
                  {v.sale ? <span className="mt-0.5 block truncate text-[12px] text-muted">{v.sale.buyerName} · {dateDE(v.sale.soldAt)}</span> : null}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-2">
                  <PhaseTag phase={v.phase} />
                  <RowActions v={v} onSchein={setScheinFor} onPrint={printSheet} printing={printing === v._id} />
                </span>
              </div>
            </li>
          ))}
        </ul>

        {!rows.length && !listError ? (
          <div className="flex flex-col items-center gap-2 px-4 py-14 text-center text-[13px] text-muted">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CarFront className="h-6 w-6 text-line-strong" />}
            {loading ? "Fahrzeuge werden geladen …" : debounced ? "Kein Fahrzeug gefunden." : "Noch keine Fahrzeugakten."}
          </div>
        ) : null}
      </div>

      {scheinFor ? <ScheinViewer v={scheinFor} onRotated={reload} onClose={() => setScheinFor(null)} onPrint={() => printSheet(scheinFor)} printing={printing === scheinFor._id} /> : null}

      <VehicleDrawer id={selected} onClose={() => openVehicle("")} onChanged={reload} />
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(v) => {
          setCreateOpen(false);
          reload();
          openVehicle(v._id);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const PHASE_LAMP = { werkstatt: "#7b8592", aufbereitung: "#d99a1e", platz: "#2fa36b", tuev: "#2b6fd6", verkauft: "#c0392b" };

/** phase as a square tag with a small indicator lamp */
function PhaseTag({ phase }) {
  return (
    <span className="ind-tag whitespace-nowrap">
      <span className="ind-lamp" style={{ "--lamp": PHASE_LAMP[phase] || "#7b8592" }} />
      {phaseLabel(phase)}
    </span>
  );
}

/** key info under the vehicle name */
function KeyLine({ v }) {
  const failed = v.tuevStatus === "failed";
  const hasHu = failed || /^\d{4}-\d{2}$/.test(v.tuevUntil || "");
  if (!v.keyNumber && !v.inStockSince && !hasHu) return null;
  return (
    <span className="mt-0.5 flex items-center gap-3 text-[11.5px] tabular-nums text-[#66707c]">
      {v.inStockSince ? (
        <span className="inline-flex items-center gap-1" title="Aufgenommen am">
          <CalendarPlus className="h-3 w-3" />
          {dateDE(v.inStockSince)}
        </span>
      ) : null}
      {hasHu ? (
        <span className="inline-flex" title={failed ? "HU nicht bestanden" : `HU / TÜV bis ${monthDE(v.tuevUntil)}${tuevExpired(v.tuevUntil) ? " – abgelaufen" : ""}`}>
          <HuBadge until={failed ? "" : v.tuevUntil} bad={failed || tuevExpired(v.tuevUntil)} size={25} />
        </span>
      ) : null}
      {v.keyNumber ? (
        <span className="inline-flex items-center gap-1" title="Schlüssel-Nr.">
          <KeyRound className="h-3 w-3" />
          {v.keyNumber}
        </span>
      ) : null}
    </span>
  );
}

/** Fahrzeugschein, fully visible, with rotate buttons (rotation is saved) */
function ScheinViewer({ v, onClose, onPrint, printing, onRotated }) {
  const [version, setVersion] = useState(v.updatedAt || "");
  const [url, setUrl] = useState(v.imageUrl || "");
  const [turning, setTurning] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function rotate(angle) {
    setTurning(angle);
    setErr("");
    const res = await api(`/api/fahrzeugakte/${v._id}`, { method: "PATCH", body: { action: "rotate", rotate: angle } });
    setTurning(0);
    if (!res.ok) return setErr(res.data.error || "Drehen fehlgeschlagen.");
    setLoaded(false);
    setUrl(res.data.vehicle?.imageUrl || url);
    setVersion(String(res.data.version || Date.now()));
    onRotated?.();
  }

  const src = url;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-[#1b1f24]/55" />
      <div className="ind-panel animate-pop-in relative flex h-full max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col sm:max-h-[calc(100dvh-3rem)]">
        <div className="ind-toolbar flex shrink-0 items-center gap-2 px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#1f252c]">
            Fahrzeugschein <span className="font-normal text-[#5d6671]">· {v.name}</span>
          </p>
          <button type="button" onClick={() => rotate(-90)} disabled={Boolean(turning)} className="ind-icon-btn" title="Nach links drehen" aria-label="Nach links drehen">
            {turning === -90 ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => rotate(90)} disabled={Boolean(turning)} className="ind-icon-btn" title="Nach rechts drehen" aria-label="Nach rechts drehen">
            {turning === 90 ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          </button>
          <span className="mx-1 h-6 w-px bg-[#b9bfc7]" />
          <button type="button" onClick={onClose} className="ind-icon-btn" title="Schließen" aria-label="Schließen">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#eceef1] p-3">
          {!loaded ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#6b7480]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`${src}|${version}`}
            src={src}
            alt="Fahrzeugschein"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={cx("h-full w-full object-contain transition-opacity", loaded ? "opacity-100" : "opacity-0")}
          />
        </div>

        <div className="ind-toolbar flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#b9bfc7] px-3 py-2">
          {err ? <p className="mr-auto text-[12.5px] font-medium text-rose-700">{err}</p> : <p className="mr-auto text-[11.5px] text-[#6b7480]">Gedrehte Ansicht wird gespeichert und so gedruckt.</p>}
          <a href={src} target="_blank" rel="noreferrer" className="ind-btn">
            In neuem Tab öffnen
          </a>
          <button type="button" onClick={onPrint} disabled={printing} className="ind-btn ind-btn-dark">
            {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Arbeitsauftrag drucken
          </button>
        </div>
      </div>
    </div>
  );
}

// HU sticker colours repeat every 6 years:
// 2022 braun · 2023 rosa · 2024 grün · 2025 orange · 2026 blau · 2027 gelb · 2028 braun …
const HU_COLORS = ["#9a6b3f", "#e98fb4", "#3aa55d", "#f08a24", "#2e7fd0", "#d9ac00"];

/** round HU inspection sticker: year colour, year in the middle, due month marked on the rim */
const HU_DARK_TEXT = new Set(["#d9ac00", "#e98fb4", "#f08a24"]);

function HuBadge({ until, bad, size = 22 }) {
  const y = /^\d{4}-\d{2}$/.test(until || "") ? Number(until.slice(0, 4)) : null;
  const fill = y ? HU_COLORS[(((y - 2022) % 6) + 6) % 6] : "#c9ced5";
  const ink = !y || HU_DARK_TEXT.has(fill) ? "#1b1f24" : "#ffffff";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="11.3" fill={bad ? "#c0392b" : "rgba(20,26,33,.28)"} />
      <circle cx="12" cy="12" r={bad ? 9.9 : 10.6} fill={fill} />
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".7" />
      <text x="12" y="15.7" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" fill={ink}>
        {y ? String(y).slice(2) : "–"}
      </text>
    </svg>
  );
}

/** one block of the vehicle drawer's data form – no box, no title, no line */
function EditGroup({ children }) {
  return <div className="grid grid-cols-6 gap-x-3 gap-y-2.5 py-2.5 first:pt-1">{children}</div>;
}

function Cell({ label, children, className, big, sub }) {
  return (
    <div className={cx("min-w-0 px-3.5 py-2.5", className)}>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7480]">{label}</dt>
      <dd className={cx("mt-1 flex min-h-[22px] items-center gap-2 truncate text-ink", big ? "text-[16px] font-semibold tabular-nums" : "text-[13.5px] font-medium")}>{children}</dd>
      {sub ? <p className="mt-0.5 truncate text-[11.5px] text-muted" title={sub}>{sub}</p> : null}
    </div>
  );
}

const dash = <span className="font-normal text-[#a3aab3]">–</span>;

/** Read-only view of the car's data (drawer, before "Bearbeiten"): 2 main facts on top, 6 below */
function ReadFacts({ v, redPlates }) {
  const failed = v.tuevStatus === "failed";
  const hasHu = /^\d{4}-\d{2}$/.test(v.tuevUntil || "");
  const tuevLabel = TUEV_STATUS.find((t) => t.key === v.tuevStatus)?.label;
  const line = "border-[#e3e6ea]";
  return (
    <div className="pb-3">
      <dl className={cx("grid grid-cols-3 overflow-hidden rounded-[4px] border bg-white", line)}>
        {/* the two main facts */}
        <Cell big label="Erstzulassung" className="bg-[#f6f7f8]">
          {v.firstRegistration || dash}
        </Cell>
        <Cell big label="FIN" className={cx("col-span-2 border-l bg-[#f6f7f8]", line)}>
          <CopyVin vin={v.vin} large />
        </Cell>

        <Cell label="Schlüssel" className={cx("border-t", line)} sub={v.keyNote || ""}>
          <span className="h-3 w-3 shrink-0 rounded-full border border-black/20" style={{ background: v.keyColor || "#000" }} aria-hidden />
          {v.keyNumber ? `Nr. ${v.keyNumber}` : "ohne Nr."}
          <span className="font-normal text-muted">· {v.keyCount ?? 0} Stk.</span>
        </Cell>
        <Cell label="Kilometer" className={cx("border-l border-t", line)}>
          {v.mileage != null ? `${kmFmt(v.mileage)} km` : dash}
        </Cell>
        <Cell label="Preis" className={cx("border-l border-t", line)}>
          {v.price != null ? formatEuro(v.price).replace(",00", "") : dash}
        </Cell>

        <Cell label="Vorbesitzer" className={cx("border-t", line)}>
          {v.owners ?? dash}
        </Cell>
        <Cell label="HU / TÜV" className={cx("border-l border-t", line)}>
          {hasHu || failed ? <HuBadge until={v.tuevUntil} bad={failed} size={20} /> : null}
          {failed ? <span className="text-[#a12d22]">nicht bestanden</span> : hasHu ? monthDE(v.tuevUntil) : tuevLabel && tuevLabel !== "–" ? tuevLabel : dash}
        </Cell>
        <Cell label="Rotes Kennzeichen" className={cx("border-l border-t", line)}>
          {redPlates.length ? redPlates.map((r) => <PlateBadge key={r.plateId} number={r.number} size="xs" />) : dash}
        </Cell>

        {v.phase === "werkstatt" && (v.werkstatt?.where || v.werkstatt?.what) ? (
          <div className={cx("col-span-3 border-t px-3.5 py-2.5", line)}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7480]">Werkstatt</dt>
            <dd className="mt-1 text-[13.5px] text-ink">{[v.werkstatt.where, v.werkstatt.what].filter(Boolean).join(" · ")}</dd>
          </div>
        ) : null}
        {failed && v.tuevIssues?.length ? (
          <div className={cx("col-span-3 border-t px-3.5 py-2.5", line)}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7480]">Mängel</dt>
            <dd className="mt-1 text-[13.5px] text-ink">{v.tuevIssues.join(" · ")}</dd>
          </div>
        ) : null}
        {v.notes ? (
          <div className={cx("col-span-3 border-t px-3.5 py-2.5", line)}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7480]">Notiz</dt>
            <dd className="mt-1 whitespace-pre-wrap text-[13.5px] text-ink">{v.notes}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** the car was sold with a contract (normal or private) */
const hasContract = (sale) => Boolean(sale?.contractId || sale?.privateContractId || sale?.contractNumber === "Privatvertrag");
/** link to that contract – the private one is also found through the car */
const contractHref = (v) =>
  v.sale?.contractId
    ? `/kaufvertrag/${v.sale.contractId}`
    : v.sale?.privateContractId
      ? `/kaufvertrag/privat/${v.sale.privateContractId}`
      : `/kaufvertrag/privat${v.vin ? `?fin=${v.vin}` : ""}`;

/** Steel panel used in the drawer (Aufgaben, Reklamationen, Fahrzeugschein) */
function Panel({ title, count, meta, actions, progress, children }) {
  const hasBody = Children.toArray(children).length > 0;
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#dfe2e6] bg-white shadow-[0_1px_2px_rgba(20,26,33,0.05)]">
      <div className={cx("relative flex min-h-[38px] items-center gap-2 bg-gradient-to-b from-[#f7f8f9] to-[#eceef1] px-3.5 py-1.5", hasBody && "border-b border-[#dfe2e6]")}>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3e454e]">{title}</h3>
        {count != null ? <span className="ind-count tabular-nums">{count}</span> : null}
        {meta ? <span className="text-[11.5px] text-muted">{meta}</span> : null}
        <span className="ml-auto flex items-center gap-2">{actions}</span>
        {progress != null ? (
          <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#e3e6ea]">
            <span className="block h-full bg-gradient-to-r from-[#59616c] to-[#3e454e] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** One task line with a steel check box */
function TaskRow({ task, onToggle, onDelete, busy }) {
  const done = task.status === "done";
  const title = task.title;
  return (
    <li className={cx("group/t flex items-center gap-3 border-b border-[#eceef1] px-3.5 py-2 last:border-b-0", busy && "opacity-60")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={() => onToggle(task)}
        disabled={busy}
        className={cx(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition",
          done ? "border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white" : "border-[#a3aab3] bg-gradient-to-b from-white to-[#eef0f2] hover:border-[#59616c]",
        )}
      >
        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </button>
      <button type="button" onClick={() => onToggle(task)} disabled={busy} className={cx("min-w-0 flex-1 text-left text-[13px] leading-snug", done ? "text-[#8a929c] line-through" : "text-ink")}>
        {title}
      </button>
      {task.contractId ? <span className="shrink-0 rounded-[3px] border border-[#cfd4da] px-1.5 text-[10.5px] font-semibold text-[#5d6671]">vor Übergabe</span> : null}
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(task)}
          disabled={busy}
          title="Aufgabe löschen"
          aria-label="Aufgabe löschen"
          className="shrink-0 rounded-[3px] p-1 text-[#a3aab3] opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover/t:opacity-100 focus:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </li>
  );
}

/** Schein + print buttons of a row */
function RowActions({ v, onSchein, onPrint, printing }) {
  return (
    <span className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onSchein(v)}
        disabled={!v.hasRegistrationPhoto}
        title={v.hasRegistrationPhoto ? "Fahrzeugschein ansehen" : "Kein Fahrzeugschein hinterlegt"}
        aria-label="Fahrzeugschein ansehen"
        className="ind-icon-btn"
      >
        <IdCard className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onPrint(v)} disabled={printing} title="Arbeitsauftrag drucken (Aufgaben + Schein)" aria-label="Arbeitsauftrag drucken" className="ind-icon-btn">
        {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
      </button>
    </span>
  );
}

/** FIN as one plate-like chip: grouped like on the Schein (WMI · VDS · VIS), click copies */
function CopyVin({ vin, large = false }) {
  const [copied, setCopied] = useState(false);
  if (!vin) return <span className="ind-vin-none">keine FIN</span>;
  const parts = vin.length === 17 ? [vin.slice(0, 3), vin.slice(3, 9), vin.slice(9)] : [vin];
  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(vin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked – ignore */
    }
  }
  return (
    <button type="button" onClick={copy} title={copied ? "Kopiert" : "FIN kopieren"} aria-label={`FIN ${vin} kopieren`} className={cx("ind-vin", large && "ind-vin-lg", copied && "ind-vin-ok")}>
      <span className="ind-vin-text">
        {parts.map((p, i) => (
          <span key={i}>{p}</span>
        ))}
      </span>
      <span className="ind-vin-icon">{copied ? <Check className={large ? "h-4 w-4" : "h-3.5 w-3.5"} /> : <Copy className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function CreateModal({ open, onClose, onCreated }) {
  const [f, setF] = useState({ name: "", vin: "", internalNumber: "", keyNumber: "", phase: "werkstatt" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    const res = await api("/api/fahrzeugakte", { method: "POST", body: f });
    setBusy(false);
    if (!res.ok) return setError(res.data.error || "Speichern fehlgeschlagen.");
    setF({ name: "", vin: "", internalNumber: "", keyNumber: "", phase: "werkstatt" });
    setError("");
    onCreated(res.data.vehicle);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fahrzeug anlegen"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !f.name.trim()}>
            {busy ? <Loader2 className="animate-spin" /> : null} Anlegen
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        <Field label="Fahrzeug" id="n-name" required className="col-span-2">
          <input id="n-name" className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="z. B. VW Golf VII" autoFocus />
        </Field>
        <Field label="FIN" id="n-vin" className="col-span-2">
          <input id="n-vin" className="field font-mono uppercase" value={f.vin} onChange={(e) => setF({ ...f, vin: e.target.value.toUpperCase() })} maxLength={21} />
        </Field>
        <Field label="Schlüssel-Nr." id="n-key" className="col-span-2">
          <input id="n-key" className="field" value={f.keyNumber} onChange={(e) => setF({ ...f, keyNumber: e.target.value })} />
        </Field>
        <Field label="Phase" id="n-phase" className="col-span-2">
          <select id="n-phase" className="field" value={f.phase} onChange={(e) => setF({ ...f, phase: e.target.value })}>
            {PHASES.filter((p) => p.key !== "verkauft").map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */

function VehicleDrawer({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sold, setSold] = useState({ open: false, buyerName: "", buyerPhone: "", date: berlinDay() });
  const [claim, setClaim] = useState({ open: false, date: berlinDay(), what: "", where: "", cost: "" });
  const [taskTitle, setTaskTitle] = useState("");
  const [busyTask, setBusyTask] = useState("");
  const fileInput = useRef(null);

  const apply = useCallback((d) => {
    if (!d?.vehicle) return;
    setData({ tasks: [], contracts: [], ...d });
    setEdit(toEdit(d.vehicle));
  }, []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const t = setTimeout(async () => {
      setData(null);
      setError("");
      setEditing(false);
      const res = await api(`/api/fahrzeugakte/${id}`);
      if (!alive) return;
      if (!res.ok) return setError(res.data.error || "Fahrzeugakte konnte nicht geladen werden.");
      apply(res.data);
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [id, apply]);

  async function patch(body, key) {
    setBusy(key);
    setError("");
    const res = await api(`/api/fahrzeugakte/${id}`, { method: "PATCH", body });
    setBusy("");
    if (!res.ok) {
      setError(res.data.error || "Speichern fehlgeschlagen.");
      return false;
    }
    apply(res.data);
    onChanged?.();
    return true;
  }

  async function saveEdit() {
    const body = { ...edit };
    if (body.phase === "verkauft" && data.vehicle.phase !== "verkauft") delete body.phase;
    if (await patch(body, "save")) {
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    }
  }

  function cancelEdit() {
    if (data?.vehicle) setEdit(toEdit(data?.vehicle));
    setEditing(false);
  }

  async function upload(file) {
    if (!file) return;
    setBusy("photo");
    setError("");
    try {
      const { imageUrl, publicId } = await uploadImage(file);
      setBusy("");
      await patch({ action: "photo", imageUrl, publicId }, "photo");
    } catch (err) {
      setBusy("");
      setError(err?.message || "Upload fehlgeschlagen.");
    }
  }

  async function removePhoto() {
    if (!(await confirmDialog("Foto des Fahrzeugscheins entfernen?"))) return;
    await patch({ action: "removePhoto" }, "photo");
  }

  async function tick(task) {
    setBusyTask(task._id);
    await patch({ action: "toggleTask", title: task.title }, "");
    setBusyTask("");
  }

  async function removeTask(task) {
    if (!(await confirmDialog({ title: "Aufgabe löschen", message: `„${task.title}“ wirklich löschen?`, confirmLabel: "Löschen", danger: true }))) return;
    setBusyTask(task._id);
    await patch({ action: "removeTask", title: task.title }, "");
    setBusyTask("");
  }

  async function removeVehicle() {
    const n = data?.contracts?.length || 0;
    const ok = await confirmDialog({
      title: "Fahrzeug löschen",
      message: `„${data?.vehicle?.name || "Fahrzeug"}“ mit Aufgaben und Fahrzeugschein wirklich löschen?${
        n ? `\nDie ${n} Kaufvertr${n === 1 ? "ag bleibt" : "äge bleiben"} erhalten.` : ""
      }\nDas kann nicht rückgängig gemacht werden.`,
      confirmLabel: "Löschen",
      danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    const res = await api(`/api/fahrzeugakte/${id}`, { method: "DELETE" });
    setBusy("");
    if (!res.ok) return setError(res.data.error || "Fahrzeug konnte nicht gelöscht werden.");
    onChanged?.();
    onClose?.();
  }

  const v = data?.vehicle;
  const e = edit;
  const set = (k, val) => setEdit((x) => ({ ...x, [k]: val }));
  const claimsTotal = v?.claims?.reduce((s, c) => s + (c.cost || 0), 0) || 0;
  const w = v?.sale?.warrantyUntil ? warrantyInfo(v.sale.warrantyUntil) : null;
  const openTasks = data?.tasks?.filter((t) => t.status === "open").length || 0;

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      width="sm:max-w-2xl"
      title={v?.name || "Fahrzeugakte"}
      subtitle={
        v ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", PHASE_STYLES[v.phase])}>{phaseLabel(v.phase)}</span>
            {v.inStockSince ? (
              <span className="inline-flex items-center gap-1" title="Im Bestand seit">
                <CalendarPlus className="h-3.5 w-3.5" />
                im Bestand seit {dateDE(v.inStockSince)}
              </span>
            ) : null}
          </span>
        ) : null
      }
    >
      {error ? (
        <div className="px-4 pt-3">
          <ErrorNote onClose={() => setError("")}>{error}</ErrorNote>
        </div>
      ) : null}

      {!v || !e ? (
        <div className="flex items-center gap-2 p-4 text-[13px] text-muted">{!error ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {!error ? "wird geladen …" : ""}</div>
      ) : (
        <>
          {/* Sale */}
          <Section title={v.sale || sold.open ? "Verkauf" : ""} className={v.sale || sold.open ? "" : "py-3!"}>
            {v.sale ? (
              <div className="space-y-3 text-[13px]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{v.sale.buyerName || "Käufer unbekannt"}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {v.sale.buyerPhone ? (
                        <a href={telHref(v.sale.buyerPhone)} className="link inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {v.sale.buyerPhone}
                        </a>
                      ) : null}
                      {v.sale.buyerAddress ? (
                        <a href={mapsHref([v.sale.buyerAddress])} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {v.sale.buyerAddress}
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {hasContract(v.sale) ? (
                    <Link href={contractHref(v)} className="btn btn-secondary btn-sm">
                      <FileText /> {v.sale.contractNumber}
                    </Link>
                  ) : (
                    <Pill>ohne Vertrag</Pill>
                  )}
                </div>
                <dl className="grid grid-cols-3 gap-2 rounded-lg bg-canvas p-3 text-[12px]">
                  <div>
                    <dt className="text-muted">Verkauft</dt>
                    <dd className="font-medium text-ink">{dateDE(v.sale.soldAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Übergeben</dt>
                    <dd className="font-medium text-ink">{v.sale.handedOverAt ? dateDE(v.sale.handedOverAt) : "–"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Gewährleistung</dt>
                    <dd className={cx("font-medium", w?.active ? "text-emerald-700" : "text-muted")}>{w ? (w.active ? `noch ${w.days} Tage` : "abgelaufen") : "keine"}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  {!v.sale.handedOverAt ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          openTasks &&
                          !(await confirmDialog({ title: "Noch offene Aufgaben", message: `Es gibt noch ${openTasks} offene Aufgabe(n). Trotzdem übergeben?`, confirmLabel: "Trotzdem übergeben" }))
                        )
                          return;
                        patch({ action: "handover" }, "handover");
                      }}
                      disabled={Boolean(busy)}
                      className="btn btn-primary btn-sm"
                    >
                      {busy === "handover" ? <Loader2 className="animate-spin" /> : <Truck />} Übergeben
                    </button>
                  ) : null}
                  {!hasContract(v.sale) ? (
                    <button
                      type="button"
                      onClick={async () =>
                        (await confirmDialog({ title: "Wieder verfügbar", message: "Fahrzeug wieder als verfügbar markieren (auch auf der Website)?", confirmLabel: "Ja, verfügbar" })) &&
                        patch({ action: "available" }, "available")
                      }
                      disabled={Boolean(busy)}
                      className="btn btn-secondary btn-sm"
                    >
                      <RotateCcw /> Wieder verfügbar
                    </button>
                  ) : null}
                </div>
              </div>
            ) : sold.open ? (
              <div className="grid grid-cols-6 gap-2.5">
                <Field label="Käufer" id="s-name" required className="col-span-6 sm:col-span-3">
                  <input id="s-name" className="field" value={sold.buyerName} onChange={(ev) => setSold({ ...sold, buyerName: ev.target.value })} autoFocus />
                </Field>
                <Field label="Telefon" id="s-phone" className="col-span-3 sm:col-span-2">
                  <input id="s-phone" className="field" value={sold.buyerPhone} onChange={(ev) => setSold({ ...sold, buyerPhone: ev.target.value })} />
                </Field>
                <Field label="Datum" id="s-date" className="col-span-3 sm:col-span-1">
                  <input id="s-date" type="date" className="field px-1.5" value={sold.date} onChange={(ev) => setSold({ ...sold, date: ev.target.value })} />
                </Field>
                <div className="col-span-6 flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSold({ ...sold, open: false })}>
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy === "sold" || !sold.buyerName.trim()}
                    onClick={async () => {
                      if (await patch({ action: "sold", ...sold }, "sold")) setSold({ open: false, buyerName: "", buyerPhone: "", date: berlinDay() });
                    }}
                  >
                    {busy === "sold" ? <Loader2 className="animate-spin" /> : null} Als verkauft speichern
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <button type="button" onClick={() => setSold({ ...sold, open: true })} className="btn btn-secondary btn-sm">
                  Als verkauft markieren
                </button>
                <Link href={`/kaufvertrag/form${v.vin ? `?fin=${v.vin}` : ""}`} className="btn btn-primary btn-sm">
                  <FilePlus2 /> Kaufvertrag
                </Link>
                <Link href={`/kaufvertrag/privat${v.vin ? `?fin=${v.vin}` : ""}`} className="btn btn-secondary btn-sm" title="Privater Kaufvertrag (TÜV-SÜD-Formular)">
                  <FileText /> Privat
                </Link>
              </div>
            )}
          </Section>

          {/* Data – read view, the form only after "Bearbeiten" */}
          <Section
            title="Daten"
            action={
              editing ? null : (
                <span className="flex items-center gap-2">
                  {v.tankEmpty ? <span className="rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[11.5px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25">Tank leer</span> : null}
                <button type="button" onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                  {saved ? <CheckCircle2 className="text-emerald-600" /> : <Pencil />} {saved ? "Gespeichert" : "Bearbeiten"}
                </button>
                </span>
              )
            }
          >
            <div>
              {editing ? (
                <>
                {/* Status */}
                <EditGroup>
                  <div className="col-span-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="ind-seg inline-flex max-w-full overflow-x-auto">
                      {PHASES.filter((p) => p.key !== "verkauft" || v.phase === "verkauft").map((p) => (
                        <button key={p.key} type="button" onClick={() => set("phase", p.key)} className={cx("ind-seg-btn ind-seg-sm", e.phase === p.key && "ind-seg-on")}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <label className={cx("ind-toggle", e.tankEmpty && "ind-toggle-on")}>
                      <input type="checkbox" checked={e.tankEmpty} onChange={(ev) => set("tankEmpty", ev.target.checked)} className="sr-only" />
                      <span className="ind-toggle-box" aria-hidden />
                      Tank leer
                    </label>
                  </div>
                </EditGroup>

                {/* Vehicle */}
                <EditGroup>
                  <Field label="Bezeichnung" id="e-name" className="col-span-6">
                    <input id="e-name" className="field" value={e.name} onChange={(ev) => set("name", ev.target.value)} />
                  </Field>
                  <Field label="FIN" id="e-vin" className="col-span-6 sm:col-span-4">
                    <input id="e-vin" className="field font-mono uppercase" value={e.vin} onChange={(ev) => set("vin", ev.target.value.toUpperCase())} maxLength={21} />
                  </Field>
                  <Field label="Erstzulassung" id="e-ez" className="col-span-6 sm:col-span-2">
                    <input id="e-ez" className="field" value={e.firstRegistration} onChange={(ev) => set("firstRegistration", ev.target.value)} placeholder="MM/JJJJ" />
                  </Field>
                  <Field label="Kilometer" id="e-km" className="col-span-2">
                    <input id="e-km" className="field" inputMode="numeric" value={e.mileage} onChange={(ev) => set("mileage", ev.target.value)} />
                  </Field>
                  <Field label="Vorbesitzer" id="e-owners" className="col-span-2">
                    <input id="e-owners" type="number" min={0} max={20} className="field" value={e.owners} onChange={(ev) => set("owners", ev.target.value)} />
                  </Field>
                  <Field label="Preis (€)" id="e-price" className="col-span-2">
                    <input id="e-price" className="field" inputMode="decimal" value={e.price} onChange={(ev) => set("price", ev.target.value)} />
                  </Field>
                </EditGroup>

                {e.phase === "werkstatt" ? (
                  <EditGroup>
                    <Field label="Werkstatt (wo)" id="e-wwhere" className="col-span-6 sm:col-span-2">
                      <input id="e-wwhere" className="field" value={e.werkstattWhere} onChange={(ev) => set("werkstattWhere", ev.target.value)} placeholder="z. B. Toni" />
                    </Field>
                    <Field label="Was wird gemacht" id="e-wwhat" className="col-span-6 sm:col-span-4">
                      <input id="e-wwhat" className="field" value={e.werkstattWhat} onChange={(ev) => set("werkstattWhat", ev.target.value)} placeholder="z. B. Bremsen vorne" />
                    </Field>
                  </EditGroup>
                ) : null}

                {/* Keys */}
                <EditGroup>
                  <Field label="Schlüssel-Nr." id="e-key" className="col-span-3">
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                      <input id="e-key" className="field pl-8" value={e.keyNumber} onChange={(ev) => set("keyNumber", ev.target.value)} placeholder="frei" />
                    </div>
                  </Field>
                  <Field label="Anzahl" id="e-keys" className="col-span-2">
                    <input id="e-keys" type="number" min={0} max={9} className="field" value={e.keyCount} onChange={(ev) => set("keyCount", ev.target.value)} />
                  </Field>
                  <Field label="Farbe" id="e-keycolor" className="col-span-1">
                    <input id="e-keycolor" type="color" className="field h-[34px] cursor-pointer p-1" value={e.keyColor} onChange={(ev) => set("keyColor", ev.target.value)} />
                  </Field>
                  <Field label="Notiz zum Schlüssel" id="e-keynote" className="col-span-6">
                    <input id="e-keynote" className="field" maxLength={200} value={e.keyNote} onChange={(ev) => set("keyNote", ev.target.value)} placeholder="z. B. Zweitschlüssel im Tresor" />
                  </Field>
                </EditGroup>

                {/* Inspection + plate */}
                <EditGroup>
                  <Field label="TÜV-Status" id="e-tuev" className="col-span-3 sm:col-span-2">
                    <select id="e-tuev" className="field" value={e.tuevStatus} onChange={(ev) => set("tuevStatus", ev.target.value)}>
                      {TUEV_STATUS.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="TÜV bis" id="e-tuevu" className="col-span-3 sm:col-span-2">
                    <input id="e-tuevu" className="field" value={e.tuevUntil} onChange={(ev) => set("tuevUntil", ev.target.value)} placeholder="MM/JJJJ" />
                  </Field>
                  <div className="col-span-6 sm:col-span-2">
                    <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">Rotes Kennzeichen</p>
                    {(data.redPlates || []).length ? (
                      <div className="flex min-h-[34px] flex-wrap items-center gap-x-3 gap-y-1.5">
                        {data.redPlates.map((r) => (
                          <PlateBadge key={r.plateId} number={r.number} size="xs" />
                        ))}
                      </div>
                    ) : (
                      <p className="flex h-[34px] items-center text-[12.5px] text-muted">nicht zugeordnet</p>
                    )}
                  </div>
                  {e.tuevStatus === "failed" ? (
                    <Field label="Mängel (eine Zeile pro Mangel)" id="e-issues" className="col-span-6">
                      <textarea id="e-issues" rows={3} className="field" value={e.tuevIssues} onChange={(ev) => set("tuevIssues", ev.target.value)} placeholder="z. B. Bremsscheiben vorne" />
                    </Field>
                  ) : null}
                </EditGroup>

                </>
              ) : (
                <ReadFacts v={v} redPlates={data.redPlates || []} />
              )}

              {/* Tasks */}
              <div className="py-2.5">
                <Panel
                  title="Aufgaben"
                  count={data.tasks.length || null}
                  progress={data.tasks.length ? (data.tasks.length - openTasks) / data.tasks.length : null}
                >
                  {data.tasks.length ? (
                    <ul>
                      {data.tasks.map((t) => (
                        <TaskRow key={t._id} task={t} onToggle={tick} onDelete={removeTask} busy={busyTask === t._id} />
                      ))}
                    </ul>
                  ) : null}
                  <form
                    className={cx("flex items-center gap-2 bg-[#fafbfb] px-3.5 py-2", data.tasks.length && "border-t border-[#e3e6ea]")}
                    onSubmit={async (ev) => {
                      ev.preventDefault();
                      if (taskTitle.trim() && (await patch({ action: "task", title: taskTitle }, "task"))) setTaskTitle("");
                    }}
                  >
                    <Plus className="h-4 w-4 shrink-0 text-[#8a929c]" />
                    <input
                      className="h-7 min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-[#a3aab3]"
                      value={taskTitle}
                      onChange={(ev) => setTaskTitle(ev.target.value)}
                      placeholder="Neue Aufgabe eingeben und Enter drücken"
                    />
                    {taskTitle.trim() ? (
                      <button type="submit" className="btn btn-secondary btn-sm shrink-0" disabled={busy === "task"}>
                        {busy === "task" ? <Loader2 className="animate-spin" /> : null} Hinzufügen
                      </button>
                    ) : null}
                  </form>
                </Panel>
              </div>

              {/* Notes */}
              {editing ? (
                <>
                  <EditGroup>
                    <Field label="Notiz" id="e-notes" className="col-span-6">
                      <textarea id="e-notes" rows={3} className="field" value={e.notes} onChange={(ev) => set("notes", ev.target.value)} placeholder="Interne Notizen zum Fahrzeug …" />
                    </Field>
                  </EditGroup>
                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={cancelEdit} disabled={busy === "save"} className="btn btn-secondary btn-sm">
                      Abbrechen
                    </button>
                    <button type="button" onClick={saveEdit} disabled={busy === "save"} className="btn btn-primary btn-sm">
                      {busy === "save" ? <Loader2 className="animate-spin" /> : null} Änderungen speichern
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </Section>

          {/* Claims */}
          <Section>
            <Panel
              title="Reklamationen"
              count={v.claims.length || null}
              meta={v.claims.length ? `gesamt ${formatEuro(claimsTotal)}` : ""}
              actions={
                !claim.open ? (
                  <button type="button" onClick={() => setClaim({ ...claim, open: true })} className="btn btn-secondary btn-sm">
                    <Plus /> Reklamation
                  </button>
                ) : null
              }
            >
              {v.claims.length ? (
                <ul>
                  {v.claims.map((c) => (
                    <li key={c._id} className="group/c flex items-center gap-3 border-b border-[#eceef1] px-3.5 py-2.5 last:border-b-0">
                      <span className="w-[72px] shrink-0 text-[11.5px] tabular-nums text-[#6b7480]">{dateDE(c.date)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{c.what}</span>
                        {c.where ? (
                          <span className="flex items-center gap-1 truncate text-[11.5px] text-muted">
                            <Wrench className="h-3 w-3 shrink-0" /> {c.where}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">{formatEuro(c.cost)}</span>
                      <button
                        type="button"
                        onClick={async () => (await confirmDialog("Reklamation entfernen?")) && patch({ action: "removeClaim", claimId: c._id }, "claim")}
                        className="shrink-0 rounded-[3px] p-1 text-[#a3aab3] opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover/c:opacity-100 focus:opacity-100"
                        aria-label="Entfernen"
                        title="Entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {claim.open ? (
                <div className={cx("grid grid-cols-6 gap-2.5 bg-[#f6f7f8] p-3.5", v.claims.length && "border-t border-[#e3e6ea]")}>
                  <Field label="Was" id="r-what" required className="col-span-6">
                    <input id="r-what" className="field" value={claim.what} onChange={(ev) => setClaim({ ...claim, what: ev.target.value })} placeholder="z. B. Bremsen hinten quietschen" autoFocus />
                  </Field>
                  <Field label="Wo repariert" id="r-where" className="col-span-6 sm:col-span-3">
                    <input id="r-where" className="field" value={claim.where} onChange={(ev) => setClaim({ ...claim, where: ev.target.value })} />
                  </Field>
                  <Field label="Datum" id="r-date" className="col-span-3 sm:col-span-2">
                    <input id="r-date" type="date" className="field px-1.5" value={claim.date} onChange={(ev) => setClaim({ ...claim, date: ev.target.value })} />
                  </Field>
                  <Field label="Kosten €" id="r-cost" className="col-span-3 sm:col-span-1">
                    <input id="r-cost" className="field" inputMode="decimal" value={claim.cost} onChange={(ev) => setClaim({ ...claim, cost: ev.target.value })} />
                  </Field>
                  <div className="col-span-6 flex justify-end gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setClaim({ ...claim, open: false })}>
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busy === "claim" || !claim.what.trim()}
                      onClick={async () => {
                        if (await patch({ action: "claim", ...claim }, "claim")) setClaim({ open: false, date: berlinDay(), what: "", where: "", cost: "" });
                      }}
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              ) : null}
            </Panel>
          </Section>

          {/* Registration photo */}
          <Section>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(ev) => upload(ev.target.files?.[0])} />
            <Panel
              title="Fahrzeugschein"
              actions={
                v.hasRegistrationPhoto ? (
                  <span className="ind-actions">
                    <a href={v.imageUrl} target="_blank" rel="noreferrer" className="ind-act" title="In neuem Tab öffnen" aria-label="Öffnen">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </a>
                    <button type="button" onClick={() => fileInput.current?.click()} className="ind-act" title="Ersetzen" aria-label="Ersetzen">
                      <ImageUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={removePhoto} className="ind-act ind-act-danger" title="Entfernen" aria-label="Entfernen">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : null
              }
            >
              {busy === "photo" ? (
                <p className="flex items-center gap-2 px-3.5 py-6 text-[13px] text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> wird hochgeladen …
                </p>
              ) : v.hasRegistrationPhoto ? (
                <a href={v.imageUrl} target="_blank" rel="noreferrer" className="block bg-[repeating-linear-gradient(135deg,#eef0f2_0_8px,#e7eaed_8px_16px)] p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.imageUrl}
                    alt="Fahrzeugschein"
                    className="mx-auto max-h-64 w-auto rounded-[2px] bg-white object-contain shadow-[0_2px_8px_rgba(20,26,33,0.18)] ring-1 ring-[#cfd4da]"
                  />
                </a>
              ) : (
                <button type="button" onClick={() => fileInput.current?.click()} className="group/u flex w-full flex-col items-center justify-center gap-2 px-3 py-7 text-[12.5px] text-muted transition hover:bg-[#f6f7f8]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfd4da] bg-gradient-to-b from-white to-[#eceef1] text-[#5d6671] transition group-hover/u:text-ink">
                    <ImageUp className="h-4.5 w-4.5" />
                  </span>
                  Foto aufnehmen oder auswählen
                </button>
              )}
            </Panel>
          </Section>

          
          {/* Delete */}
          <Section className="flex justify-end py-3!">
            <button type="button" onClick={removeVehicle} disabled={busy === "delete"} className="btn btn-secondary btn-sm text-rose-700" title="Fahrzeug löschen">
              {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Fahrzeug löschen
            </button>
          </Section>
        </>
      )}
    </Drawer>
  );
}
