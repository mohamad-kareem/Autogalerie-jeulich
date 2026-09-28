"use client";

/** Warranty (one year from the sale) and the list of claims (Reklamationen). */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiAlertTriangle, FiCheckCircle, FiPlus, FiTrash2 } from "react-icons/fi";

import { updateSchein } from "./api";
import { computeWarranty, formatCost, formatDate, toDateInput } from "./constants";
import { Button, Field, IconButton, Modal, inputClass, theme } from "./ui";

const emptyClaim = () => ({ date: toDateInput(new Date()), where: "", what: "", cost: "" });

export default function WarrantyModal({ open, schein, dark, onClose, onSaved }) {
  const t = theme(dark);
  const [claims, setClaims] = useState([]);
  const [draft, setDraft] = useState(emptyClaim());
  const [saving, setSaving] = useState(false);
  const warranty = computeWarranty(schein);

  useEffect(() => {
    if (!open) return;
    setClaims(Array.isArray(schein?.reclamations) ? schein.reclamations : []);
    setDraft(emptyClaim());
  }, [open, schein]);

  const addClaim = () => {
    const what = draft.what.trim();
    if (!what) return toast.error("Bitte eine Beschreibung eingeben.");
    if (!draft.date) return toast.error("Bitte ein Datum auswählen.");
    const cost = draft.cost === "" ? null : Number(String(draft.cost).replace(",", "."));
    if (cost !== null && Number.isNaN(cost)) return toast.error("Die Kosten sind ungültig.");
    setClaims((current) => [{ date: draft.date, where: draft.where.trim(), what, cost }, ...current]);
    setDraft(emptyClaim());
    return undefined;
  };

  const save = async () => {
    if (!schein?._id) return;
    setSaving(true);
    try {
      const saved = await updateSchein(schein._id, { reclamations: claims });
      onSaved(saved);
      toast.success("Gespeichert");
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const statusIcon =
    warranty.status === "active" ? <FiCheckCircle className="size-5 text-green-500" />
      : warranty.status === "expired" ? <FiAlertTriangle className="size-5 text-red-500" />
        : <FiAlertTriangle className={`size-5 ${t.faint}`} />;

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      title="Garantie & Reklamation"
      subtitle={schein?.carName}
      footer={
        <>
          <Button dark={dark} onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button dark={dark} variant="primary" onClick={save} disabled={saving}>{saving ? "Speichern …" : "Speichern"}</Button>
        </>
      }
    >
      <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border p-3 ${t.soft}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          {statusIcon}
          <div className="min-w-0">
            <p className={`truncate text-[14px] font-semibold ${t.title}`}>
              {warranty.status === "active" ? "Garantie aktiv" : warranty.status === "expired" ? "Garantie abgelaufen" : warranty.label}
            </p>
            {warranty.status === "active" ? (
              <p className="text-[12px] font-medium text-green-600">noch {warranty.remainingDays} Tage · bis {formatDate(warranty.end)}</p>
            ) : warranty.status === "expired" ? (
              <p className={`text-[12px] ${t.muted}`}>Ende: {formatDate(warranty.end)}</p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-[11px] ${t.muted}`}>Verkaufsdatum</p>
          <p className={`text-[13px] font-semibold ${t.title}`}>{schein?.keySold ? formatDate(schein?.soldAt) : "–"}</p>
        </div>
      </div>

      <section className={`rounded-xl border p-3 ${t.card}`}>
        <p className={`mb-3 text-[13px] font-semibold ${t.title}`}>Reklamation hinzufügen</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Datum" dark={dark}>
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={inputClass(dark)} />
          </Field>
          <Field label="Kosten (€)" dark={dark}>
            <input value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} inputMode="decimal" placeholder="z. B. 200" className={inputClass(dark)} />
          </Field>
          <Field label="Ort / Werkstatt" dark={dark} className="col-span-2 sm:col-span-1">
            <input value={draft.where} onChange={(e) => setDraft({ ...draft, where: e.target.value })} placeholder="z. B. Abo Ali" className={inputClass(dark)} />
          </Field>
          <Field label="Beschreibung" dark={dark} className="col-span-2 sm:col-span-1">
            <input value={draft.what} onChange={(e) => setDraft({ ...draft, what: e.target.value })} placeholder="z. B. Spureinstellung" className={inputClass(dark)} />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button dark={dark} variant="primary" onClick={addClaim}>
            <FiPlus className="size-4" /> Hinzufügen
          </Button>
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className={`text-[13px] font-semibold ${t.title}`}>Reklamationen</p>
          <p className={`text-[12px] ${t.muted}`}>{claims.length} Eintrag{claims.length === 1 ? "" : "e"}</p>
        </div>
        {claims.length ? (
          <ul className="space-y-2">
            {claims.map((claim, index) => (
              <li key={`${claim.date}-${index}`} className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 ${t.soft}`}>
                <div className="min-w-0">
                  <p className={`text-[14px] font-medium ${t.title}`}>{claim.what || "–"}</p>
                  <p className={`mt-0.5 text-[12px] ${t.muted}`}>
                    {formatDate(claim.date)} · {claim.where || "–"} · {formatCost(claim.cost)}
                  </p>
                </div>
                <IconButton dark={dark} title="Reklamation löschen" onClick={() => setClaims((current) => current.filter((_, i) => i !== index))} tone="text-red-500">
                  <FiTrash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`text-[13px] ${t.faint}`}>Keine Reklamationen gespeichert.</p>
        )}
      </section>
    </Modal>
  );
}
