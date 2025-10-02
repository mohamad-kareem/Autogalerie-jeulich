"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-red-950 flex items-center justify-center p-4 text-white relative">
      {/* Glow Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-red-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-950 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white/10 p-2 rounded-full mr-3">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Vertragsersteller auswählen
            </h1>
          </div>
          <p className="text-gray-300 text-sm">
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
                  ? "border-red-600 bg-red-950/30 shadow-sm"
                  : "border-gray-700 hover:border-red-600 hover:bg-gray-800/40"
              }`}
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full mr-4 ${
                  selected === opt.value ? "bg-red-900" : "bg-gray-800"
                }`}
              >
                <User
                  className={`h-5 w-5 ${
                    selected === opt.value ? "text-red-400" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{opt.label}</h3>
                <p className="text-sm text-gray-400">{opt.role}</p>
              </div>
              {selected === opt.value && (
                <CheckCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
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
                ? "bg-red-900 hover:bg-red-600 text-white shadow-md"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>Weiter</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
