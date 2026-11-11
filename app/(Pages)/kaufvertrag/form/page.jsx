"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ContractForm from "../_components/ContractForm";
import { api } from "@/app/(components)/sales/ui";
import { berlinDay } from "@/lib/sales";


/** "201312" | "2013-12" | "12/2013" → "12/2013" */
function firstRegOf(value) {
  if (!value) return "";
  const s = String(value);
  const digits = s.replace(/[^0-9]/g, "");
  if (/^\d{6}$/.test(digits) && /^\d{4}/.test(s)) return `${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
  const parts = s.split(/[-/.]/);
  if (parts.length === 2 && parts[0].length === 4) return `${parts[1].padStart(2, "0")}/${parts[0]}`;
  return s;
}

function NewContract() {
  const sp = useSearchParams();
  const issuer = sp.get("issuer") === "alawie" ? "alawie" : "karim";
  const carId = sp.get("carId") || "";
  const fin = sp.get("fin") || "";
  const [state, setState] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [num, car] = await Promise.all([
        api(`/api/kaufvertrag/nummer?issuer=${issuer}`),
        carId ? api(`/api/cars/${encodeURIComponent(carId)}`) : Promise.resolve(null),
      ]);
      if (!alive) return;
      const c = car?.ok ? car.data : null;
      const vehicle = c
        ? {
            name: [c.make, c.model].filter(Boolean).join(" ") || c.modelDescription || c.title || "",
            vin: c.vin || c.VIN || "",
            firstRegistration: firstRegOf(c.firstRegistration),
            mileage: typeof c.mileage === "number" ? c.mileage : Number(String(c.mileage || "").replace(/\D/g, "")) || null,
          }
        : { vin: fin };
      setState({
        nextNumber: num.ok ? num.data.next : "",
        websiteCar: c,
        initial: { date: berlinDay(), vehicle, warranty: "12m", paymentMethod: "cash", agreements: [] },
      });
    })();
    return () => {
      alive = false;
    };
  }, [issuer, carId, fin]);

  if (!state) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-muted">
        <Loader2 className="h-5 w-5 animate-spin" /> Formular wird geladen …
      </div>
    );
  }
  return <ContractForm mode="new" issuer={issuer} carId={carId} nextNumber={state.nextNumber} websiteCar={state.websiteCar} initial={state.initial} />;
}

export default function Page() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <Suspense fallback={null}>
        <NewContract />
      </Suspense>
    </div>
  );
}
