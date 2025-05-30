"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShowQRRedirect() {
  const router = useRouter();

  useEffect(() => {
    const code = Math.random().toString(36).substring(2, 10); // Random 8-char code
    const punchUrl = `/punch-qr?code=${code}`;
    router.replace(punchUrl); // Instantly redirect to punch-qr
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <p className="text-lg animate-pulse">QR-Code wird geladen...</p>
    </div>
  );
}
