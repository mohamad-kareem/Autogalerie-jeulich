"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const carBrands = [
  { name: "BMW", logo: "/logos/bmw.png" },
  { name: "Citroen", logo: "/logos/citroen.png" },
  { name: "Fiat", logo: "/logos/fiat.jpg" },
  { name: "Ford", logo: "/logos/ford.png" },
  { name: "Honda", logo: "/logos/honda.png" },
  { name: "Hyundai", logo: "/logos/hyundai.png" },
  { name: "Kia", logo: "/logos/kia.png" },
  { name: "Mazda", logo: "/logos/mazda.png" },
  { name: "Mini", logo: "/logos/mini.png" },
  { name: "Nissan", logo: "/logos/nissan.png" },
  { name: "Opel", logo: "/logos/opel.png" },
  { name: "Peugeot", logo: "/logos/peugeot.png" },
  { name: "Suzuki", logo: "/logos/suzuki.jpg" },
  { name: "Volkswagen", logo: "/logos/volkswagen.png" },
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
  });
  const tableRef = useRef(null);

  useEffect(() => {
    fetchCars();
  }, [filterBrand, searchTerm]);

  const fetchCars = async () => {
    try {
      let url = "/api/keys";
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterBrand) params.append("brand", filterBrand);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error("Fehler beim Laden der Autos:", error);
    }
  };

  const handleAddCar = async () => {
    if (!newCar.carName || !newCar.keyNumber) return;

    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCar),
      });
      const data = await response.json();
      setCars([...cars, data]);
      setNewCar({ carName: "", keyNumber: "", note: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Autos:", error);
    }
  };

  const handleUpdateCar = async () => {
    if (!editingCar.carName || !editingCar.keyNumber) return;

    try {
      const response = await fetch("/api/keys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingCar),
      });
      const data = await response.json();
      setCars(cars.map((car) => (car._id === data._id ? data : car)));
      setEditingCar(null);
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
    } catch (error) {
      console.error("Fehler beim Löschen des Autos:", error);
    }
  };

  const handleFilter = (brand) => {
    setFilterBrand(brand);
    setSearchTerm("");
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const resetFilters = () => {
    setFilterBrand("");
    setSearchTerm("");
  };

  const filteredCars = cars;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header and Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center  gap-4">
          <div>
            {filterBrand && (
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">
                  Gefiltert nach: {filterBrand}
                </span>
                <button
                  onClick={resetFilters}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  (Filter zurücksetzen)
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            {showSearch && (
              <div className="relative flex-grow max-w-xs">
                <input
                  type="text"
                  placeholder="Suche nach Auto oder Schlüssel…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            )}

            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch((s) => !s)}
              className={`p-2 rounded-lg ${
                showSearch
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label="Suche"
              title="Suche"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Add Car */}
            <button
              onClick={() => {
                setShowAddForm((f) => !f);
                setEditingCar(null);
              }}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="hidden sm:inline">Auto hinzufügen</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Car Form */}
        {(showAddForm || editingCar) && (
          <div className="bg-white p-5 rounded-lg shadow-md mb-6 border border-blue-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {editingCar ? "Auto bearbeiten" : "Neues Auto erfassen"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fahrzeug*
                </label>
                <input
                  name="carName"
                  value={editingCar ? editingCar.carName : newCar.carName}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({
                          ...editingCar,
                          carName: e.target.value,
                        })
                      : setNewCar({ ...newCar, carName: e.target.value })
                  }
                  placeholder="z.B. VW Golf VII"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schlüsselnummer*
                </label>
                <input
                  name="keyNumber"
                  value={editingCar ? editingCar.keyNumber : newCar.keyNumber}
                  onChange={(e) =>
                    editingCar
                      ? setEditingCar({
                          ...editingCar,
                          keyNumber: e.target.value,
                        })
                      : setNewCar({ ...newCar, keyNumber: e.target.value })
                  }
                  placeholder="z.B. 12345678"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bemerkung
                </label>
                <div className="flex gap-2">
                  <input
                    name="note"
                    value={editingCar ? editingCar.note : newCar.note}
                    onChange={(e) =>
                      editingCar
                        ? setEditingCar({ ...editingCar, note: e.target.value })
                        : setNewCar({ ...newCar, note: e.target.value })
                    }
                    placeholder="Optionale Notiz"
                    className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={editingCar ? handleUpdateCar : handleAddCar}
                      className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
                    >
                      {editingCar ? "Speichern" : "Hinzufügen"}
                    </button>
                    {editingCar && (
                      <button
                        onClick={() => setEditingCar(null)}
                        className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-sm"
                      >
                        Abbrechen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Logos - Responsive Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Markenfilter
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {carBrands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleFilter(brand.name)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  filterBrand === brand.name
                    ? "bg-blue-100 border-2 border-blue-400 shadow-inner"
                    : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm"
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={56}
                    height={56}
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

        {/* Car Table */}
        <div
          ref={tableRef}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fahrzeug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schlüsselnummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bemerkung
                  </th>
                  <th className="px-20 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {car.carName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                          {car.keyNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-600">
                          {car.note || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingCar(car)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car._id)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-300 mb-3"
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
                        <p className="text-lg mb-2">Keine Fahrzeuge gefunden</p>
                        <p className="text-sm mb-4">
                          Fügen Sie ein neues Fahrzeug hinzu oder ändern Sie
                          Ihre Filter
                        </p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                        >
                          Fahrzeug hinzufügen
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
