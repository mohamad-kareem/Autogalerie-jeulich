"use client";

/** New vehicle / edit vehicle: name, FIN, dealer, photo of the Schein, tasks. */

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FiImage, FiUpload, FiX } from "react-icons/fi";

import { createSchein, updateSchein, uploadImage } from "./api";
import { DEFAULT_OWNER, notesOf } from "./constants";
import { AddToList, Button, Field, Modal, NumberedList, inputClass, theme } from "./ui";

export default function VehicleFormModal({ open, schein = null, dark, onClose, onSaved }) {
  const isEdit = Boolean(schein?._id);
  const t = theme(dark);

  const [form, setForm] = useState({ carName: "", finNumber: "" });
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Fresh form every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setForm({ carName: schein?.carName || "", finNumber: schein?.finNumber || "" });
    setTasks(notesOf(schein));
    setTaskInput("");
    setFile(null);
    setPreview(schein?.imageUrl || "");
    if (fileRef.current) fileRef.current.value = "";
  }, [open, schein]);

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const pickFile = (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(schein?.imageUrl || "");
    if (fileRef.current) fileRef.current.value = "";
  };

  const addTask = () => {
    const text = taskInput.trim();
    if (!text) return;
    setTasks((current) => [...current, text]);
    setTaskInput("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.carName.trim()) {
      toast.error("Bitte einen Fahrzeugnamen eingeben.");
      return;
    }
    setSaving(true);
    try {
      const image = file ? await uploadImage(file) : null;
      let saved;
      if (isEdit) {
        saved = await updateSchein(schein._id, {
          ...form,
          notes: tasks,
          ...(image ? { ...image, oldPublicId: schein.publicId } : {}),
        });
        toast.success("Fahrzeug aktualisiert");
      } else {
        saved = await createSchein({ ...form, owner: DEFAULT_OWNER, notes: tasks, ...(image || {}) });
        toast.success("Fahrzeug angelegt");
      }
      onSaved(saved);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      size="xl"
      title={isEdit ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"}
      subtitle={isEdit ? schein.carName : "Fahrzeugschein hochladen und Aufgaben festlegen"}
      footer={
        <>
          <Button dark={dark} onClick={onClose}>Abbrechen</Button>
          <Button dark={dark} variant="primary" type="submit" form="vehicle-form" disabled={saving}>
            <FiUpload className="size-4" />
            {saving ? "Wird gespeichert …" : isEdit ? "Änderungen speichern" : "Fahrzeug anlegen"}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Field label="Fahrzeugname *" dark={dark}>
            <input value={form.carName} onChange={set("carName")} required placeholder="z. B. VW Golf 7 1.6 TDI" className={inputClass(dark)} />
          </Field>

          <Field label="FIN-Nummer" dark={dark}>
            <input value={form.finNumber} onChange={set("finNumber")} placeholder="z. B. WVWZZZ1KZAW000000" className={inputClass(dark, "font-mono")} />
          </Field>

          <div>
            <span className={`mb-1 block text-[12px] font-medium ${t.muted}`}>Fahrzeugschein</span>
            <div className={`flex flex-col gap-4 rounded-xl border border-dashed p-3 sm:flex-row sm:items-center ${t.soft}`}>
              <div className={`flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:w-40 ${t.card}`}>
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Vorschau" className="size-full object-cover" />
                ) : (
                  <span className={`flex flex-col items-center gap-1 text-[12px] ${t.faint}`}>
                    <FiImage className="size-5" /> Kein Bild
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <p className={`text-[13px] ${t.muted}`}>Foto des Fahrzeugscheins (JPG oder PNG).</p>
                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] ${t.secondary}`}>
                    <FiUpload className="size-4" />
                    {preview ? "Bild ändern" : "Bild auswählen"}
                    <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="sr-only" />
                  </label>
                  {file ? (
                    <button type="button" onClick={clearFile} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] ${t.ghost}`}>
                      <FiX className="size-4" /> Verwerfen
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className={`text-[12px] font-medium ${t.muted}`}>Aufgaben</span>
            {tasks.length ? <span className={`text-[12px] ${t.faint}`}>{tasks.length} Aufgabe{tasks.length === 1 ? "" : "n"}</span> : null}
          </div>
          <AddToList value={taskInput} onChange={setTaskInput} onAdd={addTask} placeholder="z. B. Ölwechsel, TÜV, Reinigung …" dark={dark} />
          <div className="max-h-72 overflow-y-auto">
            <NumberedList items={tasks} dark={dark} onRemove={(index) => setTasks((current) => current.filter((_, i) => i !== index))} empty="Noch keine Aufgaben." />
          </div>
        </div>
      </form>
    </Modal>
  );
}
