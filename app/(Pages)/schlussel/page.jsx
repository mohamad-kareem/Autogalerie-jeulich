"use client";

import { useState, useEffect } from "react";
import {
  FiSearch,
  FiKey,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiX,
  FiCheck,
  FiArrowLeft,
} from "react-icons/fi";
import { FaGasPump } from "react-icons/fa";
import { toast } from "react-hot-toast";

export default function SchlüsselManagement() {
  const [keys, setKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [form, setForm] = useState({
    car: "",
    schlusselNumber: "",
    vinNumber: "",
    doorNumber: "",
    notes: "",
    needsBenzine: false,
    transmission: "",
    color: "",
  });

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schlussels");
      const { schlussels } = await res.json();
      setKeys(schlussels);
      setFilteredKeys(schlussels);
    } catch (e) {
      toast.error("Fehler beim Laden der Schlüssel");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    setFilteredKeys(
      searchTerm
        ? keys.filter((key) =>
            key.car.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : keys
    );
  }, [searchTerm, keys]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setSelectedKey(null);
    setIsAdding(false);
    setIsEditing(false);
    setShowMobileDetail(false);
  };

  const handleSelectKey = (key) => {
    setSelectedKey(key);
    setIsAdding(false);
    setIsEditing(false);
    setShowMobileDetail(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const startAddNew = () => {
    setForm({
      car: "",
      schlusselNumber: "",
      vinNumber: "",
      doorNumber: "",
      notes: "",
      needsBenzine: false,
      transmission: "",
      color: "",
    });
    setIsAdding(true);
    setSelectedKey(null);
    setShowMobileDetail(true);
  };

  const startEditKey = () => {
    if (!selectedKey) return;
    setForm({
      car: selectedKey.car || "",
      schlusselNumber: selectedKey.schlusselNumber || "",
      vinNumber: selectedKey.vinNumber || "",
      doorNumber: selectedKey.doorNumber || "",
      notes: selectedKey.notes || "",
      needsBenzine: selectedKey.needsBenzine ?? false,
      transmission: selectedKey.transmission || "",
      color: selectedKey.color || "",
    });

    setIsEditing(true);
  };

  const saveKey = async () => {
    if (
      form.schlusselNumber &&
      keys.some(
        (k) =>
          k.schlusselNumber === form.schlusselNumber &&
          (!isEditing || k._id !== selectedKey?._id)
      )
    ) {
      toast.error("Schlüsselnummer existiert bereits");
      return;
    }

    try {
      const url = isEditing
        ? `/api/schlussels/${selectedKey._id}`
        : "/api/schlussels";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const { schlussel } = await res.json();
        if (isEditing) {
          setKeys((prev) =>
            prev.map((k) => (k._id === schlussel._id ? schlussel : k))
          );
          setFilteredKeys((prev) =>
            prev.map((k) => (k._id === schlussel._id ? schlussel : k))
          );
          setSelectedKey(schlussel);
        } else {
          setKeys((prev) => [schlussel, ...prev]);
          setFilteredKeys((prev) => [schlussel, ...prev]);
          setSelectedKey(schlussel);
        }

        setIsAdding(false);
        setIsEditing(false);
        toast.success(
          `Schlüssel erfolgreich ${isEditing ? "aktualisiert" : "hinzugefügt"}`
        );
      } else {
        throw new Error(
          isEditing ? "Fehler beim Aktualisieren" : "Fehler beim Hinzufügen"
        );
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error(error.message);
    }
  };

  const deleteKey = async (id) => {
    if (!confirm("Möchten Sie diesen Schlüssel wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/schlussels/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k._id !== id));
        setFilteredKeys((prev) => prev.filter((k) => k._id !== id));
        if (selectedKey?._id === id) {
          setSelectedKey(null);
          setShowMobileDetail(false);
        }
        toast.success("Schlüssel erfolgreich gelöscht");
      } else {
        throw new Error("Fehler beim Löschen");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const closeMobileDetail = () => {
    setShowMobileDetail(false);
    setIsAdding(false);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Lade Schlüsseldaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Schlüsselverwaltung
            </h1>
            <p className="text-gray-600">
              {keys.length} {keys.length === 1 ? "Schlüssel" : "Schlüssel"}{" "}
              registriert
            </p>
          </div>
          <button
            onClick={startAddNew}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <FiPlus />
            Neuer Schlüssel
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Header - Only shown when detail view is open on mobile */}
          {showMobileDetail && (
            <div className="md:hidden flex items-center p-4 border-b border-gray-200">
              <button
                onClick={closeMobileDetail}
                className="mr-2 text-gray-600 hover:text-gray-800"
              >
                <FiArrowLeft className="text-xl" />
              </button>
              <h2 className="text-lg font-semibold text-gray-800">
                {isAdding
                  ? "Neuer Schlüssel"
                  : isEditing
                  ? "Schlüssel bearbeiten"
                  : selectedKey?.car || "Details"}
              </h2>
            </div>
          )}

          <div className="flex flex-col md:flex-row">
            {/* Search & List - Hidden on mobile when detail view is open */}
            <div
              className={`w-full md:w-2/5 border-b md:border-b-0 md:border-r border-gray-200 ${
                showMobileDetail ? "hidden md:block" : "block"
              }`}
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Fahrzeug suchen..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
                {filteredKeys.length === 0 ? (
                  <div className="p-8 text-center">
                    <FiKey className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-600 font-medium">
                      {searchTerm
                        ? "Keine passenden Schlüssel gefunden"
                        : "Keine Schlüssel vorhanden"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={startAddNew}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mx-auto px-4 py-2"
                      >
                        <FiPlus /> Ersten Schlüssel hinzufügen
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredKeys.map((key) => (
                      <li
                        key={key._id}
                        onClick={() => handleSelectKey(key)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                          selectedKey?._id === key._id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-md ${
                              selectedKey?._id === key._id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <FiKey />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {key.car}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              #{key.schlusselNumber}
                              {key.doorNumber && (
                                <span>• {key.doorNumber}</span>
                              )}
                              {key.needsBenzine && (
                                <FaGasPump className="text-green-500" />
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteKey(key._id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-gray-100"
                          >
                            <FiTrash2 />
                          </button>
                          <FiChevronRight className="text-gray-400" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Detail / Form - Always visible on desktop, conditionally on mobile */}
            <div
              className={`w-full md:w-3/5 ${
                showMobileDetail ? "block" : "hidden md:block"
              }`}
            >
              {isAdding || isEditing ? (
                <div className="p-6">
                  <div className="hidden md:flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {isEditing
                        ? "Schlüssel bearbeiten"
                        : "Neuen Schlüssel hinzufügen"}
                    </h2>
                    <button
                      onClick={closeMobileDetail}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                    >
                      <FiX />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fahrzeugname *
                      </label>
                      <input
                        name="car"
                        value={form.car || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. BMW X5"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Schlüsselnummer *
                      </label>
                      <input
                        name="schlusselNumber"
                        value={form.schlusselNumber || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. 12345"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        VIN-Nummer
                      </label>
                      <input
                        name="vinNumber"
                        value={form.vinNumber || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Fahrgestellnummer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Getriebe
                      </label>
                      <select
                        name="transmission"
                        value={form.transmission || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="Automatik">Automatik</option>
                        <option value="Manuell">Manuell</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Farbe
                      </label>
                      <input
                        name="color"
                        value={form.color || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Fahrzeugfarbe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Türnummer
                      </label>
                      <select
                        name="doorNumber"
                        value={form.doorNumber || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Keine Auswahl</option>
                        <option value="Tür 1">Tür 1</option>
                        <option value="Tür 2">Tür 2</option>
                        <option value="Tür 3">Tür 3</option>
                        <option value="Tür 4">Tür 4</option>
                        <option value="Tür 5">Tür 5</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hinweise
                      </label>
                      <textarea
                        name="notes"
                        value={form.notes || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Besondere Anmerkungen..."
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        id="needsBenzine"
                        name="needsBenzine"
                        checked={form.needsBenzine}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="needsBenzine"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Fahrzeug benötigt Benzin
                      </label>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                      <button
                        onClick={closeMobileDetail}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={saveKey}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2"
                      >
                        <FiCheck />
                        {isEditing ? "Speichern" : "Hinzufügen"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedKey ? (
                <div className="p-6">
                  <div className="hidden md:flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-md">
                          <FiKey />
                        </span>
                        {selectedKey.car}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Schlüssel #{selectedKey.schlusselNumber}
                      </p>
                    </div>
                    <button
                      onClick={startEditKey}
                      className="text-blue-400 hover:text-blue-600 p-2 rounded-md hover:bg-blue-50"
                    >
                      <FiEdit2 />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Schlüsselnummer
                      </h3>
                      <p className="font-medium text-gray-800">
                        {selectedKey.schlusselNumber}
                      </p>
                    </div>

                    {selectedKey.vinNumber && (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          VIN-Nummer
                        </h3>
                        <p className="font-medium text-gray-800">
                          {selectedKey.vinNumber}
                        </p>
                      </div>
                    )}

                    {selectedKey.transmission && (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Getriebe
                        </h3>
                        <p className="font-medium text-gray-800">
                          {selectedKey.transmission}
                        </p>
                      </div>
                    )}

                    {selectedKey.color && (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Farbe
                        </h3>
                        <p className="font-medium text-gray-800">
                          {selectedKey.color}
                        </p>
                      </div>
                    )}

                    {selectedKey.doorNumber && (
                      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Türnummer
                        </h3>
                        <p className="font-medium text-gray-800">
                          {selectedKey.doorNumber}
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Benzin-Status
                      </h3>
                      <p className="font-medium text-gray-800">
                        {selectedKey.needsBenzine ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            Benötigt Benzin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            Kein Benzin benötigt
                          </span>
                        )}
                      </p>
                    </div>

                    {selectedKey.notes && (
                      <div className="md:col-span-2">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Hinweise
                        </h3>
                        <p className="text-gray-800 whitespace-pre-line bg-gray-50 p-4 rounded-md text-sm border border-gray-200">
                          {selectedKey.notes}
                        </p>
                      </div>
                    )}

                    <div className="md:col-span-2 pt-4 border-t border-gray-200 flex justify-between">
                      <button
                        onClick={() => deleteKey(selectedKey._id)}
                        className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2"
                      >
                        <FiTrash2 />
                        Schlüssel löschen
                      </button>
                      <button
                        onClick={startEditKey}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                      >
                        <FiEdit2 />
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="p-4 bg-gray-100 text-gray-400 rounded-full mb-4">
                    <FiKey className="text-3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">
                    {searchTerm
                      ? "Schlüssel auswählen"
                      : "Kein Schlüssel ausgewählt"}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-xs mb-4">
                    {searchTerm
                      ? "Wählen Sie einen Schlüssel aus der Liste, um Details anzuzeigen"
                      : "Wählen Sie einen Schlüssel aus der Liste oder fügen Sie einen neuen hinzu"}
                  </p>

                  {!searchTerm && (
                    <button
                      onClick={startAddNew}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2"
                    >
                      <FiPlus /> Neuen Schlüssel hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
