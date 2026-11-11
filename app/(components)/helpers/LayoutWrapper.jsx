"use client";

import { usePathname } from "next/navigation";
import FloatingContact from "./FloatingContact";

const ADMIN_PATHS = [
  "/admin",
  "/forms",
  "/schlussel",
  "/AdminDashboard",
  "/PersonalData",
  "/Posteingang",
  "/punsh",
  "/Zeiterfassungsverwaltung",
  "/excel",
  "/Reg",
  "/einstellungen",
  "/kaufvertrag",
  "/Auto-scheins",
  "/aufgabenboard",
  "/Toni-Werkstatt",
  "/Fahrzeugverwaltung",
  "/Fotostudio",
  "/preisschild",
  "/Rotkennzeichen",
  "/Kundenkontakte",
  "/marktanalyse",
  "/neue-angebote",
  "/Lagerbestand",
  "/translator",
  "/Plate",
  "/punch-qr",
  "/show-qr",
];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  const isAdminPage = ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return (
    <>
      {children}

      {!isAdminPage && <FloatingContact />}
    </>
  );
}
