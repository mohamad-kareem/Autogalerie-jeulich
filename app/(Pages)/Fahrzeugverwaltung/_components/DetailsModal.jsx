"use client";

/**
 * One vehicle at a glance: the registration photo, its status, the facts in
 * clear groups and the task checklist (ticking a task saves it right away).
 */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiDroplet, FiEdit2, FiImage, FiPrinter } from "react-icons/fi";

import { updateSchein } from "./api";
import { addressOf, computeWarranty, formatDate, normalizeStage, notesOf, platzTuev, soldContactOf } from "./constants";
import { Button, FinCopy, InfoRow, InfoSection, Modal, ScheinThumb, StageBadge, theme } from "./ui";

function LinkButton({ dark, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] font-medium hover:underline ${dark ? "text-emerald-400" : "text-emerald-700"}`}
    >
      {children}
    </button>
  );
}

function Pill({ tone, children }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${tone}`}>{children}</span>;
}

function rotPlateText(schein) {
  if (!schein.rotKennzeichen) return "";
  if (schein.rotPlateNumber === "BEIDE") return "DN-06919 + DN-06921";
  return schein.rotPlateNumber || "Ja";
}

/** The task list with tick boxes and progress. */
function Checklist({ schein, dark, onSaved }) {
  const t = theme(dark);
  const notes = notesOf(schein);
  const [done, setDone] = useState(() => schein.completedTasks || []);
  const [busy, setBusy] = useState(false);

  useEffect(() => setDone(schein.completedTasks || []), [schein]);

  const toggle = async (task) => {
    if (busy) return;
    const before = done;
    const next = done.includes(task) ? done.filter((entry) => entry !== task) : [...done, task];
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

  const finished = notes.filter((note) => done.includes(note)).length;
  const percent = notes.length ? Math.round((finished / notes.length) * 100) : 0;

  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${t.faint}`}>Aufgaben</h3>
        {notes.length ? (
          <span className={`text-[12px] tabular-nums ${t.muted}`}>
            {finished} von {notes.length} erledigt
          </span>
        ) : null}
      </div>
      {notes.length ? (
        <div className={`overflow-hidden rounded-xl border ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <div className={`h-1 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <ul className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
            {notes.map((note, index) => {
              const checked = done.includes(note);
              return (
                <li key={`${index}-${note}`}>
                  <button
                    type="button"
                    onClick={() => toggle(note)}
                    className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] transition ${dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                  >
                    <span
                      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
                        checked ? "border-emerald-600 bg-emerald-600 text-white" : dark ? "border-slate-600" : "border-slate-300"
                      }`}
                    >
                      {checked ? <FiCheck className="size-3" strokeWidth={3} /> : null}
                    </span>
                    <span className={checked ? `${t.faint} line-through` : t.text}>{note}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className={`rounded-xl border border-dashed px-3.5 py-4 text-center text-[13px] ${dark ? "border-slate-800" : "border-slate-200"} ${t.faint}`}>
          Keine Aufgaben hinterlegt.
        </p>
      )}
    </section>
  );
}

export default function DetailsModal({ open, schein, dark, onClose, onEdit, onAction, onSaved }) {
  const t = theme(dark);
  if (!open || !schein) return null;

  const stage = normalizeStage(schein.stage);
  const meta = schein.stageMeta || {};
  const warranty = computeWarranty(schein);
  const buyer = soldContactOf(schein);
  const claims = Array.isArray(schein.reclamations) ? schein.reclamations.length : 0;
  const issues = Array.isArray(meta.tuev?.issues) ? meta.tuev.issues : [];
  const rot = rotPlateText(schein);
  const dash = <span className={t.faint}>–</span>;

  const amber = dark ? "bg-amber-400/10 text-amber-300 ring-amber-400/25" : "bg-amber-50 text-amber-800 ring-amber-600/20";
  const red = dark ? "bg-red-400/10 text-red-300 ring-red-400/25" : "bg-red-50 text-red-700 ring-red-600/20";

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      size="lg"
      title="Fahrzeugdetails"
      footer={
        <>
          <Button dark={dark} onClick={() => onAction("print")}>
            <FiPrinter className="size-4" /> Drucken
          </Button>
          <Button dark={dark} variant="primary" onClick={onEdit}>
            <FiEdit2 className="size-4" /> Bearbeiten
          </Button>
        </>
      }
    >
      {/* summary */}
      <div className="flex items-start gap-4">
        <ScheinThumb url={schein.imageUrl} dark={dark} size="size-20 sm:size-24" onClick={() => onAction("image")} />
        <div className="min-w-0 flex-1">
          <h3 className={`truncate text-[18px] font-semibold tracking-tight ${t.title}`}>{schein.carName || "Fahrzeug"}</h3>
          <div className="mt-1.5">
            <FinCopy fin={schein.finNumber} dark={dark} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StageBadge stage={schein.stage} stageMeta={schein.stageMeta} dark={dark} onClick={onEdit} />
            {schein.fuelNeeded ? (
              <Pill tone={amber}>
                <FiDroplet className="size-3" /> Tank leer
              </Pill>
            ) : null}
            {rot ? <Pill tone={red}>Rotkennzeichen {rot}</Pill> : null}
          </div>
          {schein.imageUrl ? (
            <button
              type="button"
              onClick={() => onAction("image")}
              className={`mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium hover:underline ${dark ? "text-emerald-400" : "text-emerald-700"}`}
            >
              <FiImage className="size-3.5" /> Fahrzeugschein ansehen
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          <InfoSection title="Fahrzeug" dark={dark}>
            <InfoRow label="FIN" dark={dark} mono>{schein.finNumber || dash}</InfoRow>
            <InfoRow label="Hinzugefügt" dark={dark}>{formatDate(schein.createdAt)}</InfoRow>
            <InfoRow label="Ankauf" dark={dark}>{schein.boughtAt ? formatDate(schein.boughtAt) : dash}</InfoRow>
            <InfoRow label="Vorbesitzer" dark={dark}>{schein.vorbesitzer ?? dash}</InfoRow>
            <InfoRow label="Tank" dark={dark}>{schein.fuelNeeded ? "Leer – auffüllen" : "In Ordnung"}</InfoRow>
            <InfoRow label="Rotkennzeichen" dark={dark}>{rot || "Nein"}</InfoRow>
          </InfoSection>

          <InfoSection title="Schlüssel" dark={dark} action={<LinkButton dark={dark} onClick={onEdit}>Ändern</LinkButton>}>
            <InfoRow label="Nummer" dark={dark}>{schein.keyNumber ? `Nr. ${schein.keyNumber}` : dash}</InfoRow>
            <InfoRow label="Anzahl" dark={dark}>{`${schein.keyCount ?? 2} Stück`}</InfoRow>
            <InfoRow label="Farbe" dark={dark}>
              <span className="inline-block size-4 rounded-full align-middle ring-1 ring-inset ring-black/15" style={{ background: schein.keyColor || "#000000" }} />
            </InfoRow>
            {schein.keyNote ? <InfoRow label="Notiz" dark={dark}>{schein.keyNote}</InfoRow> : null}
          </InfoSection>
        </div>

        <div className="space-y-5">
          <InfoSection title="Phase" dark={dark} action={<LinkButton dark={dark} onClick={onEdit}>Ändern</LinkButton>}>
            <InfoRow label="Status" dark={dark}>
              <StageBadge stage={schein.stage} stageMeta={schein.stageMeta} dark={dark} />
            </InfoRow>
            {stage === "WERKSTATT" ? (
              <>
                <InfoRow label="Werkstatt" dark={dark}>{meta.werkstatt?.where || dash}</InfoRow>
                <InfoRow label="Arbeiten" dark={dark}>{meta.werkstatt?.what || dash}</InfoRow>
              </>
            ) : null}
            {stage === "PLATZ" ? (
              <>
                <InfoRow label="Stellplatz" dark={dark}>{meta.platz?.note || dash}</InfoRow>
                <InfoRow label="TÜV" dark={dark}>
                  {platzTuev(schein) ? (
                    <span className={platzTuev(schein).expired ? "text-red-600" : dark ? "text-sky-400" : "text-sky-700"}>{platzTuev(schein).text}</span>
                  ) : (
                    <span className={t.muted}>Kein TÜV eingetragen</span>
                  )}
                </InfoRow>
              </>
            ) : null}
            {stage === "TUEV" && !meta.tuev?.passed ? (
              <InfoRow label="Mängel" dark={dark}>
                {issues.length ? (
                  <ul className="space-y-0.5">
                    {issues.map((issue, index) => (
                      <li key={`${index}-${issue}`}>{issue}</li>
                    ))}
                  </ul>
                ) : dash}
              </InfoRow>
            ) : null}
          </InfoSection>

          {schein.keySold ? (
            <InfoSection title="Verkauf & Garantie" dark={dark} action={<LinkButton dark={dark} onClick={() => onAction("warranty")}>Reklamationen</LinkButton>}>
              <InfoRow label="Verkauft am" dark={dark}>{formatDate(schein.soldAt)}</InfoRow>
              <InfoRow label="Käufer" dark={dark}>{buyer?.customerName || dash}</InfoRow>
              {buyer?.phone ? (
                <InfoRow label="Telefon" dark={dark}>
                  <a href={`tel:${String(buyer.phone).replace(/\s+/g, "")}`} className={`hover:underline ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                    {buyer.phone}
                  </a>
                </InfoRow>
              ) : null}
              {addressOf(buyer) ? <InfoRow label="Adresse" dark={dark}>{addressOf(buyer)}</InfoRow> : null}
              <InfoRow label="Garantie" dark={dark}>
                {warranty.status === "active" ? (
                  <span className={dark ? "text-emerald-400" : "text-emerald-700"}>
                    bis {formatDate(warranty.end)} · noch {warranty.remainingDays} Tage
                  </span>
                ) : warranty.status === "expired" ? (
                  <span className={t.muted}>abgelaufen am {formatDate(warranty.end)}</span>
                ) : (
                  <span className={t.muted}>Verkaufsdatum fehlt</span>
                )}
              </InfoRow>
              <InfoRow label="Reklamationen" dark={dark}>{claims || "Keine"}</InfoRow>
            </InfoSection>
          ) : null}

          <Checklist schein={schein} dark={dark} onSaved={onSaved} />
        </div>
      </div>
    </Modal>
  );
}
