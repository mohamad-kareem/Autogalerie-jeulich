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
    <main className="relative flex min-h-screen items-center justify-center bg-[#f5f5f2] px-4 py-10 text-[#101510]">
      <button
        onClick={openSidebar}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#101510] shadow-md shadow-black/5 transition hover:bg-[#f1f6f2] md:hidden"
        aria-label="Menü öffnen"
      >
        <FiMenu className="h-4 w-4" />
      </button>

      <motion.section
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-[460px] overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-xl shadow-black/5"
      >
        <div className="border-b border-black/5 px-6 py-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
            <FileText className="h-6 w-6" />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e]">
            Kaufvertrag
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#07111f]">
            Vertragsersteller wählen
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5f695f]">
            Wählen Sie aus, wer als Vertragsersteller im Kaufvertrag erscheinen
            soll.
          </p>
        </div>

        <div className="space-y-3 px-5 py-5">
          {options.map((opt) => {
            const active = selected === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(opt.value)}
                className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition ${
                  active
                    ? "border-[#146c2e]/40 bg-[#e6f1e9]"
                    : "border-black/10 bg-[#fafaf8] hover:border-[#146c2e]/30 hover:bg-[#f1f6f2]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-[#146c2e] text-white"
                      : "bg-white text-[#146c2e] shadow-sm"
                  }`}
                >
                  <User className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-[#07111f]">
                    {opt.label}
                  </h3>

                  <p className="mt-0.5 text-sm text-[#5f695f]">{opt.role}</p>
                </div>

                <CheckCircle
                  className={`h-5 w-5 shrink-0 transition ${
                    active ? "text-[#146c2e]" : "text-black/15"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="border-t border-black/5 bg-[#fafaf8] px-5 py-5">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-medium transition ${
              selected
                ? "bg-[#146c2e] text-white shadow-md shadow-green-900/10 hover:bg-[#0f5724]"
                : "cursor-not-allowed bg-black/5 text-[#9aa39a]"
            }`}
          >
            Weiter zum Vertrag
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </main>
  );
}
