"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "aj_consent_banner_v6";

export default function ConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // Check localStorage on first load
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsOpen(true); // erste Sitzung → Banner anzeigen
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  // Trigger slide-up animation
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setHasEntered(true), 10);
      return () => clearTimeout(t);
    } else {
      setHasEntered(false);
    }
  }, [isOpen]);

  const closeAndStore = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setIsOpen(false);
  };

  const handleAccept = () => closeAndStore("accepted");
  const handleDeny = () => closeAndStore("denied");
  const handleClose = () => closeAndStore("dismissed"); // nur schließen

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-[9999]
        border-t border-slate-200
        bg-white/95 backdrop-blur-lg
        shadow-[0_-10px_30px_rgba(15,23,42,0.18)]
        transition-all duration-300 ease-out
        ${
          hasEntered
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }
      `}
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-8 py-4">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Text */}
          <div className="flex items-start gap-3">
            <div className="mt-1 hidden sm:flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm text-slate-800 leading-snug max-w-2xl">
                Wir verwenden Cookies, um Informationen zur Leistung und Nutzung
                unserer Website auszuwerten sowie Inhalte zu verbessern und
                individuell anzupassen.
              </p>
              <p className="text-[11px] text-slate-500">
                Weitere Informationen finden Sie in unserer{" "}
                <Link
                  href="/Datenschutz"
                  className="font-medium text-slate-800 underline underline-offset-2 hover:text-slate-950"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Right: Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1 sm:mt-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDeny}
              className="
                inline-flex items-center justify-center
                h-10 w-full sm:w-auto
                px-4 rounded-full
                border border-slate-300 bg-slate-50
                text-xs sm:text-sm font-medium text-slate-700
                hover:border-slate-400 hover:bg-slate-100
                transition
              "
            >
              Cookies ablehnen
            </button>

            <button
              type="button"
              onClick={handleAccept}
              className="
                inline-flex items-center justify-center
                h-10 w-full sm:w-auto
                px-6 rounded-full
                bg-slate-900 text-white
                text-xs sm:text-sm font-semibold
                shadow-sm hover:bg-black
                transition
              "
            >
              Cookies zulassen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
