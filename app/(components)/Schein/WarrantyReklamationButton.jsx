// app/(components)/Schein/WarrantyReklamationButton.jsx
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  FiShield,
  FiX,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

function toDateInputValue(date) {
  if (date === null || date === undefined || date === "") return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeWarranty(schein) {
  const keySold = !!schein?.keySold;
  const soldAt = schein?.soldAt ? new Date(schein.soldAt) : null;

  if (!keySold) return { status: "not_sold", label: "Nicht verkauft" };

  if (!soldAt || Number.isNaN(soldAt.getTime())) {
    return { status: "missing_date", label: "Verkauft (Datum fehlt)" };
  }

  const end = new Date(soldAt);
  end.setFullYear(end.getFullYear() + 1);

  const now = new Date();
  const remainingMs = end.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  if (remainingMs > 0) {
    return {
      status: "active",
      soldAt,
      end,
      remainingDays,
      label: `Garantie aktiv · ${remainingDays} Tage übrig`,
    };
  }

  return {
    status: "expired",
    soldAt,
    end,
    remainingDays: 0,
    label: `Garantie abgelaufen (Ende: ${end.toLocaleDateString("de-DE")})`,
  };
}

export default function WarrantyReklamationButton({
  schein,
  darkMode = false,
  onUpdated,
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [soldAtInput, setSoldAtInput] = useState("");
  const [recs, setRecs] = useState([]);

  // Neue Reklamation
  const [recDate, setRecDate] = useState(() => toDateInputValue(new Date()));
  const [recWhere, setRecWhere] = useState("");
  const [recWhat, setRecWhat] = useState("");
  const [recCost, setRecCost] = useState("");

  const warranty = useMemo(() => computeWarranty(schein), [schein]);

  useEffect(() => {
    if (!open) return;
    setSoldAtInput(toDateInputValue(schein?.soldAt));
    setRecs(Array.isArray(schein?.reclamations) ? schein.reclamations : []);
  }, [open, schein]);

  const styles = useMemo(() => {
    const input =
      `w-full rounded-md border px-2.5 text-sm focus:outline-none focus:ring-1 transition ` +
      (darkMode
        ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-400 focus:ring-gray-400/20"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:ring-gray-900/10");

    return {
      overlay:
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4",
      modal: `w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
        darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      }`,
      header: `flex items-center justify-between px-4 sm:px-5 py-2.5 border-b ${
        darkMode ? "border-gray-700" : "border-gray-200"
      }`,
      title: darkMode ? "text-white" : "text-gray-900",
      muted: darkMode ? "text-gray-400" : "text-gray-500",

      // compact input heights
      input: `${input} h-8 sm:h-9`,
      // compact buttons
      btn: "inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition",
      card: `rounded-xl border ${
        darkMode ? "border-gray-700" : "border-gray-200"
      }`,
      cardSoft: darkMode ? "bg-gray-800/50" : "bg-gray-50",
      cardPlain: darkMode ? "bg-gray-800/25" : "bg-white",
    };
  }, [darkMode]);

  const close = useCallback(() => setOpen(false), []);

  const addReklamation = useCallback(() => {
    const what = recWhat.trim();
    const where = recWhere.trim();

    if (!what) return toast.error("Bitte „Beschreibung“ ausfüllen.");
    if (!recDate) return toast.error("Bitte Datum auswählen.");

    const costNum =
      recCost === "" ? null : Number(String(recCost).replace(",", "."));
    if (costNum !== null && Number.isNaN(costNum)) {
      return toast.error("Kosten sind ungültig.");
    }

    const newRec = {
      date: recDate, // YYYY-MM-DD
      where,
      what,
      cost: costNum,
    };

    setRecs((prev) => [newRec, ...prev]);

    setRecWhat("");
    setRecWhere("");
    setRecCost("");
    setRecDate(toDateInputValue(new Date()));
  }, [recWhat, recWhere, recCost, recDate]);

  const removeRec = useCallback((index) => {
    setRecs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const saveAll = useCallback(async () => {
    if (!schein?._id) return;

    try {
      setSaving(true);

      const payload = {
        id: schein._id,
        soldAt: soldAtInput ? soldAtInput : null,
        reclamations: recs,
      };

      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Speichern fehlgeschlagen");

      toast.success("Gespeichert");
      onUpdated?.(data);
      setOpen(false);
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [schein?._id, soldAtInput, recs, onUpdated]);

  return (
    <>
      {/* Icon Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Garantie & Reklamation"
        className={`rounded p-1 transition-colors cursor-pointer ${
          schein?.keySold
            ? darkMode
              ? "text-green-400 hover:bg-green-900/25 hover:text-green-300"
              : "text-green-600 hover:bg-green-50 hover:text-green-700"
            : darkMode
            ? "text-gray-400 hover:bg-gray-700 hover:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <FiShield size={16} />
      </button>

      {/* Modal */}
      {open && (
        <div className={styles.overlay} onClick={close}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <div className="min-w-0">
                <div
                  className={`text-sm font-semibold truncate ${styles.title}`}
                >
                  Reklamation · {schein?.carName || "Fahrzeug"}
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                aria-label="Schließen"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Status */}
              <div className={`${styles.card} p-3 sm:p-4 ${styles.cardSoft}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mt-2 flex items-center gap-2">
                      {warranty.status === "active" ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : warranty.status === "expired" ? (
                        <FiAlertTriangle className="text-red-500" />
                      ) : (
                        <FiAlertTriangle
                          className={
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }
                        />
                      )}

                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${styles.title}`}>
                          {warranty.label}
                        </div>
                        {warranty.status === "missing_date" && (
                          <div className={`text-[11px] ${styles.muted}`}>
                            Bitte Verkaufsdatum eintragen
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-40 sm:w-44">
                    <label
                      className={`block text-[11px] font-medium ${styles.muted}`}
                    >
                      Verkaufsdatum
                    </label>
                    <input
                      type="date"
                      value={soldAtInput}
                      onChange={(e) => setSoldAtInput(e.target.value)}
                      className={styles.input}
                      disabled={!schein?.keySold}
                      title={
                        !schein?.keySold ? "Nur bei „verkauft“ relevant" : ""
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Add Reklamation */}
              <div className={`${styles.card} p-3 sm:p-4 ${styles.cardPlain}`}>
                {/* ✅ Title on the RIGHT */}
                <div className="flex items-center ">
                  <div
                    className={`text-[11px] sm:text-xs font-semibold ${styles.title} text-right`}
                  >
                    Reklamation hinzufügen
                  </div>
                </div>

                {/* Compact responsive grid */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {/* Datum */}
                  <div>
                    <label
                      className={`block text-[11px] font-medium ${styles.muted}`}
                    >
                      Datum
                    </label>
                    <input
                      type="date"
                      value={recDate}
                      onChange={(e) => setRecDate(e.target.value)}
                      className={styles.input}
                    />
                  </div>

                  {/* Kosten */}
                  <div>
                    <label
                      className={`block text-[11px] font-medium ${styles.muted}`}
                    >
                      Kosten (€)
                    </label>
                    <input
                      type="text"
                      value={recCost}
                      onChange={(e) => setRecCost(e.target.value)}
                      className={styles.input}
                      placeholder="z. B. 200 Euro"
                      inputMode="decimal"
                    />
                  </div>

                  {/* Ort */}
                  <div className="col-span-2 sm:col-span-1">
                    <label
                      className={`block text-[11px] font-medium ${styles.muted}`}
                    >
                      Ort / Werkstatt
                    </label>
                    <input
                      type="text"
                      value={recWhere}
                      onChange={(e) => setRecWhere(e.target.value)}
                      className={styles.input}
                      placeholder="z. B. Abo Ali"
                    />
                  </div>

                  {/* Beschreibung */}
                  <div className="col-span-2 sm:col-span-1">
                    <label
                      className={`block text-[11px] font-medium ${styles.muted}`}
                    >
                      Beschreibung
                    </label>
                    <input
                      type="text"
                      value={recWhat}
                      onChange={(e) => setRecWhat(e.target.value)}
                      className={styles.input}
                      placeholder="z. B. Spureinstellung"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={addReklamation}
                    className={`${styles.btn} ${
                      darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-900 text-white hover:bg-black"
                    }`}
                  >
                    <FiPlus size={14} />
                    Hinzufügen
                  </button>
                </div>
              </div>

              {/* Reklamationen List */}
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`text-[11px] sm:text-xs font-semibold ${styles.title}`}
                  >
                    Reklamationen
                  </div>
                  <div className={`text-[11px] ${styles.muted}`}>
                    {recs.length} Eintrag{recs.length === 1 ? "" : "e"}
                  </div>
                </div>

                {recs.length === 0 ? (
                  <div className={`mt-2 text-[12px] ${styles.muted}`}>
                    Keine Reklamationen gespeichert.
                  </div>
                ) : (
                  <div className="mt-2 space-y-2 max-h-52 sm:max-h-56 overflow-y-auto pr-1">
                    {recs.map((r, idx) => {
                      const dateText = r?.date
                        ? new Date(r.date).toLocaleDateString("de-DE")
                        : "—";

                      const costText =
                        r?.cost === null ||
                        r?.cost === undefined ||
                        r?.cost === ""
                          ? "—"
                          : `${Number(r.cost).toFixed(2)} €`;

                      return (
                        <div
                          key={`${r?.date || "x"}-${idx}`}
                          className={`rounded-lg border p-2.5 sm:p-3 ${
                            darkMode
                              ? "border-gray-700 bg-gray-800/60"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className={`text-sm font-medium ${styles.title}`}
                              >
                                {r?.what || "—"}
                              </div>
                              <div
                                className={`text-[11px] mt-0.5 ${styles.muted}`}
                              >
                                {dateText} · {r?.where || "—"} · {costText}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRec(idx)}
                              className={`rounded p-1 transition-colors ${
                                darkMode
                                  ? "text-red-300 hover:bg-red-900/40"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title="Löschen"
                              aria-label="Reklamation löschen"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-end gap-2 border-t px-4 sm:px-5 py-2.5 sm:py-3 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className={`${styles.btn} ${
                  darkMode
                    ? "border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={saveAll}
                disabled={saving}
                className={`${styles.btn} ${
                  saving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
