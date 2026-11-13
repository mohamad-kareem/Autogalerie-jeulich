"use client";

import { useEffect, useState } from "react";
import { COMPANY_STAMP_API } from "@/lib/companyStamp";
import { api } from "./sales/ui";

export function useCompanyStamp() {
  const [stamp, setStamp] = useState({ id: "", loading: true, error: "" });

  useEffect(() => {
    let active = true;
    api(COMPANY_STAMP_API).then((res) => {
      if (!active) return;
      setStamp({ id: res.data.id || "", loading: false, error: res.ok ? "" : res.data.error || "Firmenstempel konnte nicht geladen werden." });
    });
    return () => {
      active = false;
    };
  }, []);

  return [stamp, setStamp];
}
