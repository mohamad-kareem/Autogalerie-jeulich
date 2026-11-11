"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PrivateContractForm from "../_components/PrivateContractForm";
import { api } from "@/app/(components)/sales/ui";
import { privateForm } from "@/lib/privateContract";

/** "201312" | "2013-12" → "12/2013" */
function firstRegOf(value) {
  if (!value) return "";
  const s = String(value);
  const digits = s.replace(/[^0-9]/g, "");
  if (/^\d{6}$/.test(digits) && /^\d{4}/.test(s)) return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
  const parts = s.split(/[-/.]/);
  if (parts.length === 2 && parts[0].length === 4) return `${parts[1].padStart(2, "0")}/${parts[0]}`;
  return s;
}

/**
 * New private contract (TÜV-SÜD-Formular)
 * /kaufvertrag/privat            – empty form
 * /kaufvertrag/privat?carId=…    – car data from the website ad
 * /kaufvertrag/privat?fin=…      – FIN prefilled (from the Händler form)
 * A car that already has a private contract opens that one.
 */
function NewPrivate() {
  const router = useRouter();
  const sp = useSearchParams();
  const carId = sp.get("carId") || "";
  const fin = sp.get("fin") || "";
  const [state, setState] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const car = carId ? await api(`/api/cars/${encodeURIComponent(carId)}`) : null;
      const c = car?.ok ? car.data : null;
      const vin = String(c?.vin || c?.VIN || fin || "").replace(/\s+/g, "").toUpperCase();
      if (vin.length >= 11) {
        const found = await api(`/api/privatvertraege?vin=${encodeURIComponent(vin)}`);
        if (alive && found.ok && found.data.id) {
          router.replace(`/kaufvertrag/privat/${found.data.id}`);
          return;
        }
      }
      if (!alive) return;
      const v = c
        ? {
            name: [c.make, c.model].filter(Boolean).join(" ") || c.modelDescription || c.title || "",
            vin,
            firstRegistration: firstRegOf(c.firstRegistration),
            mileage: typeof c.mileage === "number" ? c.mileage : String(c.mileage || "").replace(/\D/g, "") || null,
            price: c.price?.consumerPriceGross ?? c.price ?? null,
          }
        : { vin };
      if (v.price != null && typeof v.price === "object") v.price = null;
      setState({ initial: privateForm(null, v), websiteCar: c });
    })();
    return () => {
      alive = false;
    };
  }, [carId, fin, router]);

  if (!state) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Formular wird geladen …
      </div>
    );
  }
  return <PrivateContractForm initial={state.initial} carId={carId} websiteCar={state.websiteCar} />;
}

export default function Page() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <NewPrivate />
      </Suspense>
    </div>
  );
}
