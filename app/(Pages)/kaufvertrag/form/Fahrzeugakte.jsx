"use client";

/**
 * Kaufvertrag — a compact summary of the car's entry in the
 * Fahrzeugverwaltung beside the contract: phase, warnings before the
 * handover, TÜV, keys, tasks and the registration photo (one click).
 * TÜV and keys are filled into the contract when those fields are empty.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiAlertTriangle, FiCheck, FiCopy, FiDroplet, FiExternalLink, FiFileText, FiShield, FiShoppingBag } from "react-icons/fi";

import { updateSchein } from "@/app/(Pages)/Fahrzeugverwaltung/_components/api";
import { formatDate, normalizeStage, notesOf, soldContactOf } from "@/app/(Pages)/Fahrzeugverwaltung/_components/constants";
import { StageBadge } from "@/app/(Pages)/Fahrzeugverwaltung/_components/ui";
import ImagePreviewModal from "@/app/(Pages)/Fahrzeugverwaltung/_components/ImagePreviewModal";
import { printSchein } from "@/app/(Pages)/Fahrzeugverwaltung/_components/printSchein";
import { euro, inspection, km, priceOf } from "@/lib/cars/format";

/* ------------------------------------------------------------ facts */

function rotPlateText(schein) {
  if (!schein?.rotKennzeichen) return "";
  if (schein.rotPlateNumber === "BEIDE") return "DN-06919 + DN-06921";
  return schein.rotPlateNumber || "Ja";
}

/**
 * The TÜV for the contract: from the Fahrzeugverwaltung first (TÜV entered
 * for the car in Boora, or TÜV passed), otherwise from the mobile.de ad.
 * → { value: "05/2027" | "neu", text, expired, source } or null
 */
export function tuevOf(schein, websiteCar) {
  const stage = normalizeStage(schein?.stage);
  const meta = schein?.stageMeta || {};
  const fromAd = websiteCar ? inspection(websiteCar) : null;
  const adValue = fromAd ? (fromAd === "HU/AU neu" ? "neu" : fromAd) : "";

  // Failed TÜV: the old HU from the ad must not go into the contract.
  if (stage === "TUEV" && !meta.tuev?.passed) {
    return { value: "", text: "Nicht bestanden", expired: false, failed: true, source: "Fahrzeugverwaltung", adValue };
  }

  const platz = meta.platz || {};
  if (platz.hasTuev) {
    const match = String(platz.tuevUntil || "").match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const now = new Date();
      const expired = Number(match[1]) * 12 + Number(match[2]) < now.getFullYear() * 12 + now.getMonth() + 1;
      return { value: `${match[2]}/${match[1]}`, text: `${expired ? "abgelaufen" : "bis"} ${match[2]}/${match[1]}`, expired, source: "Fahrzeugverwaltung", adValue };
    }
  }
  if (stage === "TUEV" && meta.tuev?.passed) {
    return { value: "neu", text: "Neu · bestanden", expired: false, source: "Fahrzeugverwaltung", adValue };
  }

  if (adValue) {
    return { value: adValue, text: adValue === "neu" ? "HU/AU neu" : `bis ${adValue}`, expired: false, source: "mobile.de-Inserat", adValue };
  }
  if (platz.hasTuev) return { value: "", text: "Vorhanden", expired: false, source: "Fahrzeugverwaltung", adValue };
  return null;
}

/** Number of keys for the contract, or null when unknown. */
export function keysOf(schein) {
  const count = Number(schein?.keyCount);
  return Number.isFinite(count) && count > 0 ? count : null;
}

function daysSince(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

/* ------------------------------------------------------------ building blocks */

function Shell({ right, children }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-[12px] shadow-sm">
      <div className="flex h-9 items-center justify-between gap-2 border-b border-slate-100 px-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Fahrzeugakte</h3>
        <div className="flex items-center gap-1.5">{right}</div>
      </div>
      {children}
    </div>
  );
}

function Note({ children }) {
  return <p className="px-3 py-3 text-slate-500">{children}</p>;
}

/** One fact: label left, value right. */
function Row({ label, children, extra }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-slate-900">
        {children}
        {extra ? <span className="block text-[11px] font-normal text-slate-500">{extra}</span> : null}
      </dd>
    </div>
  );
}

const WARN_ICON = { red: "text-red-600", amber: "text-amber-600" };

function Warning({ tone, icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <Icon className={`mt-0.5 size-3.5 shrink-0 ${WARN_ICON[tone]}`} />
      <span className={tone === "red" ? "text-red-800" : "text-slate-800"}>{children}</span>
    </li>
  );
}

/** Car name and FIN (click copies the FIN). */
function Identity({ name, fin }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fin);
      setCopied(true);
    } catch {
      toast.error("Kopieren nicht möglich");
    }
  };

  return (
    <div className="border-b border-slate-100 px-3 py-2">
      <p className="truncate text-[13px] font-semibold leading-tight text-slate-900">{name || "Fahrzeug"}</p>
      {fin ? (
        <button
          type="button"
          onClick={copy}
          title="FIN kopieren"
          className="group mt-0.5 inline-flex max-w-full items-center gap-1.5 font-mono text-[11.5px] uppercase tracking-wide text-slate-500 hover:text-slate-900"
        >
          <span className="truncate">{fin}</span>
          {copied ? <FiCheck className="size-3 shrink-0 text-slate-900" strokeWidth={3} /> : <FiCopy className="size-3 shrink-0 opacity-60 group-hover:opacity-100" />}
        </button>
      ) : null}
    </div>
  );
}

/** The ad this contract was started from: price, km and links. */
function AdLine({ car }) {
  const facts = [euro(priceOf(car)), km(car.mileage)].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-1.5 text-slate-600">
      <span className="truncate tabular-nums">{facts}</span>
      <span className="flex shrink-0 items-center gap-2.5 text-[11.5px]">
        <a href={`/gebrauchtwagen/${car._id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-slate-900 hover:underline">
          Inserat <FiExternalLink className="size-2.5" />
        </a>
        {car.detailPageUrl ? (
          <a href={car.detailPageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-slate-900 hover:underline">
            mobile.de <FiExternalLink className="size-2.5" />
          </a>
        ) : null}
      </span>
    </div>
  );
}

/** Tasks with tick boxes; a tick is saved in the Fahrzeugverwaltung at once. */
function Tasks({ schein, onSaved }) {
  const notes = notesOf(schein);
  const [done, setDone] = useState(() => schein.completedTasks || []);
  const [busy, setBusy] = useState(false);

  useEffect(() => setDone(schein.completedTasks || []), [schein]);

  // Only tasks that are still on the list count (old ticks of deleted tasks don't).
  const finished = notes.filter((note) => done.includes(note)).length;
  const open = notes.length - finished;

  const toggle = async (task) => {
    if (busy || !schein._id) return;
    const before = done;
    const next = (done.includes(task) ? done.filter((entry) => entry !== task) : [...done, task]).filter((entry) => notes.includes(entry));
    setDone(next);
    setBusy(true);
    try {
      onSaved(await updateSchein(schein._id, { completedTasks: next }));
    } catch (error) {
      setDone(before);
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-slate-100 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-semibold text-slate-700">Aufgaben</span>
        {notes.length ? (
          <span className={`text-[11px] tabular-nums ${open ? "font-medium text-amber-700" : "text-slate-500"}`}>
            {open ? `${open} offen · ` : ""}
            {finished}/{notes.length}
          </span>
        ) : null}
      </div>
      {notes.length ? (
        <ul>
          {notes.map((note, index) => {
            const checked = done.includes(note);
            return (
              <li key={`${index}-${note}`}>
                <button
                  type="button"
                  onClick={() => toggle(note)}
                  disabled={busy}
                  className="-mx-1 flex w-[calc(100%+0.5rem)] items-start gap-2 rounded px-1 py-1 text-left transition hover:bg-slate-50 disabled:cursor-wait"
                >
                  <span
                    className={`mt-px flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                      checked ? "border-slate-700 bg-slate-700 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {checked ? <FiCheck className="size-2.5" strokeWidth={3.5} /> : null}
                  </span>
                  <span className={checked ? "text-slate-400 line-through" : "text-slate-800"}>{note}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-slate-400">Keine Aufgaben</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ card */

export default function Fahrzeugakte({ status, schein, websiteCar, onSaved }) {
  const [viewer, setViewer] = useState(false);
  // Stable, so the open viewer does not reset its rotation on every render.
  const closeViewer = useCallback(() => setViewer(false), []);

  if (!schein) {
    const text =
      status === "loading"
        ? "Wird geladen …"
        : status === "missing"
          ? "Kein Eintrag in der Fahrzeugverwaltung."
          : status === "error"
            ? "Fahrzeugakte konnte nicht geladen werden."
            : "Fahrgestellnummer eingeben, um die Fahrzeugakte zu laden.";
    return (
      <Shell>
        {websiteCar ? <AdLine car={websiteCar} /> : null}
        <Note>{text}</Note>
      </Shell>
    );
  }

  const stage = normalizeStage(schein.stage);
  const meta = schein.stageMeta || {};
  const tuev = tuevOf(schein, websiteCar);
  const keys = keysOf(schein);
  const rot = rotPlateText(schein);
  const issues = Array.isArray(meta.tuev?.issues) ? meta.tuev.issues.filter(Boolean) : [];
  const buyer = soldContactOf(schein);
  const since = schein.boughtAt || schein.createdAt;
  const standing = daysSince(since);
  const werkstatt = [meta.werkstatt?.where, meta.werkstatt?.what].filter(Boolean).join(" · ");
  const adDiffers = tuev?.adValue && tuev.source !== "mobile.de-Inserat" && tuev.adValue !== tuev.value;

  const warnings = [];
  if (schein.keySold || stage === "SOLD") {
    warnings.push(
      <Warning key="sold" tone="red" icon={FiShoppingBag}>
        <b className="font-semibold">Bereits verkauft</b>
        {schein.soldAt ? ` am ${formatDate(schein.soldAt)}` : ""}
        {buyer?.customerName ? ` an ${buyer.customerName}` : ""}
      </Warning>,
    );
  }
  if (tuev?.failed) {
    warnings.push(
      <Warning key="tuev" tone="red" icon={FiShield}>
        <b className="font-semibold">TÜV nicht bestanden</b>
        {issues.length ? ` – ${issues.join(", ")}` : ""}
      </Warning>,
    );
  }
  if (tuev?.expired) {
    warnings.push(
      <Warning key="expired" tone="red" icon={FiShield}>
        <b className="font-semibold">TÜV abgelaufen</b> ({tuev.value})
      </Warning>,
    );
  }
  if (schein.fuelNeeded) {
    warnings.push(
      <Warning key="fuel" tone="amber" icon={FiDroplet}>
        Tank leer – vor Übergabe tanken
      </Warning>,
    );
  }
  if (rot) {
    warnings.push(
      <Warning key="rot" tone="amber" icon={FiAlertTriangle}>
        Rotkennzeichen {rot} noch am Fahrzeug
      </Warning>,
    );
  }

  return (
    <Shell
      right={
        <>
          <StageBadge stage={schein.stage} stageMeta={schein.stageMeta} className="!px-1.5 !py-0 !text-[11px]" />
          {schein.imageUrl ? (
            <button
              type="button"
              onClick={() => setViewer(true)}
              title="Fahrzeugschein ansehen"
              className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2 text-[11.5px] font-medium text-white transition hover:bg-emerald-700"
            >
              <FiFileText className="size-3" /> Schein
            </button>
          ) : null}
        </>
      }
    >
      <Identity name={schein.carName} fin={String(schein.finNumber || "").replace(/\s+/g, "")} />
      {websiteCar ? <AdLine car={websiteCar} /> : null}

      {warnings.length ? <ul className="border-b border-slate-100 px-3 py-1.5">{warnings}</ul> : null}

      <dl className="divide-y divide-slate-100 px-3 py-0.5">
        <Row label="TÜV / HU" extra={adDiffers ? <span className="text-amber-700">Inserat: {tuev.adValue}</span> : null}>
          {tuev ? (
            <span className={tuev.failed || tuev.expired ? "text-red-700" : ""} title={`laut ${tuev.source}`}>
              {tuev.text}
            </span>
          ) : (
            <span className="font-normal text-slate-400">–</span>
          )}
        </Row>
        <Row label="Schlüssel" extra={schein.keyNote || null}>
          <span className="inline-flex items-center gap-1.5">
            {schein.keyColor ? (
              <span className="inline-block size-2.5 rounded-full ring-1 ring-inset ring-black/15" style={{ background: schein.keyColor }} />
            ) : null}
            {keys ? `${keys} Stück` : "–"}
            {schein.keyNumber ? <span className="font-normal text-slate-500">· Nr. {schein.keyNumber}</span> : null}
          </span>
        </Row>
        {stage === "WERKSTATT" && werkstatt ? <Row label="Werkstatt">{werkstatt}</Row> : null}
        {stage === "PLATZ" && meta.platz?.note ? <Row label="Stellplatz">{meta.platz.note}</Row> : null}
        {standing != null ? (
          <Row label="Standzeit">
            <span className={standing > 90 ? "text-amber-700" : ""}>
              {standing} {standing === 1 ? "Tag" : "Tage"}
            </span>
          </Row>
        ) : null}
      </dl>

      <Tasks schein={schein} onSaved={onSaved} />

      <ImagePreviewModal open={viewer && Boolean(schein.imageUrl)} schein={schein} onClose={closeViewer} onPrint={() => printSchein(schein)} />
    </Shell>
  );
}
