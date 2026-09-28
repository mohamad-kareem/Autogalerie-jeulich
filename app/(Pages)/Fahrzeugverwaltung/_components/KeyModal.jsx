"use client";

/** Key and status: key number/count/colour/note, sold, fuel, red plates, purchase date. */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { updateSchein } from "./api";
import { ROT_PLATES, toDateInput } from "./constants";
import { Button, Checkbox, Field, Modal, inputClass, theme } from "./ui";

function initialForm(schein) {
  return {
    keyNumber: schein?.keyNumber || "",
    keyCount: typeof schein?.keyCount === "number" ? schein.keyCount : 2,
    keyColor: schein?.keyColor || "#000000",
    keySold: Boolean(schein?.keySold),
    keyNote: schein?.keyNote || "",
    fuelNeeded: Boolean(schein?.fuelNeeded),
    rotKennzeichen: Boolean(schein?.rotKennzeichen),
    rotPlateNumber: schein?.rotPlateNumber || "",
    boughtAt: toDateInput(schein?.boughtAt),
  };
}

export default function KeyModal({ open, schein, dark, onClose, onSaved }) {
  const t = theme(dark);
  const [form, setForm] = useState(initialForm(schein));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm(schein));
  }, [open, schein]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    if (!schein?._id) return;
    if (form.rotKennzeichen && !form.rotPlateNumber) {
      toast.error("Bitte ein Rotkennzeichen auswählen.");
      return;
    }
    setSaving(true);
    try {
      const saved = await updateSchein(schein._id, {
        keyNumber: form.keyNumber.trim(),
        keyCount: form.keyCount,
        keyColor: form.keyColor,
        keySold: form.keySold,
        keyNote: form.keyNote.trim(),
        fuelNeeded: form.fuelNeeded,
        rotKennzeichen: form.rotKennzeichen,
        rotPlateNumber: form.rotKennzeichen ? form.rotPlateNumber : "",
        boughtAt: form.boughtAt || null,
      });
      onSaved(saved);
      toast.success("Schlüssel-Daten gespeichert");
    } catch (error) {
      toast.error(error.message || "Fehler beim Speichern der Schlüssel-Daten");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (active) =>
    `h-10 flex-1 rounded-lg border text-[13px] font-semibold transition ${active ? t.chipActive : t.chip}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      size="sm"
      title="Schlüssel & Status"
      subtitle={schein?.carName}
      footer={
        <>
          <Button dark={dark} onClick={onClose}>Abbrechen</Button>
          <Button dark={dark} variant="primary" onClick={save} disabled={saving}>{saving ? "Speichern …" : "Speichern"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Schlüsselnummer" dark={dark}>
            <input value={form.keyNumber} onChange={(e) => set("keyNumber", e.target.value)} placeholder="z. B. 99" className={inputClass(dark)} />
          </Field>
          <Field label="Farbe" dark={dark}>
            <input type="color" value={form.keyColor || "#000000"} onChange={(e) => set("keyColor", e.target.value)} className={`h-10 w-14 cursor-pointer rounded-lg border p-1 ${t.input}`} />
          </Field>
        </div>

        <div>
          <span className={`mb-1 block text-[12px] font-medium ${t.muted}`}>Anzahl Schlüssel</span>
          <div className="flex gap-2">
            {[1, 2].map((count) => (
              <button key={count} type="button" onClick={() => set("keyCount", count)} className={toggle(form.keyCount === count)}>
                {count}
              </button>
            ))}
          </div>
        </div>

        <Field label="Notiz zum Schlüssel" dark={dark}>
          <input value={form.keyNote} onChange={(e) => set("keyNote", e.target.value)} placeholder="z. B. zweiter Schlüssel im Tresor" className={inputClass(dark)} />
        </Field>

        <Field label="Ankaufdatum" dark={dark}>
          <input type="date" value={form.boughtAt} onChange={(e) => set("boughtAt", e.target.value)} className={inputClass(dark)} />
        </Field>

        <div className={`space-y-3 rounded-xl border p-3 ${t.soft}`}>
          <Checkbox dark={dark} checked={form.keySold} onChange={(value) => set("keySold", value)} label="Fahrzeug verkauft" />
          <Checkbox dark={dark} checked={form.fuelNeeded} onChange={(value) => set("fuelNeeded", value)} label="Braucht Benzin / Diesel (Tank leer)" />
          <Checkbox dark={dark} checked={form.rotKennzeichen} onChange={(value) => set("rotKennzeichen", value)} label="Rotkennzeichen" />
          {form.rotKennzeichen ? (
            <div className="flex gap-2 pl-6">
              {ROT_PLATES.map((plate) => (
                <button
                  key={plate.id}
                  type="button"
                  onClick={() => set("rotPlateNumber", plate.id)}
                  className={`h-9 flex-1 rounded-lg border text-[12px] font-semibold transition ${
                    form.rotPlateNumber === plate.id ? "border-red-600 bg-red-600 text-white" : t.chip
                  }`}
                >
                  {plate.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
