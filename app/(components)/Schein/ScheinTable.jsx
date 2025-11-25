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
  FiRotateCcw,
  FiRotateCw,
  FiDownload,
} from "react-icons/fi";
import ScheinForm from "./ScheinForm";

const PAGE_SIZE = 15;

export default function ScheinTable({
  scheins,
  loading,
  onUpdateSchein,
  onDeleteSchein,
  darkMode = false,
}) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchein, setSelectedSchein] = useState(null);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [imageRotation, setImageRotation] = useState(0); // NEW: rotation state

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    keyNumber: "",
    keyCount: 2,
    keyColor: "#000000",
    keySold: false,
    keyNote: "",
    fuelNeeded: false,
  });
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = scheins?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

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

  // Theme classes
  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-600";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const hoverBg = darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50";

  const handlePrintImage = (doc) => {
    if (!doc) return;

    const {
      imageUrl,
      carName,
      owner,
      notes = [],
      createdAt,
      finNumber,
      keyNumber,
    } = doc;

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      toast.error("Popup wurde vom Browser blockiert.");
      return;
    }

    // Helper to escape HTML
    const esc = (s = "") =>
      String(s || "").replace(
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

    // Safe date
    let createdAtText = "—";
    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        createdAtText = d.toLocaleDateString();
      }
    }

    // Aufgaben / Hinweise
    const notesHtml =
      Array.isArray(notes) && notes.length > 0
        ? `<ul class="task-list">
           ${notes.map((n) => `<li>${esc(n)}</li>`).join("")}
         </ul>`
        : `<p class="muted">Keine Aufgaben hinterlegt.</p>`;

    // Optional image block – hell, neutral
    const imageHtml = imageUrl
      ? `
      <section class="image-section">
        <div class="image-frame">
          <img src="${esc(imageUrl)}" alt="Fahrzeugschein" />
        </div>
      </section>
    `
      : "";

    // Write HTML
    printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <title>${esc(carName || "Fahrzeugschein")}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f3f4f6;
            color: #111827;
          }

          body {
            padding: 18mm;
          }

          .page {
            background: #ffffff;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm 18mm 16mm;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
          }

          /* HEADER / BRANDING */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            margin-bottom: 18px;
            border-bottom: 1px solid #e5e7eb;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand-text-main {
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #111827;
          }

          .brand-text-sub {
            font-size: 12px;
            color: #6b7280;
          }

          .header-meta {
            text-align: right;
            font-size: 12px;
            color: #4b5563;
          }

          .header-meta strong {
            display: block;
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 2px;
          }

          /* TITLE AREA */
          .title-block {
            margin-bottom: 16px;
          }

          .doc-title {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: #111827;
            margin: 0 0 6px 0;
          }

          .doc-subtitle {
            font-size: 14px;
            color: #4b5563;
            margin: 0;
          }

          .meta-line {
            margin-top: 8px;
            font-size: 13px;
            color: #374151;
          }

          .meta-line span + span::before {
            content: "•";
            margin: 0 6px;
            color: #9ca3af;
          }

          /* IMAGE – hell, neutral */
          .image-section {
            margin-top: 14px;
            margin-bottom: 20px;
          }

          .image-frame {
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            padding: 10px;
            text-align: center;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);
          }

          .image-frame img {
            max-width: 100%;
            max-height: 380px;
            object-fit: contain;
            border-radius: 6px;
            background: #f9fafb;
          }

          /* VEHICLE DATA CARD */
          .card {
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            padding: 14px 16px;
            margin-bottom: 18px;
          }

          .card-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 600;
          }

          .data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 24px;
          }

          .data-item-label {
            font-size: 12px;
            color: #6b7280;
          }

          .data-item-value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }

          /* TASKS / NOTES */
          .tasks-card {
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            padding: 14px 16px;
            margin-top: 6px;
          }

          .tasks-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .tasks-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 600;
            color: #4b5563;
          }

          .tasks-count {
            font-size: 12px;
            padding: 3px 10px;
            border-radius: 999px;
            background: #eef2ff;
            color: #3730a3;
            border: 1px solid #c7d2fe;
          }

          .task-list {
            margin: 4px 0 0;
            padding-left: 20px;
          }

          .task-list li {
            font-size: 14px;
            line-height: 1.45;
            color: #111827;
            margin-bottom: 6px;
            font-weight: 500;
          }

          .muted {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 2px;
          }

          /* FOOTER */
          .footer {
            margin-top: 22px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
          }

          .footer span {
            display: block;
            max-width: 100%;
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .page {
              border-radius: 0;
              border: none;
              box-shadow: none;
              margin: 0;
              max-width: none;
              width: 100%;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.onafterprint = () => window.close();">
        <div class="page">
          <!-- HEADER -->
          <header class="header">
            <div class="brand">
              <div>
                <div class="brand-text-main">AUTOGALERIE JÜLICH</div>
                <div class="brand-text-sub">Werkstatt- und Instandhaltungsdokumentation</div>
              </div>
            </div>
            <div class="header-meta">
              <div>${esc(createdAtText)}</div>
              <div>FIN: ${esc(finNumber || "–")}</div>
            </div>
          </header>

          <!-- TITLE -->
          <section class="title-block">
            <h1 class="doc-title">
              ${esc(carName || "Unbekanntes Fahrzeug")}
              ${keyNumber ? ` (${esc(keyNumber)})` : ""}
            </h1>
            <p class="doc-subtitle">
              Dokumentation der Fahrzeugdaten für Wartung und Reparatur.
            </p>
          </section>

          <!-- IMAGE (optional, hell) -->
          ${imageHtml}

          <!-- VEHICLE DATA -->
          <section class="card">
            <div class="card-title">Fahrzeugdaten</div>
            <div class="data-grid">
              <div>
                <div class="data-item-label">FIN-Nummer</div>
                <div class="data-item-value">${esc(finNumber || "–")}</div>
              </div>

              <div>
                <div class="data-item-label">Schlüsselnummer</div>
                <div class="data-item-value">${esc(keyNumber || "—")}</div>
              </div>

              <div>
                <div class="data-item-label">Besitzer / Händler</div>
                <div class="data-item-value">${esc(owner || "–")}</div>
              </div>

              <div>
                <div class="data-item-label">Erfasst am</div>
                <div class="data-item-value">${esc(createdAtText)}</div>
              </div>
            </div>
          </section>

          <!-- TASKS / NOTES -->
          <section class="tasks-card">
            <div class="tasks-header">
              <div class="tasks-title">Aufgaben / Hinweise</div>
              ${
                Array.isArray(notes) && notes.length > 0
                  ? `<span class="tasks-count">${notes.length} Eintrag${
                      notes.length === 1 ? "" : "e"
                    }</span>`
                  : ""
              }
            </div>
            ${notesHtml}
          </section>

          <!-- FOOTER -->
          <footer class="footer">
            <span>Dieses Dokument ist ausschließlich für den internen Gebrauch bestimmt und nicht zur Weitergabe an Dritte vorgesehen.</span>
          </footer>
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
  };

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

  // UPDATED: gets the whole schein, not only url
  const openImagePreview = (schein) => {
    if (!schein?.imageUrl) {
      toast.error("Kein Bild verfügbar für diesen Schein.");
      return;
    }
    setSelectedSchein(schein);
    setModalImageUrl(schein.imageUrl);
    setImageRotation(0); // reset rotation every time we open
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

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);

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

  const handleDownloadCurrentImage = () => {
    if (!modalImageUrl) return;

    try {
      // Opens the image in a NEW TAB without touching your current page
      window.open(modalImageUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error("Bild konnte nicht geöffnet werden.");
    }
  };

  return (
    <>
      {/* Table */}
      <div
        className={`rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} shadow-sm`}
      >
        <div className="w-full overflow-x-auto custom-scroll">
          <table className="min-w-full divide-y transition-colors duration-300">
            <thead
              className={`transition-colors duration-300 ${
                darkMode ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <tr
                className={`text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <th className="px-3 py-2">Fahrzeug</th>
                <th className="px-16 py-2">FIN</th>
                <th className="px-3 py-2 text-right">Besitzer</th>
                <th className="px-11 py-2 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y transition-colors duration-300 ${
                darkMode
                  ? "divide-gray-700 bg-gray-800"
                  : "divide-gray-200 bg-white"
              }`}
            >
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div
                          className={`h-4 w-20 rounded transition-colors duration-300 ${
                            darkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center">
                    <div className="mx-auto max-w-md">
                      <div
                        className={`mb-1 text-sm font-medium transition-colors duration-300 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Keine Scheine gefunden
                      </div>
                      <p
                        className={`transition-colors duration-300 ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        } text-xs`}
                      >
                        Suchbegriff oder Filter anpassen
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedScheins.map((schein) => (
                  <tr
                    key={schein._id}
                    className={`cursor-pointer transition-colors duration-300 ${hoverBg}`}
                  >
                    {/* Fahrzeug + Datum + Badges */}
                    <td className="px-3 py-2 max-w-[260px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium transition-colors duration-300 ${textPrimary} truncate`}
                        >
                          {schein.carName}
                        </span>

                        {schein.keySold && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-semibold ${
                              darkMode
                                ? "bg-green-900 text-green-300"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Verkauft
                          </span>
                        )}

                        {schein.fuelNeeded && (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-semibold ${
                              darkMode
                                ? "bg-orange-900 text-orange-300"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            Tank leer
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-0.5 text-[11px] transition-colors duration-300 ${textMuted}`}
                      >
                        {schein.createdAt
                          ? new Date(schein.createdAt).toLocaleDateString()
                          : "--"}
                      </div>
                    </td>

                    {/* FIN */}
                    <td className="px-3 py-2">
                      <div
                        className={`text-sm transition-colors duration-300 ${textPrimary}`}
                      >
                        {schein.finNumber || "-"}
                      </div>
                    </td>

                    {/* Besitzer */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <FiUser
                          className={`transition-colors duration-300 ${textMuted} text-xs`}
                        />
                        <span
                          className={`text-sm transition-colors duration-300 ${textPrimary}`}
                        >
                          {schein.owner}
                        </span>
                      </div>
                    </td>

                    {/* Aktionen */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openKeyModal(schein)}
                          className={`rounded p-1 transition-colors duration-300 ${
                            darkMode
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          title="Schlüssel / Status"
                        >
                          <FiKey
                            size={16}
                            className={
                              schein.keyNumber ||
                              schein.keySold ||
                              schein.fuelNeeded
                                ? darkMode
                                  ? "text-gray-300"
                                  : "text-gray-700"
                                : "text-blue-600"
                            }
                          />
                        </button>

                        <button
                          onClick={() => handlePrintImage(schein)}
                          className={`rounded p-1 transition-colors duration-300 ${
                            darkMode
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          title="Drucken"
                        >
                          <FiPrinter size={16} />
                        </button>

                        <button
                          onClick={() => openInfoModal(schein)}
                          className={`rounded p-1 transition-colors duration-300 ${
                            darkMode
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          title="Details"
                        >
                          <FiMessageSquare size={16} />
                        </button>

                        <button
                          onClick={() => openImagePreview(schein)} // UPDATED
                          className={`rounded p-1 transition-colors duration-300 ${
                            darkMode
                              ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          title="Vorschau"
                        >
                          <FiImage size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(schein._id, schein.publicId)
                          }
                          className={`rounded p-1 transition-colors duration-300 ${
                            darkMode
                              ? "text-red-400 hover:bg-red-900 hover:text-red-300"
                              : "text-red-600 hover:bg-red-50"
                          }`}
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
          <div
            className={`flex items-center justify-between px-3 py-2 border-t-2 text-xs transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-gray-400"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
          >
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
                className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-600 hover:bg-gray-700 text-gray-400"
                    : "border-gray-300 hover:bg:white text-gray-600"
                }`}
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
                className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-600 hover:bg-gray-700 text-gray-400"
                    : "border-gray-400 hover:bg:white text-gray-600"
                }`}
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
          <div
            className={`w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-5 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="min-w-0">
                <h3
                  className={`text-sm font-semibold truncate transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Schein · {selectedSchein.carName}
                </h3>
                <p
                  className={`mt-0.5 text-[11px] transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Detailansicht des Fahrzeugscheins und aller Aufgaben.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                  darkMode
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 text-xs">
              {/* Meta-Infos */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Fahrzeugname
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedSchein.carName || "-"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    FIN-Nummer
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedSchein.finNumber || "–"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Autohändler
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] max-w-[190px] truncate transition-colors duration-300 ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-gray-300"
                        : "border-gray-200 bg-gray-50 text-gray-800"
                    }`}
                  >
                    <FiUser
                      className={darkMode ? "text-gray-400" : "text-gray-500"}
                      size={11}
                    />
                    <span>{selectedSchein.owner || "–"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Hochgeladen am
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedSchein.createdAt
                      ? new Date(selectedSchein.createdAt).toLocaleDateString()
                      : "–"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Verkaufsstatus
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedSchein.keySold ? "Verkauft" : "Nicht verkauft"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Tankstatus
                  </div>
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedSchein.fuelNeeded
                      ? "Benzin/Diesel auffüllen (Tank leer)"
                      : "Tank gefüllt"}
                  </div>
                </div>
              </div>

              {/* Aufgaben */}
              <div
                className={`pt-2 border-t transition-colors duration-300 ${
                  darkMode ? "border-gray-700" : "border-gray-100"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold transition-colors duration-300 ${
                      darkMode ? "text-gray-300" : "text-gray-800"
                    }`}
                  >
                    Aufgaben
                  </span>
                  {Array.isArray(selectedSchein.notes) &&
                    selectedSchein.notes.length > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] transition-colors duration-300 ${
                          darkMode
                            ? "bg-gray-700 text-gray-400"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
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
                        className={`flex gap-2 rounded-md border px-3 py-1.5 transition-colors duration-300 ${
                          darkMode
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
                          {idx + 1}
                        </div>
                        <p
                          className={`text-[13px] leading-snug transition-colors duration-300 ${
                            darkMode ? "text-gray-300" : "text-gray-800"
                          }`}
                        >
                          {note}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p
                    className={`text-[11px] transition-colors duration-300 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Für diesen Schein wurden noch keine Aufgaben hinterlegt.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`flex items-center justify-end gap-2 border-t px-5 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
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
          darkMode={darkMode}
        />
      )}

      {/* Image Preview Modal – with rotation + download */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-700/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl">
            <div className="p-2 border-b flex justify-between items-center gap-2">
              <span className="text-sm font-medium truncate">
                Schein Vorschau
                {selectedSchein?.carName ? ` · ${selectedSchein.carName}` : ""}
              </span>
              <div className="flex items-center gap-1">
                {/* Rotate left */}
                <button
                  onClick={() => setImageRotation((r) => (r - 90 + 360) % 360)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Nach links drehen"
                >
                  <FiRotateCcw size={16} />
                </button>
                {/* Rotate right */}
                <button
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Nach rechts drehen"
                >
                  <FiRotateCw size={16} />
                </button>
                {/* Download */}
                <button
                  onClick={handleDownloadCurrentImage}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Bild herunterladen"
                >
                  <FiDownload size={16} />
                </button>
                {/* Close */}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                  title="Schließen"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center">
              <img
                src={modalImageUrl}
                alt="Vorschau"
                className="max-w-full max-h-[70vh] object-contain"
                style={{
                  transform: `rotate(${imageRotation}deg)`,
                  transition: "transform 150ms ease-in-out",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schlüssel-Verwaltung Modal */}
      {showKeyModal && selectedSchein && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between border-b px-5 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="min-w-0">
                <h3
                  className={`text-sm font-semibold truncate transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Schlüssel verwalten
                </h3>
                <p
                  className={`mt-0.5 text-[11px] transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {selectedSchein.carName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                  darkMode
                    ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 text-xs">
              <div>
                <label
                  className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Schlüsselnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={keyForm.keyNumber}
                  onChange={(e) => handleKeyChange("keyNumber", e.target.value)}
                  className={`w-full h-9 rounded-md border px-2 text-sm focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/30"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-600 focus:ring-blue-600/30"
                  }`}
                  placeholder="z. B. 99"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Anzahl Schlüssel
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleKeyChange("keyCount", 1)}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-colors duration-300 ${
                        keyForm.keyCount === 1
                          ? "bg-blue-600 text-white border-blue-600"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeyChange("keyCount", 2)}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-colors duration-300 ${
                        keyForm.keyCount === 2
                          ? "bg-blue-600 text-white border-blue-600"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      2
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                <label
                  className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Notiz zum Schlüssel
                </label>
                <input
                  type="text"
                  value={keyForm.keyNote}
                  onChange={(e) => handleKeyChange("keyNote", e.target.value)}
                  className={`w-full h-9 rounded-md border px-2 text-sm focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/30"
                      : "bg-white border-gray-300 text-gray-900 focus:border-blue-600 focus:ring-blue-600/30"
                  }`}
                  placeholder="z. B. zweiter Schlüssel im Tresor"
                />
              </div>

              <label
                className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={keyForm.keySold}
                  onChange={(e) => handleKeyChange("keySold", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-600"
                />
                Fahrzeug verkauft
              </label>

              <label
                className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
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
            <div
              className={`flex items-center justify-end gap-2 border-t px-5 py-3 transition-colors duration-300 ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
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
