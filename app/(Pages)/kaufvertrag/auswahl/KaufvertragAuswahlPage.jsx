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

    if (carId) {
      qp.set("carId", carId);
    }

    router.push(`/kaufvertrag/form?${qp.toString()}`);
  };

  const options = [
    {
      value: "karim",
      label: "Hussein Karim",
      role: "Inhaber",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-3 py-4 sm:px-4">
      <div className="ind-plate mb-4 flex items-center gap-3 px-4 py-3">
        <button
          onClick={openSidebar}
          className="ind-icon-btn md:hidden"
          aria-label="Menü öffnen"
        >
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="ind-title">Neuer Kaufvertrag</h1>
          <p className="text-[12px] text-muted">Vertragsersteller wählen</p>
        </div>
        <FileText className="h-5 w-5 text-[#3e454e]" />
      </div>

      <motion.section
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="card overflow-hidden"
      >
        <div className="space-y-2 p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#3e454e]">
            Wer erscheint als Verkäufer im Vertrag?
          </p>
          {options.map((opt) => {
            const active = selected === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`flex w-full items-center gap-3 rounded-[4px] border p-3 text-left transition ${
                  active
                    ? "border-[#3e454e] bg-[#eef0f2] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
                    : "border-line bg-white hover:border-[#9aa1aa]"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border ${
                    active
                      ? "border-[#262b31] bg-gradient-to-b from-[#4b535d] to-[#343a42] text-white"
                      : "border-line bg-canvas text-[#3e454e]"
                  }`}
                >
                  <User className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{opt.label}</span>
                  <span className="block text-[12px] text-muted">{opt.role}</span>
                </span>

                <CheckCircle
                  className={`h-5 w-5 shrink-0 ${active ? "text-emerald-600" : "text-black/15"}`}
                />
              </button>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-[#dfe2e6] bg-[#f7f8f9] px-4 py-3">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="ind-btn ind-btn-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Weiter zum Vertrag
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </main>
  );
}
