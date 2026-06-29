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
  "/kaufvertrag",
  "/Auto-scheins",
  "/Autoteil",
  "/aufgabenboard",
  "/ai-chats",
  "/Toni-Werkstatt",
  "/Fahrzeugverwaltung",
  "/Fotostudio",
  "/preisschild",
  "/Rotkennzeichen",
  "/Kundenkontakte",
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
