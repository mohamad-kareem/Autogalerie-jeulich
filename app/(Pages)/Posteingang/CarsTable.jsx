"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FiTrash2,
  FiEye,
  FiX,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiZap,
  FiUser,
  FiMail,
  FiPhone,
  FiInfo,
  FiCheck,
  FiClock,
  FiLayers,
  FiShield,
  FiSettings,
  FiStar,
  FiNavigation,
} from "react-icons/fi";
import { FaCar, FaGasPump, FaCarCrash, FaTools } from "react-icons/fa";
import { GiCarDoor, GiCarSeat, GiGearStick, GiWeight } from "react-icons/gi";
import { MdAir, MdColorLens } from "react-icons/md";
import ImageSlider from "@/app/(Pages)/gebrauchtwagen/[id]/ImageSlider";

export default function CarsTable() {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/manualcars");
      const data = await res.json();
      setCars(data);
    } catch {
      toast.error("Fahrzeuge konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!confirm("Möchten Sie dieses Fahrzeug wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/manualcars/${carId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Fahrzeug erfolgreich gelöscht");
        setCars((prev) => prev.filter((c) => c._id !== carId));
        setSelectedCar(null);
      } else {
        toast.error("Fehler beim Löschen des Fahrzeugs");
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
  };

  const formatField = (value) => {
    if (value === undefined || value === null) return "—";
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (Array.isArray(value)) return value.join(", ");
    return value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("de-DE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Ungültiges Datum";
    }
  };

  const formatPrice = (price) => {
    return price?.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderDetailItem = (icon, label, value, unit = "") => {
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100">
        <div className="text-red-600 mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-gray-800 font-medium truncate">
            {formatField(value)}{" "}
            {unit && <span className="text-gray-500">{unit}</span>}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <FiInfo className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          Keine Fahrzeuge gefunden
        </h3>
        <p className="text-gray-500">
          Es wurden noch keine Fahrzeuge hinzugefügt
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 bg-gradient-to-r from-red-50 to-red-50 p-4 font-medium text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-5">Fahrzeug</div>
            <div className="col-span-2">Preis</div>
            <div className="col-span-2">Kilometer</div>
            <div className="col-span-2">Hinzugefügt</div>
            <div className="col-span-1 text-right">Aktionen</div>
          </div>

          {cars.map((car) => (
            <div
              key={car._id}
              className="grid grid-cols-12 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
            >
              <div className="col-span-5 flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-16 bg-gray-200 rounded-md overflow-hidden">
                  {car.images?.[0] && (
                    <img
                      src={car.images[0]}
                      alt={`${car.make} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {car.make} {car.model}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      {car.registration || "Keine Angabe"}
                    </span>
                    {car.fuel && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        {car.fuel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center text-gray-700 font-medium">
                  {formatPrice(car.price)} €
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center text-gray-700">
                  {car.kilometers?.toLocaleString("de-DE")} km
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <FiCalendar className="text-red-400" size={14} />
                  <span>{formatDate(car.createdAt)}</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end items-center gap-1">
                <button
                  onClick={() => {
                    setSelectedCar(car);
                    setActiveTab("übersicht");
                  }}
                  className="p-2 text-gray-500 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200"
                  title="Details anzeigen"
                >
                  <FiEye />
                </button>
                <button
                  onClick={() => handleDeleteCar(car._id)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-red-600 rounded-md transition-colors duration-200"
                  title="Fahrzeug löschen"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile List */}
        <div className="md:hidden">
          {cars.map((car) => (
            <div
              key={car._id}
              className="border-b border-gray-200 last:border-b-0"
            >
              <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-12 w-16 bg-gray-200 rounded-md overflow-hidden">
                    {car.images?.[0] && (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {car.make} {car.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-700">
                        {formatPrice(car.price)} €
                      </span>
                      <span className="text-xs text-gray-500">
                        {car.kilometers?.toLocaleString("de-DE")} km
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCar(car);
                    setActiveTab("übersicht");
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                  title="Details anzeigen"
                >
                  <FiEye />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Car Detail Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full mx-4">
              <div className="bg-gradient-to-r from-black to-red-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-white">
                        {selectedCar.make} {selectedCar.model}
                      </h3>
                      <p className="text-gray-400 mt-1 text-sm md:text-xs flex items-center gap-1">
                        <FiCalendar size={14} />
                        {formatDate(selectedCar.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCar(null)}
                    className="text-red-100 hover:text-white transition-colors"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-4 md:px-6 py-4 max-h-[70vh] overflow-y-auto">
                {/* Image Slider */}
                {selectedCar.images?.length > 0 && (
                  <div className="mb-6">
                    <ImageSlider
                      images={selectedCar.images}
                      car={selectedCar}
                      height="h-[200px] md:h-[250px]"
                      width="w-full"
                    />
                  </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 overflow-x-auto">
                  <nav className="flex space-x-4 min-w-max">
                    <button
                      onClick={() => setActiveTab("übersicht")}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "übersicht"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Übersicht
                    </button>
                    <button
                      onClick={() => setActiveTab("technik")}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "technik"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Technik
                    </button>
                    <button
                      onClick={() => setActiveTab("ausstattung")}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "ausstattung"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Ausstattung
                    </button>
                    <button
                      onClick={() => setActiveTab("kontakt")}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "kontakt"
                          ? "border-red-600 text-red-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Kontakt
                    </button>
                  </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === "übersicht" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {renderDetailItem(
                        <FiSettings />,
                        "Name",
                        selectedCar.name
                      )}

                      {renderDetailItem(<FiSettings />, "VIN", selectedCar.vin)}
                      {renderDetailItem(
                        <FiDollarSign />,
                        "Preis",
                        selectedCar.price?.toLocaleString("de-DE"),
                        "€"
                      )}
                      {renderDetailItem(
                        <FiTrendingUp />,
                        "Kilometerstand",
                        selectedCar.kilometers?.toLocaleString("de-DE"),
                        "km"
                      )}
                      {renderDetailItem(
                        <FiCalendar />,
                        "Erstzulassung",
                        selectedCar.registration
                      )}
                      {renderDetailItem(
                        <FaGasPump />,
                        "Kraftstoffart",
                        selectedCar.fuel
                      )}
                      {renderDetailItem(
                        <GiGearStick />,
                        "Getriebe",
                        selectedCar.transmission
                      )}
                      {renderDetailItem(
                        <FiZap />,
                        "Leistung",
                        selectedCar.power,
                        "kW"
                      )}
                      {renderDetailItem(<FiZap />, "PS", selectedCar.hp, "HP")}
                      {renderDetailItem(
                        <FiCheck />,
                        "Zustand",
                        selectedCar.condition
                      )}
                      {renderDetailItem(
                        <FaCarCrash />,
                        "Unfallfrei",
                        selectedCar.accidentFree
                      )}
                      {renderDetailItem(
                        <FiUser />,
                        "Vorbesitzer",
                        selectedCar.previousOwners
                      )}
                      {renderDetailItem(
                        <GiCarDoor />,
                        "Türen",
                        selectedCar.doors
                      )}
                      {renderDetailItem(
                        <GiCarSeat />,
                        "Sitze",
                        selectedCar.seats
                      )}
                      {renderDetailItem(
                        <FiShield />,
                        "Status",
                        selectedCar.status
                      )}
                      {renderDetailItem(
                        <FiSettings />,
                        "Kategorie",
                        selectedCar.category
                      )}
                      {renderDetailItem(
                        <FiSettings />,
                        "Aktiv",
                        selectedCar.active
                      )}
                      {renderDetailItem(
                        <FiSettings />,
                        "Betriebsbereit",
                        selectedCar.operational
                      )}
                      {renderDetailItem(
                        <FiSettings />,
                        "Modellreihe",
                        selectedCar.modelSeries
                      )}
                      {renderDetailItem(
                        <FiSettings />,
                        "Ausstattungslinie",
                        selectedCar.equipmentLine
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FiInfo className="mr-2 text-red-600" />
                        Beschreibung
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedCar.description ? (
                          <p className="text-gray-700 whitespace-pre-line">
                            {selectedCar.description}
                          </p>
                        ) : (
                          <p className="text-gray-500">
                            Keine Beschreibung vorhanden
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tech Tab */}
                {activeTab === "technik" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {renderDetailItem(
                      <FiSettings />,
                      "Hubraum",
                      selectedCar.displacement,
                      "ccm"
                    )}
                    {renderDetailItem(
                      <FiSettings />,
                      "Zylinder",
                      selectedCar.cylinders
                    )}
                    {renderDetailItem(
                      <FiNavigation />,
                      "Antriebsart",
                      selectedCar.driveType
                    )}
                    {renderDetailItem(
                      <GiWeight />,
                      "Gewicht",
                      selectedCar.weight,
                      "kg"
                    )}
                    {renderDetailItem(
                      <FiNavigation />,
                      "Anhängelast gebremst",
                      selectedCar.towCapacityBraked,
                      "kg"
                    )}
                    {renderDetailItem(
                      <FiNavigation />,
                      "Anhängelast ungebremst",
                      selectedCar.towCapacityUnbraked,
                      "kg"
                    )}
                    {renderDetailItem(
                      <FaGasPump />,
                      "Tankvolumen",
                      selectedCar.tankCapacity,
                      "L"
                    )}
                    {renderDetailItem(
                      <FaGasPump />,
                      "Verbrauch kombiniert",
                      selectedCar.fuelConsumption,
                      "L/100km"
                    )}
                    {renderDetailItem(
                      <MdAir />,
                      "CO2-Emission",
                      selectedCar.co2Emission,
                      "g/km"
                    )}
                    {renderDetailItem(
                      <FiShield />,
                      "Emissionsklasse",
                      selectedCar.emissionClass
                    )}
                    {renderDetailItem(
                      <FiShield />,
                      "Umweltplakette",
                      selectedCar.environmentalBadge
                    )}
                    {renderDetailItem(
                      <FiCalendar />,
                      "TÜV bis",
                      selectedCar.inspectionDate
                    )}
                    {renderDetailItem(
                      <FaTools />,
                      "Motorschaden",
                      selectedCar.hasEngineDamage
                    )}
                    {renderDetailItem(
                      <FiSettings />,
                      "Energieverbrauch",
                      selectedCar.energyConsumption
                    )}
                    {renderDetailItem(
                      <FiSettings />,
                      "Klimaanlage",
                      selectedCar.airConditioning
                    )}
                    {renderDetailItem(
                      <FiSettings />,
                      "Airbags",
                      selectedCar.airbags
                    )}
                    {renderDetailItem(
                      <FiSettings />,
                      "Einparkhilfe",
                      selectedCar.parkingAssistance
                    )}
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === "ausstattung" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <MdColorLens className="mr-2 text-red-600" />
                        Farben & Materialien
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {renderDetailItem(
                          <MdColorLens />,
                          "Außenfarbe",
                          selectedCar.exteriorColor
                        )}
                        {renderDetailItem(
                          <MdColorLens />,
                          "Außenfarbe (einfach)",
                          selectedCar.exteriorColorSimple
                        )}
                        {renderDetailItem(
                          <MdColorLens />,
                          "Innenfarbe",
                          selectedCar.interiorColor
                        )}
                        {renderDetailItem(
                          <MdColorLens />,
                          "Innenfarbe (einfach)",
                          selectedCar.interiorColorSimple
                        )}
                        {renderDetailItem(
                          <FiLayers />,
                          "Innenmaterial",
                          selectedCar.interiorMaterial
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FiStar className="mr-2 text-red-600" />
                        Serienausstattung
                      </h4>
                      {selectedCar.features?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedCar.features.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-start bg-gray-50 px-4 py-3 rounded-lg"
                            >
                              <FiCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Keine Angaben zur Serienausstattung
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <FiStar className="mr-2 text-red-600" />
                        Sonderausstattung
                      </h4>
                      {selectedCar.specialFeatures?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedCar.specialFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-start bg-red-50 px-4 py-3 rounded-lg"
                            >
                              <FiStar className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Keine Sonderausstattung</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === "kontakt" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {renderDetailItem(
                      <FiUser />,
                      "Vollständiger Name",
                      selectedCar.contact?.fullName
                    )}
                    {renderDetailItem(
                      <FiMail />,
                      "E-Mail",
                      selectedCar.contact?.email
                    )}
                    {renderDetailItem(
                      <FiPhone />,
                      "Telefon",
                      selectedCar.contact?.phone
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCar(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none transition-colors"
                >
                  Schließen
                </button>
                <button
                  onClick={() => handleDeleteCar(selectedCar._id)}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors"
                >
                  Fahrzeug löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
