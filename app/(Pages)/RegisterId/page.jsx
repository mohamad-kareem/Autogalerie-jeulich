"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { setDeviceId } from "@/app/utils/device";
import { FiSmartphone, FiShield, FiClock, FiMapPin } from "react-icons/fi";

export default function RegisterDevicePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const handleRegister = async () => {
    if (!session?.user?.id) {
      toast.error("Bitte zuerst einloggen");
      return;
    }

    setLoading(true);
    try {
      const deviceId = crypto.randomUUID();

      const res = await fetch("/api/punch/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, deviceId }),
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Registrierung fehlgeschlagen");

      setDeviceId(deviceId);
      toast.success("Gerät erfolgreich registriert!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Geräteregistrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-6 sm:px-6 sm:py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Geräteregistrierung
            </h1>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base">
              Registrieren Sie dieses Gerät für schnelles Ein-/Ausstempeln ohne
              Anmeldung
            </p>
          </div>

          {/* Main Content */}
          <div className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column - Info */}
              <div className="md:w-1/2 space-y-4">
                <div
                  className={`p-3 sm:p-4 rounded-lg border ${
                    expandedSection === "how"
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => toggleSection("how")}
                >
                  <div className="flex items-center cursor-pointer">
                    <FiSmartphone className="text-indigo-600 mr-2 sm:mr-3 text-lg sm:text-xl" />
                    <h3 className="font-semibold text-base sm:text-lg">
                      So funktioniert's
                    </h3>
                  </div>
                  {expandedSection === "how" && (
                    <div className="mt-2 pl-7 sm:pl-9 text-gray-600 text-sm sm:text-base space-y-1 sm:space-y-2">
                      <p>1. Gerät einmalig registrieren</p>
                      <p>2. System speichert sichere Kennung</p>
                      <p>3. Zukünftige Stempelungen ohne Login</p>
                      <p>4. Erfordert weiterhin physische Anwesenheit (GPS)</p>
                    </div>
                  )}
                </div>

                <div
                  className={`p-3 sm:p-4 rounded-lg border ${
                    expandedSection === "security"
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => toggleSection("security")}
                >
                  <div className="flex items-center cursor-pointer">
                    <FiShield className="text-indigo-600 mr-2 sm:mr-3 text-lg sm:text-xl" />
                    <h3 className="font-semibold text-base sm:text-lg">
                      Sicherheitsfunktionen
                    </h3>
                  </div>
                  {expandedSection === "security" && (
                    <div className="mt-2 pl-7 sm:pl-9 text-gray-600 text-sm sm:text-base space-y-1 sm:space-y-2">
                      <p>• Eindeutiger Geräte-Fingerabdruck</p>
                      <p>• GPS-Standortüberprüfung</p>
                      <p>• Verhindert aufeinanderfolgende Stempelungen</p>
                      <p>• Ein Gerät pro Administrator</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <FiClock className="text-blue-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 text-lg sm:text-xl" />
                    <div>
                      <h4 className="font-medium text-blue-800 text-sm sm:text-base">
                        Wichtig zu wissen
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-blue-600">
                        Bei Löschung der Browserdaten oder Nutzung eines neuen
                        Geräts ist eine Neuregistrierung erforderlich.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Registration */}
              <div className="md:w-1/2">
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg h-full flex flex-col">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Gerät registrieren
                    </h2>
                    <p className="mt-1 sm:mt-2 text-gray-600 text-sm sm:text-base">
                      Klicken Sie unten, um eine sichere Kennung für diesen
                      Browser/dieses Gerät zu generieren.
                    </p>

                    <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-4">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3">
                          <FiMapPin className="text-indigo-600 text-sm sm:text-base" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Standortdienste werden weiterhin für Stempelungen
                          benötigt
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className={`mt-4 sm:mt-6 w-full py-2 sm:py-3 px-4 rounded-lg font-medium text-white transition-all
                      ${
                        loading
                          ? "bg-indigo-400"
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
                      }
                      flex items-center justify-center text-sm sm:text-base`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                        Wird registriert...
                      </>
                    ) : (
                      "Gerätekennung generieren"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-500">
            <p>
              Diese Registrierung ist mit Ihrem Konto und diesem spezifischen
              Gerät/Browser verknüpft.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
