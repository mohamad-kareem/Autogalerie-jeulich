"use client";
import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

      // Show all vehicles for main admin
      if (email === "admin@gmail.com") {
        // show all
      }
      // Show subset of vehicles based on email
      else if (
        email === "autogalerie-juelich@hotmail.com" ||
        email === "autogalerie-juelich@web.de"
      ) {
        data = data.filter((v) => v.createdBy === "autogalerie-juelich");
      } else if (email === "autogalerie.juelich@web.de") {
        data = data.filter((v) => v.createdBy === "karim");
      } else {
        data = []; // no access for other emails
      }

      setVehicles(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVehicles();
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
        body: JSON.stringify({
          ...data,
          createdBy:
            session?.user?.email === "autogalerie.juelich@web.de"
              ? "karim"
              : "autogalerie-juelich",
        }),
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
          : "Fahrzeug erfolgreich hinzugefügt",
        {
          position: "top-center",
          style: {
            background: "#4f46e5",
            color: "#fff",
          },
        }
      );
      fetchVehicles();
      return result;
    } catch (error) {
      toast.error(error.message, {
        position: "top-center",
      });
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
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Fahrzeugverwaltung
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentVehicle(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm sm:text-base"
          >
            <FiPlus className="text-xs sm:text-base" />
            hinzufügen
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Suche nach FIN, Bezeichnung oder Modell..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Alle Fahrzeuge
            </button>
            <button
              onClick={() => setActiveFilter("official")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === "official"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Firmenwagen
            </button>
            <button
              onClick={() => setActiveFilter("unofficial")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === "unofficial"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              Testwagen
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 overflow-hidden">
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
        </div>
        <div className="flex-1 overflow-hidden">
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
