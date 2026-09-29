"use client";

/** The vehicle's phase (Werkstatt → Aufbereitung → In Boora → TÜV → Verkauft) and its details. */

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiMapPin, FiPhone, FiSave } from "react-icons/fi";

import { updateSchein } from "./api";
import { STAGES, addressOf, formatDate, normalizeStage, soldContactOf } from "./constants";
import { AddToList, Button, Checkbox, Field, Modal, NumberedList, inputClass, theme } from "./ui";

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

/** The round marker of a step: done (tick), current (ring) or still to come. */
function StepMarker({ entry, state, dark, small }) {
  const Icon = entry.icon;
  const size = small ? "size-8" : "size-9";
  if (state === "done") {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white`}>
        <FiCheck className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full ring-2 ring-emerald-600 ${dark ? "bg-slate-900 text-emerald-400" : "bg-white text-emerald-700"}`}>
        <Icon className="size-4" />
      </span>
    );
  }
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full ring-1 ${dark ? "bg-slate-900 text-slate-500 ring-slate-700" : "bg-white text-slate-400 ring-slate-300"}`}>
      <Icon className="size-4" />
    </span>
  );
}

/** Werkstatt → Aufbereitung → In Boora → TÜV → Verkauft; a click picks a step. */
function Stepper({ stage, onPick, dark }) {
  const t = theme(dark);
  const current = STAGES.findIndex((entry) => entry.id === stage);
  const stateOf = (index) => (index < current ? "done" : index === current ? "current" : "todo");
  const line = (on) => (on ? "bg-emerald-600" : dark ? "bg-slate-700" : "bg-slate-200");

  return (
    <>
      {/* computer: across */}
      <ol className="hidden sm:flex">
        {STAGES.map((entry, index) => {
          const state = stateOf(index);
          return (
            <li key={entry.id} className="relative flex-1">
              {index > 0 ? <span className={`absolute left-0 right-1/2 top-[18px] h-0.5 ${line(index <= current)}`} /> : null}
              {index < STAGES.length - 1 ? <span className={`absolute left-1/2 right-0 top-[18px] h-0.5 ${line(index < current)}`} /> : null}
              <button type="button" onClick={() => onPick(entry.id)} className="group relative flex w-full flex-col items-center gap-2 px-1 text-center">
                <span className="rounded-full transition group-hover:scale-105">
                  <StepMarker entry={entry} state={state} dark={dark} />
                </span>
                <span>
                  <span className={`block text-[13px] font-semibold ${state === "todo" ? t.muted : t.title}`}>{entry.label}</span>
                  <span className={`block text-[11px] leading-tight ${t.faint}`}>{entry.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* phone: down */}
      <ol className="sm:hidden">
        {STAGES.map((entry, index) => {
          const state = stateOf(index);
          return (
            <li key={entry.id} className="relative">
              {index < STAGES.length - 1 ? <span className={`absolute bottom-0 left-[27px] top-10 w-0.5 ${line(index < current)}`} /> : null}
              <button
                type="button"
                onClick={() => onPick(entry.id)}
                className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${state === "current" ? (dark ? "bg-emerald-500/10" : "bg-emerald-50") : ""}`}
              >
                <StepMarker entry={entry} state={state} dark={dark} small />
                <span className="min-w-0">
                  <span className={`block text-[14px] font-semibold ${state === "todo" ? t.muted : t.title}`}>{entry.label}</span>
                  <span className={`block text-[12px] ${t.faint}`}>{entry.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Two-way switch (e.g. TÜV bestanden / nicht bestanden). */
function Segmented({ value, onChange, options, dark }) {
  return (
    <div className={`grid grid-cols-2 gap-1 rounded-lg p-1 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition ${
              active ? `${dark ? "bg-slate-950" : "bg-white"} shadow-sm ${option.activeText}` : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return (parts.length ? parts.slice(0, 2).map((part) => part[0]) : ["?"]).join("").toUpperCase();
}

export default function StageModal({ open, schein, dark, onClose, onSaved }) {
  const t = theme(dark);
  const [stage, setStage] = useState(normalizeStage(schein?.stage));
  const [meta, setMeta] = useState(metaOf(schein));
  const [issueInput, setIssueInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage(normalizeStage(schein?.stage));
    setMeta(metaOf(schein));
    setIssueInput("");
  }, [open, schein]);

  const setPart = (part, field, value) =>
    setMeta((current) => ({ ...current, [part]: { ...current[part], [field]: value } }));

  const addIssue = () => {
    const text = issueInput.trim();
    if (!text) return;
    setPart("tuev", "issues", [...meta.tuev.issues, text]);
    setIssueInput("");
  };

  const save = async () => {
    if (!schein?._id) return;
    setSaving(true);
    try {
      const saved = await updateSchein(schein._id, { stage, stageMeta: meta });
      onSaved(saved);
      toast.success("Phase gespeichert");
    } catch (error) {
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const buyer = soldContactOf(schein);
  const current = STAGES.find((entry) => entry.id === stage) || STAGES[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      dark={dark}
      size="lg"
      title="Phase ändern"
      subtitle={schein?.carName}
      footer={
        <>
          <Button dark={dark} onClick={onClose}>Abbrechen</Button>
          <Button dark={dark} variant="primary" onClick={save} disabled={saving}>
            <FiSave className="size-4" />
            {saving ? "Speichern …" : "Speichern"}
          </Button>
        </>
      }
    >
      <Stepper stage={stage} onPick={setStage} dark={dark} />

      <section className={`mt-5 rounded-xl border ${t.divider}`}>
        <header className={`border-b px-4 py-2.5 ${t.divider}`}>
          <p className={`text-[12px] font-semibold uppercase tracking-wider ${t.faint}`}>Angaben · {current.label}</p>
        </header>

        <div className="p-4">
          {stage === "WERKSTATT" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Werkstatt / Ort" dark={dark}>
                <input value={meta.werkstatt.where} onChange={(e) => setPart("werkstatt", "where", e.target.value)} placeholder="z. B. Toni Jülich" className={inputClass(dark)} />
              </Field>
              <Field label="Was wird gemacht?" dark={dark}>
                <input value={meta.werkstatt.what} onChange={(e) => setPart("werkstatt", "what", e.target.value)} placeholder="z. B. Bremsen + Ölwechsel" className={inputClass(dark)} />
              </Field>
            </div>
          ) : null}

          {stage === "AUFBEREITUNG" ? (
            <p className={`text-[13px] ${t.muted}`}>Keine weiteren Angaben nötig.</p>
          ) : null}

          {stage === "PLATZ" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Stellplatz / Notiz (optional)" dark={dark} className="sm:col-span-2">
                <input value={meta.platz.note} onChange={(e) => setPart("platz", "note", e.target.value)} placeholder="z. B. Platz A3" className={inputClass(dark)} />
              </Field>
              <div className="flex h-10 items-center sm:mt-5">
                <Checkbox dark={dark} checked={meta.platz.hasTuev} onChange={(value) => setPart("platz", "hasTuev", value)} label="Fahrzeug hat TÜV" />
              </div>
              <Field label="TÜV bis" dark={dark}>
                <input
                  type="month"
                  value={meta.platz.tuevUntil}
                  disabled={!meta.platz.hasTuev}
                  onChange={(e) => setPart("platz", "tuevUntil", e.target.value)}
                  className={inputClass(dark, "disabled:opacity-50")}
                />
              </Field>
            </div>
          ) : null}

          {stage === "TUEV" ? (
            <div className="space-y-4">
              <Segmented
                dark={dark}
                value={meta.tuev.passed}
                onChange={(value) => setPart("tuev", "passed", value)}
                options={[
                  { value: true, label: "Bestanden", activeText: dark ? "text-emerald-400" : "text-emerald-700" },
                  { value: false, label: "Nicht bestanden", activeText: dark ? "text-red-400" : "text-red-700" },
                ]}
              />
              {!meta.tuev.passed ? (
                <div>
                  <p className={`mb-1.5 text-[12px] font-medium ${t.muted}`}>Mängel</p>
                  <AddToList value={issueInput} onChange={setIssueInput} onAdd={addIssue} placeholder="z. B. Bremsleitung korrodiert" dark={dark} />
                  <div className="mt-3">
                    <NumberedList
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
            schein?.keySold ? (
              buyer ? (
                <div className="flex items-start gap-3">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                    {initials(buyer.customerName)}
                  </span>
                  <div className="min-w-0 space-y-1 text-[13px]">
                    <p className={`font-semibold ${t.title}`}>{buyer.customerName || "–"}</p>
                    {addressOf(buyer) ? (
                      <p className={`flex items-center gap-1.5 ${t.text}`}>
                        <FiMapPin className={`size-3.5 shrink-0 ${t.faint}`} /> {addressOf(buyer)}
                      </p>
                    ) : null}
                    {buyer.phone ? (
                      <a href={`tel:${String(buyer.phone).replace(/\s+/g, "")}`} className={`flex items-center gap-1.5 font-medium hover:underline ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                        <FiPhone className="size-3.5 shrink-0" /> {buyer.phone}
                      </a>
                    ) : null}
                    <p className={`text-[12px] ${t.muted}`}>Verkauft am {formatDate(schein.soldAt)}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-[13px] ${t.muted}`}>Verkauft am {formatDate(schein.soldAt)} – keine Käuferdaten gespeichert.</p>
              )
            ) : (
              <p className={`text-[13px] ${t.muted}`}>Beim Speichern wird das Fahrzeug als verkauft markiert. Die Garantie läuft ab heute ein Jahr.</p>
            )
          ) : null}
        </div>
      </section>
    </Modal>
  );
}
