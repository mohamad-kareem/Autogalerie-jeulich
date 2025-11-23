"use client";

import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiUpload, FiImage, FiX } from "react-icons/fi";

const OWNERS = ["Karim", "Alawie"];

export default function ScheinForm({
  mode = "create",
  schein = null,
  onClose,
  onSuccess,
  darkMode = false,
}) {
  const isCreate = mode === "create";

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    carName: schein?.carName || "",
    finNumber: schein?.finNumber || "",
    owner: schein?.owner || "Karim",
  });

  const initialNotes = Array.isArray(schein?.notes)
    ? schein.notes
    : schein?.notes
    ? String(schein.notes)
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean)
    : [];

  const [tasks, setTasks] = useState(initialNotes);
  const [noteInput, setNoteInput] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(schein?.imageUrl || "");
  const fileInputRef = useRef(null);

  // Theme classes
  const bgClass = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-600";
  const inputBg = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const resetFileInput = () => {
    setFile(null);
    setPreviewUrl(schein?.imageUrl || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addTask = () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    setTasks((prev) => [...prev, trimmed]);
    setNoteInput("");
  };

  const handleNoteKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTask();
    }
  };

  const removeTask = (index) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      let uploadedImage = null;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "car_scheins_unsigned");

        const cloudRes = await fetch(
          "https://api.cloudinary.com/v1_1/dclgxdwrc/image/upload",
          { method: "POST", body: formData }
        );

        const cloudData = await cloudRes.json();
        if (cloudData.error)
          throw new Error(`Cloudinary-Fehler: ${cloudData.error.message}`);
        if (!cloudData.secure_url)
          throw new Error("Fehler beim Cloudinary-Upload");

        uploadedImage = {
          imageUrl: cloudData.secure_url,
          publicId: cloudData.public_id,
        };
      }

      const notesArray = tasks;

      if (isCreate) {
        const payload = {
          ...form,
          notes: notesArray,
          ...(uploadedImage || {}),
        };

        const res = await fetch("/api/carschein", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const newDoc = await res.json();
        onSuccess(newDoc);
        toast.success("Schein erfolgreich hochgeladen");
      } else {
        const updateData = {
          id: schein._id,
          ...form,
          notes: notesArray,
        };

        if (uploadedImage) {
          updateData.imageUrl = uploadedImage.imageUrl;
          updateData.publicId = uploadedImage.publicId;
          updateData.oldPublicId = schein.publicId;
        }

        const res = await fetch("/api/carschein", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!res.ok) throw new Error("Aktualisierung fehlgeschlagen");
        const updatedDoc = await res.json();
        onSuccess(updatedDoc);
        toast.success("Schein erfolgreich aktualisiert");
      }
    } catch (err) {
      toast.error(`Fehler: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="custom-scroll w-full max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-y-auto px-3 sm:px-4 lg:px-6">
        <div
          className={`overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300 ${borderColor} ${bgClass}`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b px-4 sm:px-6 py-1 sm:py-3 transition-colors duration-300 ${borderColor}`}
          >
            <div className="min-w-0">
              <h3
                className={`text-sm sm:text-base font-semibold truncate transition-colors duration-300 ${textPrimary}`}
              >
                {isCreate ? "Neuen Schein hochladen" : "Schein bearbeiten"}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                darkMode
                  ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 sm:gap-7 px-4 sm:px-6 lg:px-7 py-4 sm:py-5 lg:py-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]"
          >
            {/* LEFT – Felder + Schein */}
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  className={`mb-1.5 block text-xs sm:text-sm font-medium transition-colors duration-300 ${textSecondary}`}
                >
                  Fahrzeugname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.carName}
                  onChange={(e) => handleFormChange("carName", e.target.value)}
                  required
                  className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                    darkMode
                      ? "focus:border-gray-400 focus:ring-gray-400"
                      : "focus:border-gray-900 focus:ring-gray-900/10"
                  }`}
                  placeholder="z. B. VW Golf 7 1.6 TDI"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    className={`mb-1.5 block text-xs sm:text-sm font-medium transition-colors duration-300 ${textSecondary}`}
                  >
                    FIN-Nummer
                  </label>
                  <input
                    type="text"
                    value={form.finNumber}
                    onChange={(e) =>
                      handleFormChange("finNumber", e.target.value)
                    }
                    className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                      darkMode
                        ? "focus:border-gray-400 focus:ring-gray-400"
                        : "focus:border-gray-900 focus:ring-gray-900/10"
                    }`}
                    placeholder="z. B. WVWZZZ1KZAW000000"
                  />
                </div>

                <div>
                  <label
                    className={`mb-1.5 block text-xs sm:text-sm font-medium transition-colors duration-300 ${textSecondary}`}
                  >
                    Autohändler
                  </label>
                  <select
                    value={form.owner}
                    onChange={(e) => handleFormChange("owner", e.target.value)}
                    className={`w-full h-10 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                      darkMode
                        ? "focus:border-gray-400 focus:ring-gray-400"
                        : "focus:border-gray-900 focus:ring-gray-900/10"
                    }`}
                  >
                    {OWNERS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schein-Dokument */}
              <div>
                <label
                  className={`mb-1.5 block text-xs sm:text-sm font-medium transition-colors duration-300 ${textSecondary}`}
                >
                  Schein-Dokument{" "}
                  {isCreate && <span className="text-red-500">*</span>}
                </label>

                <div
                  className={`flex flex-col gap-3 rounded-lg border border-dashed p-3 sm:p-4 transition-colors duration-300 ${
                    darkMode
                      ? "border-gray-600 bg-gray-700/80"
                      : "border-gray-300 bg-gray-50/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4">
                    <div
                      className={`flex h-28 w-full sm:w-28 items-center justify-center overflow-hidden rounded-md border transition-colors duration-300 ${
                        darkMode
                          ? "border-gray-600 bg-gray-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Vorschau"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full flex-col items-center justify-center text-xs gap-1 transition-colors duration-300 ${
                            darkMode ? "text-gray-400" : "text-gray-300"
                          }`}
                        >
                          <FiImage size={20} />
                          <span className="text-[11px]">Kein Bild</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-xs sm:text-sm">
                      <p
                        className={`font-medium transition-colors duration-300 ${textPrimary}`}
                      >
                        Bild des Fahrzeugscheins hochladen
                      </p>
                      <p
                        className={`text-[11px] sm:text-xs transition-colors duration-300 ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Unterstützt: JPG, PNG.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <label
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-300 ${
                            darkMode
                              ? "border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <FiUpload size={14} />
                          <span>
                            {previewUrl ? "Bild ändern" : "Bild auswählen"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="sr-only"
                            required={isCreate && !previewUrl}
                          />
                        </label>

                        {previewUrl && (
                          <button
                            type="button"
                            onClick={resetFileInput}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs sm:text-sm transition-colors duration-300 ${
                              darkMode
                                ? "border-gray-600 bg-gray-600 text-gray-300 hover:bg-gray-500"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <FiX size={13} />
                            <span>Bild entfernen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT – Aufgaben */}
            <div className="flex flex-col justify-between gap-4 sm:gap-5">
              <div>
                <label
                  className={`mb-1.5 block text-xs sm:text-sm font-medium transition-colors duration-300 ${textSecondary}`}
                >
                  Aufgaben
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={handleNoteKeyDown}
                    className={`flex-1 h-9 rounded-md border px-3 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                      darkMode
                        ? "focus:border-gray-400 focus:ring-gray-400"
                        : "focus:border-gray-900 focus:ring-gray-900/10"
                    }`}
                    placeholder="z. B. Ölwechsel, TÜV, Reinigung ..."
                  />
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm rounded-md bg-gray-900 text-white hover:bg-black transition disabled:opacity-50"
                    disabled={!noteInput.trim()}
                  >
                    Hinzufügen
                  </button>
                </div>

                {tasks.length > 0 ? (
                  <>
                    <div className="mt-3 mb-1.5 flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${textPrimary}`}
                      >
                        Aktuelle Aufgaben
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] transition-colors duration-300 ${
                          darkMode
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tasks.length} Aufgabe
                        {tasks.length === 1 ? "" : "n"}
                      </span>
                    </div>

                    <ol
                      className={`max-h-64 sm:max-h-72 overflow-y-auto space-y-1.5 pr-1 transition-colors duration-300 ${
                        darkMode ? "text-gray-300" : "text-gray-800"
                      }`}
                    >
                      {tasks.map((task, idx) => (
                        <li
                          key={idx}
                          className={`flex gap-2 rounded-md border px-3 py-1.5 transition-colors duration-300 ${
                            darkMode
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 flex items-start justify-between gap-2">
                            <p className="text-xs sm:text-sm leading-snug">
                              {task}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeTask(idx)}
                              className={`mt-0.5 inline-flex items-center justify-center rounded-full p-0.5 transition-colors duration-300 ${
                                darkMode
                                  ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <FiX size={11} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p
                    className={`mt-2 text-xs transition-colors duration-300 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Noch keine Aufgaben hinzugefügt.
                  </p>
                )}
              </div>

              {/* Footer buttons */}
              <div
                className={`mt-2 flex flex-col sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 border-t pt-3 sm:pt-4 transition-colors duration-300 ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full sm:w-auto px-4 py-2 text-xs sm:text-sm rounded-md border transition-colors duration-300 ${
                    darkMode
                      ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <FiUpload size={14} />
                  {loading
                    ? "Wird gespeichert..."
                    : isCreate
                    ? "Schein hochladen"
                    : "Änderungen speichern"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
