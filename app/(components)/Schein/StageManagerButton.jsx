// app/(components)/Schein/StageManagerButton.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiTool,
  FiDroplet,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiLayers,
  FiX,
  FiSave,
  FiUser,
  FiPhone,
} from "react-icons/fi";

/* -----------------------------------------
   Stages
------------------------------------------ */
const STAGES = [
  { id: "WERKSTATT", label: "Werkstatt", icon: FiTool },
  { id: "AUFBEREITUNG", label: "Aufbereitung", icon: FiDroplet },
  { id: "PLATZ", label: "In Boora", icon: FiMapPin },
  { id: "TUEV", label: "TÜV", icon: FiShield },
  { id: "SOLD", label: "Verkauft", icon: FiCheckCircle },
];

function normalizeStage(s) {
  const up = String(s || "WERKSTATT").toUpperCase();
  return STAGES.some((x) => x.id === up) ? up : "WERKSTATT";
}

function badgeClass(stage, darkMode) {
  const s = String(stage || "").toUpperCase();
  const base =
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold leading-none whitespace-nowrap";

  if (s === "SOLD")
    return `${base} ${
      darkMode ? "bg-green-900 text-green-100" : "bg-green-100 text-green-700"
    }`;
  if (s === "TUEV")
    return `${base} ${
      darkMode
        ? "bg-indigo-900 text-indigo-100"
        : "bg-indigo-100 text-indigo-700"
    }`;
  if (s === "PLATZ")
    return `${base} ${
      darkMode ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"
    }`;
  if (s === "AUFBEREITUNG")
    return `${base} ${
      darkMode ? "bg-cyan-900 text-cyan-100" : "bg-cyan-100 text-cyan-700"
    }`;
  return `${base} ${
    darkMode ? "bg-orange-900 text-orange-100" : "bg-orange-100 text-orange-700"
  }`;
}

function inputClass(darkMode) {
  return `w-full h-9 rounded-md border px-2 text-sm focus:outline-none transition-colors ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white focus:border-gray-400"
      : "bg-white border-gray-300 text-gray-900 focus:border-gray-900"
  }`;
}

function niceAddress(c) {
  if (!c) return "";
  const line1 = [c.street].filter(Boolean).join(" ");
  const line2 = [c.postalCode, c.city].filter(Boolean).join(" ");
  return [line1, line2].filter(Boolean).join(" · ");
}

/* -----------------------------------------
   UI helpers
------------------------------------------ */
function StageCard({ s, active, darkMode, onClick }) {
  const Ico = s.icon || FiLayers;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 h-12 w-full flex items-center gap-2 text-left transition-colors duration-200 ${
        active
          ? darkMode
            ? "border-gray-500 bg-gray-700 text-white"
            : "border-gray-900 bg-gray-50 text-gray-900"
          : darkMode
          ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
          active
            ? darkMode
              ? "bg-gray-600 text-white"
              : "bg-gray-900 text-white"
            : darkMode
            ? "bg-gray-700 text-gray-200"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        <Ico size={14} />
      </span>

      <span className="min-w-0 flex-1 text-[12px] font-semibold leading-none truncate">
        {s.label}
      </span>
    </button>
  );
}

function SoldRow({ icon, children }) {
  return (
    <div className="flex items-start gap-2">
      {/* icon directly beside text (no box) */}
      <span className="mt-[2px] inline-flex shrink-0 items-center justify-center">
        {icon}
      </span>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* -----------------------------------------
   Main Component
------------------------------------------ */
export default function StageManagerButton({
  schein,
  darkMode = false,
  onUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentStage = normalizeStage(schein?.stage);
  const currentMeta = schein?.stageMeta || {};

  const [stage, setStage] = useState(currentStage);
  const [meta, setMeta] = useState({
    werkstatt: {
      where: currentMeta?.werkstatt?.where || "",
      what: currentMeta?.werkstatt?.what || "",
    },
    platz: { note: currentMeta?.platz?.note || "" },
    tuev: {
      passed: !!currentMeta?.tuev?.passed,
      issue: currentMeta?.tuev?.issue || "",
    },
  });

  // Sync when modal opens
  useEffect(() => {
    if (!open) return;
    const s = normalizeStage(schein?.stage);
    const m = schein?.stageMeta || {};

    setStage(s);
    setMeta({
      werkstatt: {
        where: m?.werkstatt?.where || "",
        what: m?.werkstatt?.what || "",
      },
      platz: { note: m?.platz?.note || "" },
      tuev: { passed: !!m?.tuev?.passed, issue: m?.tuev?.issue || "" },
    });
  }, [open, schein]);

  const stageInfo = useMemo(
    () => STAGES.find((x) => x.id === stage) || STAGES[0],
    [stage]
  );
  const StageIcon = stageInfo.icon || FiLayers;

  // Table label: show TÜV status (Bestanden/Nicht bestanden)
  const tableStageLabel = useMemo(() => {
    if (currentStage === "TUEV") {
      const passed = !!schein?.stageMeta?.tuev?.passed;
      return passed ? "TÜV Bestanden" : "TÜV Nicht bestanden";
    }
    return STAGES.find((s) => s.id === currentStage)?.label || "Werkstatt";
  }, [currentStage, schein]);

  // Sold contact (populated object)
  const soldContact = useMemo(() => {
    const v = schein?.soldContactId;
    if (!v) return null;
    if (typeof v === "object" && (v._id || v.customerName || v.phone)) return v;
    return null;
  }, [schein]);

  const save = async () => {
    if (!schein?._id) return;

    // TÜV issue is optional, but if passed -> clear issue
    const payloadMeta = {
      ...meta,
      tuev: {
        ...meta.tuev,
        issue: meta.tuev.passed ? "" : meta.tuev.issue,
      },
    };

    try {
      setSaving(true);
      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: schein._id,
          stage,
          stageMeta: payloadMeta,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Fehler beim Speichern");
        return;
      }

      onUpdated?.(data);
      toast.success("Phase gespeichert");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Table UI: icon + badge (both clickable) */}
      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 transition-colors ${
            darkMode
              ? "text-gray-300 hover:bg-gray-700 hover:text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }`}
          title="Phase / Status"
        >
          <span
            className={`${badgeClass(currentStage, darkMode)} min-w-[140px]`}
          >
            {tableStageLabel}
          </span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div
            className={`w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between gap-3 border-b px-4 sm:px-6 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="min-w-0">
                <h3
                  className={`text-sm font-semibold truncate text-left ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Status · {schein?.carName || "Fahrzeug"}
                </h3>
                <p
                  className={`mt-0.5 text-[11px] ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Wähle die Phase und trage Details ein (optional).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                  darkMode
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
                aria-label="Schließen"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4">
              {/* Stage selector:
                  - mobile: horizontal scroll
                  - desktop: 5 columns
              */}
              <div className="sm:hidden -mx-4 px-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  {STAGES.map((s) => (
                    <div key={s.id} className="w-[220px]">
                      <StageCard
                        s={s}
                        active={stage === s.id}
                        darkMode={darkMode}
                        onClick={() => setStage(s.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden sm:grid grid-cols-5 gap-2">
                {STAGES.map((s) => (
                  <StageCard
                    key={s.id}
                    s={s}
                    active={stage === s.id}
                    darkMode={darkMode}
                    onClick={() => setStage(s.id)}
                  />
                ))}
              </div>

              {/* Detail box */}
              <div
                className={`mt-4 rounded-xl border p-4 transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`text-xs font-semibold ${
                      darkMode ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    Details für:{" "}
                    <span className="font-bold">
                      {stage === "SOLD" ? "Kunden" : stageInfo.label}
                    </span>
                  </div>

                  <span className={badgeClass(stage, darkMode)}>
                    {stage === "TUEV"
                      ? meta.tuev.passed
                        ? "TÜV Bestanden"
                        : "TÜV Nicht bestanden"
                      : stageInfo.label}
                  </span>
                </div>

                {/* WERKSTATT */}
                {stage === "WERKSTATT" && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-xs mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Wo? (Werkstatt/Ort)
                      </label>
                      <input
                        className={inputClass(darkMode)}
                        value={meta.werkstatt.where}
                        onChange={(e) =>
                          setMeta((p) => ({
                            ...p,
                            werkstatt: {
                              ...p.werkstatt,
                              where: e.target.value,
                            },
                          }))
                        }
                        placeholder="z. B. Toni Jülich"
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Was wird gemacht?
                      </label>
                      <input
                        className={inputClass(darkMode)}
                        value={meta.werkstatt.what}
                        onChange={(e) =>
                          setMeta((p) => ({
                            ...p,
                            werkstatt: { ...p.werkstatt, what: e.target.value },
                          }))
                        }
                        placeholder="z. B. Bremsen + Ölwechsel"
                      />
                    </div>
                  </div>
                )}

                {/* AUFBEREITUNG */}
                {stage === "AUFBEREITUNG" && (
                  <div
                    className={`mt-3 w-full text-left rounded-lg border px-3 py-2 text-[12px] ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/20 text-gray-300"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    Status:{" "}
                    <b>
                      Auto ist in Aufbereitung{" "}
                      <span
                        className={darkMode ? "text-cyan-300" : "text-cyan-700"}
                      >
                        (in Bearbeitung)
                      </span>
                    </b>
                  </div>
                )}

                {/* PLATZ */}
                {stage === "PLATZ" && (
                  <div className="mt-3">
                    <label
                      className={`block text-xs mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Platz-Notiz (optional)
                    </label>
                    <input
                      className={inputClass(darkMode)}
                      value={meta.platz.note}
                      onChange={(e) =>
                        setMeta((p) => ({
                          ...p,
                          platz: { ...p.platz, note: e.target.value },
                        }))
                      }
                      placeholder='z. B. "Im Büro (Boora)" / "Platz A3"'
                    />
                  </div>
                )}

                {/* TUEV */}
                {stage === "TUEV" && (
                  <div className="mt-3 space-y-3">
                    <label
                      className={`flex items-center gap-2 text-xs font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={meta.tuev.passed}
                        onChange={(e) =>
                          setMeta((p) => ({
                            ...p,
                            tuev: {
                              ...p.tuev,
                              passed: e.target.checked,
                              issue: e.target.checked ? "" : p.tuev.issue,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 accent-gray-700"
                      />
                      TÜV bestanden
                    </label>

                    {!meta.tuev.passed && (
                      <div>
                        <label
                          className={`block text-xs mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Problem / Mangel (optional)
                        </label>
                        <input
                          className={inputClass(darkMode)}
                          value={meta.tuev.issue}
                          onChange={(e) =>
                            setMeta((p) => ({
                              ...p,
                              tuev: { ...p.tuev, issue: e.target.value },
                            }))
                          }
                          placeholder="z. B. Bremsleitung korrodiert"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* SOLD */}
                {stage === "SOLD" && (
                  <div
                    className={`mt-3 rounded-xl border p-4 ${
                      darkMode
                        ? "border-gray-700 bg-gray-900/20"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {soldContact ? (
                      <div className="space-y-4">
                        <div
                          className={`text-xs font-semibold text-left ${
                            darkMode ? "text-gray-200" : "text-gray-900"
                          }`}
                        >
                          Käuferdaten
                        </div>

                        <SoldRow
                          icon={
                            <FiUser
                              size={16}
                              className={
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }
                            />
                          }
                        >
                          <div
                            className={`text-sm font-semibold truncate ${
                              darkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {soldContact.customerName || "—"}
                          </div>
                        </SoldRow>

                        <SoldRow
                          icon={<FiMapPin size={16} className="text-red-500" />}
                        >
                          <div
                            className={`text-[13px] leading-snug ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {niceAddress(soldContact) || "—"}
                          </div>
                        </SoldRow>

                        <SoldRow
                          icon={
                            <FiPhone size={16} className="text-green-500" />
                          }
                        >
                          {soldContact.phone ? (
                            <a
                              href={`tel:${String(soldContact.phone).replace(
                                /\s+/g,
                                ""
                              )}`}
                              className={`text-sm font-semibold underline-offset-2 hover:underline ${
                                darkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              {soldContact.phone}
                            </a>
                          ) : (
                            <div
                              className={`text-sm font-semibold ${
                                darkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              —
                            </div>
                          )}
                        </SoldRow>
                      </div>
                    ) : (
                      <div
                        className={`text-sm text-left ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Nbe3et abel ma nbalesh neshte8el bel system lgdeed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-end gap-2 border-t px-4 sm:px-6 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <FiSave size={14} />
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
