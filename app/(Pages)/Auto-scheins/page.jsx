"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FiUpload,
  FiTrash2,
  FiImage,
  FiPlus,
  FiCalendar,
  FiX,
  FiMessageSquare,
  FiPrinter,
  FiFilter,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

import { FaCar, FaSearch } from "react-icons/fa";
import Image from "next/image";
import viewschein from "@/app/(assets)/schein1.png";

const LIMIT = 10;

export default function CarScheinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [carName, setCarName] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [scheins, setScheins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoDoc, setInfoDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showOwnerFilter, setShowOwnerFilter] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [finNumber, setFinNumber] = useState("");
  const [notesText, setNotesText] = useState("");
  const owners = ["Karim", "Alawie"];
  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Initial data fetch
  useEffect(() => {
    fetchScheins(1, true);
  }, []);
  const toggleOwner = (owner) => {
    setSelectedOwners((prev) =>
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner]
    );
  };

  const handlePrintImage = (doc) => {
    const {
      imageUrl,
      carName,
      assignedTo,
      owner,
      notes = [],
      createdAt,
      finNumber,
    } = doc;

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

    const noteItems = notes.map((n) => `<li>${esc(n)}</li>`).join("");

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
          ul {
            margin: 4mm 0 0 18px;
            padding: 0;
          }
          li {
            margin-bottom: 2mm;
            font-size: 14pt
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

            <div><span class="label">Zugewiesen an:</span> ${esc(
              assignedTo || "—"
            )}</div>
            <div><span class="label">Besitzer:</span> ${esc(owner || "—")}</div>
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

  // Data fetching function
  const fetchScheins = async (pageToLoad = 1, replace = false) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/carschein?page=${pageToLoad}&limit=${LIMIT}`
      );
      if (!res.ok) throw new Error("Abruf fehlgeschlagen");
      const { docs, totalPages } = await res.json();
      setScheins((prev) => (replace ? docs : [...prev, ...docs]));
      setPage(pageToLoad);
      setTotalPages(totalPages);
    } catch (err) {
      toast.error("Scheine konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  };

  // File handling
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleUpdateInfo = async () => {
    try {
      setIsLoading(true);
      let newImageData = {};

      if (file) {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "car_scheins_unsigned");

        const cloudRes = await fetch(
          "https://api.cloudinary.com/v1_1/dclgxdwrc/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const cloudData = await cloudRes.json();
        if (cloudData.error) throw new Error(cloudData.error.message);

        newImageData = {
          imageUrl: cloudData.secure_url,
          publicId: cloudData.public_id,
          oldPublicId: infoDoc.publicId, // include old one for deletion
        };
      }

      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: infoDoc._id,
          carName: infoDoc.carName,
          assignedTo: infoDoc.assignedTo,
          owner: infoDoc.owner,
          notes: notesText.split("\n").filter((n) => n.trim()),

          ...newImageData,
        }),
      });

      if (!res.ok) throw new Error("Aktualisierung fehlgeschlagen");

      const updatedDoc = await res.json();

      setScheins((prev) =>
        prev.map((doc) => (doc._id === updatedDoc._id ? updatedDoc : doc))
      );

      toast.success("Schein erfolgreich aktualisiert");
      setIsEditing(false);
      setShowInfoModal(false);
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      toast.error("Aktualisierung des Scheins fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFileInput = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      let uploadedImage = null;

      // 🔁 Only upload to Cloudinary if a file is selected
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "car_scheins_unsigned");

        const cloudRes = await fetch(
          "https://api.cloudinary.com/v1_1/dclgxdwrc/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const cloudData = await cloudRes.json();
        console.log("[Cloudinary Upload Result]", cloudData);

        if (cloudData.error) {
          throw new Error(`Cloudinary-Fehler: ${cloudData.error.message}`);
        }

        if (!cloudData.secure_url || !cloudData.public_id) {
          throw new Error("Fehler beim Cloudinary-Upload");
        }

        uploadedImage = {
          imageUrl: cloudData.secure_url,
          publicId: cloudData.public_id,
        };
      }

      // 🔁 Prepare the request body with optional fields
      const res = await fetch("/api/carschein", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carName,
          finNumber,
          assignedTo,
          owner,
          notes,
          ...uploadedImage, // Add imageUrl and publicId only if image was uploaded
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `Status ${res.status}`);
      }

      const newDoc = await res.json();

      setScheins((prev) => [newDoc, ...prev]);
      setCarName("");
      setAssignedTo("");
      setOwner("");
      setFinNumber("");
      setNotes("");
      resetFileInput();
      setShowUploadModal(false);
      toast.success("Schein erfolgreich hochgeladen");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(`Upload fehlgeschlagen: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete function
  const handleDelete = async (id, publicId) => {
    if (!confirm("Möchten Sie diesen Schein wirklich löschen?")) return;

    try {
      setIsLoading(true);
      await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });

      await fetch(`/api/carschein?id=${id}`, { method: "DELETE" });
      setScheins((prev) => prev.filter((s) => s._id !== id));
      toast.success("Schein erfolgreich gelöscht");
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter scheins
  // Filter scheins
  const filteredScheins = scheins.filter((schein) => {
    const nameMatch = schein.carName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const dateMatch = dateFilter
      ? new Date(schein.createdAt).toISOString().slice(0, 10) === dateFilter
      : true;

    const ownerMatch =
      selectedOwners.length === 0 || selectedOwners.includes(schein.owner);

    return nameMatch && dateMatch && ownerMatch;
  });

  // Image preview
  const openImagePreview = (url) => {
    if (!url) {
      toast.error("Kein Bild verfügbar für diesen Schein.");
      return;
    }

    setModalImageUrl(url);
    setShowPreviewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="w-full max-w-[95vw] xl:max-w-[1200px] 2xl:max-w-[1450px] mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-3xl font-bold text-gray-800">
              Fahrzeugschein-Verwaltung
            </h1>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <FiPlus className="text-lg" />
            <span>Schein hochladen</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="w-full max-w-[95vw] xl:max-w-[1200px] 2xl:max-w-[1450px] mx-auto mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* 🔍 Search Input */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Nach Fahrzeug suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* 📅 Date Picker */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiCalendar className="text-gray-400" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* 🧑‍💼 Owner Filter Dropdown */}
          <div className="relative w-full">
            <button
              onClick={() => setShowOwnerFilter(!showOwnerFilter)}
              className="w-full flex items-center justify-between pl-4 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
            >
              <div className="flex items-center">
                <FiFilter className="text-gray-400 mr-2" />
                <span className="text-gray-700">
                  {selectedOwners.length > 0
                    ? `${selectedOwners.length} Autohändler`
                    : "Alle Autohändler"}
                </span>
              </div>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${
                  showOwnerFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {showOwnerFilter && (
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                {owners.map((owner) => (
                  <div
                    key={owner}
                    className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center"
                    onClick={() => toggleOwner(owner)}
                  >
                    {selectedOwners.includes(owner) ? (
                      <FiCheck className="text-blue-500 mr-2" />
                    ) : (
                      <div className="w-4 h-4 mr-2 border border-gray-300 rounded" />
                    )}
                    <span>{owner}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="w-full max-w-[95vw] xl:max-w-[1200px] 2xl:max-w-[1450px] mx-auto">
        {isLoading ? (
          // Show loading spinner while data is being fetched
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="animate-spin h-8 w-8 text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Lade Scheine...</p>
          </div>
        ) : filteredScheins.length === 0 ? (
          // Show "no data" message if fetch completed but no scheins found
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaCar className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              Keine Scheine gefunden
            </h3>
            <p className="text-gray-500 mt-1">
              Laden Sie Ihren ersten Fahrzeugschein hoch
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FiUpload /> Schein hochladen
            </button>
          </div>
        ) : (
          // Show list of scheins
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {filteredScheins.map((schein) => (
                <li
                  key={schein._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Car Name and Date */}
                    <div className="flex-1 w-full min-w-0">
                      <p className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                        {schein.carName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <FiCalendar className="text-gray-400" />
                        <span>
                          Hochgeladen am:{" "}
                          {new Date(schein.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2">
                      <button
                        onClick={() => handlePrintImage(schein)}
                        className="p-2 hover:bg-green-300 rounded-lg transition-colors duration-200"
                        title="Drucken"
                      >
                        <FiPrinter size={20} />
                      </button>

                      <button
                        onClick={() => {
                          setInfoDoc(schein);
                          setNotesText(schein.notes?.join("\n") || "");
                          setShowInfoModal(true);
                        }}
                        className="p-2 hover:bg-blue-200 rounded-lg transition-colors duration-200"
                        title="Details anzeigen"
                      >
                        <FiMessageSquare size={20} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(schein._id, schein.publicId)
                        }
                        className="p-2 hover:bg-red-200 rounded-lg transition-colors duration-200"
                        title="Schein löschen"
                      >
                        <FiTrash2 size={20} />
                      </button>

                      <button
                        onClick={() => openImagePreview(schein.imageUrl)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                        title="Schein anzeigen"
                      >
                        <Image
                          src={viewschein}
                          alt="Anzeigen"
                          width={32}
                          height={32}
                          unoptimized
                          className="hover:opacity-100 transition-opacity"
                        />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination – Mehr laden */}
            {page < totalPages && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => fetchScheins(page + 1)}
                  disabled={isLoading}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Lade...
                    </>
                  ) : (
                    <>
                      <FiPlus /> Mehr laden
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <div className="bg-white rounded-lg overflow-hidden shadow-xl">
              <img
                src={modalImageUrl}
                alt="Vorschau"
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-700/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-2xl font-semibold text-gray-800">
                Schein hochladen
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetFileInput();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-6 md:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fahrzeugname*
                  </label>
                  <input
                    type="text"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="z.B. BMW X5 2020"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FIN-Nummer* (z.B. WBA3A9G58FNR12345)
                  </label>
                  <input
                    type="text"
                    value={finNumber}
                    onChange={(e) => setFinNumber(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Fahrgestellnummer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zugewiesen an
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">— bitte wählen —</option>
                    <option value="toni">Toni</option>
                    <option value="jaafar">Jaafar</option>
                    <option value="ali lackieren">Ali Lackieren</option>
                    <option value="rickim">Rickim</option>
                    <option value="aboali">Aboali</option>
                    <option value="abo abass">Abo Abass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autohändler
                  </label>
                  <div className="flex items-center gap-6 mt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="owner"
                        value="Karim"
                        checked={owner === "Karim"}
                        onChange={(e) => setOwner(e.target.value)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Karim</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="owner"
                        value="Alawie"
                        checked={owner === "Alawie"}
                        onChange={(e) => setOwner(e.target.value)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Alawie</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen / Aufgaben (jede Zeile = 1 Aufgabe)
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="- Tüv Neu&#10;- Ölwechsel Neu"
                  />
                </div>
              </div>

              <div className="space-y-4 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schein-Dokument*
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-24 w-24 rounded-md bg-gray-100 overflow-hidden border border-gray-300">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Vorschau"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-gray-500 px-2 text-center">
                        Kein Bild ausgewählt
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      {previewUrl ? "ändern" : "hochladen"}
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="sr-only"
                      />
                    </label>
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={resetFileInput}
                        className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        löschen
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG bis 10 MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isLoading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      Schein hochladen <FiUpload className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && infoDoc && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl overflow-hidden">
            {isEditing ? (
              <form
                className="px-6 py-6 grid grid-cols-2 md:grid-cols-2 gap-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateInfo();
                }}
              >
                {/* Fahrzeugname */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fahrzeugname*
                  </label>
                  <input
                    type="text"
                    value={infoDoc.carName}
                    onChange={(e) =>
                      setInfoDoc((prev) => ({
                        ...prev,
                        carName: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="z.B. BMW 320i Touring"
                  />
                </div>
                {/* FIN Nummer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FIN-Nummer
                  </label>
                  <input
                    type="text"
                    value={infoDoc.finNumber || ""}
                    onChange={(e) =>
                      setInfoDoc((prev) => ({
                        ...prev,
                        finNumber: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="WBA3A9G58FNR12345"
                  />
                </div>

                {/* Zugewiesen an */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zugewiesen an
                  </label>
                  <input
                    type="text"
                    value={infoDoc.assignedTo || ""}
                    onChange={(e) =>
                      setInfoDoc((prev) => ({
                        ...prev,
                        assignedTo: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="z.B. Toni"
                  />
                </div>

                {/* Autohändler Auswahl */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autohändler
                  </label>
                  <div className="flex items-center gap-6 mt-1">
                    {["Karim", "Alawie"].map((ownerOption) => (
                      <label
                        key={ownerOption}
                        className="inline-flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="owner"
                          value={ownerOption}
                          checked={infoDoc.owner === ownerOption}
                          onChange={(e) =>
                            setInfoDoc((prev) => ({
                              ...prev,
                              owner: e.target.value,
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <span>{ownerOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notizen */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen / Aufgaben (jede Zeile = 1 Aufgabe)
                  </label>
                  <textarea
                    rows={4}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="- Reifen prüfen\n- TÜV buchen"
                  />
                </div>

                {/* Bild ändern */}
                <div className="space-y-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Neues Bild (optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="h-24 w-24 rounded-md bg-gray-100 overflow-hidden border border-gray-300 flex items-center justify-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Vorschau"
                          className="h-full w-full object-cover"
                        />
                      ) : infoDoc.imageUrl ? (
                        <img
                          src={infoDoc.imageUrl}
                          alt="Aktuelles Bild"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-500 px-2 text-center">
                          Kein Bild vorhanden
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Bild wählen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const selected = e.target.files[0];
                            if (!selected) return;
                            setFile(selected);
                            setPreviewUrl(URL.createObjectURL(selected));
                          }}
                          className="sr-only"
                        />
                      </label>

                      {previewUrl && (
                        <button
                          type="button"
                          onClick={resetFileInput}
                          className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md bg-white hover:bg-gray-100"
                        >
                          Entfernen
                        </button>
                      )}

                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG bis 10 MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fahrzeugname
                  </label>
                  <div className="text-base font-semibold text-gray-800">
                    {infoDoc.carName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zugewiesen an
                  </label>
                  <div className="text-base text-gray-800">
                    {infoDoc.assignedTo || "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autohändler
                  </label>
                  <div className="text-base text-gray-800">
                    {infoDoc.owner || "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hochgeladen am
                  </label>
                  <div className="text-base text-gray-800">
                    {new Date(infoDoc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FIN-Nummer
                  </label>
                  <div className="text-base text-gray-800">
                    {infoDoc.finNumber || "—"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen / Aufgaben
                  </label>
                  <ul className="list-disc pl-5 text-gray-800">
                    {infoDoc.notes && infoDoc.notes.length > 0 ? (
                      infoDoc.notes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))
                    ) : (
                      <li>Keine Aufgaben</li>
                    )}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dokument
                  </label>
                  {infoDoc.imageUrl ? (
                    <img
                      src={infoDoc.imageUrl}
                      alt="Schein"
                      className="h-40 w-auto rounded-md border border-gray-300 object-contain"
                    />
                  ) : (
                    <div className="h-20 w-fit p-2 flex items-center justify-center text-sm text-gray-500 border border-gray-300 rounded-md">
                      Kein Bild verfügbar
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  >
                    Schließen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
