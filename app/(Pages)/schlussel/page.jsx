"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  FiEdit,
  FiTrash2,
  FiSearch,
  FiPlus,
  FiX,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";
const carBrands = [
  { name: "BMW", logo: "/logos/bmw.png" },
  { name: "Citroen", logo: "/logos/citroen1.png" },
  { name: "Volkswagen", logo: "/logos/Volkswagen2.jpg" },
  { name: "Fiat", logo: "/logos/fiat.jpg" },
  { name: "Ford", logo: "/logos/ford.png" },
  { name: "Opel", logo: "/logos/opel44.png" },
  { name: "Dacia", logo: "/logos/Dacia1.png" },
  { name: "Honda", logo: "/logos/honda1.png" },
  { name: "Mercedes", logo: "/logos/Mercedes2.png" },
  { name: "Suzuki", logo: "/logos/suzuki.jpg" },
  { name: "Renault", logo: "/logos/Renault.png" },

  { name: "Skoda", logo: "/logos/scoda1.jpg" },
  { name: "Hyundai", logo: "/logos/hyundia.jpg" },
  { name: "Peugeot", logo: "/logos/peugeot1.png" },

  { name: "Mazda", logo: "/logos/mazda.png" },
  { name: "Nissan", logo: "/logos/nissan.png" },
  { name: "Seat", logo: "/logos/seat1.png" },
  { name: "Kia", logo: "/logos/kia1.png" },
  { name: "Toyota", logo: "/logos/Toyota1.png" },

  { name: "MiniCooper", logo: "/logos/minicooper1.png" },
  { name: "Audi", logo: "/logos/audi1.png" },
];

export default function KeysPage() {
  const [cars, setCars] = useState([]);
  const [filterBrand, setFilterBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  const [newCar, setNewCar] = useState({
    carName: "",
    keyNumber: "",
    note: "",
    numberOfKeys: 2,
    color: "#000000",
    sold: false, // ✅
  });
  const [showSoldOnly, setShowSoldOnly] = useState(false);

  const tableRef = useRef(null);
  const brandsRef = useRef(null);
  const currentCar = editingCar ?? newCar;
  useEffect(() => {
    fetchCars();
  }, [filterBrand, searchTerm, showSoldOnly]);

  const fetchCars = async () => {
    try {
      let url = "/api/keys";
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);

      if (showSoldOnly) params.append("sold", "true");
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error("Fehler beim Laden der Autos:", error);
    }
  };
  useEffect(() => {
    if (!filterBrand) return;

    const timeout = setTimeout(() => {
      setFilterBrand("");
    }, 60000); // 10 seconds

    return () => clearTimeout(timeout); // Clear if filter changes before 10s
  }, [filterBrand]);

  const handleAddCar = async () => {
    if (!newCar.carName || !newCar.keyNumber) return;
    console.log("Adding car:", newCar);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newCar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Fehler beim Hinzufügen des Autos");
        return;
      }

      setCars([...cars, data]);
      setNewCar({
        carName: "",
        keyNumber: "",
        note: "",
        color: "#000000",
        numberOfKeys: 2,
        sold: false,
      });
      setShowAddForm(false);
      toast.success("Fahrzeug erfolgreich gelöscht!");

      scrollToTable();
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Autos:", error);
    }
  };

  const handleUpdateCar = async () => {
    if (!editingCar?.carName || !editingCar?.keyNumber || !editingCar?._id) {
      alert("Bitte stellen Sie sicher, dass alle Felder ausgefüllt sind.");
      return;
    }

    try {
      const response = await fetch("/api/keys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCar._id,
          carName: editingCar.carName,
          keyNumber: editingCar.keyNumber,
          note: editingCar.note,
          color: editingCar.color,
          numberOfKeys: editingCar.numberOfKeys,
          sold: editingCar.sold,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Fehler beim Aktualisieren des Autos");
        return;
      }

      setCars(cars.map((car) => (car._id === data._id ? data : car)));
      setEditingCar(null);
      toast.success("Fahrzeug erfolgreich aktualisiert!");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Autos:", error);
    }
  };

  const handleDeleteCar = async (id) => {
    if (!window.confirm("Möchten Sie dieses Auto wirklich löschen?")) return;

    try {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      setCars(cars.filter((car) => car._id !== id));
      toast.success("Fahrzeug erfolgreich gelöscht!");
    } catch (error) {
      console.error("Fehler beim Löschen des Autos:", error);
    }
  };

  const handleFilter = (brand) => {
    setFilterBrand(brand);
    setSearchTerm("");
    scrollToTable();
  };

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        const tableTop = tableRef.current.offsetTop;
        const windowHeight = window.innerHeight;
        const scrollTo = Math.min(tableTop, tableTop - windowHeight * 0);
        window.scrollTo({
          top: scrollTo,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const resetFilters = () => {
    setFilterBrand("");
    setSearchTerm("");
    if (brandsRef.current) {
      brandsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const brandSynonyms = {
    Volkswagen: ["Volkswagen", "VW"],
    Mercedes: ["Mercedes", "Mercedes-Benz"],
    MiniCooper: ["Mini", "MiniCooper"],
    BMW: ["BMW"],
    Citroen: ["Citroen"],
    Fiat: ["Fiat"],
    Ford: ["Ford"],
    Opel: ["Opel"],
    Dacia: ["Dacia"],
    Honda: ["Honda"],
    Suzuki: ["Suzuki"],
    Renault: ["Renault"],
    Skoda: ["Skoda"],
    Hyundai: ["Hyundai"],
    Peugeot: ["Peugeot"],
    Mazda: ["Mazda"],
    Nissan: ["Nissan"],
    Seat: ["Seat"],
    Kia: ["Kia"],
    Toyota: ["Toyota"],
    Audi: ["Audi"],
  };

  const filteredCars = cars.filter((car) => {
    const name = (car.carName ?? "").toLowerCase();
    const key = (car.keyNumber ?? "").toLowerCase();
    const note = (car.note ?? "").toLowerCase();

    // Brand filtering
    if (filterBrand) {
      const aliases = brandSynonyms[filterBrand] || [filterBrand];
      const matchesBrand = aliases.some((alias) =>
        name.includes(alias.toLowerCase())
      );
      if (!matchesBrand) return false;
    }

    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        name.includes(term) || key.includes(term) || note.includes(term);
      if (!matchesSearch) return false;
    }

    // Sold filter
    if (showSoldOnly && !car.sold) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto">
        {/* Brand Logos - Always visible at top */}
        <div ref={brandsRef} className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-md sm:text-lg font-semibold text-gray-800">
              Markenfilter
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
            {carBrands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleFilter(brand.name)}
                className={`flex flex-col items-center p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                  filterBrand === brand.name
                    ? "bg-blue-100 border-2 border-blue-400 shadow-inner"
                    : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm"
                }`}
              >
                <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-18 md:h-18 flex items-center justify-center ">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={60}
                    height={60}
                    unoptimized
                    className="object-contain w-full h-full"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 truncate w-full text-center">
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table with integrated controls */}
        <div
          ref={tableRef}
          className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden border-1 border-gray-200"
        >
          {/* Enhanced Table Controls */}
          {/* Enhanced Table Controls - Mobile Optimized */}
          <div className="bg-gray-50 px-3 py-3 flex flex-col sm:flex-row justify-between items-stretch gap-3 border-b border-gray-200">
            {/* Mobile Layout */}
            <div className="sm:hidden w-full flex flex-col gap-3">
              {/* Row 1: Actions & Search Toggle */}
              <div className="flex justify-between items-center w-full">
                {/* Mobile Search Toggle */}
                <button
                  onClick={() => {
                    setShowSearch(!showSearch);
                    if (showSearch) setSearchTerm("");
                  }}
                  className={`p-2 rounded-lg flex items-center justify-center ${
                    showSearch
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  aria-label={showSearch ? "Suche schließen" : "Suche öffnen"}
                >
                  <FiSearch className="h-5 w-5" />
                </button>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2">
                  {filterBrand && (
                    <button
                      onClick={resetFilters}
                      className="px-2 py-1.5 text-xs font-medium flex items-center gap-1 bg-blue-50 text-blue-700 rounded"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowAddForm(!showAddForm);
                      setEditingCar(null);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg shadow"
                  >
                    <FiPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Search Input when visible */}
              {showSearch && (
                <div className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Suche Fahrzeuge..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-3 w-full">
              {/* Search Toggle Button */}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchTerm("");
                }}
                className={`p-2 rounded-lg flex items-center justify-center ${
                  showSearch
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                aria-label={showSearch ? "Suche schließen" : "Suche öffnen"}
              >
                <FiSearch className="h-5 w-5" />
              </button>

              {/* Search Input - Only visible if toggled */}
              <div
                className={`transition-all duration-200 ${
                  showSearch
                    ? "w-64 opacity-100"
                    : "w-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Suche Fahrzeuge..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Desktop Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  {filterBrand && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1.5 text-xs font-medium flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <FiFilter className="h-3 w-3" />
                      {filterBrand}
                      <FiX className="h-3 w-3 ml-1" />
                    </button>
                  )}

                  <button
                    onClick={() => setShowSoldOnly(!showSoldOnly)}
                    className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                      showSoldOnly
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {showSoldOnly ? "Verkaufte" : "Alle"}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setEditingCar(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-medium transition-colors"
                >
                  <FiPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Neues Fahrzeug</span>
                </button>
              </div>
            </div>
          </div>

          {/* Add/Edit Car Form */}

          {/* Car Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fahrzeug
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schl.Nr.
                  </th>

                  <th className="px-3 sm:px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schl.anz
                  </th>

                  <th className="px-3 sm:px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider m">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
                    <tr
                      key={car._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                          {car.color && (
                            <span
                              className="inline-block w-5 h-5 rounded-full border border-gray-300"
                              style={{ backgroundColor: car.color }}
                              title={`Farbe: ${car.color}`}
                            />
                          )}
                          <span
                            title={car.sold ? "Fahrzeug verkauft" : ""}
                            className={`whitespace-nowrap ${
                              car.sold
                                ? "line-through text-gray-400"
                                : "text-black"
                            }`}
                          >
                            {car.carName}
                          </span>
                        </div>
                        {car.note && (
                          <div className="text-xs text-gray-500 mt-1">
                            {car.note}
                          </div>
                        )}
                      </td>

                      <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm sm:text-base  font-semibold text-black/80 bg-blue-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md inline-block">
                          {car.keyNumber}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm sm:text-base text-gray-800">
                          {car.numberOfKeys || 1}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium space-x-1 sm:space-x-2">
                        <button
                          onClick={() => {
                            setEditingCar(car);
                            scrollToTable();
                          }}
                          className="p-1 rounded hover:bg-blue-50"
                          aria-label="Bearbeiten"
                          title="Bearbeiten"
                        >
                          <FiEdit className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car._id)}
                          className="p-1 rounded hover:bg-red-50"
                          aria-label="Löschen"
                          title="Löschen"
                        >
                          <FiTrash2 className="h-4 w-4 text-red-600 hover:text-red-800" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-3 sm:px-6 py-4 sm:py-6 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 sm:h-10 w-8 sm:w-10 text-gray-300 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm sm:text-md mb-1">
                          Keine Fahrzeuge gefunden
                        </p>
                        <p className="text-xs sm:text-sm mb-3">
                          {filterBrand || searchTerm
                            ? "Keine Ergebnisse für Ihre Filter"
                            : "Fügen Sie ein neues Fahrzeug hinzu"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal for Add/Edit */}
      {(showAddForm || editingCar) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 px-2">
          <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-2xl relative">
            {/* Close Button */}

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              {editingCar ? "Fahrzeug bearbeiten" : "Neues Fahrzeug hinzufügen"}
            </h2>

            {/* Form */}
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                editingCar ? handleUpdateCar() : handleAddCar();
              }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {/* Car Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fahrzeugname*
                </label>
                <input
                  name="carName"
                  autoComplete="off"
                  value={currentCar.carName ?? ""}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({
                          ...editingCar,
                          carName: e.target.value,
                        })
                      : setNewCar({ ...newCar, carName: e.target.value })
                  }
                  placeholder="z.B. VW Golf VII"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Key Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schlüsselnummer*
                </label>
                <input
                  name="keyNumber"
                  autoComplete="off"
                  value={currentCar.keyNumber ?? ""}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({
                          ...editingCar,
                          keyNumber: e.target.value,
                        })
                      : setNewCar({ ...newCar, keyNumber: e.target.value })
                  }
                  placeholder="z.B. 99"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wagenfarbe
                </label>
                <input
                  type="color"
                  autoComplete="off"
                  value={currentCar.color ?? "#000000"}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({ ...editingCar, color: e.target.value })
                      : setNewCar({ ...newCar, color: e.target.value })
                  }
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bemerkung
                </label>
                <input
                  name="note"
                  autoComplete="off"
                  value={currentCar.note ?? ""}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({ ...editingCar, note: e.target.value })
                      : setNewCar({ ...newCar, note: e.target.value })
                  }
                  placeholder="Optionale Notiz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Checkbox Section */}
              <div className="sm:col-span-2 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* One Key Checkbox */}
                  <label className="flex items-center text-sm gap-2">
                    <input
                      type="checkbox"
                      checked={currentCar.numberOfKeys === 1}
                      onChange={(e) =>
                        editingCar
                          ? setEditingCar({
                              ...editingCar,
                              numberOfKeys: e.target.checked ? 1 : 2,
                            })
                          : setNewCar({
                              ...newCar,
                              numberOfKeys: e.target.checked ? 1 : 2,
                            })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    Nur ein Schlüssel vorhanden
                  </label>

                  {/* Sold Checkbox */}
                  <label className="flex items-center text-sm gap-2">
                    <input
                      type="checkbox"
                      checked={!!currentCar.sold}
                      onChange={(e) =>
                        editingCar
                          ? setEditingCar({
                              ...editingCar,
                              sold: e.target.checked,
                            })
                          : setNewCar({ ...newCar, sold: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                    />
                    Fahrzeug verkauft
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2 mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCar(null);
                  }}
                  className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
                >
                  {editingCar ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
