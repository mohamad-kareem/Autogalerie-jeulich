"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  FiTrash2,
  FiImage,
  FiMessageSquare,
  FiPrinter,
  FiUser,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiKey,
} from "react-icons/fi";
import ScheinForm from "./ScheinForm";

const PAGE_SIZE = 15; // Anzahl der Scheine pro Seite

export default function ScheinTable({
  scheins,
  loading,
  onUpdateSchein,
  onDeleteSchein,
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchein, setSelectedSchein] = useState(null);
  const [modalImageUrl, setModalImageUrl] = useState("");

  // Key modal state (Schlüssel-Verwaltung / verkauft / Tank)
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    keyNumber: "",
    keyCount: 2,
    keyColor: "#000000",
    keySold: false,
    keyNote: "",
    fuelNeeded: false,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = scheins?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Sicherstellen, dass die Seite gültig bleibt, wenn sich Datenmenge ändert
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  const paginatedScheins = useMemo(() => {
    if (!scheins || scheins.length === 0) return [];
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return scheins.slice(startIndex, endIndex);
  }, [scheins, currentPage]);

  // -----------------------------
  // Drucken (ohne Schlüssel-Daten)
  // -----------------------------
  const handlePrintImage = (doc) => {
    const { imageUrl, carName, owner, notes = [], createdAt, finNumber } = doc;

    const printWindow = window.open("", "_blank", "width=800,height=1000");

    const esc = (s = "") =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          }[c])
      );

    const noteItems = (notes || []).map((n) => `<li>${esc(n)}</li>`).join("");

    printWindow.document.write(/* html */ `
      <html>
        <head>
          <title>${esc(carName)} – Fahrzeugschein</title>
          <style>
            @page { size: A4; margin: 0 }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              width: 210mm;
              height: 297mm;
            }
            .container {
              padding: 12mm 18mm;
              box-sizing: border-box;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
            }
            .image {
              width: 100%;
              max-height: 55vh;
              object-fit: contain;
              margin-bottom: 8mm;
            }
            .section {
              font-size: 15pt;
              line-height: 1.4;
              color: #333;
            }
            .label {
              font-weight: 600;
              margin-right: 6px;
            }
            .owner-value {
              font-weight: 700;
            }
            ul {
              margin: 4mm 0 0 18px;
              padding: 0;
            }
            li {
              margin-bottom: 2mm;
              font-size: 14pt;
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="container">
            <img src="${esc(imageUrl)}" class="image" />

            <div class="section">
              <div><span class="label">Fahrzeug:</span> ${esc(carName)}</div>
              <div><span class="label">FIN-Nummer:</span> ${esc(
                finNumber || "—"
              )}</div>
              <div>
                <span class="label">Besitzer:</span>
                <span class="owner-value">${esc(owner || "—")}</span>
              </div>
              <div><span class="label">Hochgeladen am:</span> ${new Date(
                createdAt
              ).toLocaleDateString()}</div>

              ${
                noteItems
                  ? `<div class="label" style="margin-top:6mm;">Aufgaben:</div><ul>${noteItems}</ul>`
                  : ""
              }
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // -----------------------------
  // Löschen
  // -----------------------------
  const handleDelete = async (id, publicId) => {
    if (!confirm("Möchten Sie diesen Schein wirklich löschen?")) return;
    try {
      await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      await fetch(`/api/carschein?id=${id}`, { method: "DELETE" });
      onDeleteSchein(id);
      toast.success("Schein erfolgreich gelöscht");
    } catch (err) {
      console.error(err);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  // -----------------------------
  // Modals öffnen / schließen
  // -----------------------------
  const openImagePreview = (url) => {
    if (!url) {
      toast.error("Kein Bild verfügbar für diesen Schein.");
      return;
    }
    setModalImageUrl(url);
    setShowPreviewModal(true);
  };

  const openInfoModal = (schein) => {
    setSelectedSchein(schein);
    setShowInfoModal(true);
  };

  const openEditModal = (schein) => {
    setSelectedSchein(schein);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedDoc) => {
    onUpdateSchein(updatedDoc);
    setShowEditModal(false);
    setShowInfoModal(false);
  };

  // Pagination
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

  // ───────────────────────
  // Key Modal helpers (nur Edit / Add)
  // ───────────────────────
  const openKeyModal = (schein) => {
    setSelectedSchein(schein);
    setKeyForm({
      keyNumber: schein.keyNumber || "",
      keyCount: typeof schein.keyCount === "number" ? schein.keyCount : 2,
      keyColor: schein.keyColor || "#000000",
      keySold: !!schein.keySold,
      keyNote: schein.keyNote || "",
      fuelNeeded: !!schein.fuelNeeded,
    });
    setShowKeyModal(true);
  };

  const handleKeyChange = (field, value) => {
    setKeyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeySave = async () => {
    if (!selectedSchein?._id) return;

    if (!keyForm.keyNumber.trim()) {
      toast.error("Bitte eine Schlüsselnummer eintragen.");
      return;
    }

    try {
      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSchein._id,
          carName: selectedSchein.carName,
          owner: selectedSchein.owner,
          notes: selectedSchein.notes || [],
          imageUrl: selectedSchein.imageUrl,
          publicId: selectedSchein.publicId,
          keyNumber: keyForm.keyNumber.trim(),
          keyCount: keyForm.keyCount,
          keyColor: keyForm.keyColor,
          keySold: keyForm.keySold,
          keyNote: keyForm.keyNote.trim(),
          fuelNeeded: keyForm.fuelNeeded,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Fehler beim Speichern der Schlüssel-Daten");
        return;
      }

      onUpdateSchein(data);
      setShowKeyModal(false);
      toast.success("Schlüssel-Daten erfolgreich gespeichert");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern der Schlüssel-Daten");
    }
  };

  return (
    <>
      {/* Tabelle */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto custom-scroll">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-3 py-2">Fahrzeug</th>
                <th className="px-16 py-2">FIN</th>
                <th className="px-3 py-2 text-right">Besitzer</th>
                <th className="px-11 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mb-1 text-sm font-medium text-gray-700">
                        Keine Scheine gefunden
                      </div>
                      <p className="text-gray-500 text-xs">
                        Suchbegriff oder Filter anpassen
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedScheins.map((schein) => (
                  <tr key={schein._id} className="hover:bg-blue-100">
                    {/* Fahrzeug + Datum + Badges */}
                    <td className="px-3 py-2 max-w-[260px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {schein.carName}
                        </span>

                        {schein.keySold && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-[1px] text-[10px] font-semibold text-green-700">
                            Verkauft
                          </span>
                        )}

                        {schein.fuelNeeded && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-[1px] text-[10px] font-semibold text-orange-700">
                            Tank leer
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 text-[11px] text-gray-500">
                        {schein.createdAt
                          ? new Date(schein.createdAt).toLocaleDateString()
                          : "--"}
                      </div>
                    </td>

                    {/* FIN */}
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {schein.finNumber || "-"}
                      </div>
                    </td>

                    {/* Besitzer */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <FiUser className="text-gray-500 text-xs" />
                        <span className="text-sm">{schein.owner}</span>
                      </div>
                    </td>

                    {/* Aktionen */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Schlüssel verwalten */}
                        <button
                          onClick={() => openKeyModal(schein)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Schlüssel / Status"
                        >
                          <FiKey
                            size={16}
                            className={
                              schein.keyNumber ||
                              schein.keySold ||
                              schein.fuelNeeded
                                ? "text-gray-700"
                                : "text-blue-600"
                            }
                          />
                        </button>

                        <button
                          onClick={() => handlePrintImage(schein)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Drucken"
                        >
                          <FiPrinter size={16} />
                        </button>

                        <button
                          onClick={() => openInfoModal(schein)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Details"
                        >
                          <FiMessageSquare size={16} />
                        </button>

                        <button
                          onClick={() => openImagePreview(schein.imageUrl)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          title="Vorschau"
                        >
                          <FiImage size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(schein._id, schein.publicId)
                          }
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Löschen"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t-2 bg-gray-50 text-xs text-gray-400">
            <div>
              Zeige{" "}
              <span className="font-medium">
                {startItem}–{endItem}
              </span>{" "}
              von <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded border border-gray-300 px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg:white"
              >
                <FiChevronLeft className="mr-1" size={12} />
              </button>
              <span className="px-2">
                Seite <span className="font-medium">{currentPage}</span> /{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded border border-gray-400 px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg:white"
              >
                <FiChevronRight className="ml-1" size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && selectedSchein && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  Schein · {selectedSchein.carName}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Detailansicht des Fahrzeugscheins und aller Aufgaben.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 text-xs">
              {/* Meta-Infos */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-gray-500">Fahrzeugname</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedSchein.carName || "-"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-500">FIN-Nummer</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedSchein.finNumber || "–"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-500">Autohändler</div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-800 max-w-[190px] truncate">
                    <FiUser className="text-gray-500" size={11} />
                    <span>{selectedSchein.owner || "–"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-500">Hochgeladen am</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedSchein.createdAt
                      ? new Date(selectedSchein.createdAt).toLocaleDateString()
                      : "–"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-500">Verkaufsstatus</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedSchein.keySold ? "Verkauft" : "Nicht verkauft"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-gray-500">Tankstatus</div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedSchein.fuelNeeded
                      ? "Benzin/Diesel auffüllen (Tank leer)"
                      : "Tank ok"}
                  </div>
                </div>
              </div>

              {/* Aufgaben */}
              <div className="pt-2 border-t border-gray-100">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">
                    Aufgaben
                  </span>
                  {Array.isArray(selectedSchein.notes) &&
                    selectedSchein.notes.length > 0 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                        {selectedSchein.notes.length} Aufgabe
                        {selectedSchein.notes.length === 1 ? "" : "n"}
                      </span>
                    )}
                </div>

                {Array.isArray(selectedSchein.notes) &&
                selectedSchein.notes.length > 0 ? (
                  <ol className="space-y-1.5">
                    {selectedSchein.notes.map((note, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5"
                      >
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
                          {idx + 1}
                        </div>
                        <p className="text-[13px] text-gray-800 leading-snug">
                          {note}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    Für diesen Schein wurden noch keine Aufgaben hinterlegt.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={() => openEditModal(selectedSchein)}
                className="px-3 py-1.5 text-xs rounded-md bg-gray-900 text-white hover:bg-black transition"
              >
                Bearbeiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchein && (
        <ScheinForm
          mode="edit"
          schein={selectedSchein}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-700/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full">
            <div className="p-2 border-b flex justify-between items-center">
              <span className="text-sm font-medium">Schein Vorschau</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={modalImageUrl}
                alt="Vorschau"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Schlüssel-Verwaltung Modal */}
      {showKeyModal && selectedSchein && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate flex items-center gap-2">
                  Schlüssel verwalten
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {selectedSchein.carName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Schlüsselnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={keyForm.keyNumber}
                  onChange={(e) => handleKeyChange("keyNumber", e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none transition"
                  placeholder="z. B. 99"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Anzahl Schlüssel
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleKeyChange("keyCount", 1)}
                      className={`px-3 py-1.5 rounded-md text-xs border ${
                        keyForm.keyCount === 1
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeyChange("keyCount", 2)}
                      className={`px-3 py-1.5 rounded-md text-xs border ${
                        keyForm.keyCount === 2
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      2
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Farbe
                  </label>
                  <input
                    type="color"
                    value={keyForm.keyColor}
                    onChange={(e) =>
                      handleKeyChange("keyColor", e.target.value)
                    }
                    className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notiz zum Schlüssel
                </label>
                <input
                  type="text"
                  value={keyForm.keyNote}
                  onChange={(e) => handleKeyChange("keyNote", e.target.value)}
                  className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 outline-none transition"
                  placeholder="z. B. zweiter Schlüssel im Tresor"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mt-1">
                <input
                  type="checkbox"
                  checked={keyForm.keySold}
                  onChange={(e) => handleKeyChange("keySold", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-600"
                />
                Fahrzeug verkauft
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mt-1">
                <input
                  type="checkbox"
                  checked={keyForm.fuelNeeded}
                  onChange={(e) =>
                    handleKeyChange("fuelNeeded", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-gray-600"
                />
                Fahrzeug braucht Benzin / Diesel (Tank leer)
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleKeySave}
                className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
