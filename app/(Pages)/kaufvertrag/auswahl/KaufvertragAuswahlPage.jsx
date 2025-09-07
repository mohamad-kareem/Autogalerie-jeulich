"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, FileText, ChevronRight, User } from "lucide-react";

export default function KaufvertragAuswahlPage({ carId }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  const handleContinue = () => {
    if (!selected) {
      alert("Bitte wählen Sie eine Option aus");
      return;
    }
    const qp = new URLSearchParams();
    qp.set("issuer", selected);
    if (carId) qp.set("carId", carId);
    router.push(`/kaufvertrag/form?${qp.toString()}`);
  };

  const options = [
    { value: "karim", label: "Hussein Karim", role: "Inhaber" },
    { value: "alawie", label: "Jibrail Alawie", role: "Inhaber" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white/20 p-2 rounded-full mr-3">
              <FileText className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">Vertragsersteller auswählen</h1>
          </div>
          <p className="text-blue-100 text-center text-sm opacity-90">
            Bitte wählen Sie aus, auf wen der Kaufvertrag ausgestellt werden
            soll.
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`cursor-pointer flex items-start p-4 rounded-xl border transition-all duration-200 ${
                selected === opt.value
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full mr-4 ${
                  selected === opt.value ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <User
                  className={`h-5 w-5 ${
                    selected === opt.value ? "text-blue-600" : "text-gray-500"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{opt.label}</h3>
                <p className="text-sm text-gray-500">{opt.role}</p>
              </div>
              {selected === opt.value && (
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Continue button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              selected
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Weiter</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
