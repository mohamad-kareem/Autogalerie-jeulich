"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const carBrands = [
  { name: "BMW", logo: "/logos/bmw.png" },
  { name: "Citroen", logo: "/logos/citroen.png" },
  { name: "Volkswagen", logo: "/logos/Volkswagen2.jpg" },
  { name: "Fiat", logo: "/logos/fiat.jpg" },
  { name: "Ford", logo: "/logos/ford.png" },
  { name: "Opel", logo: "/logos/opel4.png" },
  { name: "Dacia", logo: "/logos/Dacia1.png" },
  { name: "Honda", logo: "/logos/honda1.png" },
  { name: "Skoda", logo: "/logos/scoda1.jpg" },
  { name: "Renault", logo: "/logos/Renault.png" },
  { name: "Hyundai", logo: "/logos/hyundia.jpg" },
  { name: "Peugeot", logo: "/logos/peugeot1.png" },
  { name: "Suzuki", logo: "/logos/suzuki.jpg" },
  { name: "Mazda", logo: "/logos/mazda.png" },
  { name: "Nissan", logo: "/logos/nissan.png" },
  { name: "Toyota", logo: "/logos/Toyota1.png" },
  { name: "Audi", logo: "/logos/audi1.png" },
  { name: "Kia", logo: "/logos/kia1.png" },
  { name: "MiniCooper", logo: "/logos/minicooper.png" },
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
  });

  const tableRef = useRef(null);
  const brandsRef = useRef(null);

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
      setNewCar({ carName: "", keyNumber: "", note: "", numberOfKeys: 2 });

      setShowAddForm(false);
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
          id: editingCar._id, // explicitly send the ID
          carName: editingCar.carName,
          keyNumber: editingCar.keyNumber,
          note: editingCar.note,
          numberOfKeys: editingCar.numberOfKeys,
        }),
      });

      const data = await response.json();

      if (!data || !data._id) {
        console.error("Serverantwort ungültig:", data);
        alert("Fehler beim Aktualisieren. Versuchen Sie es erneut.");
        return;
      }

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

  const filteredCars = cars;

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto">
        {/* Brand Logos - Always visible at top */}
        <div ref={brandsRef} className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-md sm:text-lg font-semibold text-gray-800">
              Markenfilter
            </h3>
            {filterBrand && (
              <button
                onClick={resetFilters}
                className="text-xs text-black hover:text-blue-800 bg-blue-100 rounded-2xl p-2"
              >
                Filter zurücksetzen
              </button>
            )}
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
                    width={220}
                    height={220}
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
          className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden"
        >
          {/* Table Controls */}
          <div className="bg-gray-50 px-3 sm:px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 border-b border-gray-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showSearch && (
                <div className="relative flex-grow sm:flex-grow-0 sm:w-48">
                  <input
                    type="text"
                    placeholder="Suche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <svg
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
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
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowSearch((s) => !s)}
                className={`p-1 sm:p-2 rounded-lg ${
                  showSearch
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
                aria-label="Suche"
                title="Suche"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
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

              <button
                onClick={() => {
                  setShowAddForm((f) => !f);
                  setEditingCar(null);
                  if (!showAddForm) scrollToTable();
                }}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-xs sm:text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                <span>Auto hinzufügen</span>
              </button>
            </div>
          </div>

          {/* Add/Edit Car Form */}
          {(showAddForm || editingCar) && (
            <div className="bg-white p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-md sm:text-lg font-semibold mb-3 text-gray-800">
                {editingCar ? "Auto bearbeiten" : "Neues Auto"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Bemerkung
                  </label>
                  <input
                    name="note"
                    value={editingCar ? editingCar.note : newCar.note}
                    onChange={(e) =>
                      editingCar
                        ? setEditingCar({ ...editingCar, note: e.target.value })
                        : setNewCar({ ...newCar, note: e.target.value })
                    }
                    placeholder="Optionale Notiz"
                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />

                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center text-xs sm:text-sm text-gray-700 gap-1">
                      <input
                        type="checkbox"
                        checked={
                          editingCar
                            ? editingCar.numberOfKeys === 1
                            : newCar.numberOfKeys === 1
                        }
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
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      Nur ein Schlüssel vorhanden
                    </label>

                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={editingCar ? handleUpdateCar : handleAddCar}
                        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
                      >
                        {editingCar ? "Speichern" : "Hinzufügen"}
                      </button>
                      {editingCar && (
                        <button
                          onClick={() => setEditingCar(null)}
                          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-sm"
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

          {/* Car Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fahrzeug
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schlüsselnummer
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                    Bemerkung
                  </th>
                  <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Schlüsselanzahl
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
                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                          {car.carName}
                        </div>
                        {car.note && (
                          <div className="text-xs text-gray-500 sm:hidden mt-1">
                            {car.note}
                          </div>
                        )}
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <div className="text-sm sm:text-base font-mono font-bold text-blue-950 bg-blue-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md inline-block">
                          {car.keyNumber}
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 py-3 max-w-xs hidden sm:table-cell">
                        <div className="text-xs sm:text-sm text-gray-600">
                          {car.note || <span className="text-gray-400">-</span>}
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
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
    </div>
  );
}
