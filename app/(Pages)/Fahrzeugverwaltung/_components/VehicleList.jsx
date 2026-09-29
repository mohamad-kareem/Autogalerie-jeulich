"use client";

/**
 * The vehicles: a table on a computer, compact rows on a phone, 25 per page.
 * A click on a row opens its details. Each row has its own buttons for the
 * registration photo and printing; the rest sits in the row's "⋯" menu.
 */

import { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiDroplet,
  FiEdit2,
  FiFileText,
  FiInfo,
  FiKey,
  FiLayers,
  FiPrinter,
  FiShield,
  FiTrash2,
} from "react-icons/fi";

import { PAGE_SIZE, computeWarranty, formatDate, platzTuev, stageDetail } from "./constants";
import { ActionMenu, FinCopy, IconButton, StageBadge, theme } from "./ui";

/* ------------------------------------------------------------ cells */

/** Sold cars: how long the warranty still runs, and any claims. */
function WarrantyLine({ schein, dark, onClick }) {
  const warranty = computeWarranty(schein);
  const t = theme(dark);
  const claims = Array.isArray(schein.reclamations) ? schein.reclamations.length : 0;
  let text = <span className={t.muted}>Verkaufsdatum fehlt</span>;
  if (warranty.status === "active") {
    text = (
      <span className={`inline-flex items-center gap-1 ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
        <FiShield className="size-3" /> Garantie noch {warranty.remainingDays} Tage
      </span>
    );
  } else if (warranty.status === "expired") {
    text = <span className={dark ? "text-slate-400" : "text-slate-500"}>Garantie abgelaufen</span>;
  }
  return (
    <button
      type="button"
      title="Garantie & Reklamation"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex max-w-full items-center gap-1.5 truncate text-[12px] hover:underline"
    >
      {text}
      {claims ? (
        <span className={dark ? "text-amber-300" : "text-amber-700"}>
          · {claims} {claims === 1 ? "Reklamation" : "Reklamationen"}
        </span>
      ) : null}
    </button>
  );
}

/** In Boora: "TÜV bis 05/2027" in blue (red once it has run out). */
function TuevLine({ schein, dark }) {
  const tuev = platzTuev(schein);
  if (!tuev) return null;
  const tone = tuev.expired ? (dark ? "text-red-400" : "text-red-600") : dark ? "text-sky-400" : "text-sky-700";
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${tone}`}>
      <FiShield className="size-3" /> {tuev.text}
    </span>
  );
}

function PhaseCell({ schein, dark, onAction }) {
  const detail = stageDetail(schein);
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <StageBadge stage={schein.stage} stageMeta={schein.stageMeta} dark={dark} onClick={() => onAction("stage", schein)} />
      {schein.keySold ? (
        <WarrantyLine schein={schein} dark={dark} onClick={() => onAction("warranty", schein)} />
      ) : (
        <>
          <TuevLine schein={schein} dark={dark} />
          {detail ? <span className={`max-w-full truncate text-[12px] ${theme(dark).muted}`}>{detail}</span> : null}
        </>
      )}
    </div>
  );
}

function VehicleName({ schein, dark }) {
  const t = theme(dark);
  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-[14px] font-medium ${t.title}`}>
      <span className="truncate">{schein.carName || "–"}</span>
      {schein.fuelNeeded ? (
        <FiDroplet title="Tank leer – auffüllen" aria-label="Tank leer" className="size-3.5 shrink-0 text-amber-500" />
      ) : null}
    </p>
  );
}

/** Schein, Drucken and the "⋯" menu, side by side. */
function RowActions({ schein, dark, onAction }) {
  return (
    <div className="flex items-center justify-end gap-0.5" onClick={(event) => event.stopPropagation()}>
      <IconButton
        dark={dark}
        title={schein.imageUrl ? "Fahrzeugschein ansehen" : "Kein Fahrzeugschein hochgeladen"}
        disabled={!schein.imageUrl}
        onClick={() => onAction("image", schein)}
        className="disabled:cursor-not-allowed disabled:opacity-30"
      >
        <FiFileText className="size-4" />
      </IconButton>
      <IconButton dark={dark} title="Drucken" onClick={() => onAction("print", schein)}>
        <FiPrinter className="size-4" />
      </IconButton>
      <span className={`mx-0.5 h-4 w-px ${dark ? "bg-slate-700" : "bg-slate-200"}`} aria-hidden="true" />
      <ActionMenu dark={dark} items={menuItems(schein, onAction)} />
    </div>
  );
}

function menuItems(schein, onAction) {
  return [
    { key: "details", label: "Details", icon: FiInfo, onClick: () => onAction("details", schein) },
    { key: "edit", label: "Bearbeiten", icon: FiEdit2, onClick: () => onAction("edit", schein) },
    { key: "key", label: "Schlüssel & Status", icon: FiKey, onClick: () => onAction("key", schein) },
    { key: "stage", label: "Phase ändern", icon: FiLayers, onClick: () => onAction("stage", schein) },
    // Warranty only exists once a car is sold.
    ...(schein.keySold ? [{ key: "warranty", label: "Garantie & Reklamation", icon: FiShield, onClick: () => onAction("warranty", schein) }] : []),
    { key: "d1", divider: true },
    { key: "delete", label: "Löschen", icon: FiTrash2, danger: true, onClick: () => onAction("delete", schein) },
  ];
}

/* ------------------------------------------------------------ list */

export default function VehicleList({ scheins, loading, dark, onAction, resetKey }) {
  const t = theme(dark);
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(scheins.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  // A new search or filter starts at the first page.
  useEffect(() => setPage(1), [resetKey]);

  const visible = useMemo(() => scheins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [scheins, page]);
  const rowDivider = dark ? "divide-slate-800" : "divide-slate-100";

  if (loading) {
    return (
      <div className={`divide-y ${rowDivider}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-6 px-5 py-4">
            <div className="space-y-2">
              <div className={`h-3.5 w-44 rounded ${t.skeleton}`} />
              <div className={`h-3 w-32 rounded ${t.skeleton}`} />
            </div>
            <div className={`ml-auto h-3.5 w-24 rounded ${t.skeleton}`} />
          </div>
        ))}
      </div>
    );
  }

  if (!scheins.length) {
    return (
      <div className="px-6 py-16 text-center">
        <p className={`text-[14px] font-medium ${t.title}`}>Keine Fahrzeuge gefunden</p>
        <p className={`mt-1 text-[13px] ${t.muted}`}>Suchbegriff oder Filter anpassen.</p>
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, scheins.length);
  const openRow = (schein) => onAction("details", schein);

  return (
    <>
      {/* phone */}
      <ul className={`divide-y md:hidden ${rowDivider}`}>
        {visible.map((schein) => (
          <li key={schein._id} className="space-y-2 px-4 py-3" onClick={() => openRow(schein)}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <VehicleName schein={schein} dark={dark} />
              </div>
              <RowActions schein={schein} dark={dark} onAction={onAction} />
            </div>
            <FinCopy fin={schein.finNumber} dark={dark} />
            <PhaseCell schein={schein} dark={dark} onAction={onAction} />
          </li>
        ))}
      </ul>

      {/* computer */}
      <table className="hidden w-full text-left md:table">
        <thead className={`border-b text-[12px] font-medium ${t.divider} ${t.muted}`}>
          <tr>
            <th className="px-5 py-2.5 font-medium">Fahrzeug</th>
            <th className="px-3 py-2.5 font-medium">FIN</th>
            <th className="px-3 py-2.5 font-medium">Schlüssel</th>
            <th className="px-3 py-2.5 font-medium">Phase</th>
            <th className="px-3 py-2.5 font-medium">Hinzugefügt</th>
            <th className="w-36 px-3 py-2.5" aria-label="Aktionen" />
          </tr>
        </thead>
        <tbody className={`divide-y ${rowDivider}`}>
          {visible.map((schein) => (
            <tr key={schein._id} onClick={() => openRow(schein)} className={`cursor-pointer transition-colors ${t.rowHover}`}>
              <td className="max-w-[16rem] px-5 py-3">
                <VehicleName schein={schein} dark={dark} />
              </td>
              <td className="px-3 py-3">
                <FinCopy fin={schein.finNumber} dark={dark} />
              </td>
              <td className={`px-3 py-3 text-[13px] tabular-nums ${t.text}`}>{schein.keyNumber ? `Nr. ${schein.keyNumber}` : <span className={t.faint}>–</span>}</td>
              <td className="max-w-[18rem] px-3 py-3">
                <PhaseCell schein={schein} dark={dark} onAction={onAction} />
              </td>
              <td className={`whitespace-nowrap px-3 py-3 text-[13px] tabular-nums ${t.muted}`}>{formatDate(schein.createdAt)}</td>
              <td className="px-3 py-3">
                <RowActions schein={schein} dark={dark} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={`flex items-center justify-between gap-3 border-t px-5 py-3 text-[12px] ${t.divider} ${t.muted}`}>
        <span className="tabular-nums">
          {from}–{to} von {scheins.length}
        </span>
        {pages > 1 ? (
          <div className="flex items-center gap-1">
            <IconButton dark={dark} title="Vorherige Seite" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="disabled:opacity-30">
              <FiChevronLeft className="size-4" />
            </IconButton>
            <span className="px-1 tabular-nums">
              Seite {page} von {pages}
            </span>
            <IconButton dark={dark} title="Nächste Seite" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="disabled:opacity-30">
              <FiChevronRight className="size-4" />
            </IconButton>
          </div>
        ) : null}
      </div>
    </>
  );
}
