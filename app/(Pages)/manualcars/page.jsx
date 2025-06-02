"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  FiXCircle,
  FiClock,
  FiLayers,
  FiDroplet,
  FiShield,
  FiSettings,
  FiStar,
  FiNavigation,
  FiCreditCard,
} from "react-icons/fi";
import { FaCar, FaGasPump, FaCarCrash, FaTools } from "react-icons/fa";
import { GiCarDoor, GiCarSeat, GiGearStick, GiWeight } from "react-icons/gi";
import { MdAir, MdDirectionsCar, MdColorLens } from "react-icons/md";
import ImageSlider from "@/app/(Pages)/gebrauchtwagen/[id]/ImageSlider"; // Make sure to import your ImageSlider component

export default function ManualCarsPage() {
  const { data: session, status } = useSession();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState("übersicht");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isAdmin) {
      fetchCars();
    }
  }, [status]);

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/manualcars");
      const data = await res.json();
      setCars(data);
    } catch {
      toast.error("Fahrzeuge konnten nicht geladen werden");
    }
  };

  const handleDelete = async (carId) => {
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
    return value;
  };

  const renderDetailItem = (icon, label, value, unit = "") => {
    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="text-red-900 mt-1">{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-gray-800 font-medium">
            {formatField(value)}{" "}
            {unit && <span className="text-gray-500">{unit}</span>}
          </p>
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <FiXCircle className="mx-auto text-red-500 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-600">
            Sie sind nicht berechtigt, diese Seite zu sehen. Bitte wenden Sie
            sich an Ihren Administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-red-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FaCar className="text-red-900" />
            Fahrzeugverwaltung
          </h1>
          <p className="text-gray-400 mt-1">
            Verwalten Sie alle manuell hinzugefügten Fahrzeuge im System
          </p>
        </div>

        {cars.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiInfo className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Keine Fahrzeuge gefunden
            </h3>
            <p className="text-gray-500">
              Es wurden noch keine Fahrzeuge hinzugefügt
            </p>
          </div>
        ) : (
          <div className="bg-white  shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-black/95 p-4 font-medium text-white text-sm">
              <div className="col-span-4 md:col-span-3">Fahrzeug</div>
              <div className="col-span-3 md:col-span-2 flex items-center">
                <FiDollarSign className="mr-1" />
                Preis
              </div>
              <div className="hidden md:flex col-span-2 items-center">
                <FiTrendingUp className="mr-1" />
                Kilometer
              </div>
              <div className="hidden md:flex col-span-2 items-center">
                <FiCalendar className="mr-1" />
                Hinzugefügt
              </div>
              <div className="col-span-5 md:col-span-3 text-right">
                Aktionen
              </div>
            </div>

            {cars.map((car) => (
              <div
                key={car._id}
                className="grid grid-cols-12 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-4 md:col-span-3 flex items-center space-x-3">
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
                    <p className="text-sm text-gray-500 truncate">
                      {car.registration || "Keine Angabe"}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <div className="flex items-center text-gray-700">
                    {car.price?.toLocaleString("de-DE")} €
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 items-center">
                  <div className="flex items-center text-gray-700">
                    {car.kilometers?.toLocaleString("de-DE")} km
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 items-center">
                  <div className="text-sm text-gray-500">
                    {new Date(car.createdAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
                <div className="col-span-5 md:col-span-3 flex justify-end items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCar(car);
                      setActiveTab("übersicht");
                    }}
                    className="p-2 text-gray-700 hover:text-red-900 rounded-md hover:bg-gray-100 transition-colors"
                    title="Details anzeigen"
                  >
                    <FiEye />
                  </button>
                  <button
                    onClick={() => handleDelete(car._id)}
                    className="p-2 text-gray-700 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Fahrzeug löschen"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fahrzeug-Detailansicht */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black to-red-800 bg-opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-gray-100 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedCar.make} {selectedCar.model}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedCar.registration} | {selectedCar.fuel} |{" "}
                      {selectedCar.kilometers?.toLocaleString("de-DE")} km
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCar(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                {/* Bildergalerie - Using the ImageSlider component */}
                {selectedCar.images?.length > 0 && (
                  <div className="mb-8">
                    <ImageSlider
                      images={selectedCar.images}
                      car={selectedCar}
                      height="h-[250px]"
                      width="w-full"
                    />
                  </div>
                )}

                {/* Navigations-Tabs */}
                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab("übersicht")}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "übersicht"
                          ? "border-red-900 text-red-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Übersicht
                    </button>
                    <button
                      onClick={() => setActiveTab("technik")}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "technik"
                          ? "border-red-900 text-red-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Technik
                    </button>
                    <button
                      onClick={() => setActiveTab("ausstattung")}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "ausstattung"
                          ? "border-red-900 text-red-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Ausstattung
                    </button>
                    <button
                      onClick={() => setActiveTab("kontakt")}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "kontakt"
                          ? "border-red-900 text-red-900"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Kontakt
                    </button>
                  </nav>
                </div>

                {/* Übersicht Tab */}
                {activeTab === "übersicht" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FiInfo className="mr-2 text-red-900" />
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

                {/* Technik Tab */}
                {activeTab === "technik" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  </div>
                )}

                {/* Ausstattung Tab */}
                {activeTab === "ausstattung" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <MdColorLens className="mr-2 text-red-900" />
                        Farben & Materialien
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <FiStar className="mr-2 text-red-900" />
                        Serienausstattung
                      </h4>
                      {selectedCar.features?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <FiStar className="mr-2 text-red-900" />
                        Sonderausstattung
                      </h4>
                      {selectedCar.specialFeatures?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {selectedCar.specialFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-start bg-blue-50 px-4 py-3 rounded-lg"
                            >
                              <FiStar className="text-red-900 mr-2 mt-0.5 flex-shrink-0" />
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

                {/* Kontakt Tab */}
                {activeTab === "kontakt" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedCar(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-900"
                >
                  Schließen
                </button>
                <button
                  onClick={() => handleDelete(selectedCar._id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Fahrzeug löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
