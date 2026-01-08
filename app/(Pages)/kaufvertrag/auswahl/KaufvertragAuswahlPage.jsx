"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, FileText, ChevronRight, User } from "lucide-react";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { FiMenu } from "react-icons/fi";
export default function KaufvertragAuswahlPage({ carId }) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const { openSidebar } = useSidebar();
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Mobile hamburger */}
      <button
        onClick={openSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors duration-300"
        aria-label="Menü öffnen"
      >
        <FiMenu className="h-4 w-4" />
      </button>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-750 p-6 text-center border-b border-slate-700">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Vertragsersteller
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Wählen Sie den Vertragsersteller für die Kaufvertragsgenerierung
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`cursor-pointer flex items-center p-4 rounded-lg border transition-colors ${
                selected === opt.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-600 hover:border-blue-400 hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    selected === opt.value ? "bg-blue-500" : "bg-slate-700"
                  }`}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">
                    {opt.label}
                  </h3>
                  <p className="text-sm text-slate-400">{opt.role}</p>
                </div>
              </div>
              {selected === opt.value && (
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Continue button */}
        <div className="p-6 pt-4">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-colors ${
              selected
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Weiter zum Vertrag</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
