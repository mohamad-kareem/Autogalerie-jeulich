"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ContractForm from "../../_components/ContractForm";
import { api } from "@/app/(components)/sales/ui";

export default function EditContractPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await api(`/api/kaufvertrag/${id}?view=1`);
      if (!alive) return;
      setState(res.ok ? { loading: false, data: res.data, error: "" } : { loading: false, data: null, error: res.data.error || "Vertrag nicht gefunden." });
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const c = state.data?.contract;
  return (
    <div className="px-4 py-6 sm:px-6">
      {state.loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> Vertrag wird geladen …
        </div>
      ) : c ? (
        <ContractForm mode="correct" contractId={c._id} number={c.number} issuer={c.issuer} initial={c} />
      ) : (
        <div className="card mx-auto max-w-md p-6 text-center text-[13px] text-muted">{state.error}</div>
      )}
    </div>
  );
}
