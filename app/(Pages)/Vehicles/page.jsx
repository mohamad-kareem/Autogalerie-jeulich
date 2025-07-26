"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import VehicleModal from "@/app/(components)/vehicles/VehicleModal";
import VehicleTable from "@/app/(components)/vehicles/VehicleTable";
import LoadingSpinner from "@/app/(components)/vehicles/LoadingSpinner";

export default function VehiclesPage() {
  const { data: session, status } = useSession();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (status === "authenticated") {
      fetchVehicles();
    }
  }, [status]);

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vehicles", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Fahrzeuge");
      }

      let data = await response.json();
      const email = session?.user?.email;

      if (email === "admin@gmail.com") {
        // Admin sees all vehicles
      } else if (
        email === "autogalerie-juelich@hotmail.com" ||
        email === "autogalerie-juelich@web.de"
      ) {
        data = data.filter((v) => v.issuer === "alawie");
      } else if (email === "autogalerie.juelich@web.de") {
        data = data.filter((v) => v.issuer === "karim");
      } else {
        data = []; // All others see nothing
      }

      setVehicles(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      const method = currentVehicle ? "PUT" : "POST";
      const url = currentVehicle
        ? `/api/vehicles/${currentVehicle._id}`
        : "/api/vehicles";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Fehler beim Speichern des Fahrzeugs"
        );
      }

      const result = await response.json();
      toast.success(
        currentVehicle
          ? "Fahrzeug erfolgreich aktualisiert"
          : "Fahrzeug erfolgreich hinzugefügt"
      );
      fetchVehicles();
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Fehler beim Löschen des Fahrzeugs");
    }

    return response.json();
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "all" || vehicle.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const officialVehicles = filteredVehicles.filter(
    (v) => v.type === "official"
  );
  const unofficialVehicles = filteredVehicles.filter(
    (v) => v.type === "unofficial"
  );

  if (isLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Fahrzeugverwaltung
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Verwalten Sie Dienst- und Privatfahrzeuge
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentVehicle(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm sm:text-base"
        >
          <FiPlus className="text-sm sm:text-base" /> Fahrzeug hinzufügen
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Suche nach FIN, Bezeichnung oder Modell..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === "all"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setActiveFilter("official")}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === "official"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Dienstfahrzeuge
            </button>
            <button
              onClick={() => setActiveFilter("unofficial")}
              className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeFilter === "unofficial"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              Privatfahrzeuge
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleTable
          vehicles={officialVehicles}
          type="official"
          onEdit={(vehicle) => {
            setCurrentVehicle(vehicle);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
        <VehicleTable
          vehicles={unofficialVehicles}
          type="unofficial"
          onEdit={(vehicle) => {
            setCurrentVehicle(vehicle);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>

      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={currentVehicle}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
