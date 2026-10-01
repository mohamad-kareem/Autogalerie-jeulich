"use client";

/**
 * New vehicle / edit vehicle — everything in one form:
 * vehicle (name, FIN, purchase date, Schein photo), keys, status, phase and tasks.
 * Classic layout: plain bordered fields, small section titles, checkboxes and radios.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FiImage, FiX } from "react-icons/fi";

import { createSchein, updateSchein, uploadImage } from "./api";
import { DEFAULT_OWNER, ROT_PLATES, STAGES, formatDate, normalizeStage, notesOf, soldContactOf, toDateInput } from "./constants";
import { Modal, theme } from "./ui";

/* ------------------------------------------------------------ data */

/** Keys and status of a vehicle, ready for the form. */
function keyFormOf(schein) {
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
    vorbesitzer: schein?.vorbesitzer === null || schein?.vorbesitzer === undefined ? "" : String(schein.vorbesitzer),
  };
}

/** The details of each phase, ready for the form. */
function metaOf(schein) {
  const meta = schein?.stageMeta || {};
  const issues = Array.isArray(meta?.tuev?.issues) ? meta.tuev.issues : meta?.tuev?.issue ? [meta.tuev.issue] : [];
  return {
    werkstatt: { where: meta?.werkstatt?.where || "", what: meta?.werkstatt?.what || "" },
    platz: {
      note: meta?.platz?.note || "",
      hasTuev: Boolean(meta?.platz?.hasTuev),
      tuevUntil: meta?.platz?.tuevUntil || "",
    },
    tuev: { passed: Boolean(meta?.tuev?.passed), issues },
  };
}

/* ------------------------------------------------------------ small parts */

/** Classic field: white, thin grey border, no glow. */
function fieldClass(dark, extra = "") {
  const look = dark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-slate-400"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-600";
  return `h-9 w-full rounded border px-2.5 text-[13px] outline-none transition-colors ${look} ${extra}`;
}

function Label({ children, dark }) {
  return <span className={`mb-1 block text-[12px] ${dark ? "text-slate-400" : "text-slate-600"}`}>{children}</span>;
}

function FieldBox({ label, dark, className = "", children }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <Label dark={dark}>{label}</Label>
      {children}
    </label>
  );
}

/** Section: small grey title with a thin line under it. */
function Section({ title, aside, dark, children }) {
  return (
    <section>
      <div className={`mb-3 flex items-end justify-between gap-2 border-b pb-1.5 ${dark ? "border-slate-800" : "border-slate-200"}`}>
        <h3 className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Check({ checked, onChange, label, dark }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-[13px] ${dark ? "text-slate-200" : "text-slate-700"}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-slate-700" />
      {label}
    </label>
  );
}

function Radio({ name, checked, onChange, label, dark }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-[13px] ${dark ? "text-slate-200" : "text-slate-700"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-4 accent-slate-700" />
      {label}
    </label>
  );
}

/** Two small joined buttons (number of keys). */
function Pair({ options, value, onChange, dark }) {
  return (
    <div className={`inline-flex h-9 overflow-hidden rounded border ${dark ? "border-slate-700" : "border-slate-300"}`}>
      {options.map((option, index) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`w-10 text-[13px] transition-colors ${index ? (dark ? "border-l border-slate-700" : "border-l border-slate-300") : ""} ${
              active ? (dark ? "bg-slate-200 font-semibold text-slate-900" : "bg-slate-800 font-semibold text-white") : dark ? "bg-slate-950 text-slate-300 hover:bg-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** A text field with a plain "Hinzufügen" button next to it (Enter works too). */
function AddRow({ value, onChange, onAdd, placeholder, dark }) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className={fieldClass(dark, "flex-1")}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={!value.trim()}
        className={`h-9 shrink-0 rounded border px-3 text-[13px] transition-colors disabled:opacity-40 ${
          dark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        Hinzufügen
      </button>
    </div>
  );
}

/** Plain numbered list with thin lines between the entries. */
function SlimList({ items, onRemove, empty, dark }) {
  const t = theme(dark);
  if (!items.length) return <p className={`py-1 text-[12px] ${t.faint}`}>{empty}</p>;
  return (
    <ol className={`divide-y ${dark ? "divide-slate-800" : "divide-slate-100"}`}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="group flex items-center gap-2.5 py-1.5 text-[13px]">
          <span className={`w-5 shrink-0 text-right tabular-nums ${t.faint}`}>{index + 1}.</span>
          <span className={`min-w-0 flex-1 leading-snug ${t.text}`}>{item}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Entfernen"
            title="Entfernen"
            className={`rounded p-0.5 opacity-60 transition focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${t.ghost}`}
          >
            <FiX className="size-3.5" />
          </button>
        </li>
      ))}
    </ol>
  );
}

function FooterButton({ primary, dark, children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center rounded border px-4 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? dark
            ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
            : "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
          : dark
            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------ form */

export default function VehicleFormModal({ open, schein = null, dark, onClose, onSaved }) {
  const isEdit = Boolean(schein?._id);
  const t = theme(dark);

  const [form, setForm] = useState({ carName: "", finNumber: "" });
  const [keys, setKeys] = useState(keyFormOf(null));
  const [stage, setStage] = useState("WERKSTATT");
  const [meta, setMeta] = useState(metaOf(null));
  const [issueInput, setIssueInput] = useState("");
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
    setKeys(keyFormOf(schein));
    setStage(normalizeStage(schein?.stage));
    setMeta(metaOf(schein));
    setIssueInput("");
    setTasks(notesOf(schein));
    setTaskInput("");
    setFile(null);
    setPreview(schein?.imageUrl || "");
    if (fileRef.current) fileRef.current.value = "";
  }, [open, schein]);

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const setKey = (field, value) => setKeys((current) => ({ ...current, [field]: value }));
  const setPart = (part, field, value) => setMeta((current) => ({ ...current, [part]: { ...current[part], [field]: value } }));

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

  const addIssue = () => {
    const text = issueInput.trim();
    if (!text) return;
    setPart("tuev", "issues", [...meta.tuev.issues, text]);
    setIssueInput("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.carName.trim()) {
      toast.error("Bitte einen Fahrzeugnamen eingeben.");
      return;
    }
    if (keys.rotKennzeichen && !keys.rotPlateNumber) {
      toast.error("Bitte ein Rotkennzeichen auswählen.");
      return;
    }
    setSaving(true);
    try {
      const image = file ? await uploadImage(file) : null;
      // Keys, status and phase — the same fields as always.
      const details = {
        keyNumber: keys.keyNumber.trim(),
        keyCount: keys.keyCount,
        keyColor: keys.keyColor,
        keySold: keys.keySold,
        keyNote: keys.keyNote.trim(),
        fuelNeeded: keys.fuelNeeded,
        rotKennzeichen: keys.rotKennzeichen,
        rotPlateNumber: keys.rotKennzeichen ? keys.rotPlateNumber : "",
        boughtAt: keys.boughtAt || null,
        vorbesitzer: keys.vorbesitzer === "" ? null : Number(keys.vorbesitzer),
        stage,
        stageMeta: meta,
      };
      let saved;
      if (isEdit) {
        saved = await updateSchein(schein._id, {
          ...form,
          notes: tasks,
          ...details,
          ...(image ? { ...image, oldPublicId: schein.publicId } : {}),
        });
        toast.success("Fahrzeug aktualisiert");
      } else {
        saved = await createSchein({ ...form, owner: DEFAULT_OWNER, notes: tasks, ...details, ...(image || {}) });
        toast.success("Fahrzeug angelegt");
      }
      onSaved(saved);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const buyer = soldContactOf(schein);
  const divider = dark ? "border-slate-800" : "border-slate-200";

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      size="2xl"
      title={isEdit ? "Fahrzeug bearbeiten" : "Neues Fahrzeug"}
      subtitle={isEdit ? schein.carName : "Fahrzeug, Schlüssel, Phase und Aufgaben"}
      footer={
        <>
          <FooterButton dark={dark} onClick={onClose}>Abbrechen</FooterButton>
          <FooterButton dark={dark} primary type="submit" form="vehicle-form" disabled={saving}>
            {saving ? "Wird gespeichert …" : isEdit ? "Speichern" : "Fahrzeug anlegen"}
          </FooterButton>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={submit} className="space-y-6 sm:px-1">
        {/* ---------- vehicle ---------- */}
        <Section title="Fahrzeug" dark={dark}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_90px]">
            <FieldBox label="Fahrzeugname *" dark={dark} className="col-span-2 sm:col-span-1">
              <input value={form.carName} onChange={set("carName")} required placeholder="z. B. VW Golf 7 1.6 TDI" className={fieldClass(dark)} />
            </FieldBox>
            <FieldBox label="FIN-Nummer" dark={dark} className="col-span-2 sm:col-span-1">
              <input value={form.finNumber} onChange={set("finNumber")} placeholder="WVWZZZ1KZAW000000" className={fieldClass(dark, "font-mono")} />
            </FieldBox>
            <FieldBox label="Ankaufdatum" dark={dark}>
              <input type="date" value={keys.boughtAt} onChange={(e) => setKey("boughtAt", e.target.value)} className={fieldClass(dark)} />
            </FieldBox>
            <FieldBox label="Vorbesitzer" dark={dark}>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                step={1}
                value={keys.vorbesitzer}
                onChange={(e) => setKey("vorbesitzer", e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="–"
                aria-label="Anzahl Vorbesitzer"
                className={fieldClass(dark, "tabular-nums")}
              />
            </FieldBox>
          </div>

          {/* Schein: small preview and a link */}
          <div className="mt-3 flex items-center gap-2.5 text-[12px]">
            <span className={`flex size-8 shrink-0 items-center justify-center overflow-hidden rounded border ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="size-full object-cover" />
              ) : (
                <FiImage className={`size-3.5 ${t.faint}`} />
              )}
            </span>
            <span className={t.muted}>Fahrzeugschein: {file ? file.name : preview ? "vorhanden" : "kein Bild"}</span>
            <label className={`cursor-pointer underline underline-offset-2 ${dark ? "text-slate-200 hover:text-white" : "text-slate-800 hover:text-black"}`}>
              {preview ? "Ändern" : "Hochladen"}
              <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="sr-only" />
            </label>
            {file ? (
              <button type="button" onClick={clearFile} className={`underline-offset-2 hover:underline ${t.muted}`}>
                Verwerfen
              </button>
            ) : null}
          </div>
        </Section>

        {/* ---------- two columns ---------- */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* left: keys + status */}
          <div className="space-y-6">
            <Section title="Schlüssel" dark={dark}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-3">
                <FieldBox label="Nummer" dark={dark}>
                  <input value={keys.keyNumber} onChange={(e) => setKey("keyNumber", e.target.value)} placeholder="z. B. 99" className={fieldClass(dark)} />
                </FieldBox>
                <div>
                  <Label dark={dark}>Anzahl</Label>
                  <Pair dark={dark} options={[1, 2]} value={keys.keyCount} onChange={(value) => setKey("keyCount", value)} />
                </div>
                <FieldBox label="Farbe" dark={dark}>
                  <input
                    type="color"
                    value={keys.keyColor || "#000000"}
                    onChange={(e) => setKey("keyColor", e.target.value)}
                    className={`h-9 w-12 cursor-pointer rounded border p-1 ${dark ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-white"}`}
                  />
                </FieldBox>
              </div>
              <FieldBox label="Notiz" dark={dark} className="mt-3">
                <input value={keys.keyNote} onChange={(e) => setKey("keyNote", e.target.value)} placeholder="z. B. zweiter Schlüssel im Tresor" className={fieldClass(dark)} />
              </FieldBox>
            </Section>

            <Section title="Status" dark={dark}>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Check dark={dark} checked={keys.keySold} onChange={(value) => setKey("keySold", value)} label="Verkauft" />
                <Check dark={dark} checked={keys.fuelNeeded} onChange={(value) => setKey("fuelNeeded", value)} label="Tank leer" />
                <Check dark={dark} checked={keys.rotKennzeichen} onChange={(value) => setKey("rotKennzeichen", value)} label="Rotkennzeichen" />
              </div>
              {keys.rotKennzeichen ? (
                <div className={`mt-3 flex flex-wrap gap-x-6 gap-y-2 border-l-2 pl-3 ${divider}`}>
                  {ROT_PLATES.map((plate) => (
                    <Radio
                      key={plate.id}
                      dark={dark}
                      name="rot-plate"
                      checked={keys.rotPlateNumber === plate.id}
                      onChange={() => setKey("rotPlateNumber", plate.id)}
                      label={plate.label}
                    />
                  ))}
                </div>
              ) : null}
            </Section>
          </div>

          {/* right: phase + tasks */}
          <div className="space-y-6">
            <Section title="Phase" dark={dark}>
              <FieldBox label="Aktuelle Phase" dark={dark}>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className={fieldClass(dark, "cursor-pointer pr-8")}>
                  {STAGES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label} – {entry.hint}
                    </option>
                  ))}
                </select>
              </FieldBox>

              <div className="mt-3">
                {stage === "WERKSTATT" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldBox label="Werkstatt / Ort" dark={dark}>
                      <input value={meta.werkstatt.where} onChange={(e) => setPart("werkstatt", "where", e.target.value)} placeholder="z. B. Toni Jülich" className={fieldClass(dark)} />
                    </FieldBox>
                    <FieldBox label="Was wird gemacht?" dark={dark}>
                      <input value={meta.werkstatt.what} onChange={(e) => setPart("werkstatt", "what", e.target.value)} placeholder="z. B. Bremsen + Ölwechsel" className={fieldClass(dark)} />
                    </FieldBox>
                  </div>
                ) : null}

                {stage === "AUFBEREITUNG" ? <p className={`text-[12px] ${t.muted}`}>Keine weiteren Angaben nötig.</p> : null}

                {stage === "PLATZ" ? (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                    <FieldBox label="Stellplatz / Notiz" dark={dark} className="sm:col-span-2">
                      <input value={meta.platz.note} onChange={(e) => setPart("platz", "note", e.target.value)} placeholder="z. B. Platz A3" className={fieldClass(dark)} />
                    </FieldBox>
                    <div className="flex h-9 items-center sm:self-end">
                      <Check dark={dark} checked={meta.platz.hasTuev} onChange={(value) => setPart("platz", "hasTuev", value)} label="Fahrzeug hat TÜV" />
                    </div>
                    <FieldBox label="TÜV bis" dark={dark}>
                      <input
                        type="month"
                        value={meta.platz.tuevUntil}
                        disabled={!meta.platz.hasTuev}
                        onChange={(e) => setPart("platz", "tuevUntil", e.target.value)}
                        className={fieldClass(dark, "disabled:opacity-40")}
                      />
                    </FieldBox>
                  </div>
                ) : null}

                {stage === "TUEV" ? (
                  <div className="space-y-3">
                    <div className="flex gap-6">
                      <Radio dark={dark} name="tuev-result" checked={meta.tuev.passed === true} onChange={() => setPart("tuev", "passed", true)} label="Bestanden" />
                      <Radio dark={dark} name="tuev-result" checked={meta.tuev.passed === false} onChange={() => setPart("tuev", "passed", false)} label="Nicht bestanden" />
                    </div>
                    {!meta.tuev.passed ? (
                      <div>
                        <Label dark={dark}>Mängel</Label>
                        <AddRow value={issueInput} onChange={setIssueInput} onAdd={addIssue} placeholder="z. B. Bremsleitung korrodiert" dark={dark} />
                        <div className="mt-1.5">
                          <SlimList
                            items={meta.tuev.issues}
                            dark={dark}
                            onRemove={(index) => setPart("tuev", "issues", meta.tuev.issues.filter((_, i) => i !== index))}
                            empty="Keine Mängel eingetragen."
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {stage === "SOLD" ? (
                  <p className={`text-[12px] ${t.muted}`}>
                    {schein?.keySold
                      ? `Verkauft am ${formatDate(schein.soldAt)}${buyer?.customerName ? ` an ${buyer.customerName}` : ""}.`
                      : "Beim Speichern wird das Fahrzeug als verkauft markiert. Die Garantie läuft ab heute ein Jahr."}
                  </p>
                ) : null}
              </div>
            </Section>

            <Section title="Aufgaben" dark={dark} aside={tasks.length ? <span className={`text-[11px] ${t.faint}`}>{tasks.length}</span> : null}>
              <AddRow value={taskInput} onChange={setTaskInput} onAdd={addTask} placeholder="z. B. Ölwechsel" dark={dark} />
              <div className="mt-1.5 max-h-52 overflow-y-auto">
                <SlimList items={tasks} dark={dark} onRemove={(index) => setTasks((current) => current.filter((_, i) => i !== index))} empty="Noch keine Aufgaben." />
              </div>
            </Section>
          </div>
        </div>
      </form>
    </Modal>
  );
}
