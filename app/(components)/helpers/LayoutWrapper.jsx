"use client";

import { usePathname } from "next/navigation";
import FloatingContact from "./FloatingContact";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();

  // 🚫 Define admin-only paths
  const isAdminPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/forms") ||
    pathname.startsWith("/schlussel") ||
    pathname.startsWith("/AdminDashboard") ||
    pathname.startsWith("/PersonalData") ||
    pathname.startsWith("/Posteingang") ||
    pathname.startsWith("/punsh") ||
    pathname.startsWith("/Zeiterfassungsverwaltung") ||
    pathname.startsWith("/excel") ||
    pathname.startsWith("/Reg") ||
    pathname.startsWith("/kaufvertrag") ||
    pathname.startsWith("/Auto-scheins") ||
    pathname.startsWith("/Autoteil") ||
    pathname.startsWith("/aufgabenboard");

  return (
    <>
      {children}
      {!isAdminPage && <FloatingContact />}
    </>
  );
}
