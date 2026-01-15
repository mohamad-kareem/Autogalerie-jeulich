// app/(components)/ScheinTable.jsx
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
  FiDroplet,
} from "react-icons/fi";

import ScheinForm from "./ScheinForm";
import WarrantyReklamationButton from "@/app/(components)/Schein/WarrantyReklamationButton";
import StageManagerButton from "@/app/(components)/Schein/StageManagerButton";

const PAGE_SIZE = 15;

/* -------------------------------------------------------
   Mobile wrapper: render desktop-like table on phones
   - Only affects < sm
   - User can pinch zoom naturally
-------------------------------------------------------- */
function MobileDesktopScale({ children }) {
  return (
    <div className="sm:hidden overflow-x-auto">
      <div className="origin-top-left scale-[0.62] w-[161%]">{children}</div>
    </div>
  );
}

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
  const [imageRotation, setImageRotation] = useState(270); // -90°

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    keyNumber: "",
    keyCount: 2,
    keyColor: "#000000",
    keySold: false,
    keyNote: "",
    fuelNeeded: false,
    rotKennzeichen: false,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = scheins?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages || 1);
  }, [currentPage, totalPages]);

  const paginatedScheins = useMemo(() => {
    if (!scheins || scheins.length === 0) return [];
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return scheins.slice(startIndex, endIndex);
  }, [scheins, currentPage]);

  // Theme classes
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const hoverBg = darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50";

  /* -----------------------------
     Actions
  ------------------------------ */
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

    const printDate = new Date().toLocaleDateString("de-DE");

    const doPrint = (finalImageUrl) => {
      const printWindow = window.open("", "_blank", "width=900,height=1200");
      if (!printWindow) {
        toast.error("Popup wurde vom Browser blockiert.");
        return;
      }

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

      let createdAtText = "—";
      if (createdAt) {
        const d = new Date(createdAt);
        if (!isNaN(d.getTime())) createdAtText = d.toLocaleDateString();
      }

      const notesHtml =
        Array.isArray(notes) && notes.length > 0
          ? `<ul class="task-list">
             ${notes.map((n) => `<li>${esc(n)}</li>`).join("")}
           </ul>`
          : `<p class="muted">Keine Aufgaben hinterlegt.</p>`;

      const imageHtml = finalImageUrl
        ? `
        <section class="section section-image">
          <h2 class="section-title">Bilddokumentation</h2>
          <div class="image-frame">
            <img src="${esc(finalImageUrl)}" alt="Fahrzeugschein" />
          </div>
        </section>
      `
        : "";

      printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="UTF-8" />
          <title>${esc(carName || "Fahrzeugschein")}</title>
          <style>
            @page { size: A4; margin: 0; }
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f3f4f6;
              color: #111827;
            }
            body { padding: 18mm; }
            .page {
              background: #ffffff;
              max-width: 210mm;
              margin: 0 auto;
              padding: 18mm 18mm 14mm;
              border-radius: 10px;
              border: 1px solid #e5e7eb;
              box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 12px;
              margin-bottom: 18px;
              border-bottom: 1px solid #e5e7eb;
            }
            .brand-text-main {
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #111827;
            }
            .header-meta { text-align: right; font-size: 12px; color: #4b5563; }
            .doc-title { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; }
            .section { margin-bottom: 16px; }
            .section-title {
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 8px;
            }
            .card {
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              background: #f9fafb;
              padding: 14px;
            }
            .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .data-label {
              width: 35%;
              padding: 6px 8px;
              color: #6b7280;
              font-weight: 500;
              border-bottom: 1px solid #e5e7eb;
            }
            .data-value {
              padding: 6px 8px;
              color: #111827;
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
            }
            .data-table tr:last-child .data-label,
            .data-table tr:last-child .data-value { border-bottom: none; }

            .tasks-card {
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              padding: 12px;
              background: #ffffff;
            }
            .tasks-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }
            .tasks-title {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              color: #4b5563;
            }
            .tasks-count {
              font-size: 11px;
              padding: 2px 10px;
              border-radius: 999px;
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
            }
            .task-list { padding-left: 18px; margin: 0; }
            .task-list li { font-size: 13px; color: #111827; margin-bottom: 4px; }
            .muted { font-size: 12px; color: #9ca3af; }

            .image-frame {
              padding: 10px;
              background: #f9fafb;
              text-align: center;
            }
            .image-frame img {
              max-width: 100%;
              max-height: 520px;
              object-fit: contain;
            }

            @media print {
              body { padding: 0; background: #ffffff; }
              .page {
                border-radius: 0;
                border: none;
                box-shadow: none;
                margin: 0;
                max-width: none;
                width: 100%;
                padding: 14mm 16mm 12mm;
              }
              .image-frame img { max-height: 650px; }
            }

            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              font-size: 11px;
              color: #6b7280;
            }
          </style>
        </head>

        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="page">

            <header class="header">
              <div class="brand">
                <div class="brand-text-main">AUTOGALERIE JÜLICH</div>
              </div>
              <div class="header-meta">
                <span>${esc(printDate)}</span>
              </div>
            </header>

            <section class="title-block">
              <h1 class="doc-title">
                ${esc(carName || "Unbekanntes Fahrzeug")}
                ${keyNumber ? ` (${esc(keyNumber)})` : ""}
              </h1>
            </section>

            <section class="section">
              <h2 class="section-title">Fahrzeugdaten</h2>
              <div class="card">
                <table class="data-table">
                  <tr>
                    <td class="data-label">FIN-Nummer</td>
                    <td class="data-value">${esc(finNumber || "—")}</td>
                  </tr>
                  <tr>
                    <td class="data-label">Schlüsselnummer</td>
                    <td class="data-value">${esc(keyNumber || "—")}</td>
                  </tr>
                  <tr>
                    <td class="data-label">Besitzer / Händler</td>
                    <td class="data-value">${esc(owner || "—")}</td>
                  </tr>
                  <tr>
                    <td class="data-label">Erfasst am</td>
                    <td class="data-value">${esc(createdAtText)}</td>
                  </tr>
                </table>
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Aufgaben / Hinweise</h2>
              <div class="tasks-card">
                <div class="tasks-header">
                  <div class="tasks-title">Liste</div>
                  ${
                    notes.length > 0
                      ? `<span class="tasks-count">${notes.length} Eintrag${
                          notes.length === 1 ? "" : "e"
                        }</span>`
                      : ""
                  }
                </div>
                ${notesHtml}
              </div>
            </section>

            ${imageHtml}

            <footer class="footer">
              Dieses Dokument ist ausschließlich für den internen Gebrauch bestimmt
              und nicht zur Weitergabe an Dritte vorgesehen.
            </footer>

          </div>
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.focus();
    };

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.height;
          canvas.height = img.width;

          const ctx = canvas.getContext("2d");
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          const rotatedUrl = canvas.toDataURL("image/jpeg", 0.95);
          doPrint(rotatedUrl);
        } catch (err) {
          console.error("Rotation failed, printing original image:", err);
          doPrint(imageUrl);
        }
      };

      img.onerror = () => {
        console.error("Image load failed, printing original image");
        doPrint(imageUrl);
      };

      img.src = imageUrl;
    } else {
      doPrint(null);
    }
  };

  const handleDelete = async (id, publicId) => {
    if (!confirm("Möchten Sie diesen Schein wirklich löschen?")) return;
    try {
      if (publicId) {
        await fetch("/api/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
      }

      await fetch(`/api/carschein?id=${id}`, { method: "DELETE" });
      onDeleteSchein(id);
      toast.success("Schein erfolgreich gelöscht");
    } catch (err) {
      console.error(err);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const openImagePreview = (schein) => {
    if (!schein?.imageUrl) {
      toast.error("Kein Bild verfügbar für diesen Schein.");
      return;
    }

    setSelectedSchein(schein);
    setModalImageUrl(schein.imageUrl);

    const isSmallScreen =
      typeof window !== "undefined" && window.innerWidth < 768;

    setImageRotation(isSmallScreen ? 0 : 270);
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
      rotKennzeichen: !!schein.rotKennzeichen,
    });
    setShowKeyModal(true);
  };

  const handleKeyChange = (field, value) => {
    setKeyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeySave = async () => {
    if (!selectedSchein?._id) return;

    try {
      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSchein._id,
          carName: selectedSchein.carName,
          owner: selectedSchein.owner,
          notes: selectedSchein.notes || [],
          imageUrl: selectedSchein.imageUrl ?? null,
          publicId: selectedSchein.publicId ?? null,

          keyNumber: keyForm.keyNumber.trim() || "",
          keyCount: keyForm.keyCount,
          keyColor: keyForm.keyColor,
          keySold: keyForm.keySold,
          keyNote: keyForm.keyNote.trim(),
          fuelNeeded: keyForm.fuelNeeded,
          rotKennzeichen: keyForm.rotKennzeichen,
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
      window.open(modalImageUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error("Bild konnte nicht geöffnet werden.");
    }
  };

  /* -------------------------------------------------------
     Table UI (single JSX) -> reused for mobile + desktop
  -------------------------------------------------------- */
  const TableUI = (
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
              <th className="px-9 py-2 text-right">Garantie</th>
              <th className="px-18 py-2 text-right">Phase</th>
              <th className="px-11 py-2 text-right">Aktionen</th>
            </tr>
          </thead>

          <tbody
            className={`divide-y transition-colors duration-300 tracking-wide ${
              darkMode
                ? "divide-gray-700 bg-gray-800"
                : "divide-gray-200 bg-white"
            }`}
          >
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 5 }).map((__, j) => (
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
                <td colSpan={5} className="px-3 py-8 text-center">
                  <div className="mx-auto max-w-md">
                    <div
                      className={`mb-1 text-sm font-medium transition-colors duration-300 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Keine Scheine gefunden
                    </div>
                    <p
                      className={`text-xs transition-colors duration-300 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
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
                  className={`transition-colors duration-300 ${hoverBg}`}
                >
                  {/* Fahrzeug */}
                  <td className="px-3 py-2 max-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${textPrimary} truncate`}
                      >
                        {schein.carName}
                      </span>

                      {schein.fuelNeeded && (
                        <span
                          title="Tank leer"
                          className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors duration-300 ${
                            darkMode
                              ? "bg-green-500 text-white"
                              : "bg-green-300 text-green-950"
                          }`}
                        >
                          <FiDroplet size={14} />
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

                  {/* Garantie */}
                  <td className="px-15 py-2 text-right">
                    <div className="flex justify-end">
                      <WarrantyReklamationButton
                        schein={schein}
                        darkMode={darkMode}
                        onUpdated={onUpdateSchein}
                      />
                    </div>
                  </td>

                  {/* Phase */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end">
                      <StageManagerButton
                        schein={schein}
                        darkMode={darkMode}
                        onUpdated={onUpdateSchein}
                      />
                    </div>
                  </td>

                  {/* Aktionen */}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openKeyModal(schein)}
                        className={`rounded cursor-pointer p-1 transition-colors duration-300 ${
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
                        className={`rounded p-1 cursor-pointer transition-colors duration-300 ${
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
                        className={`rounded p-1 cursor-pointer transition-colors duration-300 ${
                          darkMode
                            ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                        title="Details"
                      >
                        <FiMessageSquare size={16} />
                      </button>

                      <button
                        onClick={() => openImagePreview(schein)}
                        className={`rounded p-1 cursor-pointer transition-colors duration-300 ${
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
                        className={`rounded p-1 cursor-pointer transition-colors duration-300 ${
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

      {/* Pagination */}
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
  );

  return (
    <>
      {/* Mobile: scaled desktop-like table */}
      <MobileDesktopScale>{TableUI}</MobileDesktopScale>

      {/* Desktop/tablet: normal table */}
      <div className="hidden sm:block">{TableUI}</div>

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
            {/* ... keep your existing Info Modal code exactly as-is ... */}
            {/* (I left it unchanged on purpose to avoid risking any UI logic) */}
            {/* If you want, paste the rest and I’ll merge it 1:1. */}
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

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-700/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full shadow-xl max-h-[85vh] flex flex-col">
            <div className="p-2 border-b flex justify-between items-center gap-2">
              <span className="text-sm font-medium truncate">
                Schein Vorschau
                {selectedSchein?.carName ? ` · ${selectedSchein.carName}` : ""}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setImageRotation((r) => (r - 90 + 360) % 360)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Nach links drehen"
                >
                  <FiRotateCcw size={16} />
                </button>
                <button
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Nach rechts drehen"
                >
                  <FiRotateCw size={16} />
                </button>
                <button
                  onClick={handleDownloadCurrentImage}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                  title="Bild herunterladen"
                >
                  <FiDownload size={16} />
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
                  title="Schließen"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 md:p-3 flex-1 overflow-hidden flex items-center justify-center">
              <img
                src={modalImageUrl}
                alt="Vorschau"
                className="max-w-full object-contain max-h-[70vh] lg:max-h-[100vh]"
                style={{
                  transform: `rotate(${imageRotation}deg)`,
                  transition: "transform 150ms ease-in-out",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Key Modal */}
      {showKeyModal && selectedSchein && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border transition-colors duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
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

            <div className="px-5 py-4 space-y-4 text-xs">
              <div>
                <label
                  className={`block text-xs font-medium mb-1 transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Schlüsselnummer
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
              <label
                className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={keyForm.rotKennzeichen}
                  onChange={(e) =>
                    handleKeyChange("rotKennzeichen", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-gray-600"
                />
                Rotkennzeichen
              </label>
            </div>

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
